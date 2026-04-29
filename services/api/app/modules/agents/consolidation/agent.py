from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from app.modules.agents.base_agent import BaseAgent
from app.modules.agents.client import get_anthropic_client
from app.modules.agents.state import BaseAgentState
from app.modules.cannibalization.models import CannibalizationIssue
from app.modules.cms.models import CMSPage
from app.modules.content.models import ContentBrief, ContentDraft
from app.modules.linking.models import Page

MODEL = "claude-sonnet-4-6"

MERGE_PROMPT = """You are an expert trekking content editor. You have two published trek guide articles that cover overlapping topics and keywords. Your task is to merge them into a single, comprehensive, best-of-both article.

Article A — "{title_a}":
{content_a}

---

Article B — "{title_b}":
{content_b}

---

Instructions:
- Combine the best, most accurate, and most detailed sections from both articles.
- Eliminate redundancy; keep only one version of each fact.
- Produce a single, well-structured Markdown article.
- Keep all safety-critical information (altitude, permits, emergency contacts).
- Title the merged article: "Complete Guide: {title_a} (Updated)"
- Output only the merged Markdown article. No commentary."""


def _slug_from_title(title: str) -> str:
    slug = title.lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug.strip())
    return slug[:200] + "-consolidated-" + str(uuid.uuid4())[:8]


class ConsolidationAgent(BaseAgent):
    agent_type = "consolidation"

    def __init__(self, db: Session, issue_id: str) -> None:
        self.db = db
        self.issue_id = uuid.UUID(issue_id)
        self.issue: CannibalizationIssue | None = None
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("fetch_pages", self._fetch_pages)
        graph.add_node("merge_content", self._merge_content)
        graph.add_node("store_draft", self._store_draft)
        graph.set_entry_point("fetch_pages")
        graph.add_edge("fetch_pages", "merge_content")
        graph.add_edge("merge_content", "store_draft")
        graph.add_edge("store_draft", END)
        return graph.compile()

    def _fetch_pages(self, state: BaseAgentState) -> BaseAgentState:
        self.issue = self.db.get(CannibalizationIssue, self.issue_id)
        if self.issue is None:
            state["errors"] = [f"CannibalizationIssue {self.issue_id} not found"]
            return state

        page_a = self.db.get(Page, self.issue.page_a_id)
        page_b = self.db.get(Page, self.issue.page_b_id)

        if page_a is None or page_b is None:
            state["errors"] = ["One or both pages not found"]
            return state

        cms_a = self.db.get(CMSPage, page_a.cms_page_id) if page_a.cms_page_id else None
        cms_b = self.db.get(CMSPage, page_b.cms_page_id) if page_b.cms_page_id else None

        state["output"] = {
            "title_a": page_a.title,
            "title_b": page_b.title,
            "content_a": (cms_a.content_html if cms_a else page_a.title)[:6000],
            "content_b": (cms_b.content_html if cms_b else page_b.title)[:6000],
        }
        return state

    def _merge_content(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors") or not state.get("output"):
            return state

        out = state["output"]
        prompt = (
            MERGE_PROMPT
            .replace("{title_a}", out["title_a"])
            .replace("{title_b}", out["title_b"])
            .replace("{content_a}", out["content_a"])
            .replace("{content_b}", out["content_b"])
        )

        client = get_anthropic_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        state["output"]["merged_markdown"] = response.content[0].text
        return state

    def _store_draft(self, state: BaseAgentState) -> BaseAgentState:
        if state.get("errors") or not state.get("output", {}).get("merged_markdown"):
            return state

        out = state["output"]
        now = datetime.now(timezone.utc)
        merged_title = f"Complete Guide: {out['title_a']} (Updated)"

        brief = ContentBrief(
            title=merged_title,
            slug=_slug_from_title(merged_title),
            target_keyword=out["title_a"].lower()[:255],
            status="draft",
            created_at=now,
            updated_at=now,
        )
        self.db.add(brief)
        self.db.flush()

        draft = ContentDraft(
            brief_id=brief.id,
            title=merged_title,
            slug=_slug_from_title(merged_title),
            content_markdown=out["merged_markdown"],
            status="requires_review",
            version=1,
            created_at=now,
            updated_at=now,
        )
        self.db.add(draft)
        self.db.commit()

        state["output"]["draft_id"] = str(draft.id)
        state["output"]["brief_id"] = str(brief.id)
        return state
