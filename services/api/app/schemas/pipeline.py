from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PipelineRunCreate(BaseModel):
    seed_topics: list[str] | None = None
    start_stage: str = "trend_discovery"
    end_stage: str = "publish"
    brief_id: uuid.UUID | None = None
    draft_id: uuid.UUID | None = None


class PipelineStageResponse(BaseModel):
    id: uuid.UUID
    stage_name: str
    status: str
    agent_run_id: int | None = None
    error_detail: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PipelineRunResponse(BaseModel):
    id: uuid.UUID
    pipeline_type: str
    status: str
    current_stage: str | None = None
    start_stage: str
    end_stage: str
    input_json: str | None = None
    output_json: str | None = None
    error_detail: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
    stages: list[PipelineStageResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PipelineTriggerResponse(BaseModel):
    pipeline_run_id: uuid.UUID
    status: str
    message: str
