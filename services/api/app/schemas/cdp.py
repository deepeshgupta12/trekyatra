from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Event ingest ──────────────────────────────────────────────────────────────

class EventIn(BaseModel):
    anonymous_id: str
    session_id: Optional[str] = None
    event_category: str
    event_name: str
    event_value: Optional[float] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
    page_url: Optional[str] = None
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    consent_given: bool = False


class BatchEventIn(BaseModel):
    events: List[EventIn] = Field(..., max_length=20)


class EventOut(BaseModel):
    id: uuid.UUID
    event_category: str
    event_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Session ───────────────────────────────────────────────────────────────────

class SessionStartIn(BaseModel):
    anonymous_id: str
    landing_page: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    country: Optional[str] = None


class SessionEndIn(BaseModel):
    session_id: str
    exit_page: Optional[str] = None
    page_count: int = 0
    event_count: int = 0
    duration_seconds: Optional[int] = None
    converted: bool = False
    conversion_event: Optional[str] = None


class SessionOut(BaseModel):
    id: str
    anonymous_id: str
    user_id: Optional[uuid.UUID]
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    page_count: int
    event_count: int
    converted: bool

    model_config = {"from_attributes": True}


# ── User profile ──────────────────────────────────────────────────────────────

class UserTraitOut(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    anonymous_id: Optional[str]
    total_sessions: int
    total_events: int
    total_page_views: int
    first_seen_at: Optional[datetime]
    last_seen_at: Optional[datetime]
    acquisition_source: Optional[str]
    acquisition_medium: Optional[str]
    acquisition_campaign: Optional[str]
    preferred_trek_categories: List[str]
    viewed_treks: List[str]
    searched_queries: List[str]
    plan_wizard_started: bool
    plan_wizard_completed: bool
    signed_up_at: Optional[datetime]
    signed_in_count: int
    device_types_used: List[str]
    countries: List[str]
    custom_traits: Dict[str, Any]
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserProfileOut(BaseModel):
    user_id: Optional[uuid.UUID]
    anonymous_id: Optional[str]
    email: Optional[str]
    full_name: Optional[str]
    traits: Optional[UserTraitOut]
    recent_events: List[Dict[str, Any]]
    sessions: List[SessionOut]
    touchpoints: List[Dict[str, Any]]


# ── User list ─────────────────────────────────────────────────────────────────

class UserListItem(BaseModel):
    user_id: Optional[uuid.UUID]
    anonymous_id: Optional[str]
    email: Optional[str]
    full_name: Optional[str]
    total_sessions: int
    total_events: int
    first_seen_at: Optional[datetime]
    last_seen_at: Optional[datetime]
    acquisition_source: Optional[str]
    signed_up_at: Optional[datetime]


class UserListOut(BaseModel):
    users: List[UserListItem]
    total: int
    page: int
    page_size: int


# ── Funnel ────────────────────────────────────────────────────────────────────

class FunnelStep(BaseModel):
    step: int
    event_name: str
    users: int
    drop_off_pct: Optional[float]


class FunnelOut(BaseModel):
    name: str
    steps: List[FunnelStep]
    overall_conversion_pct: float
    date_from: Optional[date]
    date_to: Optional[date]


# ── Cohort ────────────────────────────────────────────────────────────────────

class CohortRow(BaseModel):
    cohort_week: str
    total_users: int
    retained_week1: Optional[int]
    retained_week2: Optional[int]
    retained_week4: Optional[int]


class CohortOut(BaseModel):
    rows: List[CohortRow]


# ── Segment ───────────────────────────────────────────────────────────────────

class SegmentOut(BaseModel):
    name: str
    description: str
    user_count: int
    filter_criteria: Dict[str, Any]


class SegmentListOut(BaseModel):
    segments: List[SegmentOut]


# ── Event stream ──────────────────────────────────────────────────────────────

class EventStreamItem(BaseModel):
    id: uuid.UUID
    anonymous_id: str
    user_id: Optional[uuid.UUID]
    event_category: str
    event_name: str
    event_value: Optional[float]
    page_url: Optional[str]
    properties: Dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class EventStreamOut(BaseModel):
    events: List[EventStreamItem]
    total: int


# ── GSC ───────────────────────────────────────────────────────────────────────

class GscRow(BaseModel):
    page_url: str
    query: str
    date: date
    clicks: int
    impressions: int
    ctr: Optional[float]
    position: Optional[float]

    model_config = {"from_attributes": True}


class GscOut(BaseModel):
    rows: List[GscRow]
    total: int
    date_from: Optional[date]
    date_to: Optional[date]


# ── Consent / DPDP ───────────────────────────────────────────────────────────

class ConsentUpdateIn(BaseModel):
    anonymous_id: str
    consent_given: bool


class ConsentOut(BaseModel):
    anonymous_id: str
    consent_given: bool
    updated_at: str


# ── Identity stitching ────────────────────────────────────────────────────────

class IdentifyIn(BaseModel):
    anonymous_id: str
    user_id: str


# ── Dynamic funnel ────────────────────────────────────────────────────────────

class FunnelStepIn(BaseModel):
    event_name: str
    event_category: Optional[str] = None
    event_value_min: Optional[float] = None
    event_value_max: Optional[float] = None


class DynamicFunnelIn(BaseModel):
    steps: List[FunnelStepIn] = Field(..., min_length=2, max_length=8)
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    count_type: str = "unique_users"  # "unique_users" | "total_events"


class DynamicFunnelStepOut(BaseModel):
    step: int
    event_name: str
    users: int
    drop_off_pct: Optional[float]


class DynamicFunnelOut(BaseModel):
    steps: List[DynamicFunnelStepOut]
    overall_conversion_pct: float
    date_from: Optional[str]
    date_to: Optional[str]
    count_type: str


# ── Event catalog ─────────────────────────────────────────────────────────────

class EventCatalogItem(BaseModel):
    event_name: str
    event_category: str
    count: int


class EventCatalogOut(BaseModel):
    events: List[EventCatalogItem]


# ── Cohort retention heatmap ──────────────────────────────────────────────────

class CohortRetentionCell(BaseModel):
    week: int
    users: int
    pct: float


class CohortHeatmapRow(BaseModel):
    cohort_week: str
    total_users: int
    retention: List[CohortRetentionCell]


class CohortHeatmapOut(BaseModel):
    rows: List[CohortHeatmapRow]
    max_weeks: int


# ── User activity timeline ────────────────────────────────────────────────────

class ActivityItem(BaseModel):
    id: str
    event_category: str
    event_name: str
    properties: Dict[str, Any]
    page_url: Optional[str]
    page_title: Optional[str]
    created_at: datetime


class UserActivityOut(BaseModel):
    email: Optional[str]
    full_name: Optional[str]
    anonymous_id: Optional[str]
    user_id: Optional[str]
    signed_up_at: Optional[datetime]
    total_events: int
    events: List[ActivityItem]
    page: int
    page_size: int
    total: int
