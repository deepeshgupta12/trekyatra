from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.cms import service as cms_service
from app.schemas.cms import (
    CMSCacheInvalidateRequest,
    CMSCacheInvalidateResponse,
    CMSPageCreate,
    CMSPagePatch,
    CMSPageResponse,
)

router = APIRouter(prefix="/cms", tags=["cms"])


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


@router.post("/pages", response_model=CMSPageResponse, status_code=status.HTTP_201_CREATED)
def create_cms_page(body: CMSPageCreate, db: Session = Depends(get_db)) -> CMSPageResponse:
    existing = cms_service.get_page_by_slug(db, body.slug)
    if existing:
        raise HTTPException(status_code=409, detail=f"CMS page with slug '{body.slug}' already exists.")
    page = cms_service.create_page(db, data=body)
    db.commit()
    db.refresh(page)
    return CMSPageResponse.model_validate(page)


@router.get("/pages/{slug}", response_model=CMSPageResponse)
def get_cms_page(slug: str, db: Session = Depends(get_db)) -> CMSPageResponse:
    page = cms_service.get_page_by_slug(db, slug)
    if not page:
        raise HTTPException(status_code=404, detail=f"CMS page '{slug}' not found.")
    return CMSPageResponse.model_validate(page)


@router.patch("/pages/{slug}", response_model=CMSPageResponse)
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


@router.delete("/pages/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cms_page(slug: str, db: Session = Depends(get_db)) -> None:
    page = cms_service.get_page_by_slug(db, slug)
    if not page:
        raise HTTPException(status_code=404, detail=f"CMS page '{slug}' not found.")
    cms_service.delete_page(db, page=page)
    db.commit()


@router.post("/cache/invalidate", response_model=CMSCacheInvalidateResponse)
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
