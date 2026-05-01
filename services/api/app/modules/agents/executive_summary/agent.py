from __future__ import annotations

from typing import Any

from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from app.modules.agents.base_agent import BaseAgent
from app.modules.agents.client import get_anthropic_client
from app.modules.agents.state import BaseAgentState

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 1024


def _build_prompt(revenue_by_cluster: list[dict], revenue_by_type: list[dict], decaying: list[dict]) -> str:
    cluster_lines = "\n".join(
        f"- {r.get('cluster_name') or 'Unknown'}: ₹{r['total_revenue_inr']:.0f} "
        f"({r['total_clicks']} clicks, {r['total_leads']} leads)"
        for r in revenue_by_cluster[:5]
    ) or "No cluster data yet."
    type_lines = "\n".join(
        f"- {r.get('page_type') or 'Unknown'}: ₹{r['total_revenue_inr']:.0f}"
        for r in revenue_by_type[:5]
    ) or "No page-type data yet."
    decay_lines = "\n".join(
        f"- {r.get('page_type') or 'page'} (page_id={r['page_id']}): {r['decay_pct']}% drop in clicks"
        for r in decaying[:3]
    ) or "No decaying pages detected."

    return f"""You are the TrekYatra executive analyst. Write a concise weekly performance summary (≤300 words, Markdown).

## Revenue by Cluster (top 5)
{cluster_lines}

## Revenue by Page Type (top 5)
{type_lines}

## Decaying Pages (top 3)
{decay_lines}

Produce the summary now. Include:
1. Key wins this week
2. Top revenue sources
3. Pages to watch (decay)
4. One recommended action
"""


class ExecutiveSummaryAgent(BaseAgent):
    agent_type = "executive_summary"

    def __init__(self, db: Session) -> None:
        self.db = db
        super().__init__()

    def _build_graph(self) -> Any:
        from app.modules.revenue import service as rev_service

        def gather_data(state: BaseAgentState) -> BaseAgentState:
            try:
                clusters = rev_service.revenue_by_cluster(self.db)
                page_types = rev_service.revenue_by_page_type(self.db)
                decaying = rev_service.decaying_pages(self.db)
                state["metadata"]["clusters"] = clusters
                state["metadata"]["page_types"] = page_types
                state["metadata"]["decaying"] = decaying
            except Exception as exc:
                state["errors"].append(f"gather_data: {exc}")
            return state

        def generate_summary(state: BaseAgentState) -> BaseAgentState:
            if state["errors"]:
                return state
            try:
                prompt = _build_prompt(
                    state["metadata"].get("clusters", []),
                    state["metadata"].get("page_types", []),
                    state["metadata"].get("decaying", []),
                )
                client = get_anthropic_client()
                response = client.messages.create(
                    model=MODEL,
                    max_tokens=MAX_TOKENS,
                    messages=[{"role": "user", "content": prompt}],
                )
                content_md = response.content[0].text.strip()
                state["output"]["content_md"] = content_md
            except Exception as exc:
                state["errors"].append(f"generate_summary: {exc}")
                state["output"]["content_md"] = "Summary generation failed — check agent logs."
            return state

        def store_summary(state: BaseAgentState) -> BaseAgentState:
            try:
                week_label = state["input"].get("week_label", "unknown")
                content_md = state["output"].get("content_md", "")
                from app.modules.revenue.service import upsert_executive_summary
                summary = upsert_executive_summary(self.db, week_label, content_md)
                state["output"]["summary_id"] = str(summary.id)
            except Exception as exc:
                state["errors"].append(f"store_summary: {exc}")
            return state

        graph = StateGraph(BaseAgentState)
        graph.add_node("gather_data", gather_data)
        graph.add_node("generate_summary", generate_summary)
        graph.add_node("store_summary", store_summary)
        graph.set_entry_point("gather_data")
        graph.add_edge("gather_data", "generate_summary")
        graph.add_edge("generate_summary", "store_summary")
        graph.add_edge("store_summary", END)
        return graph.compile()
