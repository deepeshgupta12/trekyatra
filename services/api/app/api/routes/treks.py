from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.trek_intelligence import service as trek_intel_service
from app.modules.treks.service import get_trek_by_slug, list_treks
from app.schemas.cms import CMSPageResponse
from app.schemas.treks import TrekDetailResponse, TrekListResponse, TrekSummary
from app.schemas.trek_intelligence import (
    AskTrekQuestionRequest,
    AskTrekQuestionResponse,
    CompareTreksRequest,
    CompareTreksResponse,
    TrekProfile,
)

router = APIRouter(prefix="/treks", tags=["treks"])
limiter = Limiter(key_func=get_remote_address)


class FilterFacets(BaseModel):
    states:        list[str]
    difficulties:  list[str]
    seasons:       list[str]
    suitabilities: list[str]
    durations:     list[str]


# Duration bucket boundaries (days)
_DURATION_BUCKETS = [
    (1, 3,  "1–3 days"),
    (4, 6,  "4–6 days"),
    (7, 9,  "7–9 days"),
    (10, 99, "10+ days"),
]


def _bucket_durations(raw_durations: list[str]) -> list[str]:
    """Convert raw duration strings ('6 Days', '8 days'…) to display buckets."""
    covered: set[str] = set()
    for raw in raw_durations:
        try:
            days = int("".join(c for c in raw if c.isdigit()))
        except (ValueError, TypeError):
            continue
        for lo, hi, label in _DURATION_BUCKETS:
            if lo <= days <= hi:
                covered.add(label)
                break
    return [label for _, _, label in _DURATION_BUCKETS if label in covered]


@router.get("/filter-facets", response_model=FilterFacets)
def get_filter_facets(db: Session = Depends(get_db)) -> FilterFacets:
    """Return distinct filter values from published trek_guide CMS pages.
    Used to populate the Explore page filter sidebar dynamically.
    """
    from app.modules.cms.models import CMSPage
    rows = db.execute(
        select(
            CMSPage.trek_state,
            CMSPage.trek_difficulty,
            CMSPage.trek_season,
            CMSPage.trek_suitability,
            CMSPage.trek_duration,
        ).where(
            CMSPage.page_type == "trek_guide",
            CMSPage.status == "published",
        )
    ).fetchall()

    def distinct(col: int) -> list[str]:
        return sorted({r[col] for r in rows if r[col]})

    raw_durations = [r[4] for r in rows if r[4]]
    return FilterFacets(
        states        = distinct(0),
        difficulties  = distinct(1),
        seasons       = distinct(2),
        suitabilities = distinct(3),
        durations     = _bucket_durations(raw_durations),
    )


@router.get("/seasonal", response_model=list[CMSPageResponse])
def get_seasonal_treks(
    month: int | None = Query(default=None, ge=1, le=12),
    limit: int = Query(default=6, ge=1, le=20),
    db: Session = Depends(get_db),
) -> list[CMSPageResponse]:
    """Return published trek_guide pages whose trek_season covers the given month.

    Defaults to the current month if not provided.
    """
    from datetime import datetime

    from app.modules.cms import service as cms_service

    target_month = month or datetime.now().month
    pages = cms_service.get_seasonal_pages(db, month=target_month, limit=limit)
    return [CMSPageResponse.model_validate(p) for p in pages]


@router.get("", response_model=TrekListResponse)
def get_treks(
    beginner: bool | None = Query(None),
    state: str | None = Query(None),
    difficulty: str | None = Query(None),
    db: Session = Depends(get_db),
) -> TrekListResponse:
    treks = list_treks(db, beginner=beginner, state=state, difficulty=difficulty)
    return TrekListResponse(
        treks=[TrekSummary(**t) for t in treks],
        total=len(treks),
    )


@router.post("/compare", response_model=CompareTreksResponse)
@limiter.limit("15/minute")
def compare_treks(request: Request, payload: CompareTreksRequest, db: Session = Depends(get_db)) -> CompareTreksResponse:
    """Step 72: compare 2-4 trek_guide CMS pages with a cached AI trade-off summary."""
    try:
        return trek_intel_service.compare_treks(db, payload.slugs)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{slug}/profile", response_model=TrekProfile)
def get_trek_profile(slug: str, db: Session = Depends(get_db)) -> TrekProfile:
    """Step 72: full structured trek profile (used by datacenter subdomain + MCP)."""
    profile = trek_intel_service.get_trek_details(db, slug)
    if profile is None:
        raise HTTPException(status_code=404, detail="Trek not found")
    return profile


@router.get("/{slug}/content")
def get_trek_content_section(
    slug: str,
    section: str = Query(..., description="content_json section, e.g. itinerary|packing|faqs"),
    db: Session = Depends(get_db),
):
    """Step 72: fetch a single content_json section for grounding (e.g. itinerary)."""
    content = trek_intel_service.get_trek_content(db, slug, section)
    if content is None:
        raise HTTPException(status_code=404, detail="Trek or section not found")
    return {"slug": slug, "section": section, "content": content}


@router.post("/{slug}/ask", response_model=AskTrekQuestionResponse)
@limiter.limit("20/minute")
def ask_trek_question(
    request: Request, slug: str, payload: AskTrekQuestionRequest, db: Session = Depends(get_db)
) -> AskTrekQuestionResponse:
    """Step 72: Trek Detail Q&A — cached, Haiku-backed, never invents facts."""
    try:
        return trek_intel_service.ask_trek_question(db, slug, payload.question, history=payload.history)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{slug}", response_model=TrekDetailResponse)
def get_trek(slug: str, db: Session = Depends(get_db)) -> TrekDetailResponse:
    trek = get_trek_by_slug(db, slug)
    if trek is None:
        raise HTTPException(status_code=404, detail="Trek not found")
    return TrekDetailResponse(**trek)
