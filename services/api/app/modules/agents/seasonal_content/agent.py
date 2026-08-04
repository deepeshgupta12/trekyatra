from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from langgraph.graph import END, StateGraph
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.agents.base_agent import BaseAgent
from app.modules.agents.client import get_anthropic_client
from app.modules.agents.state import BaseAgentState
from app.modules.cms.models import CMSPage
from app.modules.hubs.hub_content import SEASON_CONTENT, hub_to_html

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 2000

from app.modules.hubs.season_meta import SEASONS as _CANON_SEASONS, treks_in_season

# Per-season prose enrichment (overview + regions), keyed by the canonical 5-season slugs
# (app.modules.hubs.season_meta.SEASONS). Title + month label come from the canonical table so
# the agent, the endpoint, the home tabs and the /seasons/[slug] hub all agree.
_SEASON_ENRICH: dict[str, dict] = {
    "spring": {
        "overview": "rhododendron forests in bloom, snow-free lower trails, ideal weather windows",
        "regions": "Uttarakhand, Sikkim, North East",
    },
    "summer": {
        "overview": "alpine meadows in full bloom, pre-monsoon shoulder season, manageable temperatures",
        "regions": "Himachal Pradesh, Ladakh, Kashmir",
    },
    "monsoon": {
        "overview": "lush green landscapes, cascading waterfalls, misty ridges in the Western Ghats",
        "regions": "Maharashtra (Sahyadris), Kerala, Coorg",
    },
    "autumn": {
        "overview": "crisp post-monsoon skies, stable weather, and the clearest high-Himalayan views of the year",
        "regions": "Uttarakhand, Himachal Pradesh, Sikkim",
    },
    "winter": {
        "overview": "snow-covered Himalayan trails, frozen lake crossings, and pristine white campsites",
        "regions": "Uttarakhand, Himachal Pradesh",
    },
}

# Backward-compatible SEASON_META (now the canonical 5 seasons): title + months label + enrichment.
SEASON_META: dict[str, dict] = {
    slug: {
        "title": _CANON_SEASONS[slug]["title"],
        "months": _CANON_SEASONS[slug]["label"],
        "overview": _SEASON_ENRICH[slug]["overview"],
        "regions": _SEASON_ENRICH[slug]["regions"],
    }
    for slug in _CANON_SEASONS
}

SEASONAL_PROMPT = """You are a senior trekking content writer for TrekYatra, India's leading trekking guide platform.

Write a 700–900 word seasonal hub article for the following season:

Season: {season_name}
Best months: {months}
Overview: {overview}
Key regions: {regions}

The article must include these sections (use ## headings):
## Why Trek in {season_name}?
## Top Treks to do in {season_name}
## What to Pack for {season_name} Treks
## Safety Tips for {season_name} Trekking
## FAQ

Requirements:
- Write in a confident, expert but accessible tone
- Include practical advice trekkers can act on immediately
- FAQ section: 3 questions in **Q:** / **A:** format
- Do NOT use phrases like "100% safe" or "always guaranteed"
- Include an affiliate disclosure line at the bottom: "This article contains affiliate links. We may earn a commission at no extra cost to you."

Output ONLY the article content in markdown. No JSON wrapper. No preamble."""


