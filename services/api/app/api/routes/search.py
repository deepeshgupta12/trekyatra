"""Search API endpoints — Step 44: Discovery Engine Improvements.

POST /search/log     — record a search query + optional result click
GET  /search/suggestions — CMS-powered autocomplete across all page types
GET  /search/trending — most-searched queries in the last 7 days
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.search import service as search_service

router = APIRouter(prefix="/search", tags=["search"])


class SearchLogRequest(BaseModel):
    query: str
    results_count: int = 0
    session_id: str | None = None
    clicked_slug: str | None = None
    clicked_page_type: str | None = None


class SearchSuggestion(BaseModel):
    slug: str
    title: str
    page_type: str
    hero_image_url: str | None
    seo_description: str | None


@router.post("/log", status_code=204)
def log_search(
    payload: SearchLogRequest,
    db: Session = Depends(get_db),
) -> None:
    """Record a search query for analytics. Returns 204 — fire-and-forget from frontend."""
    if not payload.query.strip():
        return
    search_service.log_search_event(
        db,
        query=payload.query,
        results_count=payload.results_count,
        session_id=payload.session_id,
        clicked_slug=payload.clicked_slug,
        clicked_page_type=payload.clicked_page_type,
    )


@router.get("/suggestions", response_model=list[SearchSuggestion])
def search_suggestions(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(default=8, ge=1, le=20),
    db: Session = Depends(get_db),
) -> list[SearchSuggestion]:
    """Return CMS page suggestions matching the query (all page types, not just treks)."""
    items = search_service.get_cms_suggestions(db, q, limit=limit)
    return [SearchSuggestion(**item) for item in items]


@router.get("/trending", response_model=list[str])
def trending_queries(
    limit: int = Query(default=10, ge=1, le=30),
    db: Session = Depends(get_db),
) -> list[str]:
    """Return the most frequently searched queries in the last 7 days."""
    return search_service.get_trending_queries(db, limit=limit)
