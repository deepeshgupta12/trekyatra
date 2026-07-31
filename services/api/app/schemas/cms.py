from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class CMSPageCreate(BaseModel):
    slug: str
    page_type: str
    title: str
    content_html: str = ""
    content_json: dict[str, Any] | None = None
    status: str = "draft"
    seo_title: str | None = None
    seo_description: str | None = None
    seo_meta: dict[str, Any] | None = None
    hero_image_url: str | None = None
    brief_id: uuid.UUID | None = None
    cluster_id: uuid.UUID | None = None
    language: str = "en"
    translations: dict[str, Any] | None = None
    source_page_id: uuid.UUID | None = None
    is_premium: bool = False


class CMSPagePatch(BaseModel):
    title: str | None = None
    content_html: str | None = None
    content_json: dict[str, Any] | None = None
    status: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    seo_meta: dict[str, Any] | None = None
    hero_image_url: str | None = None
    route_image_url: str | None = None
    language: str | None = None
    translations: dict[str, Any] | None = None
    is_premium: bool | None = None
    # Featured flag (Step 54) — marks trek as "Featured" on explore page
    is_featured: bool | None = None
    # Trek guide metadata columns (Step 46) — editable by admin
    trek_name: str | None = None
    trek_state: str | None = None
    trek_difficulty: str | None = None
    trek_duration: str | None = None
    trek_season: str | None = None
    trek_suitability: str | None = None


class CMSPageResponse(BaseModel):
    id: uuid.UUID
    slug: str
    page_type: str
    title: str
    content_html: str
    content_json: dict[str, Any] | None = None
    status: str
    seo_title: str | None = None
    seo_description: str | None = None
    seo_meta: dict[str, Any] | None = None
    hero_image_url: str | None = None
    route_image_url: str | None = None
    brief_id: uuid.UUID | None = None
    cluster_id: uuid.UUID | None = None
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    language: str = "en"
    translations: dict[str, Any] | None = None
    source_page_id: uuid.UUID | None = None
    is_premium: bool = False
    is_gated: bool = False  # set True at route level for premium pages when user is free
    # Trek guide metadata (only populated for page_type = "trek_guide")
    trek_name: str | None = None
    trek_state: str | None = None
    trek_difficulty: str | None = None
    trek_duration: str | None = None
    trek_season: str | None = None
    trek_suitability: str | None = None
    trek_permit_required: bool | None = None
    # Master CMS trek metadata (admin/trek-data backfill + intelligence) — mobile trek-detail facts
    # table (STEP-M30 N07). Additive/optional; web clients ignore unknown fields.
    trek_region: str | None = None
    trek_max_altitude_ft: int | None = None
    trek_duration_days_min: int | None = None
    trek_duration_days_max: int | None = None
    trek_best_months: list[int] | None = None
    trek_open_months: list[int] | None = None
    trek_avoid_months: list[int] | None = None
    trek_permit_notes: str | None = None
    trek_budget_min: int | None = None
    trek_budget_max: int | None = None
    trek_themes: list[str] | None = None
    trek_crowd_level: str | None = None
    trek_beginner_friendly: bool | None = None
    trek_solo_friendly: bool | None = None
    trek_family_friendly: bool | None = None
    trek_operator_available: bool | None = None

    model_config = {"from_attributes": True}


class CMSCacheInvalidateRequest(BaseModel):
    slug: str | None = None
    slugs: list[str] | None = None
    scope: str | None = None  # "all" to flush all pages


class CMSCacheInvalidateResponse(BaseModel):
    invalidated: list[str]
    message: str
