from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AgentRunResponse(BaseModel):
    id: int
    agent_type: str
    status: str
    input_json: str | None
    output_json: str | None
    error: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