class SeasonalContentAgent(BaseAgent):
    agent_type = "seasonal_content"

    def __init__(self, db: Session, season_slug: str) -> None:
        self.db = db
        self.season_slug = season_slug.lower()
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("prepare_context", self._prepare_context)
        graph.add_node("generate_content", self._generate_content)
        graph.add_node("store_page", self._store_page)
        graph.set_entry_point("prepare_context")
        graph.add_edge("prepare_context", "generate_content")
        graph.add_edge("generate_content", "store_page")
        graph.add_edge("store_page", END)
        return graph.compile()

    def _prepare_context(self, state: BaseAgentState) -> BaseAgentState:
        content = SEASON_CONTENT.get(self.season_slug)
        if not content:
            state["errors"] = [
                f"Unknown season slug '{self.season_slug}'. Valid values: {list(SEASON_CONTENT.keys())}"
            ]
            return state
        state["output"]["season_slug"] = self.season_slug
        state["output"]["content"] = content
        state["output"]["trek_count"] = len(treks_in_season(self.db, self.season_slug, limit=50))
        return state

    def _generate_content(self, state: BaseAgentState) -> BaseAgentState:
        # Optional LLM polish of the intro only (fails safe to the deterministic intro). All facts,
        # regions, months, packing and FAQs stay deterministic so nothing is hallucinated.
        if state.get("errors"):
            return state
        content = state["output"]["content"]
        intro = content["intro"]
        real_treks = treks_in_season(self.db, self.season_slug, limit=8)
        names = [(p.trek_name or p.title) for p in real_treks if (p.trek_name or p.title)]
        if names:
            try:
                prompt = (
                    f"Rewrite this intro paragraph for a page about {self.season_slug} trekking in India, "
                    f"in 60 to 90 words, human and vivid, using NO dashes or hyphens, and do not invent "
                    f"treks. Prefer these real treks if you name any: {', '.join(names[:6])}.\n\n{intro}"
                )
                client = get_anthropic_client()
                resp = client.messages.create(model=MODEL, max_tokens=400, messages=[{"role": "user", "content": prompt}])
                text = (resp.content[0].text or "").strip()
                if len(text) >= 60 and "-" not in text and "—" not in text and "–" not in text:
                    intro = text
            except Exception:  # noqa: BLE001 — enrichment is best effort
                pass
        state["output"]["intro"] = intro
        return state

    def _store_page(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors"):
            return state
        content = state["output"]["content"]
        intro = state["output"].get("intro", content["intro"])
        count = state["output"]["trek_count"]
        name = self.season_slug.capitalize()

        faqs = [
            {"q": f"When is the best time for {name.lower()} treks in India?",
             "a": f"The {name.lower()} trekking window runs {content['months_label']}. {content['weather']}"},
            {"q": f"Which regions are best for {name.lower()} trekking?",
             "a": " ".join(f"{r['name']}, {r['note']}" for r in content["bestRegions"])},
            {"q": f"How many {name.lower()} treks does TrekYatra cover?",
             "a": f"{count} treks match the {name.lower()} window, each with a full route breakdown, permits, cost estimates and live trail conditions."},
            {"q": f"What should I pack for {name.lower()} treks?",
             "a": f"Key items are {', '.join(content['packing'])}. {content['prep']}"},
            {"q": f"Are {name.lower()} treks good for beginners?", "a": content["beginnerNote"]},
        ]
        hub = {
            "intro": intro, "overview": content["overview"], "why": content["why"],
            "bestRegions": content["bestRegions"], "monthTable": content["monthTable"],
            "prepare": content["prepare"], "packing": content["packing"],
            "weather": content["weather"], "faqs": faqs,
        }
        slug = f"seasons/{self.season_slug}"
        title = f"Best {name} Treks in India"
        content_html = hub_to_html(hub, f"trek in {name}")
        content_json = {"hub": hub, "faqs": faqs, "season_slug": self.season_slug, "generated_by": "seasonal_content_agent"}
        seo_description = f"The best {name.lower()} treks in India for {content['months_label']}. {content['why'][:120]}"

        existing = self.db.scalar(select(CMSPage).where(CMSPage.slug == slug))
        now = datetime.now(timezone.utc)

        if existing:
            existing.title = title
            existing.content_html = content_html
            existing.content_json = content_json
            existing.status = "published"
            existing.seo_title = f"{title} | TrekYatra"
            existing.seo_description = seo_description
            existing.published_at = existing.published_at or now
            existing.updated_at = now
            page_id = str(existing.id)
        else:
            page = CMSPage(
                id=uuid.uuid4(), slug=slug, page_type="seasonal_hub", title=title,
                content_html=content_html, content_json=content_json, status="published",
                seo_title=f"{title} | TrekYatra", seo_description=seo_description,
                published_at=now, created_at=now, updated_at=now,
            )
            self.db.add(page)
            page_id = str(page.id)

        self.db.commit()
        state["output"]["page_id"] = page_id
        state["output"]["slug"] = slug
        return state
