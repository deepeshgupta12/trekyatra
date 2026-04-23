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


class CMSPagePatch(BaseModel):
    title: str | None = None
    content_html: str | None = None
    content_json: dict[str, Any] | None = None
    status: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    seo_meta: dict[str, Any] | None = None
    hero_image_url: str | None = None


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
    brief_id: uuid.UUID | None = None
    cluster_id: uuid.UUID | None = None
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CMSCacheInvalidateRequest(BaseModel):
    slug: str | None = None
    slugs: list[str] | None = None
    scope: str | None = None  # "all" to flush all pages


class CMSCacheInvalidateResponse(BaseModel):
    invalidated: list[str]
    message: str
