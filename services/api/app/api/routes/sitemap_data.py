"""Public sitemap data endpoints.

Provides two endpoints:
- GET /public/sitemap-pages         — English published CMS pages (default; language='en')
- GET /public/sitemap-pages/hindi   — Published Hindi trek pages with source_slug for URL building

No authentication required. Lightweight, tuned for sitemap crawlers.
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


class HindiSitemapEntry(BaseModel):
    """Entry for Hindi sitemap — source_slug is the English page slug used in /hi/trek/{source_slug}."""
    source_slug: str
    page_type: str
    updated_at: datetime
    published_at: datetime | None


@router.get("/sitemap-pages", response_model=list[SitemapEntry])
def sitemap_pages(
    limit: int = Query(default=500, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[SitemapEntry]:
    """Return published English CMS pages for sitemap generation.
    Returns only language='en' pages to prevent Hindi pages from bleeding into the main sitemap.
    Public endpoint — no authentication required.
    """
    rows = db.execute(
        select(
            CMSPage.slug,
            CMSPage.page_type,
            CMSPage.updated_at,
            CMSPage.published_at,
        )
        .where(CMSPage.status == "published")
        .where(
            (CMSPage.language == "en") | (CMSPage.language.is_(None))
        )
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


@router.get("/sitemap-pages/hindi", response_model=list[HindiSitemapEntry])
def sitemap_pages_hindi(
    limit: int = Query(default=500, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[HindiSitemapEntry]:
    """Return published Hindi CMS pages for the Hindi sitemap.
    Each entry includes source_slug (the English page slug) so the frontend can build
    /hi/trek/{source_slug} URLs correctly.
    Public endpoint — no authentication required.
    """
    # Join Hindi pages with their English source pages to get the source slug
    hi_alias = CMSPage.__table__.alias("hi")
    src_alias = CMSPage.__table__.alias("src")

    rows = db.execute(
        select(
            src_alias.c.slug.label("source_slug"),
            hi_alias.c.page_type,
            hi_alias.c.updated_at,
            hi_alias.c.published_at,
        )
        .select_from(hi_alias)
        .join(src_alias, hi_alias.c.source_page_id == src_alias.c.id)
        .where(hi_alias.c.status == "published")
        .where(hi_alias.c.language == "hi")
        .where(hi_alias.c.page_type == "trek_guide")
        .order_by(hi_alias.c.updated_at.desc())
        .limit(limit)
    ).all()

    return [
        HindiSitemapEntry(
            source_slug=r.source_slug,
            page_type=r.page_type,
            updated_at=r.updated_at,
            published_at=r.published_at,
        )
        for r in rows
    ]
