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
    is_internal: bool = False


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


# ── Step 67: Event Definitions ────────────────────────────────────────────────

class EventDefinitionOut(BaseModel):
    id: uuid.UUID
    event_name: str
    event_category: str
    description: Optional[str]
    is_active: bool
    is_test_only: bool

    model_config = {"from_attributes": True}


class EventDefinitionsOut(BaseModel):
    events: List[EventDefinitionOut]
    total: int


# ── Step 67: KPI Dashboard ─────────────────────────────────────────────────────

class SparklinePoint(BaseModel):
    label: str
    value: int


class KpiTile(BaseModel):
    key: str
    label: str
    value: int
    delta: int
    delta_pct: float
    trend: str  # "up" | "down" | "flat"
    sparkline: List[SparklinePoint]


class KpisOut(BaseModel):
    tiles: List[KpiTile]


# ── Step 67: Alerts ────────────────────────────────────────────────────────────

class AlertItem(BaseModel):
    id: str
    severity: str  # "warning" | "info" | "critical"
    title: str
    body: str


class AlertsOut(BaseModel):
    alerts: List[AlertItem]


# ── Step 67: Real-time feed ────────────────────────────────────────────────────

class RealtimeFeedItem(BaseModel):
    id: uuid.UUID
    anonymous_id: str
    user_id: Optional[uuid.UUID]
    event_category: str
    event_name: str
    page_url: Optional[str]
    properties: Dict[str, Any]
    is_internal: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RealtimeFeedOut(BaseModel):
    events: List[RealtimeFeedItem]


# ── Step 67: Event Explorer ────────────────────────────────────────────────────

class EventExplorerItem(BaseModel):
    id: uuid.UUID
    anonymous_id: str
    user_id: Optional[uuid.UUID]
    session_id: Optional[str]
    event_category: str
    event_name: str
    event_value: Optional[float]
    page_url: Optional[str]
    page_title: Optional[str]
    properties: Dict[str, Any]
    device_type: Optional[str]
    browser: Optional[str]
    country: Optional[str]
    is_internal: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class EventExplorerOut(BaseModel):
    events: List[EventExplorerItem]
    total: int
    page: int
    page_size: int


# ── Step 67: Funnel templates ──────────────────────────────────────────────────

class FunnelTemplateStep(BaseModel):
    event_name: str


class FunnelTemplate(BaseModel):
    id: str
    name: str
    description: str
    steps: List[FunnelTemplateStep]


class FunnelTemplatesOut(BaseModel):
    templates: List[FunnelTemplate]


# ── Step 67: Custom cohort ─────────────────────────────────────────────────────

class CustomCohortIn(BaseModel):
    cohort_event: str = "session_started"
    retention_event: Optional[str] = None  # None = any activity
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    max_weeks: int = Field(default=9, ge=2, le=16)


# ── Step 67: Segment builder ───────────────────────────────────────────────────

class SegmentCondition(BaseModel):
    type: str  # "event_count" | "event_property" | "trait" | "inactivity"
    event_name: Optional[str] = None
    property_key: Optional[str] = None
    property_value: Optional[str] = None
    operator: str = "gte"  # "gte" | "lte" | "eq" | "contains"
    value: Any = None
    time_window_days: Optional[int] = None


class CustomSegmentIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = None
    conditions: List[SegmentCondition] = Field(..., min_length=1)


class CustomSegmentOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    conditions: List[Dict[str, Any]]
    user_count: Optional[int]
    last_computed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomSegmentListOut(BaseModel):
    segments: List[CustomSegmentOut]
    total: int


class SegmentPreviewIn(BaseModel):
    conditions: List[SegmentCondition] = Field(..., min_length=1)


class SegmentPreviewOut(BaseModel):
    estimated_count: int
    evaluated_in_ms: int


# ── Step 67: Content analytics ─────────────────────────────────────────────────

class ContentPageAnalytics(BaseModel):
    slug: str
    title: str
    page_type: str
    views_7d: int
    views_30d: int
    scroll_50_count: int
    scroll_100_count: int
    leads: int
    published_at: Optional[str]


class ContentPagesOut(BaseModel):
    pages: List[ContentPageAnalytics]
    total: int


class TrekAnalyticsRow(BaseModel):
    trek_slug: str
    trek_name: str
    views_30d: int
    plan_cta_clicks: int
    plan_completions: int
    save_count: int
    conversion_rate: float


class TrekAnalyticsOut(BaseModel):
    treks: List[TrekAnalyticsRow]
    total: int


# ── Step 67: Webhook rules ─────────────────────────────────────────────────────

class WebhookRuleIn(BaseModel):
    name: Optional[str] = None
    trigger_event: str = Field(..., min_length=1, max_length=120)
    condition: Optional[Dict[str, Any]] = None
    webhook_url: str = Field(..., min_length=1)


class WebhookRuleOut(BaseModel):
    id: uuid.UUID
    name: Optional[str]
    trigger_event: str
    condition: Optional[Dict[str, Any]]
    webhook_url: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookRulesOut(BaseModel):
    rules: List[WebhookRuleOut]
    total: int


# ── Step 67: Suppression ───────────────────────────────────────────────────────

class SuppressionItem(BaseModel):
    user_id: uuid.UUID
    email: Optional[str]
    full_name: Optional[str]
    suppressed_at: Optional[datetime]


class SuppressionsOut(BaseModel):
    users: List[SuppressionItem]
    total: int
