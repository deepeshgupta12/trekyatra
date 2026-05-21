from __future__ import annotations

import uuid

import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin, get_optional_user
from app.modules.auth.models import User
from app.modules.cms import service as cms_service
from app.modules.cms.models import CMSPage
from app.schemas.cms import (
    CMSCacheInvalidateRequest,
    CMSCacheInvalidateResponse,
    CMSPageCreate,
    CMSPagePatch,
    CMSPageResponse,
)

# Public read endpoints — no auth (called server-side by Next.js without cookies)
router = APIRouter(prefix="/cms", tags=["cms"])

# Admin write endpoints — require admin token
_admin = Depends(get_current_admin)


@router.get("/pages/trending", response_model=list[CMSPageResponse])
def trending_trek_pages(
    limit: int = Query(default=6, ge=1, le=20),
    db: Session = Depends(get_db),
) -> list[CMSPageResponse]:
    """Return published trek_guide pages ranked by popularity.

    Score = (page_views last 30d × 0.5) + (bookmark count × 0.3) + (recency × 0.2).
    Falls back to is_featured=true first, then most-recently-published when no analytics data.
    """
    from sqlalchemy import text
    rows = db.execute(
        text(
            "SELECT c.id, c.slug, "
            "COALESCE(v.view_count, 0) * 0.5 + COALESCE(b.bookmark_count, 0) * 0.3 + "
            "EXTRACT(EPOCH FROM COALESCE(c.published_at, NOW() - INTERVAL '365 days')) / 1e9 * 0.2 "
            "  AS score "
            "FROM cms_pages c "
            "LEFT JOIN ( "
            "  SELECT page_slug, COUNT(*) AS view_count FROM page_views "
            "  WHERE viewed_at > NOW() - INTERVAL '30 days' GROUP BY page_slug "
            ") v ON v.page_slug = c.slug "
            "LEFT JOIN ( "
            "  SELECT trek_slug, COUNT(*) AS bookmark_count FROM user_bookmarks "
            "  WHERE trek_slug IS NOT NULL GROUP BY trek_slug "
            ") b ON b.trek_slug = c.slug "
            "WHERE c.page_type = 'trek_guide' AND c.status = 'published' "
            "ORDER BY c.is_featured DESC, score DESC "
            "LIMIT :lim"
        ),
        {"lim": limit},
    ).fetchall()
    slugs = [r[1] for r in rows]
    if not slugs:
        # Absolute fallback — no published trek guides yet
        pages = cms_service.list_pages(db, status="published", page_type="trek_guide", limit=limit)
        return [CMSPageResponse.model_validate(p) for p in pages]
    from sqlalchemy import select
    slug_to_pos = {s: i for i, s in enumerate(slugs)}
    pages_map = {
        p.slug: p
        for p in db.scalars(select(CMSPage).where(CMSPage.slug.in_(slugs))).all()
    }
    ordered = [pages_map[s] for s in slugs if s in pages_map]
    return [CMSPageResponse.model_validate(p) for p in ordered]


@router.get("/pages", response_model=list[CMSPageResponse])
def list_cms_pages(
    status: str | None = Query(default=None),
    page_type: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[CMSPageResponse]:
    pages = cms_service.list_pages(db, status=status, page_type=page_type, limit=limit, offset=offset)
    return [CMSPageResponse.model_validate(p) for p in pages]


@router.post("/pages", response_model=CMSPageResponse, status_code=status.HTTP_201_CREATED, dependencies=[_admin])
def create_cms_page(body: CMSPageCreate, db: Session = Depends(get_db)) -> CMSPageResponse:
    existing = cms_service.get_page_by_slug(db, body.slug)
    if existing:
        raise HTTPException(status_code=409, detail=f"CMS page with slug '{body.slug}' already exists.")
    page = cms_service.create_page(db, data=body)
    db.commit()
    db.refresh(page)
    return CMSPageResponse.model_validate(page)


@router.get("/pages/{slug}", response_model=CMSPageResponse)
def get_cms_page(
    slug: str,
    lang: str | None = Query(default=None, description="Language code (e.g. 'hi'). Falls back to 'en' if translation not found."),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> CMSPageResponse:
    page = cms_service.get_page_by_slug(db, slug)
    if not page:
        raise HTTPException(status_code=404, detail=f"CMS page '{slug}' not found.")

    # If a specific language is requested and the page has a translation, serve it
    if lang and lang != "en" and page.translations:
        translated_id = page.translations.get(lang)
        if translated_id:
            translated = db.get(CMSPage, _uuid.UUID(translated_id))
            if translated and translated.status == "published":
                page = translated

    response = CMSPageResponse.model_validate(page)

    # Premium content gating — enforce server-side (Step 40)
    if page.is_premium:
        user_plan = getattr(current_user, "subscription_plan", "free") if current_user else "free"
        if user_plan != "premium":
            response.content_html = ""
            response.content_json = None
            response.is_gated = True

    return response


@router.patch("/pages/{slug}", response_model=CMSPageResponse, dependencies=[_admin])
def patch_cms_page(
    slug: str,
    body: CMSPagePatch,
    db: Session = Depends(get_db),
) -> CMSPageResponse:
    page = cms_service.get_page_by_slug(db, slug)
    if not page:
        raise HTTPException(status_code=404, detail=f"CMS page '{slug}' not found.")
    page = cms_service.update_page(db, page=page, patch=body)
    db.commit()
    db.refresh(page)
    return CMSPageResponse.model_validate(page)


@router.post("/pages/{slug}/reparse-sections", response_model=CMSPageResponse, dependencies=[_admin])
def reparse_cms_page_sections(slug: str, db: Session = Depends(get_db)) -> CMSPageResponse:
    """Re-extract content_json.sections from the page's source draft markdown."""
    page = cms_service.get_page_by_slug(db, slug)
    if not page:
        raise HTTPException(status_code=404, detail=f"CMS page '{slug}' not found.")
    try:
        page = cms_service.reparse_sections_from_draft(db, page=page)
        db.commit()
        db.refresh(page)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return CMSPageResponse.model_validate(page)


@router.delete("/pages/{slug}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_admin])
def delete_cms_page(slug: str, db: Session = Depends(get_db)) -> None:
    page = cms_service.get_page_by_slug(db, slug)
    if not page:
        raise HTTPException(status_code=404, detail=f"CMS page '{slug}' not found.")
    cms_service.delete_page(db, page=page)
    db.commit()


@router.post("/cache/invalidate", response_model=CMSCacheInvalidateResponse, dependencies=[_admin])
def invalidate_cache(body: CMSCacheInvalidateRequest) -> CMSCacheInvalidateResponse:
    if body.scope == "all":
        cms_service.cache_invalidate_all()
        return CMSCacheInvalidateResponse(invalidated=["*"], message="All CMS page caches cleared.")

    slugs: list[str] = []
    if body.slug:
        slugs.append(body.slug)
    if body.slugs:
        slugs.extend(body.slugs)
    if not slugs:
        raise HTTPException(status_code=400, detail="Provide 'slug', 'slugs', or scope='all'.")

    cms_service.cache_invalidate(slugs)
    return CMSCacheInvalidateResponse(invalidated=slugs, message=f"Cache cleared for {len(slugs)} page(s).")
