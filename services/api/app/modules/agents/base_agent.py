from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.modules.agents.state import BaseAgentState


class BaseAgent(ABC):
    """Wraps a LangGraph StateGraph; subclasses define nodes and edges."""

    agent_type: str = "base"

    def __init__(self) -> None:
        self._graph = self._build_graph()

    @abstractmethod
    def _build_graph(self) -> Any:
        """Return a compiled LangGraph StateGraph."""
        ...

    def run(self, input_data: dict[str, Any], run_id: int | None = None) -> dict[str, Any]:
        initial: BaseAgentState = {
            "run_id": run_id or 0,
            "agent_type": self.agent_type,
            "input": input_data,
            "output": {},
            "errors": [],
            "metadata": {},
        }
        result = self._graph.invoke(initial)
        return dict(result)
