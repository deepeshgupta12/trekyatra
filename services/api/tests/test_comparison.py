"""Tests for #8 / Step 81 — deterministic trek comparison page generation.

Covers: canonical pair slug, deterministic verdict, generate/upsert idempotency,
same-state top-3 pairing, unpublished/self guards, and the admin generate route.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage
from app.modules.comparison.service import (
    build_verdict,
    generate_comparison_page,
    generate_comparisons_for_trek,
    pair_slug,
    trek_summary,
)

client = TestClient(app)


def _uid() -> str:
    return str(uuid.uuid4())[:8]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _mk_trek(
    db,
    slug: str,
    *,
    state: str,
    difficulty: str,
    altitude: int | None = None,
    duration_min: int | None = None,
    budget_min: int | None = None,
    beginner: bool | None = None,
    status: str = "published",
) -> CMSPage:
    now = _now()
    page = CMSPage(
        slug=slug,
        title=f"Trek {slug}",
        trek_name=f"Trek {slug}",
        page_type="trek_guide",
        status=status,
        content_html="",
        trek_state=state,
        trek_difficulty=difficulty,
        trek_max_altitude_ft=altitude,
        trek_duration_days_min=duration_min,
        trek_budget_min=budget_min,
        trek_budget_max=(budget_min + 10000) if budget_min else None,
        trek_beginner_friendly=beginner,
        trek_season="Jun – Sep",
        trek_duration="6 days",
        published_at=now if status == "published" else None,
        created_at=now,
        updated_at=now,
    )
    db.add(page)
    db.flush()
    return page


def _cleanup(db, slugs: list[str]) -> None:
    db.query(CMSPage).filter(CMSPage.slug.in_(slugs)).delete(synchronize_session=False)
    db.flush()
    db.commit()


# ---------------------------------------------------------------------------
# TC-B-C01 — canonical pair slug is order-independent
# ---------------------------------------------------------------------------
def test_pair_slug_is_canonical():
    assert pair_slug("brahmatal", "kedarkantha") == "brahmatal-vs-kedarkantha"
    assert pair_slug("kedarkantha", "brahmatal") == "brahmatal-vs-kedarkantha"


# ---------------------------------------------------------------------------
# TC-B-C02 — deterministic verdict picks the easier/higher/shorter/cheaper trek
# ---------------------------------------------------------------------------
def test_build_verdict_picks():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    try:
        pa = _mk_trek(db, sa, state="Uttarakhand", difficulty="Easy",
                      altitude=5000, duration_min=2, budget_min=5000, beginner=True)
        pb = _mk_trek(db, sb, state="Uttarakhand", difficulty="Difficult",
                      altitude=14000, duration_min=8, budget_min=20000, beginner=False)
        a, b = trek_summary(pa), trek_summary(pb)
        verdict = build_verdict(a, b)
        assert verdict["picks"]["beginner"] == sa
        assert verdict["picks"]["altitude"] == sb   # B climbs higher
        assert verdict["picks"]["shorter"] == sa    # A is shorter
        assert verdict["picks"]["budget"] == sa     # A is cheaper
        assert verdict["summary"]
    finally:
        _cleanup(db, [sa, sb])
        db.close()


# ---------------------------------------------------------------------------
# TC-B-C03 — generate_comparison_page creates a comparison page with canonical slug
# ---------------------------------------------------------------------------
def test_generate_comparison_page_creates_page():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    cslug = pair_slug(sa, sb)
    try:
        _mk_trek(db, sa, state="Himachal Pradesh", difficulty="Easy", altitude=5000)
        _mk_trek(db, sb, state="Himachal Pradesh", difficulty="Moderate", altitude=12000)
        page = generate_comparison_page(db, slug_a=sa, slug_b=sb)
        assert page is not None
        assert page.slug == cslug
        assert page.page_type == "comparison"
        assert page.status == "published"
        assert page.published_at is not None
        c = page.content_json["comparison"]
        assert c["trek_a"]["slug"] == min(sa, sb)   # ordered to match canonical slug
        assert len(c["rows"]) == 7
        assert page.seo_title and "vs" in page.seo_title
    finally:
        _cleanup(db, [sa, sb, cslug])
        db.close()


# ---------------------------------------------------------------------------
# TC-B-C04 — regeneration is idempotent (upsert, no duplicate)
# ---------------------------------------------------------------------------
def test_generate_comparison_is_idempotent():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    cslug = pair_slug(sa, sb)
    try:
        _mk_trek(db, sa, state="Sikkim", difficulty="Easy")
        _mk_trek(db, sb, state="Sikkim", difficulty="Moderate")
        p1 = generate_comparison_page(db, slug_a=sa, slug_b=sb)
        p2 = generate_comparison_page(db, slug_a=sb, slug_b=sa)  # reversed order
        assert p1.id == p2.id
        count = db.query(CMSPage).filter(CMSPage.slug == cslug).count()
        assert count == 1
    finally:
        _cleanup(db, [sa, sb, cslug])
        db.close()


# ---------------------------------------------------------------------------
# TC-B-C05 — returns None for unpublished or self-pair
# ---------------------------------------------------------------------------
def test_generate_comparison_guards():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    try:
        _mk_trek(db, sa, state="Ladakh", difficulty="Easy")
        _mk_trek(db, sb, state="Ladakh", difficulty="Moderate", status="draft")
        assert generate_comparison_page(db, slug_a=sa, slug_b=sa) is None       # self
        assert generate_comparison_page(db, slug_a=sa, slug_b=sb) is None       # b unpublished
        assert generate_comparison_page(db, slug_a=sa, slug_b="nope") is None   # missing
    finally:
        _cleanup(db, [sa, sb])
        db.close()


# ---------------------------------------------------------------------------
# TC-B-C06 — same-state top-3 pairing (peers in other states excluded, capped)
# ---------------------------------------------------------------------------
def test_generate_comparisons_for_trek_same_state_top3():
    db = SessionLocal()
    hero = f"cmp-hero-{_uid()}"
    peers = [f"cmp-peer-{i}-{_uid()}" for i in range(4)]
    other = f"cmp-other-{_uid()}"
    created_slugs: list[str] = []
    try:
        _mk_trek(db, hero, state="Uttarakhand", difficulty="Moderate")
        for i, p in enumerate(peers):
            _mk_trek(db, p, state="Uttarakhand", difficulty="Moderate", altitude=10000 + i)
        _mk_trek(db, other, state="Himachal Pradesh", difficulty="Moderate")  # different state
        created = generate_comparisons_for_trek(db, hero)
        created_slugs = created
        # capped at 3, all same-state, none pairing with the other-state trek
        assert len(created) == 3
        assert all(other not in cslug for cslug in created)
        assert all(hero in cslug for cslug in created)
    finally:
        _cleanup(db, [hero, *peers, other, *created_slugs])
        db.close()


# ---------------------------------------------------------------------------
# TC-B-C07 — admin generate route returns created comparison slugs
# ---------------------------------------------------------------------------
def test_admin_generate_route():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    cslug = pair_slug(sa, sb)
    try:
        _mk_trek(db, sa, state="Maharashtra", difficulty="Easy")
        _mk_trek(db, sb, state="Maharashtra", difficulty="Moderate")
        db.commit()
        resp = client.post(f"/api/v1/admin/comparisons/generate/{sa}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["slug"] == sa
        assert cslug in body["comparison_pages"]
    finally:
        _cleanup(db, [sa, sb, cslug])
        db.close()
