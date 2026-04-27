from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.linking.service import (
    get_anchor_suggestions,
    get_orphan_pages,
    get_related_pages,
    sync_pages_from_cms,
)
from app.schemas.linking import AnchorSuggestion, OrphanResponse, RelatedPageResponse, SyncResponse

public_router = APIRouter(prefix="/links", tags=["linking"])
admin_router = APIRouter(prefix="/admin/links", tags=["linking-admin"], dependencies=[Depends(get_current_admin)])


@admin_router.post("/sync", response_model=SyncResponse)
def trigger_sync(db: Session = Depends(get_db)) -> SyncResponse:
    count = sync_pages_from_cms(db)
    db.commit()
    return SyncResponse(synced=count, message=f"Synced {count} pages from CMS.")


@public_router.get("/suggestions/{slug}", response_model=list[RelatedPageResponse])
def related_pages(slug: str, limit: int = 5, db: Session = Depends(get_db)) -> list[RelatedPageResponse]:
    pages = get_related_pages(db, slug=slug, limit=limit)
    return [RelatedPageResponse.model_validate(p) for p in pages]


@admin_router.get("/orphans", response_model=OrphanResponse)
def orphan_pages(db: Session = Depends(get_db)) -> OrphanResponse:
    from app.schemas.linking import PageResponse
    pages = get_orphan_pages(db)
    return OrphanResponse(
        pages=[PageResponse.model_validate(p) for p in pages],
        count=len(pages),
    )


@admin_router.get("/anchors/{slug}", response_model=list[AnchorSuggestion])
def anchor_suggestions(slug: str, db: Session = Depends(get_db)) -> list[AnchorSuggestion]:
    suggestions = get_anchor_suggestions(db, slug=slug)
    return [AnchorSuggestion(**s) for s in suggestions]
