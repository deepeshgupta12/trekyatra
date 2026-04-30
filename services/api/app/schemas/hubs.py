from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

HUB_PAGE_TYPES = {"seasonal_hub", "cluster_hub", "regional_hub"}

VALID_SEASON_SLUGS = {"winter", "summer", "monsoon", "spring"}


class HubPageResponse(BaseModel):
    id: uuid.UUID
    slug: str
    page_type: str
    title: str
    status: str
    published_at: datetime | None = None
    updated_at: datetime | None = None
    seo_title: str | None = None
    hero_image_url: str | None = None


class HubRegenerateRequest(BaseModel):
    season_slug: str | None = None


class HubRegenerateResponse(BaseModel):
    slug: str
    hub_type: str
    message: str
    page_id: str | None = None
