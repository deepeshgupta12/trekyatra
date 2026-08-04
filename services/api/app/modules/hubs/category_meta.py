"""Curated Trek Category taxonomy — the fixed source for cluster_hub (/trek-types) generation.

Regional hubs map on `trek_state` and seasonal hubs on month arrays; Trek Categories have no single
populated column, so each category is a curated entry with a **predicate** over reliable trek fields
(trek_suitability / trek_difficulty / trek_duration / altitude / trek_themes). This is the fixed
taxonomy half of the "Both" cluster design; keyword_cluster-sourced hubs are handled separately
(cluster_meta.treks_in_cluster by cluster_id / trek_themes).

MIRRORED (slugs only) in `apps/web-next/lib/categories.ts` so the /trek-types page knows which slugs
are curated categories vs keyword-cluster hubs.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage

# ── field parsers (defensive — trek data is free-text / partial) ─────────────

def _duration_max_days(page: CMSPage) -> int | None:
    text = (page.trek_duration or "")
    nums = [int(n) for n in re.findall(r"\d+", text)]
    if nums:
        return max(nums)
    if "weekend" in text.lower():
        return 3
    return None


def _altitude_m(page: CMSPage) -> int | None:
    facts = (page.content_json or {}).get("trek_facts") if isinstance(page.content_json, dict) else None
    raw = (facts or {}).get("altitude") if isinstance(facts, dict) else None
    if not raw:
        return None
    s = str(raw).lower().replace(",", "")
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    if not m:
        return None
    val = float(m.group(1))
    if "ft" in s or "feet" in s:
        val *= 0.3048  # feet → metres
    return int(val)


def _themes_lower(page: CMSPage) -> list[str]:
    return [str(t).lower() for t in (page.trek_themes or [])]


def _text_blob(page: CMSPage) -> str:
    return f"{page.trek_name or ''} {page.title or ''}".lower()


def _is_beginner(p: CMSPage) -> bool:
    suit = (p.trek_suitability or "").lower()
    diff = (p.trek_difficulty or "").lower()
    return "begin" in suit or "easy" in suit or diff.startswith("easy")


def _is_weekend(p: CMSPage) -> bool:
    d = _duration_max_days(p)
    return d is not None and d <= 3


def _is_high_altitude(p: CMSPage) -> bool:
    a = _altitude_m(p)
    return a is not None and a >= 4000


def _is_lake(p: CMSPage) -> bool:
    return any("lake" in t for t in _themes_lower(p)) or "lake" in _text_blob(p)


def _is_snow(p: CMSPage) -> bool:
    if any("snow" in t for t in _themes_lower(p)) or "snow" in _text_blob(p):
        return True
    winter = {12, 1, 2}
    months = set(p.trek_best_months or []) | set(p.trek_open_months or [])
    return bool(months & winter)


def _is_family(p: CMSPage) -> bool:
    suit = (p.trek_suitability or "").lower()
    return "family" in suit or any("family" in t for t in _themes_lower(p))


@dataclass(frozen=True)
class CategoryMeta:
    slug: str
    name: str
    tagline: str
    blurb: str
    match: Callable[[CMSPage], bool]


CATEGORIES: tuple[CategoryMeta, ...] = (
    CategoryMeta(
        "beginner-friendly-treks", "Beginner-Friendly Treks", "Your first Himalayan trek",
        "Gentle gradients, well-marked trails and short days — the best routes to start trekking in India.",
        _is_beginner,
    ),
    CategoryMeta(
        "weekend-treks", "Weekend Treks", "Two days, big mountains",
        "Short treks you can finish over a weekend — perfect for a quick escape from the city.",
        _is_weekend,
    ),
    CategoryMeta(
        "high-altitude-treks", "High-Altitude Treks", "Above 4,000 metres",
        "Serious routes that climb past 4,000 m — big passes, thin air, and the grandest Himalayan views.",
        _is_high_altitude,
    ),
    CategoryMeta(
        "lake-treks", "Lake Treks", "Turquoise alpine water",
        "Treks built around high-altitude alpine lakes — glacial blues, reflections, and lakeside campsites.",
        _is_lake,
    ),
    CategoryMeta(
        "snow-treks", "Snow Treks", "Walk the white season",
        "Winter and snowline treks — frozen trails, snow-laden pines, and crisp summit mornings.",
        _is_snow,
    ),
    CategoryMeta(
        "family-treks", "Family Treks", "Trails the whole family can enjoy",
        "Easier, safer routes suitable for children and mixed-age groups — big scenery without the risk.",
        _is_family,
    ),
)

CATEGORY_BY_SLUG: dict[str, CategoryMeta] = {c.slug: c for c in CATEGORIES}


def category_by_slug(slug: str) -> CategoryMeta | None:
    return CATEGORY_BY_SLUG.get(slug)


def _published_trek_guides(db: Session) -> list[CMSPage]:
    return list(
        db.scalars(
            select(CMSPage)
            .where(CMSPage.page_type == "trek_guide")
            .where(CMSPage.status == "published")
            .order_by(CMSPage.updated_at.desc())
        ).all()
    )


def treks_in_category(db: Session, category_slug: str, limit: int = 12) -> list[CMSPage]:
    """Published trek guides matching a curated category's predicate."""
    meta = category_by_slug(category_slug)
    if not meta:
        return []
    return [p for p in _published_trek_guides(db) if meta.match(p)][:limit]
