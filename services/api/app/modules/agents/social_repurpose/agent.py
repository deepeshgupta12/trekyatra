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
from app.modules.newsletter.models import SocialSnippet
from app.modules.linking.models import Page

MODEL = "claude-sonnet-4-6"

REPURPOSE_PROMPT = """You are a social media copywriter for TrekYatra, an Indian trekking content platform.

Article title: {title}
Article excerpt: {excerpt}
Page URL path: /{page_type}/{slug}

Generate social media copy for the following platforms. Output a JSON object with exactly these fields:

{{
  "instagram": {{
    "copy": "Instagram caption (max 280 characters, include relevant emojis and 3-5 hashtags)"
  }},
  "pinterest": {{
    "copy_title": "Pinterest pin title (max 100 characters)",
    "copy": "Pinterest pin description (max 150 characters)"
  }},
  "twitter": {{
    "copy": "Twitter/X thread hook (max 240 characters, punchy opening line that drives clicks)"
  }}
}}

Output only the JSON object. No commentary."""


class SocialRepurposeAgent(BaseAgent):
    agent_type = "social_repurpose"

    def __init__(self, db: Session, page_slug: str) -> None:
        self.db = db
        self.page_slug = page_slug
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("fetch_page", self._fetch_page)
        graph.add_node("generate_snippets", self._generate_snippets)
        graph.add_node("store_snippets", self._store_snippets)
        graph.set_entry_point("fetch_page")
        graph.add_edge("fetch_page", "generate_snippets")
        graph.add_edge("generate_snippets", "store_snippets")
        graph.add_edge("store_snippets", END)
        return graph.compile()

    def _fetch_page(self, state: BaseAgentState) -> BaseAgentState:
        cms_page = self.db.scalar(
            select(CMSPage).where(CMSPage.slug == self.page_slug)
        )
        if cms_page is None:
            state["errors"] = [f"CMSPage with slug '{self.page_slug}' not found"]
            return state

        excerpt = ""
        if cms_page.content_html:
            import re
            text = re.sub(r"<[^>]+>", "", cms_page.content_html)
            excerpt = " ".join(text.split())[:400]

        # Try to find the linked Page row for page_id
        linked_page = self.db.scalar(
            select(Page).where(Page.slug == self.page_slug)
        )

        state["output"]["title"] = cms_page.title
        state["output"]["slug"] = cms_page.slug
        state["output"]["page_type"] = cms_page.page_type
        state["output"]["excerpt"] = excerpt
        state["output"]["page_id"] = str(linked_page.id) if linked_page else None
        return state

    def _generate_snippets(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors") or not state.get("output", {}).get("title"):
            return state

        out = state["output"]
        prompt = (
            REPURPOSE_PROMPT
            .replace("{title}", out["title"])
            .replace("{excerpt}", out["excerpt"])
            .replace("{page_type}", out["page_type"])
            .replace("{slug}", out["slug"])
        )

        client = get_anthropic_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
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
                state["errors"] = ["Failed to parse social snippets JSON from LLM"]
                return state

        state["output"]["snippets"] = data
        return state

    def _store_snippets(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors") or not state.get("output", {}).get("snippets"):
            return state

        out = state["output"]
        snippets_data = out["snippets"]
        now = datetime.now(timezone.utc)
        page_id = uuid.UUID(out["page_id"]) if out.get("page_id") else None
        created_ids = []

        platform_map = {
            "instagram": ("instagram", snippets_data.get("instagram", {}).get("copy", ""), None),
            "pinterest": (
                "pinterest",
                snippets_data.get("pinterest", {}).get("copy", ""),
                snippets_data.get("pinterest", {}).get("copy_title"),
            ),
            "twitter": ("twitter", snippets_data.get("twitter", {}).get("copy", ""), None),
        }

        for platform, copy_text, copy_title in platform_map.values():
            if not copy_text:
                continue
            snippet = SocialSnippet(
                id=uuid.uuid4(),
                page_id=page_id,
                platform=platform,
                copy=copy_text,
                copy_title=copy_title,
                status="draft",
                created_at=now,
            )
            self.db.add(snippet)
            created_ids.append(str(snippet.id))

        self.db.commit()
        state["output"]["snippet_ids"] = created_ids
        return state
