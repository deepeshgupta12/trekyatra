from __future__ import annotations

import json
import re
import uuid
from typing import Any

from langgraph.graph import END, StateGraph
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.agents.base_agent import BaseAgent
from app.modules.agents.client import get_anthropic_client
from app.modules.agents.keyword_cluster.prompts import KEYWORD_CLUSTER_PROMPT
from app.modules.agents.state import BaseAgentState
from app.modules.content.models import TopicOpportunity
from app.modules.content.service import create_cluster
from app.schemas.content import KeywordClusterCreate

MODEL = "claude-sonnet-4-6"


def _slugify_cluster(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:72]
    return f"{slug}-{str(uuid.uuid4())[:8]}"


class KeywordClusterAgent(BaseAgent):
    agent_type = "keyword_cluster"

    def __init__(self, db: Session) -> None:
        self.db = db
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("fetch_topics", self._fetch_topics)
        graph.add_node("cluster_topics", self._cluster_topics)
        graph.add_node("store_results", self._store_results)
        graph.set_entry_point("fetch_topics")
        graph.add_edge("fetch_topics", "cluster_topics")
        graph.add_edge("cluster_topics", "store_results")
        graph.add_edge("store_results", END)
        return graph.compile()

    def _fetch_topics(self, state: BaseAgentState) -> dict[str, Any]:
        topic_ids: list[str] = state.get("input", {}).get("topic_ids", [])
        if not topic_ids:
            return {"errors": ["topic_ids must be a non-empty list"]}

        try:
            uuids = [uuid.UUID(tid) for tid in topic_ids]
        except ValueError as exc:
            return {"errors": [f"Invalid topic_id format: {exc}"]}

        rows = self.db.scalars(
            select(TopicOpportunity).where(TopicOpportunity.id.in_(uuids))
        ).all()

        if not rows:
            return {"errors": ["No topics found for the given topic_ids"]}

        topic_summaries = [
            {"title": t.title, "primary_keyword": t.primary_keyword, "intent": t.intent}
            for t in rows
        ]
        return {"metadata": {"topic_summaries": topic_summaries}}

    def _cluster_topics(self, state: BaseAgentState) -> dict[str, Any]:
        if state.get("errors"):
            return {}

        if not settings.anthropic_api_key:
            return {"errors": ["ANTHROPIC_API_KEY is not configured"]}

        topics = state.get("metadata", {}).get("topic_summaries", [])
        prompt = KEYWORD_CLUSTER_PROMPT.format(topics=json.dumps(topics, indent=2))

        client = get_anthropic_client()
        message = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        clusters: list[dict[str, Any]] = json.loads(raw)
        return {"output": {"clusters": clusters}}

    def _store_results(self, state: BaseAgentState) -> dict[str, Any]:
        errors = state.get("errors", [])
        if errors:
            return {}

        clusters: list[dict[str, Any]] = state.get("output", {}).get("clusters", [])
        created_ids: list[str] = []
        skipped = 0

        for c in clusters:
            try:
                payload = KeywordClusterCreate(
                    name=c["name"],
                    primary_keyword=c["primary_keyword"],
                    supporting_keywords=c.get("supporting_keywords", []),
                    intent=c.get("intent"),
                    pillar_title=c.get("pillar_title"),
                    status="draft",
                    notes={
                        "competition_score": c.get("competition_score"),
                        "cannibalization_risk": c.get("cannibalization_risk", False),
                        "topic_titles": c.get("topic_titles", []),
                    },
                )
                cluster = create_cluster(self.db, payload)
                created_ids.append(str(cluster.id))
            except Exception:
                skipped += 1

        return {
            "output": {
                **state.get("output", {}),
                "cluster_ids": created_ids,
                "count": len(created_ids),
                "skipped": skipped,
            }
        }
