from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.treks.service import get_trek_by_slug, list_treks
from app.schemas.treks import TrekDetailResponse, TrekListResponse, TrekSummary

router = APIRouter(prefix="/treks", tags=["treks"])


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


@router.get("", response_model=TrekListResponse)
def get_treks(
    beginner: bool | None = Query(None),
    state: str | None = Query(None),
    difficulty: str | None = Query(None),
) -> TrekListResponse:
    treks = list_treks(beginner=beginner, state=state, difficulty=difficulty)
    return TrekListResponse(
        treks=[TrekSummary(**vars(t)) for t in treks],
        total=len(treks),
    )


@router.get("/{slug}", response_model=TrekDetailResponse)
def get_trek(slug: str) -> TrekDetailResponse:
    trek = get_trek_by_slug(slug)
    if trek is None:
        raise HTTPException(status_code=404, detail="Trek not found")
    return TrekDetailResponse(**vars(trek))
