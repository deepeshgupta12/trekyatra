from __future__ import annotations

import json
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
from app.modules.newsletter.models import NewsletterCampaign

MODEL = "claude-sonnet-4-6"

NEWSLETTER_PROMPT = """You are a travel newsletter editor for TrekYatra, a trekking content platform in India.

Based on the following recently published articles, compose a weekly newsletter digest.

Published articles this week:
{articles}

Output a JSON object with exactly these fields:
{{
  "subject": "Engaging email subject line (max 80 chars)",
  "preview_text": "Preview text shown in inbox (max 120 chars)",
  "body_html": "Full HTML email body with hero section and content cards for each article"
}}

Requirements for body_html:
- Use clean, mobile-friendly inline-styled HTML
- Hero section: TrekYatra logo text + week headline
- One content card per article: title, 2-sentence excerpt, read more link (use the slug as the path)
- Footer: unsubscribe note
- Keep the total HTML under 8000 characters

Output only the JSON object. No commentary."""


def _current_week_label() -> str:
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-W%W")


class NewsletterAgent(BaseAgent):
    agent_type = "newsletter"

    def __init__(self, db: Session) -> None:
        self.db = db
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("fetch_pages", self._fetch_pages)
        graph.add_node("generate_newsletter", self._generate_newsletter)
        graph.add_node("store_campaign", self._store_campaign)
        graph.set_entry_point("fetch_pages")
        graph.add_edge("fetch_pages", "generate_newsletter")
        graph.add_edge("generate_newsletter", "store_campaign")
        graph.add_edge("store_campaign", END)
        return graph.compile()

    def _fetch_pages(self, state: BaseAgentState) -> BaseAgentState:
        pages = list(
            self.db.scalars(
                select(CMSPage)
                .where(CMSPage.status == "published")
                .order_by(CMSPage.published_at.desc())
                .limit(5)
            ).all()
        )
        if not pages:
            state["errors"] = ["No published pages found to generate newsletter"]
            return state

        articles = []
        for p in pages:
            excerpt = ""
            if p.content_html:
                import re
                text = re.sub(r"<[^>]+>", "", p.content_html)
                excerpt = " ".join(text.split())[:300]
            articles.append({
                "title": p.title,
                "slug": p.slug,
                "page_type": p.page_type,
                "excerpt": excerpt,
            })

        state["output"]["articles"] = articles
        return state

    def _generate_newsletter(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors") or not state.get("output", {}).get("articles"):
            return state

        articles_text = "\n".join(
            f"- {a['title']} (/{a['page_type']}/{a['slug']}): {a['excerpt']}"
            for a in state["output"]["articles"]
        )
        prompt = NEWSLETTER_PROMPT.replace("{articles}", articles_text)

        client = get_anthropic_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()

        try:
            data = json.loads(raw)
        except Exception:
            import re
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                data = json.loads(m.group(0))
            else:
                state["errors"] = ["Failed to parse newsletter JSON from LLM"]
                return state

        state["output"]["newsletter"] = data
        return state

    def _store_campaign(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors") or not state.get("output", {}).get("newsletter"):
            return state

        nl = state["output"]["newsletter"]
        now = datetime.now(timezone.utc)
        week_label = _current_week_label()

        campaign = NewsletterCampaign(
            id=uuid.uuid4(),
            week_label=week_label,
            subject=nl.get("subject", f"TrekYatra Weekly — {week_label}"),
            preview_text=nl.get("preview_text"),
            body_html=nl.get("body_html", ""),
            status="draft",
            created_at=now,
        )
        self.db.add(campaign)
        self.db.commit()

        state["output"]["campaign_id"] = str(campaign.id)
        state["output"]["week_label"] = week_label
        return state
