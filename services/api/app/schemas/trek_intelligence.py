from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TrekProfile(BaseModel):
    """Full structured trek profile — canonical shape served by /treks/{slug}/profile,
    the datacenter subdomain, and the MCP get_trek_details/search_treks tools."""

    slug: str
    name: str
    title: str
    state: str | None = None
    region: str | None = None
    difficulty: str | None = None
    duration: str | None = None
    duration_days_min: int | None = None
    duration_days_max: int | None = None
    season: str | None = None
    best_months: list[int] | None = None
    open_months: list[int] | None = None
    avoid_months: list[int] | None = None
    max_altitude_ft: int | None = None
    permit_required: bool | None = None
    permit_notes: str | None = None
    budget_min: int | None = None
    budget_max: int | None = None
    themes: list[str] | None = None
    crowd_level: str | None = None
    beginner_friendly: bool | None = None
    solo_friendly: bool | None = None
    family_friendly: bool | None = None
    operator_available: bool = True
    is_unsafe_closed: bool = False
    suitability: str | None = None
    seo_description: str | None = None
    hero_image_url: str | None = None
    data_confidence: dict[str, str] = Field(default_factory=dict)
    last_verified_at: datetime | None = None
    content_sections: dict[str, str] = Field(default_factory=dict)
    faqs: list[dict[str, str]] = Field(default_factory=list)


class CompareTreksRequest(BaseModel):
    slugs: list[str] = Field(min_length=2, max_length=4)


class TrekComparisonRow(BaseModel):
    field: str
    label: str
    values: list[str | int | bool | None]


class CompareTreksResponse(BaseModel):
    treks: list[TrekProfile]
    rows: list[TrekComparisonRow]
    ai_summary: str | None = None


class ChatTurn(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AskTrekQuestionRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    history: list[ChatTurn] | None = None


class AskTrekQuestionResponse(BaseModel):
    answer: str
    cached: bool = False
    not_verified: bool = False


class OperatorHelpLeadRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: str
    phone: str | None = None
    trek_slug: str | None = None
    trek_interest: str
    message: str | None = None
    consent: bool = False
    travel_month: str | None = None
    traveller_count: int | None = None
    city: str | None = None
    budget_preference: str | None = None
    transport_required: bool | None = None
    source_page: str = "/"


class BackfillTrekMetaRequest(BaseModel):
    slug: str


class AILogRequest(BaseModel):
    source: str = Field(description="web|mobile|chatgpt|claude")
    tool_name: str
    query_summary: str | None = None
    result_summary: str | None = None
    page_url: str | None = None
    session_id: str | None = None
    trek_slugs: list[str] | None = None


class TrekContentSection(BaseModel):
    slug: str
    section: str
    content: Any = None


class TrekMetaPatch(BaseModel):
    """Admin-editable structured trek fields (Step 72 trek data-quality dashboard)."""

    trek_region: str | None = None
    trek_max_altitude_ft: int | None = None
    trek_duration_days_min: int | None = None
    trek_duration_days_max: int | None = None
    trek_best_months: list[int] | None = None
    trek_open_months: list[int] | None = None
    trek_avoid_months: list[int] | None = None
    trek_permit_required: bool | None = None
    trek_permit_notes: str | None = None
    trek_budget_min: int | None = None
    trek_budget_max: int | None = None
    trek_themes: list[str] | None = None
    trek_crowd_level: str | None = None
    trek_beginner_friendly: bool | None = None
    trek_solo_friendly: bool | None = None
    trek_family_friendly: bool | None = None
    trek_operator_available: bool | None = None
    trek_is_unsafe_closed: bool | None = None


class TrekDataQualityRow(BaseModel):
    slug: str
    name: str
    verified_count: int
    draft_count: int
    missing_count: int
    is_unsafe_closed: bool
    last_verified_at: datetime | None = None


class AIInteractionLogResponse(BaseModel):
    id: str
    source: str
    tool_name: str
    query_summary: str | None = None
    result_summary: str | None = None
    page_url: str | None = None
    trek_slugs: list[str] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BackfillTriggerResponse(BaseModel):
    slug: str
    status: str


class BackfillAllTriggerResponse(BaseModel):
    status: str
    trek_count: int
