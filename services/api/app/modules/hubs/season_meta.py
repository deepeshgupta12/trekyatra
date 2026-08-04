"""Canonical SEASON taxonomy + trek↔season matching — the single source of truth.

Used by the seasonal endpoint (`/treks/seasonal`), the SeasonalContentAgent, and (mirrored in
`apps/web-next/lib/seasons.ts`) the home season tabs + `/seasons/[slug]` hub. One definition so the
site is consistent everywhere.

SEASON SIGNAL (decided 2026-08-04): a trek's months come from the Trek Backfill arrays first —
`trek_best_months`, then `trek_open_months` — falling back to parsing the free-text `trek_season`
string only when neither is populated. A trek belongs to a season if its months intersect the
season's months.
"""
from __future__ import annotations

import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage

# Canonical 5-season India trekking calendar (slug → month numbers, 1=Jan).
SEASONS: dict[str, dict[str, Any]] = {
    "spring":  {"title": "Best Spring Treks in India",  "months": [3, 4],     "label": "Mar – Apr"},
    "summer":  {"title": "Best Summer Treks in India",  "months": [5, 6],     "label": "May – Jun"},
    "monsoon": {"title": "Best Monsoon Treks in India", "months": [7, 8, 9],  "label": "Jul – Sep"},
    "autumn":  {"title": "Best Autumn Treks in India",  "months": [10, 11],   "label": "Oct – Nov"},
    "winter":  {"title": "Best Winter Treks in India",  "months": [12, 1, 2], "label": "Dec – Feb"},
}

VALID_SEASON_SLUGS = set(SEASONS.keys())

_MONTH_ABBR = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def _parse_season_string(season: str) -> set[int]:
    """Expand a free-text season string ('Sep - Oct', 'Dec–Apr', 'May, Jun') into month numbers."""
    if not season:
        return set()
    abbrs = re.findall(r"[A-Za-z]{3,}", season)
    nums = [_MONTH_ABBR[a[:3].lower()] for a in abbrs if a[:3].lower() in _MONTH_ABBR]
    if not nums:
        return set()
    if len(nums) == 1:
        return {nums[0]}
    # Range notation (dash / "to") → inclusive span with year wrap
    if len(nums) == 2 and re.search(r"[-–—]|to", season):
        start, end = nums[0], nums[1]
        out: list[int] = []
        m = start
        for _ in range(12):
            out.append(m)
            if m == end:
                break
            m = (m % 12) + 1
        return set(out)
    return set(nums)


def trek_months(page: CMSPage) -> set[int]:
    """A trek's active months — backfill arrays first, then the season string (decided 2026-08-04)."""
    if page.trek_best_months:
        return {int(m) for m in page.trek_best_months if 1 <= int(m) <= 12}
    if page.trek_open_months:
        return {int(m) for m in page.trek_open_months if 1 <= int(m) <= 12}
    return _parse_season_string(page.trek_season or "")


def _published_trek_guides(db: Session) -> list[CMSPage]:
    return list(
        db.scalars(
            select(CMSPage)
            .where(CMSPage.page_type == "trek_guide")
            .where(CMSPage.status == "published")
            .order_by(CMSPage.updated_at.desc())
        ).all()
    )


def treks_in_month(db: Session, month: int, limit: int = 6) -> list[CMSPage]:
    """Published trek guides whose active months include `month`."""
    return [p for p in _published_trek_guides(db) if month in trek_months(p)][:limit]


def treks_in_season(db: Session, season_slug: str, limit: int = 12) -> list[CMSPage]:
    """Published trek guides whose active months intersect the canonical season window."""
    wanted = set(SEASONS.get(season_slug, {}).get("months", []))
    if not wanted:
        return []
    return [p for p in _published_trek_guides(db) if trek_months(p) & wanted][:limit]


def season_for_page(page: CMSPage) -> list[str]:
    """The canonical season slugs a trek belongs to (may be several)."""
    months = trek_months(page)
    return [slug for slug, meta in SEASONS.items() if months & set(meta["months"])]
