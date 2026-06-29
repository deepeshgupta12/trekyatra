"""STEP-M20 — Nearby Treks (GPS) backend tests (5 tests).

Tests cover the haversine service function and the GET /api/v1/mobile/nearby endpoint.
The service layer tests (TC-B-M20-02/03/05) use the TREK_COORDS static lookup directly.
The API test (TC-B-M20-01) seeds a single CMS trek page so the enrichment path is
exercised. TC-B-M20-04 verifies query validation (no DB needed).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage
from app.modules.treks.service import get_nearby_treks

client = TestClient(app, raise_server_exceptions=True)

# nag-tibba is ~37km from Rishikesh — guaranteed within 300km default radius
_SEED_SLUG = "nag-tibba"
_SEED_TITLE = "Nag Tibba Trek"

# Rishikesh coords — within range of several Uttarakhand treks
_RISHIKESH_LAT = 30.09
_RISHIKESH_LON = 78.27


@pytest.fixture(autouse=True)
def seed_trek_page():
    """Seed one published trek CMS page so the nearby API enrichment path runs."""
    db = SessionLocal()
    try:
        existing = db.query(CMSPage).filter(CMSPage.slug == _SEED_SLUG).first()
        if not existing:
            page = CMSPage(
                slug=_SEED_SLUG,
                title=_SEED_TITLE,
                page_type="trek_guide",
                status="published",
                trek_state="Uttarakhand",
                trek_difficulty="Easy",
                trek_duration="2 days",
                content_html="",
            )
            db.add(page)
            db.commit()
        yield
    finally:
        db.query(CMSPage).filter(CMSPage.slug == _SEED_SLUG).delete()
        db.commit()
        db.close()


# ── Unit tests for get_nearby_treks service ─────────────────────────────────

def test_nearby_sorted_by_distance() -> None:
    """TC-B-M20-02: Results are returned in ascending distance_km order."""
    results = get_nearby_treks(lat=_RISHIKESH_LAT, lon=_RISHIKESH_LON, radius_km=300, limit=20)
    assert len(results) >= 2
    distances = [r["distance_km"] for r in results]
    assert distances == sorted(distances), "Results must be sorted ascending by distance"


def test_nearby_radius_filter() -> None:
    """TC-B-M20-03: Smaller radius_km returns fewer treks than larger radius."""
    near_results = get_nearby_treks(lat=_RISHIKESH_LAT, lon=_RISHIKESH_LON, radius_km=50)
    far_results = get_nearby_treks(lat=_RISHIKESH_LAT, lon=_RISHIKESH_LON, radius_km=500)
    assert len(near_results) <= len(far_results)


def test_nearby_far_location_returns_empty() -> None:
    """TC-B-M20-05: Mumbai (19.07, 72.87) is >600km from all Himalayan treks within 200km."""
    results = get_nearby_treks(lat=19.07, lon=72.87, radius_km=200)
    assert results == [], "No Himalayan treks should be within 200km of Mumbai"


# ── API endpoint tests ───────────────────────────────────────────────────────

def test_nearby_api_from_rishikesh() -> None:
    """TC-B-M20-01: lat/lon near Rishikesh returns nag-tibba (~37km away) enriched with CMS data."""
    resp = client.get(
        f"/api/v1/mobile/nearby?lat={_RISHIKESH_LAT}&lon={_RISHIKESH_LON}&limit=5"
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "treks" in body
    assert "user_lat" in body and "user_lon" in body
    assert body["user_lat"] == pytest.approx(_RISHIKESH_LAT)
    treks = body["treks"]
    assert len(treks) >= 1
    slugs = [t["slug"] for t in treks]
    assert _SEED_SLUG in slugs, f"nag-tibba must appear in results from Rishikesh; got {slugs}"
    nag = next(t for t in treks if t["slug"] == _SEED_SLUG)
    assert nag["distance_km"] > 0
    assert nag["name"] == _SEED_TITLE
    assert nag["state"] == "Uttarakhand"


def test_nearby_api_invalid_lat() -> None:
    """TC-B-M20-04: lat=999 returns HTTP 422 Unprocessable Entity."""
    resp = client.get("/api/v1/mobile/nearby?lat=999&lon=77.0")
    assert resp.status_code == 422
