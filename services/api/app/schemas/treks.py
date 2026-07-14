from __future__ import annotations

from pydantic import BaseModel


class TrekSummary(BaseModel):
    slug: str
    name: str
    region: str
    state: str
    duration: str
    altitude: str
    difficulty: str
    season: str
    description: str
    beginner: bool
    image: str | None = None


class TrekListResponse(BaseModel):
    treks: list[TrekSummary]
    total: int


class TrekDetailResponse(TrekSummary):
    pass
