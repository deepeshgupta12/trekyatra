from __future__ import annotations
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class BookmarkResponse(BaseModel):
    id: UUID
    user_id: UUID
    cms_page_id: UUID | None = None
    trek_slug: str | None = None
    created_at: datetime
    slug: str | None = None
    title: str | None = None
    page_type: str | None = None
    hero_image_url: str | None = None

    model_config = {"from_attributes": True}


class BookmarkCreate(BaseModel):
    cms_page_id: UUID


class BookmarkBySlugCreate(BaseModel):
    trek_slug: str
    title: str | None = None
    hero_image_url: str | None = None


class BookmarkCheckResponse(BaseModel):
    bookmarked: bool
    bookmark_id: UUID | None = None


class DownloadResponse(BaseModel):
    id: UUID
    user_id: UUID
    product_id: str | None
    order_id: UUID | None = None
    filename: str
    download_url: str | None = None
    downloaded_at: datetime

    model_config = {"from_attributes": True}


class TrekAlertCreate(BaseModel):
    trek_slug: str
    alert_type: str = "any"


class TrekAlertResponse(BaseModel):
    id: UUID
    user_id: UUID
    trek_slug: str
    alert_type: str
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    fitness_level: str | None = None
    trek_experience: str | None = None
    preferred_regions: list[str] | None = None
    budget_range: str | None = None


class UserProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    fitness_level: str | None
    trek_experience: str | None
    preferred_regions: list[str] | None
    budget_range: str | None
    submitted_at: datetime | None
    updated_at: datetime

    model_config = {"from_attributes": True}


class ComparisonCreate(BaseModel):
    name: str
    slugs: list[str]


class ComparisonResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    slugs: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
