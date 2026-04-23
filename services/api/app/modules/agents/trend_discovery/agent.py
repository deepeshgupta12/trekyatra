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
from app.modules.agents.state import BaseAgentState
from app.modules.agents.trend_discovery.prompts import TREND_DISCOVERY_PROMPT
from app.modules.content.service import create_topic
from app.schemas.content import TopicOpportunityCreate

MODEL = "claude-sonnet-4-6"


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:72]
    return f"{slug}-{str(uuid.uuid4())[:8]}"


class TrendDiscoveryAgent(BaseAgent):
    agent_type = "trend_discovery"

    def __init__(self, db: Session) -> None:
        self.db = db
        super().__init__()

    def _build_graph(self) -> Any:
        graph: StateGraph = StateGraph(BaseAgentState)
        graph.add_node("score_topics", self._score_topics)
        graph.add_node("store_results", self._store_results)
        graph.set_entry_point("score_topics")
        graph.add_edge("score_topics", "store_results")
        graph.add_edge("store_results", END)
        return graph.compile()

    def _score_topics(self, state: BaseAgentState) -> dict[str, Any]:
        if not settings.anthropic_api_key:
            return {"errors": ["ANTHROPIC_API_KEY is not configured"]}

        seed_topics: list[str] = state.get("input", {}).get("seed_topics", [])
        if not seed_topics:
            return {"errors": ["seed_topics must be a non-empty list"]}

        prompt = TREND_DISCOVERY_PROMPT.format(seed_topics=", ".join(seed_topics))
        client = get_anthropic_client()
        message = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        topics: list[dict[str, Any]] = json.loads(raw)
        return {"output": {"topics": topics}}

    def _store_results(self, state: BaseAgentState) -> dict[str, Any]:
        errors = state.get("errors", [])
        if errors:
            return {}

        topics: list[dict[str, Any]] = state.get("output", {}).get("topics", [])
        created_ids: list[str] = []
        skipped = 0

        for t in topics:
            try:
                slug = t.get("slug") or _slugify(t.get("title", "topic"))
                payload = TopicOpportunityCreate(
                    title=t["title"],
                    slug=slug,
                    primary_keyword=t["primary_keyword"],
                    source=t.get("source", "agent_trend_discovery"),
                    intent=t.get("intent"),
                    page_type=t.get("page_type"),
                    trend_score=t.get("trend_score"),
                    urgency_score=t.get("urgency_score"),
                    status="new",
                    notes=t.get("notes"),
                )
                topic = create_topic(self.db, payload)
                created_ids.append(str(topic.id))
            except Exception:
                skipped += 1

        return {
            "output": {
                **state.get("output", {}),
                "topic_ids": created_ids,
                "count": len(created_ids),
                "skipped": skipped,
            }
        }
