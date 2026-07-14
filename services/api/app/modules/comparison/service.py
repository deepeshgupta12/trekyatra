"""Deterministic trek-vs-trek comparison PAIRS (#8 / Step 81, rebuilt).

The comparison agent records suitable PAIRS in the ``trek_comparisons`` table
(one row per pair) — it does NOT create ``page_type="comparison"`` CMS pages.
The clean page at ``/compare/{pair_slug}`` renders live from the two published
``trek_guide`` CMS pages' backfill fields (same data the ``/compare?slugs=`` tool
uses). This module:

- picks pairs (same-state, closest difficulty, top 3) on trek publish → upserts rows
- computes the comparison payload on demand from live trek data (verdict + table)
- lists existing pairs for the sitemap + home section

Everything is deterministic — no LLM.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.modules.cms.models import CMSPage
from app.modules.comparison.models import TrekComparison

logger = logging.getLogger(__name__)

# How many same-state peers a newly-published trek is auto-paired with.
MAX_PAIRS_PER_TREK = 3

# Difficulty ordering — lower is easier. Unknown difficulties sort last.
_DIFFICULTY_RANK = {
    "easy": 1,
    "moderate": 2,
    "moderate-difficult": 3,
    "difficult": 4,
    "challenging": 5,
    "expedition": 6,
}


def _difficulty_rank(difficulty: str | None) -> int:
    if not difficulty:
        return 99
    return _DIFFICULTY_RANK.get(difficulty.strip().lower(), 50)


def _facts(page: CMSPage) -> dict:
    return (page.content_json or {}).get("trek_facts", {}) or {}


def pair_slug(slug_a: str, slug_b: str) -> str:
    """Canonical, order-independent pair slug: the two trek slugs sorted then
    joined with ``-vs-`` (so ``a-vs-b`` and ``b-vs-a`` collapse to one URL)."""
    lo, hi = sorted([slug_a, slug_b])
    return f"{lo}-vs-{hi}"


# ---------------------------------------------------------------------------
# Live comparison compute (from real trek_guide data — no stored content)
# ---------------------------------------------------------------------------

def trek_summary(page: CMSPage) -> dict:
    """Flatten a trek_guide CMSPage into the comparison-card shape."""
    tf = _facts(page)
    alt = page.trek_max_altitude_ft
    bmin, bmax = page.trek_budget_min, page.trek_budget_max
    return {
        "slug": page.slug,
        "name": page.trek_name or page.title,
        "image": page.hero_image_url or "/images/trek-forest.jpg",
        "state": page.trek_state or "",
        "region": page.trek_region or page.trek_state or "",
        "difficulty": page.trek_difficulty or tf.get("difficulty") or "Moderate",
        "duration": page.trek_duration or tf.get("duration") or "—",
        "duration_days_min": page.trek_duration_days_min,
        "season": page.trek_season or tf.get("season") or "—",
        "altitude_ft": alt,
        "altitude_label": (f"{alt:,} ft" if alt else tf.get("altitude") or "—"),
        "permit_required": page.trek_permit_required,
        "permit_label": (
            "Permit required"
            if page.trek_permit_required is True
            else ("No permit" if page.trek_permit_required is False else tf.get("permits") or "—")
        ),
        "budget_min": bmin,
        "budget_max": bmax,
        "budget_label": (f"₹{bmin:,}–₹{bmax:,}" if bmin and bmax else (tf.get("cost") or "—")),
        "beginner_friendly": page.trek_beginner_friendly,
        "description": page.seo_description or tf.get("summary") or "",
    }


def build_verdict(a: dict, b: dict) -> dict:
    """Rule-based verdict — picks a trek per decision axis, composes a summary."""
    picks: dict[str, str] = {}

    if a["beginner_friendly"] and not b["beginner_friendly"]:
        picks["beginner"] = a["slug"]
    elif b["beginner_friendly"] and not a["beginner_friendly"]:
        picks["beginner"] = b["slug"]
    else:
        ra, rb = _difficulty_rank(a["difficulty"]), _difficulty_rank(b["difficulty"])
        if ra != rb:
            picks["beginner"] = a["slug"] if ra < rb else b["slug"]

    if a["altitude_ft"] and b["altitude_ft"] and a["altitude_ft"] != b["altitude_ft"]:
        picks["altitude"] = a["slug"] if a["altitude_ft"] > b["altitude_ft"] else b["slug"]

    if a["duration_days_min"] and b["duration_days_min"] and a["duration_days_min"] != b["duration_days_min"]:
        picks["shorter"] = a["slug"] if a["duration_days_min"] < b["duration_days_min"] else b["slug"]

    if a["budget_min"] and b["budget_min"] and a["budget_min"] != b["budget_min"]:
        picks["budget"] = a["slug"] if a["budget_min"] < b["budget_min"] else b["slug"]

    def name_for(slug: str) -> str:
        return a["name"] if slug == a["slug"] else b["name"]

    parts: list[str] = []
    if "beginner" in picks:
        parts.append(f"{name_for(picks['beginner'])} is the friendlier pick for first-timers")
    if "altitude" in picks:
        parts.append(f"{name_for(picks['altitude'])} climbs higher for bigger summit views")
    if "shorter" in picks:
        parts.append(f"{name_for(picks['shorter'])} fits a shorter schedule")
    if "budget" in picks:
        parts.append(f"{name_for(picks['budget'])} is easier on the budget")

    if parts:
        summary = "; ".join(parts) + "."
        summary = summary[0].upper() + summary[1:]
    else:
        summary = (
            f"{a['name']} and {b['name']} are closely matched — choose on region, "
            "season and the exact scenery you're after."
        )
    return {"picks": picks, "summary": summary}


def _comparison_rows(a: dict, b: dict) -> list[dict]:
    return [
        {"label": "Difficulty", "a": a["difficulty"], "b": b["difficulty"]},
        {"label": "Duration", "a": a["duration"], "b": b["duration"]},
        {"label": "Max altitude", "a": a["altitude_label"], "b": b["altitude_label"]},
        {"label": "Best season", "a": a["season"], "b": b["season"]},
        {"label": "Permits", "a": a["permit_label"], "b": b["permit_label"]},
        {"label": "Est. cost", "a": a["budget_label"], "b": b["budget_label"]},
        {"label": "Region", "a": a["region"] or "—", "b": b["region"] or "—"},
    ]


def compute_comparison(page_a: CMSPage, page_b: CMSPage) -> dict:
    """Full comparison payload computed live from two trek_guide pages.

    trek_a/trek_b are ordered to match the canonical (alphabetical) pair slug so
    the page heading reads the same as its URL. Includes SEO title/description.
    """
    if page_a.slug > page_b.slug:
        page_a, page_b = page_b, page_a
    a = trek_summary(page_a)
    b = trek_summary(page_b)
    verdict = build_verdict(a, b)
    heading = f"{a['name']} vs {b['name']}"
    seo_title = f"{a['name']} vs {b['name']}: Which Trek Should You Choose? | TrekYatra"
    seo_description = (
        f"Compare {a['name']} and {b['name']} side by side — difficulty, duration, "
        f"altitude, best season, permits and cost. {verdict['summary']}"
    )[:320]
    return {
        "pair_slug": pair_slug(a["slug"], b["slug"]),
        "heading": heading,
        "seo_title": seo_title,
        "seo_description": seo_description,
        "hero_image_url": a["image"],
        "trek_a": a,
        "trek_b": b,
        "rows": _comparison_rows(a, b),
        "verdict": verdict,
    }


def _published_trek(db: Session, slug: str) -> CMSPage | None:
    return db.scalar(
        select(CMSPage).where(
            CMSPage.slug == slug,
            CMSPage.page_type == "trek_guide",
            CMSPage.status == "published",
        )
    )


def get_comparison_for_pair(db: Session, pslug: str) -> dict | None:
    """Live comparison payload for a curated pair slug, or None if the pair is
    not registered or either trek is no longer a published trek_guide."""
    row = db.scalar(select(TrekComparison).where(TrekComparison.pair_slug == pslug))
    if not row:
        return None
    page_a = _published_trek(db, row.slug_a)
    page_b = _published_trek(db, row.slug_b)
    if not page_a or not page_b:
        return None
    return compute_comparison(page_a, page_b)


# ---------------------------------------------------------------------------
# Pair curation (the "agent") — records pairs, never creates CMS pages
# ---------------------------------------------------------------------------

def upsert_pair(db: Session, slug_a: str, slug_b: str, state: str | None) -> str | None:
    """Insert/refresh a trek_comparisons row for a pair. Returns pair_slug, or
    None for a self-pair. Idempotent on the canonical pair_slug."""
    if slug_a == slug_b:
        return None
    lo, hi = sorted([slug_a, slug_b])
    pslug = f"{lo}-vs-{hi}"
    existing = db.scalar(select(TrekComparison).where(TrekComparison.pair_slug == pslug))
    if existing:
        existing.slug_a, existing.slug_b, existing.state = lo, hi, state
        db.flush()
        return pslug
    db.add(TrekComparison(pair_slug=pslug, slug_a=lo, slug_b=hi, state=state))
    db.flush()
    return pslug


def _same_state_peers(db: Session, page: CMSPage, limit: int) -> list[CMSPage]:
    """Published trek_guide peers in the same state, ranked by closeness of
    difficulty (relevance), excluding self and *test* fixtures."""
    if not page.trek_state:
        return []
    peers = list(
        db.scalars(
            select(CMSPage).where(
                CMSPage.page_type == "trek_guide",
                CMSPage.status == "published",
                CMSPage.trek_state == page.trek_state,
                CMSPage.slug != page.slug,
                CMSPage.slug.notilike("%test%"),
            )
        ).all()
    )
    base_rank = _difficulty_rank(page.trek_difficulty)
    peers.sort(key=lambda p: (abs(_difficulty_rank(p.trek_difficulty) - base_rank), p.slug))
    return peers[:limit]


def generate_comparisons_for_trek(db: Session, slug: str) -> list[str]:
    """Publish-trigger entrypoint: record comparison pairs for the given trek and
    its same-state peers. Returns the pair slugs upserted. Safe for
    non-trek/unpublished/test slugs (returns [])."""
    if "test" in slug.lower():
        return []
    page = _published_trek(db, slug)
    if not page or not page.trek_state:
        return []
    created: list[str] = []
    for peer in _same_state_peers(db, page, MAX_PAIRS_PER_TREK):
        pslug = upsert_pair(db, page.slug, peer.slug, page.trek_state)
        if pslug:
            created.append(pslug)
    return created


def backfill_all_comparisons(db: Session) -> dict:
    """Record comparison pairs for every published trek's same-state peers.
    Idempotent. Returns a summary count."""
    treks = list(
        db.scalars(
            select(CMSPage).where(
                CMSPage.page_type == "trek_guide",
                CMSPage.status == "published",
                CMSPage.trek_state.isnot(None),
                CMSPage.trek_state != "",
                CMSPage.slug.notilike("%test%"),
            )
        ).all()
    )
    all_pairs: set[str] = set()
    for trek in treks:
        for pslug in generate_comparisons_for_trek(db, trek.slug):
            all_pairs.add(pslug)
    return {"treks_processed": len(treks), "comparison_pairs": len(all_pairs)}


def list_comparison_pairs(db: Session, *, limit: int = 500) -> list[dict]:
    """All registered pairs where BOTH treks are still published — for the
    sitemap + home section. Includes each trek's name/difficulty (one query)."""
    A = aliased(CMSPage)
    B = aliased(CMSPage)
    rows = db.execute(
        select(
            TrekComparison.pair_slug,
            TrekComparison.slug_a,
            TrekComparison.slug_b,
            TrekComparison.state,
            TrekComparison.updated_at,
            A.trek_name.label("a_name"),
            A.title.label("a_title"),
            A.trek_difficulty.label("a_diff"),
            B.trek_name.label("b_name"),
            B.title.label("b_title"),
            B.trek_difficulty.label("b_diff"),
        )
        .join(A, (A.slug == TrekComparison.slug_a) & (A.status == "published") & (A.page_type == "trek_guide"))
        .join(B, (B.slug == TrekComparison.slug_b) & (B.status == "published") & (B.page_type == "trek_guide"))
        .order_by(TrekComparison.updated_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "pair_slug": r.pair_slug,
            "slug_a": r.slug_a,
            "slug_b": r.slug_b,
            "state": r.state,
            "name_a": r.a_name or r.a_title,
            "name_b": r.b_name or r.b_title,
            "difficulty_a": r.a_diff,
            "difficulty_b": r.b_diff,
        }
        for r in rows
    ]
