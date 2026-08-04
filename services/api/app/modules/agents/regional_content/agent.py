"""RegionalContentAgent — generates a `regional_hub` CMS page for /regions/{slug}.

HYBRID design:
  1. Deterministic scaffold (always) — builds the editorial body + FAQs from the region's REAL
     published treks (count, beginner routes, peak season, permit rules, actual trek names). This
     guarantees accurate, grounded, SEO-complete output even with no LLM.
  2. Optional LLM enrichment — a single Anthropic pass rewrites ONLY the intro prose for uniqueness.
     Any failure (no key, timeout, empty) falls back to the deterministic intro. FAQs + trek facts
     are never LLM-invented (avoids hallucinated numbers / YMYL claims).

The generated page's `content_html` (rich body) + `content_json.faqs` are consumed as an overlay by
the code-rendered region page (`apps/web-next/app/(public)/regions/[slug]/page.tsx`): when present
they enrich the body + drive the FAQPage JSON-LD; the stat strip / trek grid / schema stay live.
"""
from __future__ import annotations

import logging
import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from langgraph.graph import END, StateGraph
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.agents.base_agent import BaseAgent
from app.modules.agents.client import get_anthropic_client
from app.modules.agents.state import BaseAgentState
from app.modules.cms.models import CMSPage
from app.modules.hubs.region_meta import RegionMeta, permit_copy, region_by_slug

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 700

INTRO_PROMPT = """You are a senior trekking editor for TrekYatra. Write ONE punchy intro paragraph \
(60–90 words) for the "{name}" trekking region hub page. Ground it in these facts and do NOT invent \
numbers or trek names:

Region: {name} ({country})
Positioning: {tagline}
Context: {blurb}
Documented treks: {count}
Notable treks: {trek_names}

Write in a confident, expert, accessible tone. No headings, no lists, no markdown, no preamble — \
output ONLY the paragraph text."""


def _trek_facts(pages: list[CMSPage]) -> dict[str, Any]:
    """Aggregate the real facts used in the scaffold + FAQs."""
    names = [(p.trek_name or p.title) for p in pages if (p.trek_name or p.title)]
    beginner = [
        (p.trek_name or p.title)
        for p in pages
        if (p.trek_suitability or "").lower().find("begin") >= 0
        or (p.trek_suitability or "").lower().find("easy") >= 0
    ]
    seasons = [p.trek_season for p in pages if p.trek_season and p.trek_season.strip() not in ("", "—")]
    peak_season = Counter(seasons).most_common(1)[0][0] if seasons else "Varies"
    return {
        "names": names,
        "beginner": beginner,
        "peak_season": peak_season,
        "count": len(pages),
    }


