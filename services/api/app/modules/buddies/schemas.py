from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ── Signals ──────────────────────────────────────────────────────────────────

class SignalIn(BaseModel):
    trek_slug: str = Field(..., min_length=1, max_length=200)
    month_year: str = Field(..., pattern=r"^\d{4}-\d{2}$")  # "2026-06"
    group_size: int = Field(default=1, ge=1, le=20)
    experience: Optional[Literal["beginner", "intermediate", "expert"]] = None
    notes: Optional[str] = Field(default=None, max_length=500)


class SignalOut(BaseModel):
    id: uuid.UUID
    display_name: str
    avatar_url: Optional[str] = None
    trek_slug: str
    month_year: str
    group_size: int
    experience: Optional[str] = None
    notes: Optional[str] = None
    is_own: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class MonthCount(BaseModel):
    month_year: str
    count: int


class BuddyCountOut(BaseModel):
    count: int
    upcoming_months: list[MonthCount] = []


# ── Requests ─────────────────────────────────────────────────────────────────

class BuddyRequestIn(BaseModel):
    signal_id: uuid.UUID
    message: Optional[str] = Field(default=None, max_length=500)


class BuddyResponseIn(BaseModel):
    action: Literal["accept", "reject"]


class BuddyRequestOut(BaseModel):
    id: uuid.UUID
    signal: SignalOut
    other_party_name: str
    other_party_avatar: Optional[str] = None
    message: Optional[str] = None
    status: str
    trek_slug: str
    month_year: str
    created_at: datetime
    responded_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Chat ─────────────────────────────────────────────────────────────────────

class ChatMessageIn(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class ChatMessageOut(BaseModel):
    id: uuid.UUID
    is_mine: bool
    content: str
    created_at: datetime
    read_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Public trekker profile ────────────────────────────────────────────────────

class TrekkerProfileOut(BaseModel):
    display_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None
    trek_count: int = 0
    joined_year: int
    signal_id: uuid.UUID
    trek_slug: str
    month_year: str
