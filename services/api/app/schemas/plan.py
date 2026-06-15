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


# ── Step 57: Plan My Trek Recommendation Engine ───────────────────────────────

class PlanRecommendRequest(BaseModel):
    """Input from the 6-step wizard."""
    intent: list[str] = Field(default_factory=list, description="e.g. ['beginner', 'snow']")
    months: list[str] = Field(default_factory=list, description="e.g. ['Dec','Jan','Feb']")
    duration_min: int = Field(default=1, ge=1, le=30)
    duration_max: int = Field(default=30, ge=1, le=30)
    experience_level: str = Field(default="moderate", description="never|easy|moderate|experienced|expert")
    fitness_level: str = Field(default="average", description="low|average|good|very_good")
    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)
    region: str | None = Field(default=None, max_length=100)
    comfort_preferences: list[str] = Field(default_factory=list)
    traveller_type: str | None = Field(default=None, description="solo|friends|couple|family|corporate|first-time")


class TrekRecommendation(BaseModel):
    """Single trek recommendation with match score and explanation."""
    slug: str
    name: str
    match_score: int = Field(ge=0, le=100, description="0-100 match percentage")
    category: str = Field(description="best_match|safer|adventurous|budget|comparison")
    why_this_matches: str
    warnings: list[str] = Field(default_factory=list)
    # Trek metadata from CMS
    state: str | None = None
    difficulty: str | None = None
    duration: str | None = None
    season: str | None = None
    altitude: str | None = None
    permits: str | None = None
    base: str | None = None
    hero_image_url: str | None = None
    seo_description: str | None = None
    suitability: str | None = None
    # Step 72 — structured trek intelligence fields (when verified/drafted)
    budget_min: int | None = None
    budget_max: int | None = None
    themes: list[str] | None = None
    permit_required: bool | None = None
    crowd_level: str | None = None


class PlanRecommendResponse(BaseModel):
    """Top 5 trek recommendations from the scoring engine."""
    recommendations: list[TrekRecommendation]
    total_treks_scored: int
    no_match: bool = False
    no_match_message: str | None = None
