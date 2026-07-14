"""Tests for #8 / Step 81 — comparison PAIRS (trek_comparisons table) + live render.

The agent records pairs (no CMS pages); /compare/{pair} renders live from trek data.
Covers: canonical pair slug, deterministic verdict, pair upsert idempotency,
same-state top-3 + test-slug exclusion, live payload compute, and public/admin routes.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage
from app.modules.comparison.models import TrekComparison
from app.modules.comparison.service import (
    build_verdict,
    generate_comparisons_for_trek,
    get_comparison_for_pair,
    pair_slug,
    trek_summary,
    upsert_pair,
)

client = TestClient(app)


def _uid() -> str:
    return str(uuid.uuid4())[:8]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _mk_trek(db, slug, *, state, difficulty, altitude=None, duration_min=None,
             budget_min=None, beginner=None, status="published") -> CMSPage:
    now = _now()
    page = CMSPage(
        slug=slug, title=f"Trek {slug}", trek_name=f"Trek {slug}",
        page_type="trek_guide", status=status, content_html="",
        trek_state=state, trek_difficulty=difficulty,
        trek_max_altitude_ft=altitude, trek_duration_days_min=duration_min,
        trek_budget_min=budget_min, trek_budget_max=(budget_min + 10000) if budget_min else None,
        trek_beginner_friendly=beginner, trek_season="Jun – Sep", trek_duration="6 days",
        published_at=now if status == "published" else None, created_at=now, updated_at=now,
    )
    db.add(page)
    db.flush()
    db.commit()
    return page


def _cleanup(db, trek_slugs, pair_slugs):
    db.query(TrekComparison).filter(TrekComparison.pair_slug.in_(pair_slugs)).delete(synchronize_session=False)
    db.query(CMSPage).filter(CMSPage.slug.in_(trek_slugs)).delete(synchronize_session=False)
    db.commit()


# TC-B-C01 — canonical pair slug is order-independent
def test_pair_slug_is_canonical():
    assert pair_slug("brahmatal", "kedarkantha") == "brahmatal-vs-kedarkantha"
    assert pair_slug("kedarkantha", "brahmatal") == "brahmatal-vs-kedarkantha"


# TC-B-C02 — deterministic verdict picks
def test_build_verdict_picks():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    try:
        pa = _mk_trek(db, sa, state="Uttarakhand", difficulty="Easy", altitude=5000, duration_min=2, budget_min=5000, beginner=True)
        pb = _mk_trek(db, sb, state="Uttarakhand", difficulty="Difficult", altitude=14000, duration_min=8, budget_min=20000, beginner=False)
        v = build_verdict(trek_summary(pa), trek_summary(pb))
        assert v["picks"]["beginner"] == sa
        assert v["picks"]["altitude"] == sb
        assert v["picks"]["shorter"] == sa
        assert v["picks"]["budget"] == sa
    finally:
        _cleanup(db, [sa, sb], [])
        db.close()


# TC-B-C03 — upsert_pair records a canonical trek_comparisons row
def test_upsert_pair_records_row():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    pslug = pair_slug(sa, sb)
    try:
        result = upsert_pair(db, sa, sb, "Himachal Pradesh")
        db.commit()
        assert result == pslug
        row = db.query(TrekComparison).filter(TrekComparison.pair_slug == pslug).one()
        assert row.slug_a == min(sa, sb) and row.slug_b == max(sa, sb)
        assert row.state == "Himachal Pradesh"
    finally:
        _cleanup(db, [], [pslug])
        db.close()


# TC-B-C04 — upsert is idempotent (reversed order → one row)
def test_upsert_pair_idempotent():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    pslug = pair_slug(sa, sb)
    try:
        upsert_pair(db, sa, sb, "Sikkim")
        upsert_pair(db, sb, sa, "Sikkim")  # reversed
        db.commit()
        assert db.query(TrekComparison).filter(TrekComparison.pair_slug == pslug).count() == 1
        assert upsert_pair(db, sa, sa, "Sikkim") is None  # self-pair guard
    finally:
        _cleanup(db, [], [pslug])
        db.close()


# TC-B-C05 — same-state top-3, excludes other-state + test-slug + null-state
def test_generate_comparisons_same_state_top3():
    db = SessionLocal()
    hero = f"cmp-hero-{_uid()}"
    peers = [f"cmp-peer-{i}-{_uid()}" for i in range(4)]
    other = f"cmp-other-{_uid()}"
    testpeer = f"cmp-test-{_uid()}"
    created = []
    try:
        _mk_trek(db, hero, state="Uttarakhand", difficulty="Moderate")
        for i, p in enumerate(peers):
            _mk_trek(db, p, state="Uttarakhand", difficulty="Moderate", altitude=10000 + i)
        _mk_trek(db, other, state="Himachal Pradesh", difficulty="Moderate")
        _mk_trek(db, testpeer, state="Uttarakhand", difficulty="Moderate")  # 'test' in slug → excluded
        created = generate_comparisons_for_trek(db, hero)
        db.commit()
        assert len(created) == 3
        assert all(other not in c for c in created)
        assert all("test" not in c for c in created)
        assert all(hero in c for c in created)
    finally:
        _cleanup(db, [hero, *peers, other, testpeer], created)
        db.close()


# TC-B-C06 — get_comparison_for_pair computes live payload; None for unregistered
def test_get_comparison_for_pair_live():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    pslug = pair_slug(sa, sb)
    try:
        _mk_trek(db, sa, state="Ladakh", difficulty="Easy", altitude=5000)
        _mk_trek(db, sb, state="Ladakh", difficulty="Moderate", altitude=12000)
        assert get_comparison_for_pair(db, pslug) is None  # not registered yet
        upsert_pair(db, sa, sb, "Ladakh")
        db.commit()
        payload = get_comparison_for_pair(db, pslug)
        assert payload is not None
        assert payload["pair_slug"] == pslug
        assert len(payload["rows"]) == 7
        assert payload["trek_a"]["slug"] == min(sa, sb)
        assert "vs" in payload["seo_title"]
    finally:
        _cleanup(db, [sa, sb], [pslug])
        db.close()


# TC-B-C07 — public list/detail + admin generate routes
def test_comparison_routes():
    db = SessionLocal()
    sa, sb = f"cmp-a-{_uid()}", f"cmp-b-{_uid()}"
    pslug = pair_slug(sa, sb)
    try:
        _mk_trek(db, sa, state="Maharashtra", difficulty="Easy")
        _mk_trek(db, sb, state="Maharashtra", difficulty="Moderate")
        db.commit()
        # admin generate records pairs
        r = client.post(f"/api/v1/admin/comparisons/generate/{sa}")
        assert r.status_code == 200
        assert pslug in r.json()["comparison_pairs"]
        # public list includes the pair with names/difficulties
        listing = client.get("/api/v1/public/comparisons?limit=1000").json()
        assert any(p["pair_slug"] == pslug for p in listing)
        # public detail renders live
        detail = client.get(f"/api/v1/public/comparisons/{pslug}")
        assert detail.status_code == 200
        assert len(detail.json()["rows"]) == 7
        # unknown pair 404s
        assert client.get("/api/v1/public/comparisons/nope-vs-nada").status_code == 404
    finally:
        _cleanup(db, [sa, sb], [pslug])
        db.close()
