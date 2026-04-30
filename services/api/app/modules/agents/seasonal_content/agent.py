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
from app.modules.cms.service import _md_to_html

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 2000

SEASON_META: dict[str, dict] = {
    "winter": {
        "title": "Best Winter Treks in India",
        "months": "December – March",
        "overview": "snow-covered Himalayan trails, frozen lake crossings, and pristine white campsites",
        "regions": "Uttarakhand, Himachal Pradesh",
    },
    "summer": {
        "title": "Best Summer Treks in India",
        "months": "May – June",
        "overview": "alpine meadows in full bloom, pre-monsoon shoulder season, manageable temperatures",
        "regions": "Himachal Pradesh, Ladakh, Kashmir",
    },
    "monsoon": {
        "title": "Best Monsoon Treks in India",
        "months": "June – September",
        "overview": "lush green landscapes, cascading waterfalls, misty ridges in the Western Ghats",
        "regions": "Maharashtra (Sahyadris), Kerala, Coorg",
    },
    "spring": {
        "title": "Best Spring Treks in India",
        "months": "March – April",
        "overview": "rhododendron forests in bloom, snow-free lower trails, ideal weather windows",
        "regions": "Uttarakhand, Sikkim, North East",
    },
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
        meta = SEASON_META.get(self.season_slug)
        if not meta:
            state["errors"] = [
                f"Unknown season slug '{self.season_slug}'. "
                f"Valid values: {list(SEASON_META.keys())}"
            ]
            return state

        state["output"]["season_slug"] = self.season_slug
        state["output"]["meta"] = meta
        return state

    def _generate_content(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors"):
            return state

        meta = state["output"]["meta"]
        prompt = (
            SEASONAL_PROMPT
            .replace("{season_name}", self.season_slug.capitalize())
            .replace("{months}", meta["months"])
            .replace("{overview}", meta["overview"])
            .replace("{regions}", meta["regions"])
        )

        client = get_anthropic_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )
        markdown = response.content[0].text.strip()
        state["output"]["markdown"] = markdown
        return state

    def _store_page(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors") or not state.get("output", {}).get("markdown"):
            return state

        meta = state["output"]["meta"]
        markdown = state["output"]["markdown"]
        slug = f"seasons/{self.season_slug}"
        title = meta["title"]
        content_html = _md_to_html(markdown)

        existing = self.db.scalar(select(CMSPage).where(CMSPage.slug == slug))
        now = datetime.now(timezone.utc)

        if existing:
            existing.title = title
            existing.content_html = content_html
            existing.content_json = {"markdown": markdown, "season_slug": self.season_slug}
            existing.status = "published"
            existing.published_at = now
            existing.updated_at = now
            page_id = str(existing.id)
        else:
            page = CMSPage(
                id=uuid.uuid4(),
                slug=slug,
                page_type="seasonal_hub",
                title=title,
                content_html=content_html,
                content_json={"markdown": markdown, "season_slug": self.season_slug},
                status="published",
                seo_title=f"{title} | TrekYatra",
                seo_description=f"Discover the best {self.season_slug} treks in India. Expert guide to trails, packing, safety, and planning for {meta['months']}.",
                published_at=now,
                created_at=now,
                updated_at=now,
            )
            self.db.add(page)
            page_id = str(page.id)

        self.db.commit()
        state["output"]["page_id"] = page_id
        state["output"]["slug"] = slug
        return state
