from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PlanGenerateRequest(BaseModel):
    session_id: str = Field(min_length=8, max_length=128)
    region: str | None = Field(default=None, max_length=100)
    duration_days: int | None = Field(default=None, ge=1, le=30)
    experience: str | None = Field(default=None, max_length=50)
    month: str | None = Field(default=None, max_length=20)
    budget_inr: int | None = Field(default=None, ge=0)
    group_size: str | None = Field(default=None, max_length=50)
    email: str | None = None  # optional — for lead capture


class ItineraryDay(BaseModel):
    day: int
    title: str
    activities: list[str]
    notes: str | None = None


class TripPlanOutput(BaseModel):
    trek_slug: str | None = None
    trek_title: str
    itinerary: list[ItineraryDay]
    cost_estimate: str | None = None
    gear_essentials: list[str] = []
    permit_note: str | None = None
    operator_suggestion: str | None = None
    best_month: str | None = None
    difficulty: str | None = None


class TripPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: str
    user_id: uuid.UUID | None
    inputs: dict[str, Any]
    output: dict[str, Any] | None
    trek_slug: str | None
    fallback_used: bool
    created_at: datetime


class PlanEmailRequest(BaseModel):
    email: str
