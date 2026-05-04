from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class RecommendationItem(BaseModel):
    id: str
    slug: str
    title: str
    page_type: str
    hero_image_url: str | None = None
    seo_description: str | None = None
    published_at: str | None = None


class SimilarPagesResponse(BaseModel):
    page_slug: str
    items: list[RecommendationItem]


class RecommendationsResponse(BaseModel):
    personalised: bool
    items: list[RecommendationItem]
