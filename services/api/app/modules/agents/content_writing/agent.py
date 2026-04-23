from __future__ import annotations

import json
import re
import uuid
from typing import Any

from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.agents.base_agent import BaseAgent
from app.modules.agents.client import get_anthropic_client
from app.modules.agents.content_writing.prompts import (
    CONTENT_WRITING_PROMPT,
    CONTENT_WRITING_SYSTEM,
)
from app.modules.agents.state import BaseAgentState
from app.modules.content import service as content_service
from app.modules.content.models import ContentBrief
from app.schemas.content import ContentDraftCreate, DraftClaimCreate

MODEL = "claude-sonnet-4-6"
CONFIDENCE_FLAG_THRESHOLD = 0.7


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:72]
    return f"{slug}-{str(uuid.uuid4())[:8]}"


class ContentWritingAgent(BaseAgent):
    agent_type = "content_writing"

    def __init__(self, db: Session) -> None:
        self.db = db
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("fetch_brief", self._fetch_brief)
        graph.add_node("write_draft", self._write_draft)
        graph.add_node("store_results", self._store_results)
        graph.set_entry_point("fetch_brief")
        graph.add_edge("fetch_brief", "write_draft")
        graph.add_edge("write_draft", "store_results")
        graph.add_edge("store_results", END)
        return graph.compile()

    def _fetch_brief(self, state: BaseAgentState) -> dict[str, Any]:
        brief_id_str = state.get("input", {}).get("brief_id")
        if not brief_id_str:
            return {"errors": ["brief_id is required"]}

        try:
            brief_id = uuid.UUID(brief_id_str)
        except ValueError:
            return {"errors": [f"Invalid brief_id format: {brief_id_str}"]}

        brief: ContentBrief | None = content_service.get_brief(self.db, brief_id)
        if brief is None:
            return {"errors": [f"Brief not found: {brief_id_str}"]}

        if brief.status != "approved":
            return {"errors": [f"Brief must be approved before writing; current status: {brief.status}"]}

        if not brief.structured_brief:
            return {"errors": ["Brief has no structured_brief data; regenerate the brief first"]}

        return {
            "metadata": {
                "brief_id": str(brief.id),
                "brief": brief.structured_brief,
                "title": brief.title,
                "target_keyword": brief.target_keyword,
                "page_type": brief.page_type or "article",
            }
        }

    def _write_draft(self, state: BaseAgentState) -> dict[str, Any]:
        if state.get("errors"):
            return {}

        if not settings.anthropic_api_key:
            return {"errors": ["ANTHROPIC_API_KEY is not configured"]}

        meta = state.get("metadata", {})
        brief = meta.get("brief", {})

        heading_lines = "\n".join(
            f"  {h.get('level', 'H2')}: {h.get('text', '')} — {h.get('notes', '')}"
            for h in (brief.get("heading_structure") or [])
        )
        faq_lines = "\n".join(
            f"  Q: {f.get('question', '')} | Hint: {f.get('answer_hint', '')}"
            for f in (brief.get("faqs") or [])
        )

        prompt = CONTENT_WRITING_PROMPT.format(
            target_keyword=meta.get("target_keyword", ""),
            page_type=meta.get("page_type", "article"),
            word_count_target=brief.get("word_count_target", 1800),
            heading_structure=heading_lines or "Follow standard article structure",
            faqs=faq_lines or "Include 5 relevant FAQs",
            key_entities=", ".join(brief.get("key_entities") or []),
            internal_link_targets=", ".join(brief.get("internal_link_targets") or []),
            schema_recommendations=", ".join(brief.get("schema_recommendations") or []),
        )

        client = get_anthropic_client()
        message = client.messages.create(
            model=MODEL,
            max_tokens=16000,
            system=[{
                "type": "text",
                "text": CONTENT_WRITING_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        try:
            draft_data: dict[str, Any] = json.loads(raw)
        except json.JSONDecodeError as exc:
            return {"errors": [f"LLM returned invalid JSON: {exc}. raw_length={len(raw)}"]}

        return {"output": {"draft": draft_data}}

    def _store_results(self, state: BaseAgentState) -> dict[str, Any]:
        errors = state.get("errors", [])
        if errors:
            return {}

        draft_data: dict[str, Any] = state.get("output", {}).get("draft", {})
        if not draft_data:
            return {"errors": ["No draft data produced"]}

        meta = state.get("metadata", {})
        brief_id_str = meta.get("brief_id")

        has_flagged = any(
            c.get("flagged_for_review", False)
            for c in draft_data.get("fact_check_claims", [])
        )
        draft_status = "requires_review" if has_flagged else "draft"

        payload = ContentDraftCreate(
            brief_id=brief_id_str,
            title=draft_data.get("title", meta.get("title", "Draft"))[:255],
            slug=draft_data.get("slug") or _slugify(draft_data.get("title", "draft")),
            content_markdown=draft_data.get("content_markdown", ""),
            excerpt=draft_data.get("excerpt"),
            meta_title=draft_data.get("title", "")[:255],
            meta_description=draft_data.get("meta_description"),
            version=1,
            confidence_score=draft_data.get("confidence_score"),
            status=draft_status,
        )

        try:
            draft = content_service.create_draft(self.db, payload)
            draft_id = draft.id

            for claim_data in draft_data.get("fact_check_claims", []):
                score = float(claim_data.get("confidence_score", 1.0))
                content_service.create_draft_claim(
                    self.db,
                    DraftClaimCreate(
                        draft_id=str(draft_id),
                        claim_text=claim_data.get("claim_text", ""),
                        claim_type=claim_data.get("claim_type", "other"),
                        confidence_score=score,
                        flagged_for_review=score < CONFIDENCE_FLAG_THRESHOLD,
                    ),
                )
        except Exception as exc:
            return {"errors": [f"Failed to store draft: {exc}"]}

        return {
            "output": {
                **state.get("output", {}),
                "draft_id": str(draft_id),
                "status": draft_status,
                "flagged_claims": sum(
                    1 for c in draft_data.get("fact_check_claims", [])
                    if c.get("flagged_for_review", False)
                ),
            }
        }