class RegionalContentAgent(BaseAgent):
    agent_type = "regional_content"

    def __init__(self, db: Session, region_slug: str, *, use_llm: bool = True) -> None:
        self.db = db
        self.region_slug = region_slug.lower()
        self.use_llm = use_llm
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

    # ── 1. Context: region meta + its real published treks ───────────────────
    def _prepare_context(self, state: BaseAgentState) -> BaseAgentState:
        meta = region_by_slug(self.region_slug)
        if not meta:
            state["errors"] = [
                f"Unknown region slug '{self.region_slug}'. "
                f"Add it to app.modules.hubs.region_meta.REGIONS first."
            ]
            return state

        # Match this region's published trek_guide pages (exact composite first, then substring —
        # mirrors the frontend regionForState / list_pages ILIKE filter).
        rows = list(
            self.db.scalars(
                select(CMSPage)
                .where(CMSPage.page_type == "trek_guide")
                .where(CMSPage.status == "published")
                .where(CMSPage.trek_state.ilike(f"%{meta.match_word}%"))
                .order_by(CMSPage.updated_at.desc())
            ).all()
        )
        state["output"]["meta"] = meta
        state["output"]["facts"] = _trek_facts(rows)
        return state

    # ── 2. Intro prose: LLM enrich with deterministic fallback ───────────────
    def _generate_content(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors"):
            return state
        meta: RegionMeta = state["output"]["meta"]
        facts = state["output"]["facts"]

        deterministic_intro = meta.blurb
        intro = deterministic_intro
        if self.use_llm and facts["count"] > 0:
            try:
                prompt = INTRO_PROMPT.format(
                    name=meta.name, country=meta.country, tagline=meta.tagline, blurb=meta.blurb,
                    count=facts["count"], trek_names=", ".join(facts["names"][:6]) or "—",
                )
                client = get_anthropic_client()
                resp = client.messages.create(
                    model=MODEL, max_tokens=MAX_TOKENS,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = (resp.content[0].text or "").strip()
                if len(text) >= 40:  # guard against empty/garbage responses
                    intro = text
            except Exception as exc:  # noqa: BLE001 — enrichment is best-effort
                logger.warning("RegionalContentAgent LLM enrich failed for %s: %s", self.region_slug, exc)

        state["output"]["intro"] = intro
        return state

    # ── 3. Store: deterministic HTML body + grounded FAQs ────────────────────
    def _store_page(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors"):
            return state
        meta: RegionMeta = state["output"]["meta"]
        facts = state["output"]["facts"]
        intro = state["output"]["intro"]
        permits = permit_copy(meta)
        count = facts["count"]
        peak = facts["peak_season"]

        top_names = facts["names"][:8]
        top_treks_html = (
            "<ul>" + "".join(f"<li>{n}</li>" for n in top_names) + "</ul>"
            if top_names
            else "<p>Trek guides for this region are being published.</p>"
        )
        body_html = (
            f"<p>{intro}</p>"
            f"<h2>Why trek in {meta.name}?</h2>"
            f"<p>{meta.blurb}</p>"
            f"<h2>Top treks in {meta.name}</h2>"
            f"{top_treks_html}"
            f"<h2>Best time to trek in {meta.name}</h2>"
            f"<p>The peak trekking window for most routes in {meta.name} is {peak}. "
            f"Higher-altitude routes have shorter, later windows — always check current conditions "
            f"before departing.</p>"
            f"<h2>Permits & preparation</h2>"
            f"<p>{permits['answer']}</p>"
        )

        faqs = [
            {
                "q": f"How many treks are documented in {meta.name}?",
                "a": f"TrekYatra documents {count} trek{'s' if count != 1 else ''} across {meta.name}, "
                     f"each with a detailed route breakdown, permits, cost estimates, and live trail conditions.",
            },
            {
                "q": f"When is the best time to trek in {meta.name}?",
                "a": (f"The peak trekking window for most routes in {meta.name} is {peak}. Higher-altitude "
                      f"routes have shorter, later windows — always check current conditions before departing.")
                if peak != "Varies"
                else (f"Season windows vary by altitude and route in {meta.name}. Each trek guide lists its "
                      f"recommended months and current on-the-ground conditions."),
            },
            {"q": f"Do I need permits for treks in {meta.name}?", "a": permits["answer"]},
        ]
        if facts["beginner"]:
            n = len(facts["beginner"])
            faqs.append({
                "q": f"Which treks in {meta.name} are good for beginners?",
                "a": f"{n} route{'s are' if n != 1 else ' is'} suitable for first-time trekkers in "
                     f"{meta.name}, including {', '.join(facts['beginner'][:3])}. Each guide flags the "
                     f"fitness level and prior experience needed.",
            })

        slug = f"regions/{meta.slug}"
        title = f"{meta.name} Treks"
        now = datetime.now(timezone.utc)
        content_json = {
            "faqs": faqs,
            "region_slug": meta.slug,
            "trek_names": top_names,
            "generated_by": "regional_content_agent",
        }
        seo_description = (
            f"{meta.name} trekking guide: {count} documented route{'s' if count != 1 else ''}, "
            f"best seasons, permits, costs and live conditions. {meta.tagline}."
        )

        existing = self.db.scalar(select(CMSPage).where(CMSPage.slug == slug))
        if existing:
            existing.title = title
            existing.content_html = body_html
            existing.content_json = content_json
            existing.status = "published"
            existing.seo_title = f"{title} | TrekYatra"
            existing.seo_description = seo_description
            if not existing.hero_image_url:
                existing.hero_image_url = meta.hero_image
            existing.published_at = existing.published_at or now
            existing.updated_at = now
            page_id = str(existing.id)
        else:
            page = CMSPage(
                id=uuid.uuid4(),
                slug=slug,
                page_type="regional_hub",
                title=title,
                content_html=body_html,
                content_json=content_json,
                status="published",
                seo_title=f"{title} | TrekYatra",
                seo_description=seo_description,
                hero_image_url=meta.hero_image,
                trek_state=meta.name,
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
