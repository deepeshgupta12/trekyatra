from __future__ import annotations

import json
import re
import uuid
from typing import Any

import anthropic
from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.agents.base_agent import BaseAgent
from app.modules.agents.content_brief.prompts import CONTENT_BRIEF_PROMPT
from app.modules.agents.state import BaseAgentState
from app.modules.content import service as content_service
from app.modules.content.models import ContentBrief, KeywordCluster, TopicOpportunity
from app.schemas.content import ContentBriefCreate

MODEL = "claude-sonnet-4-6"


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:72]
    return f"{slug}-{str(uuid.uuid4())[:8]}"


class ContentBriefAgent(BaseAgent):
    agent_type = "content_brief"

    def __init__(self, db: Session) -> None:
        self.db = db
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("fetch_context", self._fetch_context)
        graph.add_node("generate_brief", self._generate_brief)
        graph.add_node("store_results", self._store_results)
        graph.set_entry_point("fetch_context")
        graph.add_edge("fetch_context", "generate_brief")
        graph.add_edge("generate_brief", "store_results")
        graph.add_edge("store_results", END)
        return graph.compile()

    def _fetch_context(self, state: BaseAgentState) -> dict[str, Any]:
        inp = state.get("input", {})
        topic_id = inp.get("topic_id")
        cluster_id = inp.get("cluster_id")

        topic: TopicOpportunity | None = None
        cluster: KeywordCluster | None = None

        if topic_id:
            topic = self.db.get(TopicOpportunity, uuid.UUID(topic_id))
            if topic is None:
                return {"errors": [f"Topic not found: {topic_id}"]}

        if cluster_id:
            cluster = self.db.get(KeywordCluster, uuid.UUID(cluster_id))
        elif topic and topic.primary_keyword:
            # try to find a cluster by primary keyword match
            from sqlalchemy import select
            cluster = self.db.scalar(
                select(KeywordCluster).where(
                    KeywordCluster.primary_keyword == topic.primary_keyword
                ).limit(1)
            )

        return {
            "metadata": {
                "topic": {
                    "id": str(topic.id) if topic else None,
                    "title": topic.title if topic else None,
                    "primary_keyword": topic.primary_keyword if topic else None,
                    "intent": topic.intent if topic else None,
                    "page_type": topic.page_type if topic else None,
                    "notes": topic.notes if topic else None,
                },
                "cluster": {
                    "id": str(cluster.id) if cluster else None,
                    "name": cluster.name if cluster else None,
                    "supporting_keywords": cluster.supporting_keywords if cluster else [],
                    "pillar_title": cluster.pillar_title if cluster else None,
                } if cluster else None,
            }
        }

    def _generate_brief(self, state: BaseAgentState) -> dict[str, Any]:
        if state.get("errors"):
            return {}

        if not settings.anthropic_api_key:
            return {"errors": ["ANTHROPIC_API_KEY is not configured"]}

        inp = state.get("input", {})
        meta = state.get("metadata", {})
        topic_ctx = meta.get("topic", {})
        cluster_ctx = meta.get("cluster") or {}

        target_keyword = inp.get("target_keyword") or topic_ctx.get("primary_keyword", "")
        page_type = inp.get("page_type") or topic_ctx.get("page_type") or "article"
        intent = topic_ctx.get("intent") or "informational"
        secondary_kws: list[str] = cluster_ctx.get("supporting_keywords") or []
        topic_context = topic_ctx.get("title") or target_keyword
        cluster_kws = ", ".join(secondary_kws[:20]) if secondary_kws else "none"

        prompt = CONTENT_BRIEF_PROMPT.format(
            target_keyword=target_keyword,
            page_type=page_type,
            intent=intent,
            secondary_keywords=", ".join(secondary_kws[:10]) or "none",
            topic_context=topic_context,
            cluster_keywords=cluster_kws,
        )

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model=MODEL,
            max_tokens=8096,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        brief_data: dict[str, Any] = json.loads(raw)
        return {"output": {"brief": brief_data}}

    def _store_results(self, state: BaseAgentState) -> dict[str, Any]:
        errors = state.get("errors", [])
        if errors:
            return {}

        brief_data: dict[str, Any] = state.get("output", {}).get("brief", {})
        if not brief_data:
            return {"errors": ["No brief data produced"]}

        inp = state.get("input", {})
        meta = state.get("metadata", {})
        topic_ctx = meta.get("topic", {})
        cluster_ctx = meta.get("cluster") or {}

        target_keyword = inp.get("target_keyword") or topic_ctx.get("primary_keyword", "")
        title = brief_data.get("editorial_brief_markdown", "").split("\n")[0].lstrip("# ").strip()
        if not title:
            title = f"Brief: {target_keyword}"

        payload = ContentBriefCreate(
            topic_opportunity_id=topic_ctx.get("id"),
            keyword_cluster_id=cluster_ctx.get("id") if cluster_ctx else None,
            title=title[:255],
            slug=_slugify(title),
            target_keyword=target_keyword,
            secondary_keywords=brief_data.get("secondary_keywords"),
            intent=topic_ctx.get("intent"),
            page_type=inp.get("page_type") or topic_ctx.get("page_type"),
            heading_outline=brief_data.get("heading_structure"),
            faqs=brief_data.get("faqs"),
            internal_link_targets=brief_data.get("internal_link_targets"),
            schema_recommendations=brief_data.get("schema_recommendations"),
            monetization_notes={"slots": brief_data.get("monetization_slots", [])},
            structured_brief=brief_data,
            word_count_target=brief_data.get("word_count_target"),
            status="review",
        )

        try:
            brief: ContentBrief = content_service.create_brief(self.db, payload)
            brief_id = brief.id
            content_service.create_brief_version(self.db, brief_id, brief_data)
        except Exception as exc:
            return {"errors": [f"Failed to store brief: {exc}"]}

        return {
            "output": {
                **state.get("output", {}),
                "brief_id": str(brief_id),
                "title": title,
                "status": "review",
            }
        }
