"""Tests for /api/v1/treks — now CMS-backed (PT4 / Step 81: the 12 hardcoded stub
treks were removed; the endpoint serves real published trek_guide pages)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage

client = TestClient(app)


def _uid() -> str:
    return str(uuid.uuid4())[:8]


def _mk_trek(db, slug, *, state, difficulty, beginner, image="/images/x.jpg") -> CMSPage:
    now = datetime.now(timezone.utc)
    page = CMSPage(
        slug=slug,
        title=f"Trek {slug}",
        trek_name=f"Trek {slug}",
        page_type="trek_guide",
        status="published",
        content_html="",
        trek_state=state,
        trek_difficulty=difficulty,
        trek_beginner_friendly=beginner,
        trek_duration="6 days",
        trek_season="Jun – Sep",
        hero_image_url=image,
        seo_description="A real trek.",
        language="en",
        published_at=now,
        created_at=now,
        updated_at=now,
    )
    db.add(page)
    db.flush()
    db.commit()
    return page


def _cleanup(db, slugs):
    db.query(CMSPage).filter(CMSPage.slug.in_(slugs)).delete(synchronize_session=False)
    db.commit()


def test_list_treks_returns_all() -> None:
    db = SessionLocal()
    s = f"treklist-{_uid()}"
    try:
        _mk_trek(db, s, state="Uttarakhand", difficulty="Moderate", beginner=True)
        response = client.get("/api/v1/treks")
        assert response.status_code == 200
        payload = response.json()
        assert payload["total"] == len(payload["treks"])
        assert payload["total"] > 0
        trek = next(t for t in payload["treks"] if t["slug"] == s)
        for field in ("slug", "name", "region", "state", "duration", "altitude", "difficulty", "season", "description", "beginner", "image"):
            assert field in trek
        assert trek["image"] == "/images/x.jpg"
    finally:
        _cleanup(db, [s])
        db.close()


def test_list_treks_beginner_filter() -> None:
    db = SessionLocal()
    sb, sn = f"beg-{_uid()}", f"nonbeg-{_uid()}"
    try:
        _mk_trek(db, sb, state="Uttarakhand", difficulty="Easy", beginner=True)
        _mk_trek(db, sn, state="Uttarakhand", difficulty="Difficult", beginner=False)
        payload = client.get("/api/v1/treks?beginner=true").json()
        assert all(t["beginner"] is True for t in payload["treks"])
        assert any(t["slug"] == sb for t in payload["treks"])
        assert all(t["slug"] != sn for t in payload["treks"])
    finally:
        _cleanup(db, [sb, sn])
        db.close()


def test_list_treks_state_filter() -> None:
    db = SessionLocal()
    s = f"state-{_uid()}"
    try:
        _mk_trek(db, s, state="Sikkim", difficulty="Moderate", beginner=False)
        payload = client.get("/api/v1/treks?state=Sikkim").json()
        assert all(t["state"] == "Sikkim" for t in payload["treks"])
        assert any(t["slug"] == s for t in payload["treks"])
    finally:
        _cleanup(db, [s])
        db.close()


def test_list_treks_difficulty_filter() -> None:
    db = SessionLocal()
    s = f"diff-{_uid()}"
    try:
        _mk_trek(db, s, state="Ladakh", difficulty="Challenging", beginner=False)
        payload = client.get("/api/v1/treks?difficulty=Challenging").json()
        assert all(t["difficulty"] == "Challenging" for t in payload["treks"])
        assert any(t["slug"] == s for t in payload["treks"])
    finally:
        _cleanup(db, [s])
        db.close()


def test_get_trek_by_slug() -> None:
    db = SessionLocal()
    s = f"getone-{_uid()}"
    try:
        _mk_trek(db, s, state="Uttarakhand", difficulty="Moderate", beginner=True)
        response = client.get(f"/api/v1/treks/{s}")
        assert response.status_code == 200
        payload = response.json()
        assert payload["slug"] == s
        assert payload["beginner"] is True
        assert payload["image"] == "/images/x.jpg"
    finally:
        _cleanup(db, [s])
        db.close()


def test_list_treks_excludes_test_fixture_slugs() -> None:
    # PT4b / Step 81: *test* fixture pages (even with a valid state) must not leak
    # into the public trek list.
    db = SessionLocal()
    real_s, test_s = f"real-{_uid()}", f"real-test-{_uid()}"
    try:
        _mk_trek(db, real_s, state="Uttarakhand", difficulty="Moderate", beginner=True)
        _mk_trek(db, test_s, state="Uttarakhand", difficulty="Moderate", beginner=True)
        slugs = [t["slug"] for t in client.get("/api/v1/treks").json()["treks"]]
        assert real_s in slugs
        assert test_s not in slugs
    finally:
        _cleanup(db, [real_s, test_s])
        db.close()


def test_get_trek_not_found() -> None:
    response = client.get("/api/v1/treks/nonexistent-trek-xyz")
    assert response.status_code == 404
    assert response.json()["detail"] == "Trek not found"
