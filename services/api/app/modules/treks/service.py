from __future__ import annotations

from app.modules.treks.data import TREKS, TrekRecord


def list_treks(
    beginner: bool | None = None,
    state: str | None = None,
    difficulty: str | None = None,
) -> list[TrekRecord]:
    result = list(TREKS)
    if beginner is not None:
        result = [t for t in result if t.beginner == beginner]
    if state:
        result = [t for t in result if t.state.lower() == state.lower()]
    if difficulty:
        result = [t for t in result if t.difficulty.lower() == difficulty.lower()]
    return result


def get_trek_by_slug(slug: str) -> TrekRecord | None:
    return next((t for t in TREKS if t.slug == slug), None)
