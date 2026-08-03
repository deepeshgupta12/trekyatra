"""Public sitemap data endpoints.

Provides two endpoints:
- GET /public/sitemap-pages         — English published CMS pages (default; language='en')
- GET /public/sitemap-pages/hindi   — Published Hindi trek pages with source_slug for URL building
- GET /public/sitemap-treks         — Trek guide pages with max(updated_at, conditions last_updated_at)

No authentication required. Lightweight, tuned for sitemap crawlers.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, outerjoin, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.cms.models import CMSPage
from app.modules.conditions.models import TrekCondition

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


class TrekSitemapEntry(BaseModel):
    slug: str
    trek_state: str | None
    last_modified: datetime


@router.get("/sitemap-treks", response_model=list[TrekSitemapEntry])
def sitemap_treks(
    state: str | None = Query(default=None, description="Filter by trek_state (substring, case-insensitive)"),
    limit: int = Query(default=500, ge=1, le=50000),  # 50000 = sitemap spec max (single catch-all sitemap)
    db: Session = Depends(get_db),
) -> list[TrekSitemapEntry]:
    """Published trek_guide pages with lastmod = max(cms_pages.updated_at, trek_conditions.last_updated_at).
    Used by state-specific XML sitemaps so Google re-crawls trek pages when conditions are refreshed.
    """
    stmt = (
        select(
            CMSPage.slug,
            CMSPage.trek_state,
            func.greatest(
                CMSPage.updated_at,
                func.coalesce(TrekCondition.last_updated_at, CMSPage.updated_at),
            ).label("last_modified"),
        )
        .select_from(
            outerjoin(CMSPage, TrekCondition, CMSPage.slug == TrekCondition.slug)
        )
        .where(CMSPage.status == "published")
        .where(CMSPage.page_type == "trek_guide")
        .where((CMSPage.language == "en") | CMSPage.language.is_(None))
        .order_by(CMSPage.updated_at.desc())
        .limit(limit)
    )
    if state:
        # Substring match (consistent with list_pages / trek_season / trek_suitability) so a region
        # like "Nepal" catches composite trek_state values such as "Koshi Province, Nepal / Tibet,
        # China" (the 8000m peaks). Without this, international treks land in no sitemap at all.
        # Exact single-state filters are unaffected (nothing else contains "Uttarakhand" etc.).
        stmt = stmt.where(CMSPage.trek_state.ilike(f"%{state}%"))

    rows = db.execute(stmt).all()
    return [
        TrekSitemapEntry(slug=r.slug, trek_state=r.trek_state, last_modified=r.last_modified)
        for r in rows
    ]


class TrekStateCount(BaseModel):
    state: str
    count: int


@router.get("/trek-state-counts", response_model=list[TrekStateCount])
def trek_state_counts(db: Session = Depends(get_db)) -> list[TrekStateCount]:
    """Published trek_guide counts grouped by trek_state — powers the dynamic
    'trekking regions' home section. New states appear automatically as treks are
    published; counts stay live. Public, no auth.
    """
    rows = db.execute(
        select(CMSPage.trek_state, func.count().label("count"))
        .where(CMSPage.status == "published")
        .where(CMSPage.page_type == "trek_guide")
        .where(CMSPage.trek_state.isnot(None))
        .where(CMSPage.trek_state != "")
        # Exclude *test* pipeline fixtures so home region counts reflect real treks
        # only (production-safe: no real trek slug contains "test").
        .where(CMSPage.slug.notilike("%test%"))
        .where((CMSPage.language == "en") | CMSPage.language.is_(None))
        .group_by(CMSPage.trek_state)
        .order_by(func.count().desc(), CMSPage.trek_state)
    ).all()
    return [TrekStateCount(state=r.trek_state, count=int(r.count)) for r in rows]


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
