from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.modules.treks.service import get_trek_by_slug, list_treks
from app.schemas.treks import TrekDetailResponse, TrekListResponse, TrekSummary

router = APIRouter(prefix="/treks", tags=["treks"])


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
