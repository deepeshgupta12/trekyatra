from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ReportIn(BaseModel):
    trek_slug: str
    title: Optional[str] = None
    body: str = Field(..., min_length=50, max_length=2000)
    condition: Literal["open", "caution", "closed", "unknown"] = "unknown"
    trek_date: date
    photo_urls: list[str] = Field(default_factory=list, max_length=3)


class MediaOut(BaseModel):
    id: uuid.UUID
    url: str
    s3_key: str
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None

    model_config = {"from_attributes": True}


class ReportOut(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    trek_slug: str
    title: Optional[str] = None
    body: str
    condition: str
    trek_date: date
    status: str
    moderated_at: Optional[datetime] = None
    created_at: datetime
    media: list[MediaOut] = []

    model_config = {"from_attributes": True}


class ConditionSummary(BaseModel):
    total_reports: int
    open_pct: int
    caution_pct: int
    closed_pct: int
    unknown_pct: int
    last_report_date: Optional[date] = None


class ReportPageOut(BaseModel):
    items: list[ReportOut]
    condition_summary: ConditionSummary
    total: int
    page: int
    has_more: bool


class MediaUploadOut(BaseModel):
    url: str
    key: str


class ModerationIn(BaseModel):
    action: Literal["approve", "reject"]
    reason: Optional[str] = None
