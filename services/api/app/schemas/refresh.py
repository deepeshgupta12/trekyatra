from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StalePageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    page_type: str
    freshness_interval_days: int
    last_refreshed_at: datetime | None
    do_not_refresh: bool
    days_stale: int | None = None


class RefreshTriggerRequest(BaseModel):
    page_ids: list[str]


class RefreshLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    page_id: uuid.UUID
    triggered_by: str
    trigger_at: datetime
    completed_at: datetime | None
    result: str
    notes: str | None
    created_at: datetime


class RefreshTriggerResponse(BaseModel):
    queued: int
    logs: list[RefreshLogResponse]
