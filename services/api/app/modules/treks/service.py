from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from app.modules.treks.data import TREKS, TrekRecord
from app.modules.conditions.service import TREK_COORDS


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


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * R * asin(sqrt(a))


def get_nearby_treks(
    lat: float,
    lon: float,
    radius_km: float = 200,
    limit: int = 10,
) -> list[dict]:
    """Return treks sorted by straight-line distance from the given coordinates.

    Uses the shared TREK_COORDS dict from conditions service — no DB query needed.
    Returns slug + distance_km only; caller enriches with CMS data.
    """
    results: list[dict] = []
    for slug, (tlat, tlon) in TREK_COORDS.items():
        dist = _haversine_km(lat, lon, tlat, tlon)
        if dist <= radius_km:
            results.append({"slug": slug, "distance_km": round(dist, 1)})
    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]
