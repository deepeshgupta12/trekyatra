from __future__ import annotations

from typing import Any
from typing_extensions import TypedDict


class BaseAgentState(TypedDict, total=False):
    run_id: int
    agent_type: str
    input: dict[str, Any]
    output: dict[str, Any]
    errors: list[str]
    metadata: dict[str, Any]
