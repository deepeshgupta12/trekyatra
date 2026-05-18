"""Public sitemap data endpoint.

Returns minimal published CMS page data (slug, page_type, updated_at) for sitemap
generation. No authentication required. This endpoint exists specifically to serve
the Next.js sitemap server function, which cannot use cookies/auth.

The standard /cms/pages endpoint is public too but goes through the full response
model (large). This endpoint is lightweight and tuned for sitemap crawlers.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.cms.models import CMSPage

router = APIRouter(prefix="/public", tags=["public"])


class SitemapEntry(BaseModel):
    slug: str
    page_type: str
    updated_at: datetime
    published_at: datetime | None


@router.get("/sitemap-pages", response_model=list[SitemapEntry])
def sitemap_pages(
    limit: int = Query(default=500, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[SitemapEntry]:
    """Return all published CMS pages needed for sitemap generation.
    Public endpoint — no authentication required.
    Optimised: only fetches slug, page_type, updated_at, published_at.
    """
    rows = db.execute(
        select(
            CMSPage.slug,
            CMSPage.page_type,
            CMSPage.updated_at,
            CMSPage.published_at,
        )
        .where(CMSPage.status == "published")
        .order_by(CMSPage.updated_at.desc())
        .limit(limit)
    ).all()

    return [
        SitemapEntry(
            slug=r.slug,
            page_type=r.page_type,
            updated_at=r.updated_at,
            published_at=r.published_at,
        )
        for r in rows
    ]
