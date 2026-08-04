"""ClusterContentAgent — generates a `cluster_hub` CMS page for /trek-types/{slug}.

HYBRID (same shape as RegionalContentAgent): deterministic scaffold (body + grounded FAQs from the
category's real matching treks) + optional LLM intro enrichment (fails safe to deterministic).

Handles BOTH sources of a Trek Category:
  - a curated category  (app.modules.hubs.category_meta.CATEGORIES) → matched by predicate
  - a keyword_cluster    (content pipeline) → matched by cluster_id / trek_themes

The generated page's content_html + content_json.faqs are consumed as an overlay by the
/trek-types/[slug] page; the member-trek grid stays live (fetched by category/cluster each render).
"""
from __future__ import annotations

import logging
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
from app.modules.content.models import KeywordCluster
from app.modules.hubs.category_meta import category_by_slug, treks_in_category
from app.modules.hubs.cluster_meta import treks_in_cluster

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 700

INTRO_PROMPT = """You are a senior trekking editor for TrekYatra. Write ONE punchy intro paragraph \
(60–90 words) for the "{name}" trek-category hub page. Ground it in these facts and do NOT invent \
numbers or trek names:

Category: {name}
Context: {blurb}
Documented treks: {count}
Notable treks: {trek_names}

Confident, expert, accessible tone. No headings, no lists, no markdown, no preamble — output ONLY \
the paragraph text."""


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


class ClusterContentAgent(BaseAgent):
    agent_type = "cluster_content"

    def __init__(
        self, db: Session, *, category_slug: str | None = None, cluster_id: str | None = None,
        use_llm: bool = True,
    ) -> None:
        if bool(category_slug) == bool(cluster_id):
            raise ValueError("Pass exactly one of category_slug or cluster_id.")
        self.db = db
        self.category_slug = category_slug
        self.cluster_id = cluster_id
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

    def _prepare_context(self, state: BaseAgentState) -> BaseAgentState:
        if self.category_slug:
            meta = category_by_slug(self.category_slug)
            if not meta:
                state["errors"] = [f"Unknown category slug '{self.category_slug}'."]
                return state
            treks = treks_in_category(self.db, self.category_slug, limit=12)
            ctx = {"name": meta.name, "tagline": meta.tagline, "blurb": meta.blurb,
                   "slug": meta.slug, "cluster_fk": None, "category_slug": meta.slug}
        else:
            kc = self.db.get(KeywordCluster, uuid.UUID(str(self.cluster_id)))
            if not kc:
                state["errors"] = [f"Keyword cluster '{self.cluster_id}' not found."]
                return state
            treks = treks_in_cluster(self.db, cluster_id=str(kc.id), theme=kc.primary_keyword, limit=12)
            ctx = {"name": kc.name, "tagline": kc.primary_keyword,
                   "blurb": f"Curated {kc.name.lower()} in India — {kc.primary_keyword}.",
                   "slug": _slugify(kc.name), "cluster_fk": str(kc.id), "category_slug": None}
        ctx["names"] = [(p.trek_name or p.title) for p in treks if (p.trek_name or p.title)]
        ctx["count"] = len(treks)
        ctx["hero"] = next((p.hero_image_url for p in treks if p.hero_image_url), None)
        state["output"]["ctx"] = ctx
        return state

    def _generate_content(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors"):
            return state
        ctx = state["output"]["ctx"]
        intro = ctx["blurb"]
        if self.use_llm and ctx["count"] > 0:
            try:
                prompt = INTRO_PROMPT.format(
                    name=ctx["name"], blurb=ctx["blurb"], count=ctx["count"],
                    trek_names=", ".join(ctx["names"][:6]) or "—",
                )
                client = get_anthropic_client()
                resp = client.messages.create(model=MODEL, max_tokens=MAX_TOKENS,
                                               messages=[{"role": "user", "content": prompt}])
                text = (resp.content[0].text or "").strip()
                if len(text) >= 40:
                    intro = text
            except Exception as exc:  # noqa: BLE001 — enrichment is best-effort
                logger.warning("ClusterContentAgent LLM enrich failed for %s: %s", ctx["slug"], exc)
        state["output"]["intro"] = intro
        return state

    def _store_page(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors"):
            return state
        ctx = state["output"]["ctx"]
        intro = state["output"]["intro"]
        names = ctx["names"]
        count = ctx["count"]

        top = "<ul>" + "".join(f"<li>{n}</li>" for n in names[:10]) + "</ul>" if names else \
            "<p>Trek guides for this category are being published.</p>"
        body_html = (
            f"<p>{intro}</p>"
            f"<h2>Why choose {ctx['name'].lower()}?</h2><p>{ctx['blurb']}</p>"
            f"<h2>Top {ctx['name']}</h2>{top}"
        )
        faqs = [
            {"q": f"How many {ctx['name'].lower()} are documented?",
             "a": f"TrekYatra documents {count} trek{'s' if count != 1 else ''} in the {ctx['name']} "
                  f"category, each with a full route breakdown, permits, costs, and live conditions."},
            {"q": f"Are {ctx['name'].lower()} suitable for me?",
             "a": f"{ctx['blurb']} Every guide lists the fitness level, altitude and prior experience needed "
                  f"so you can pick the right route."},
        ]

        slug = f"trek-types/{ctx['slug']}"
        title = ctx["name"]
        now = datetime.now(timezone.utc)
        content_json = {
            "faqs": faqs, "trek_names": names[:10],
            "category_slug": ctx["category_slug"], "generated_by": "cluster_content_agent",
        }
        seo_description = f"{ctx['name']} in India: {count} documented route{'s' if count != 1 else ''}, "\
                          f"with difficulty, seasons, permits, costs and live conditions. {ctx['tagline']}."

        existing = self.db.scalar(select(CMSPage).where(CMSPage.slug == slug))
        if existing:
            existing.title = title
            existing.content_html = body_html
            existing.content_json = content_json
            existing.status = "published"
            existing.seo_title = f"{title} | TrekYatra"
            existing.seo_description = seo_description
            if ctx["cluster_fk"]:
                existing.cluster_id = uuid.UUID(ctx["cluster_fk"])
            if not existing.hero_image_url and ctx["hero"]:
                existing.hero_image_url = ctx["hero"]
            existing.published_at = existing.published_at or now
            existing.updated_at = now
            page_id = str(existing.id)
        else:
            page = CMSPage(
                id=uuid.uuid4(), slug=slug, page_type="cluster_hub", title=title,
                content_html=body_html, content_json=content_json, status="published",
                seo_title=f"{title} | TrekYatra", seo_description=seo_description,
                hero_image_url=ctx["hero"],
                cluster_id=uuid.UUID(ctx["cluster_fk"]) if ctx["cluster_fk"] else None,
                published_at=now, created_at=now, updated_at=now,
            )
            self.db.add(page)
            page_id = str(page.id)

        self.db.commit()
        state["output"]["page_id"] = page_id
        state["output"]["slug"] = slug
        return state
