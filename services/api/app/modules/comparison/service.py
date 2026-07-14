"""Deterministic trek-vs-trek comparison page generation (#8 / Step 81).

Comparison pages are ordinary CMS rows with ``page_type = "comparison"`` and a
canonical slug ``{a}-vs-{b}`` (the two trek slugs sorted alphabetically so
``a-vs-b`` and ``b-vs-a`` collapse to one page). Everything on the page is
derived deterministically from each trek's first-class columns (with a
``content_json.trek_facts`` fallback) — no LLM. A short rule-based verdict tells
the reader which trek suits which intent.

Generation is idempotent: re-running upserts the same slug. The publish-trigger
(``comparison.generate_for_trek`` Celery task) pairs a newly-published trek with
up to 3 other published treks in the same state (closest difficulty).
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage

logger = logging.getLogger(__name__)

# How many same-state peers a newly-published trek is auto-compared against.
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
    """Canonical, order-independent comparison slug: the two slugs sorted then
    joined with ``-vs-``. Ensures ``a-vs-b`` and ``b-vs-a`` are the same page."""
    lo, hi = sorted([slug_a, slug_b])
    return f"{lo}-vs-{hi}"


def trek_summary(page: CMSPage) -> dict:
    """Flatten a trek_guide CMSPage into the comparison-card shape the FE renders.

    Prefers first-class columns; falls back to ``content_json.trek_facts`` free
    text so older pages without structured columns still compare cleanly.
    """
    tf = _facts(page)
    altitude_ft = page.trek_max_altitude_ft
    budget_min = page.trek_budget_min
    budget_max = page.trek_budget_max
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
        "altitude_ft": altitude_ft,
        "altitude_label": (f"{altitude_ft:,} ft" if altitude_ft else tf.get("altitude") or "—"),
        "permit_required": page.trek_permit_required,
        "permit_label": (
            "Permit required"
            if page.trek_permit_required is True
            else ("No permit" if page.trek_permit_required is False else tf.get("permits") or "—")
        ),
        "budget_min": budget_min,
        "budget_max": budget_max,
        "budget_label": (
            f"₹{budget_min:,}–₹{budget_max:,}" if budget_min and budget_max else (tf.get("cost") or "—")
        ),
        "beginner_friendly": page.trek_beginner_friendly,
        "description": page.seo_description or tf.get("summary") or "",
    }


def build_verdict(a: dict, b: dict) -> dict:
    """Rule-based verdict — no LLM. Picks a trek per common decision axis and
    composes a one-line summary sentence."""
    picks: dict[str, str] = {}

    # Beginner pick — explicit flag wins, else the easier difficulty.
    if a["beginner_friendly"] and not b["beginner_friendly"]:
        picks["beginner"] = a["slug"]
    elif b["beginner_friendly"] and not a["beginner_friendly"]:
        picks["beginner"] = b["slug"]
    else:
        ra, rb = _difficulty_rank(a["difficulty"]), _difficulty_rank(b["difficulty"])
        if ra != rb:
            picks["beginner"] = a["slug"] if ra < rb else b["slug"]

    # Higher / more dramatic altitude.
    if a["altitude_ft"] and b["altitude_ft"] and a["altitude_ft"] != b["altitude_ft"]:
        picks["altitude"] = a["slug"] if a["altitude_ft"] > b["altitude_ft"] else b["slug"]

    # Quicker / shorter getaway.
    if a["duration_days_min"] and b["duration_days_min"] and a["duration_days_min"] != b["duration_days_min"]:
        picks["shorter"] = a["slug"] if a["duration_days_min"] < b["duration_days_min"] else b["slug"]

    # Budget-friendlier.
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
    """The side-by-side table rows the FE renders."""
    return [
        {"label": "Difficulty", "a": a["difficulty"], "b": b["difficulty"]},
        {"label": "Duration", "a": a["duration"], "b": b["duration"]},
        {"label": "Max altitude", "a": a["altitude_label"], "b": b["altitude_label"]},
        {"label": "Best season", "a": a["season"], "b": b["season"]},
        {"label": "Permits", "a": a["permit_label"], "b": b["permit_label"]},
        {"label": "Est. cost", "a": a["budget_label"], "b": b["budget_label"]},
        {"label": "Region", "a": a["region"] or "—", "b": b["region"] or "—"},
    ]


def build_comparison_content(page_a: CMSPage, page_b: CMSPage) -> dict:
    """Full ``content_json`` payload for a comparison page."""
    # Order trek_a/trek_b to match the canonical slug (alphabetical) so the page
    # heading reads the same as its URL.
    if page_a.slug > page_b.slug:
        page_a, page_b = page_b, page_a
    a = trek_summary(page_a)
    b = trek_summary(page_b)
    verdict = build_verdict(a, b)
    return {
        "comparison": {
            "trek_a": a,
            "trek_b": b,
            "rows": _comparison_rows(a, b),
            "verdict": verdict,
        }
    }


def _seo_for(a: dict, b: dict, verdict: dict) -> tuple[str, str, str]:
    title = f"{a['name']} vs {b['name']}: Which Trek Should You Choose?"
    heading = f"{a['name']} vs {b['name']}"
    desc = (
        f"Compare {a['name']} and {b['name']} side by side — difficulty, duration, "
        f"altitude, best season, permits and cost. {verdict['summary']}"
    )[:320]
    return title, heading, desc


def generate_comparison_page(db: Session, *, slug_a: str, slug_b: str) -> CMSPage | None:
    """Create or update the ``comparison`` CMS page for two trek slugs.

    Idempotent upsert keyed on the canonical ``pair_slug``. Returns None if
    either trek is not a published ``trek_guide`` (nothing to compare).
    """
    if slug_a == slug_b:
        return None

    pages = {
        p.slug: p
        for p in db.scalars(
            select(CMSPage).where(
                CMSPage.slug.in_([slug_a, slug_b]),
                CMSPage.page_type == "trek_guide",
                CMSPage.status == "published",
            )
        ).all()
    }
    page_a, page_b = pages.get(slug_a), pages.get(slug_b)
    if not page_a or not page_b:
        return None

    content = build_comparison_content(page_a, page_b)
    a = content["comparison"]["trek_a"]
    b = content["comparison"]["trek_b"]
    verdict = content["comparison"]["verdict"]
    title, heading, desc = _seo_for(a, b, verdict)
    cslug = pair_slug(slug_a, slug_b)

    existing = db.scalar(select(CMSPage).where(CMSPage.slug == cslug))
    if existing:
        existing.title = heading
        existing.content_json = content
        existing.seo_title = f"{title} | TrekYatra"
        existing.seo_description = desc
        existing.hero_image_url = a["image"]
        existing.status = "published"
        db.flush()
        return existing

    page = CMSPage(
        slug=cslug,
        page_type="comparison",
        title=heading,
        content_html="",
        content_json=content,
        status="published",
        seo_title=f"{title} | TrekYatra",
        seo_description=desc,
        hero_image_url=a["image"],
        language="en",
    )
    from datetime import datetime, timezone

    page.published_at = datetime.now(timezone.utc)
    db.add(page)
    db.flush()
    return page


def _same_state_peers(db: Session, page: CMSPage, limit: int) -> list[CMSPage]:
    """Published trek_guide peers in the same state, ranked by closeness of
    difficulty to ``page`` (so comparisons are relevant), excluding itself."""
    if not page.trek_state:
        return []
    peers = list(
        db.scalars(
            select(CMSPage).where(
                CMSPage.page_type == "trek_guide",
                CMSPage.status == "published",
                CMSPage.trek_state == page.trek_state,
                CMSPage.slug != page.slug,
            )
        ).all()
    )
    base_rank = _difficulty_rank(page.trek_difficulty)
    peers.sort(key=lambda p: (abs(_difficulty_rank(p.trek_difficulty) - base_rank), p.slug))
    return peers[:limit]


def generate_comparisons_for_trek(db: Session, slug: str) -> list[str]:
    """Publish-trigger entrypoint: generate comparison pages pairing the given
    trek with its same-state peers. Returns the list of comparison slugs created
    or updated. Safe to call for non-trek/unpublished slugs (returns [])."""
    page = db.scalar(
        select(CMSPage).where(
            CMSPage.slug == slug,
            CMSPage.page_type == "trek_guide",
            CMSPage.status == "published",
        )
    )
    if not page:
        return []
    created: list[str] = []
    for peer in _same_state_peers(db, page, MAX_PAIRS_PER_TREK):
        result = generate_comparison_page(db, slug_a=page.slug, slug_b=peer.slug)
        if result:
            created.append(result.slug)
    return created


def backfill_all_comparisons(db: Session) -> dict:
    """Generate comparison pages for every published trek's same-state peers.
    Idempotent — safe to re-run. Returns a summary count."""
    treks = list(
        db.scalars(
            select(CMSPage).where(
                CMSPage.page_type == "trek_guide",
                CMSPage.status == "published",
            )
        ).all()
    )
    all_slugs: set[str] = set()
    for trek in treks:
        for cslug in generate_comparisons_for_trek(db, trek.slug):
            all_slugs.add(cslug)
    return {"treks_processed": len(treks), "comparison_pages": len(all_slugs)}


def list_comparison_pages(db: Session, *, limit: int = 500) -> list[CMSPage]:
    """All published comparison pages (for sitemap / static params)."""
    return list(
        db.scalars(
            select(CMSPage)
            .where(CMSPage.page_type == "comparison", CMSPage.status == "published")
            .order_by(CMSPage.updated_at.desc())
            .limit(limit)
        ).all()
    )
