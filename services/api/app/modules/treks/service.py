from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage
from app.modules.conditions.service import TREK_COORDS

# PT4 (Step 81) — the 12 hardcoded stub treks (old app/modules/treks/data.py) were
# removed. The CMS is now the sole source of trek data: /api/v1/treks and
# /api/v1/treks/{slug} serve real published trek_guide pages. A "real" trek is a
# published English trek_guide with a non-null trek_state whose slug is not a test
# fixture (excludes both the stateless seed rows and any *test* pipeline fixtures).
# Ordered newest-published first. Production-safe: no real trek slug contains "test".

_DEFAULT_IMAGE = "/images/trek-forest.jpg"


def _facts(page: CMSPage) -> dict:
    return (page.content_json or {}).get("trek_facts", {}) or {}


def _cms_to_trek(page: CMSPage) -> dict:
    """Map a trek_guide CMSPage to the TrekSummary/TrekDetailResponse shape."""
    tf = _facts(page)
    alt = page.trek_max_altitude_ft
    return {
        "slug": page.slug,
        "name": page.trek_name or page.title,
        "region": page.trek_region or page.trek_state or "",
        "state": page.trek_state or "",
        "duration": page.trek_duration or tf.get("duration") or "—",
        "altitude": f"{alt:,} ft" if alt else (tf.get("altitude") or "—"),
        "difficulty": page.trek_difficulty or tf.get("difficulty") or "Moderate",
        "season": page.trek_season or tf.get("season") or "—",
        "description": page.seo_description or "",
        "beginner": bool(page.trek_beginner_friendly),
        "image": page.hero_image_url or _DEFAULT_IMAGE,
    }


def _real_trek_query():
    return (
        select(CMSPage)
        .where(
            CMSPage.page_type == "trek_guide",
            CMSPage.status == "published",
            CMSPage.trek_state.isnot(None),
            CMSPage.trek_state != "",
            CMSPage.slug.notilike("%test%"),
            (CMSPage.language == "en") | CMSPage.language.is_(None),
        )
        .order_by(CMSPage.published_at.desc().nullslast(), CMSPage.trek_name)
    )


def list_treks(
    db: Session,
    beginner: bool | None = None,
    state: str | None = None,
    difficulty: str | None = None,
    limit: int = 200,
) -> list[dict]:
    q = _real_trek_query()
    if state:
        q = q.where(CMSPage.trek_state == state)
    if difficulty:
        q = q.where(CMSPage.trek_difficulty.ilike(difficulty))
    if beginner is not None:
        q = q.where(CMSPage.trek_beginner_friendly.is_(beginner))
    pages = db.scalars(q.limit(limit)).all()
    return [_cms_to_trek(p) for p in pages]


def get_trek_by_slug(db: Session, slug: str) -> dict | None:
    page = db.scalar(
        select(CMSPage).where(
            CMSPage.slug == slug,
            CMSPage.page_type == "trek_guide",
            CMSPage.status == "published",
        )
    )
    return _cms_to_trek(page) if page else None


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
