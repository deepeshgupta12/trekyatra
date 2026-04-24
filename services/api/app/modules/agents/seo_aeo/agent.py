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
from app.modules.agents.seo_aeo.prompts import SEO_AEO_PROMPT, SEO_AEO_SYSTEM
from app.modules.agents.state import BaseAgentState
from app.modules.content import service as content_service
from app.modules.content.models import ContentDraft


def _clean_llm_json(raw: str) -> str:
    """Escape literal control characters inside JSON string values.

    LLMs sometimes emit real newlines/tabs inside a JSON string instead of \\n/\\t,
    making json.loads fail with 'Invalid control character'.  Walk char-by-char,
    tracking whether we are inside a string, and escape the offending bytes.
    """
    result: list[str] = []
    in_string = False
    i = 0
    while i < len(raw):
        ch = raw[i]
        if ch == "\\" and in_string:
            # Pass the escape sequence through untouched (two characters)
            result.append(ch)
            i += 1
            if i < len(raw):
                result.append(raw[i])
        elif ch == '"':
            in_string = not in_string
            result.append(ch)
        elif in_string and ch == "\n":
            result.append("\\n")
        elif in_string and ch == "\r":
            result.append("\\r")
        elif in_string and ch == "\t":
            result.append("\\t")
        else:
            result.append(ch)
        i += 1
    return "".join(result)

MODEL = "claude-sonnet-4-6"


class SEOAEOAgent(BaseAgent):
    agent_type = "seo_aeo"

    def __init__(self, db: Session) -> None:
        self.db = db
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("fetch_draft", self._fetch_draft)
        graph.add_node("optimize", self._optimize)
        graph.add_node("store_results", self._store_results)
        graph.set_entry_point("fetch_draft")
        graph.add_edge("fetch_draft", "optimize")
        graph.add_edge("optimize", "store_results")
        graph.add_edge("store_results", END)
        return graph.compile()

    def _fetch_draft(self, state: BaseAgentState) -> dict[str, Any]:
        draft_id_str = state.get("input", {}).get("draft_id")
        if not draft_id_str:
            return {"errors": ["draft_id is required"]}

        try:
            draft_id = uuid.UUID(draft_id_str)
        except ValueError:
            return {"errors": [f"Invalid draft_id format: {draft_id_str}"]}

        draft: ContentDraft | None = content_service.get_draft(self.db, draft_id)
        if draft is None:
            return {"errors": [f"Draft not found: {draft_id_str}"]}

        brief = content_service.get_brief(self.db, draft.brief_id) if draft.brief_id else None

        return {
            "metadata": {
                "draft_id": str(draft.id),
                "title": draft.title,
                "target_keyword": brief.target_keyword if brief else "",
                "content_markdown": draft.content_markdown,
            }
        }

    def _optimize(self, state: BaseAgentState) -> dict[str, Any]:
        if state.get("errors"):
            return {}

        if not settings.anthropic_api_key:
            return {"errors": ["ANTHROPIC_API_KEY is not configured"]}

        meta = state.get("metadata", {})

        prompt = SEO_AEO_PROMPT.format(
            title=meta.get("title", ""),
            target_keyword=meta.get("target_keyword", ""),
            content_markdown=meta.get("content_markdown", ""),
        )

        client = get_anthropic_client()
        message = client.messages.create(
            model=MODEL,
            max_tokens=16000,
            system=[{
                "type": "text",
                "text": SEO_AEO_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        try:
            result: dict[str, Any] = json.loads(raw)
        except json.JSONDecodeError:
            try:
                result = json.loads(_clean_llm_json(raw))
            except json.JSONDecodeError as exc:
                return {"errors": [f"LLM returned invalid JSON: {exc}. raw_length={len(raw)}"]}

        return {"output": {"optimization": result}}

    def _store_results(self, state: BaseAgentState) -> dict[str, Any]:
        errors = state.get("errors", [])
        if errors:
            return {}

        opt: dict[str, Any] = state.get("output", {}).get("optimization", {})
        if not opt:
            return {"errors": ["No optimization data produced"]}

        meta = state.get("metadata", {})
        draft_id = uuid.UUID(meta["draft_id"])

        try:
            optimized_content = opt.get("optimized_content", "")
            content_service.update_draft_optimized_content(self.db, draft_id, optimized_content)
        except Exception as exc:
            return {"errors": [f"Failed to store optimized content: {exc}"]}

        return {
            "output": {
                **state.get("output", {}),
                "draft_id": str(draft_id),
                "changes_count": len(opt.get("changes_summary", [])),
                "faq_count": len(opt.get("faq_schema", [])),
            }
        }
