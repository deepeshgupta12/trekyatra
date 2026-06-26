"""STEP-80 / M19 — Live Trek Conditions backend tests (9 tests)."""
from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage
from app.modules.conditions.models import TrekCondition
from app.modules.conditions.schemas import WeatherOut
from app.modules.conditions.service import (
    _parse_weather,
    build_condition_summary,
    derive_permit_status,
    derive_trail_status,
    get_trek_conditions,
    seed_trek_coordinates,
)
from app.modules.reports.models import TripReport

client = TestClient(app, raise_server_exceptions=True)

_SLUG = f"test-conditions-trek-{uuid.uuid4().hex[:6]}"

_OPEN_METEO_RESPONSE = {
    "current": {
        "temperature_2m": 12.5,
        "apparent_temperature": 10.0,
        "relative_humidity_2m": 68,
        "wind_speed_10m": 15.2,
        "weather_code": 2,
    },
    "daily": {
        "time": ["2026-06-26", "2026-06-27", "2026-06-28"],
        "weather_code": [2, 61, 80],
        "temperature_2m_max": [15.0, 12.0, 14.0],
        "temperature_2m_min": [6.0, 4.0, 5.0],
    },
}


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def trek_page(db):
    """Create a minimal trek_guide CMSPage for testing."""
    page = CMSPage(
        slug=_SLUG,
        page_type="trek_guide",
        title="Test Conditions Trek",
        status="published",
        trek_name="Test Conditions Trek",
        trek_base_lat=31.0167,
        trek_base_lng=78.2167,
        trek_is_unsafe_closed=False,
        trek_permit_required=False,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    yield page
    # cleanup
    db.query(TrekCondition).filter(TrekCondition.slug == _SLUG).delete()
    db.delete(page)
    db.commit()


# ── Unit tests ─────────────────────────────────────────────────────────────────

def test_parse_weather_current():
    """TC-B-M19-01: _parse_weather extracts current temp + WMO label from Open-Meteo response."""
    weather, forecast = _parse_weather(_OPEN_METEO_RESPONSE)
    assert weather.temp_c == 12.5
    assert weather.wmo_code == 2
    assert weather.label == "Partly Cloudy"
    assert weather.humidity_pct == 68
    assert weather.wind_kph == 15.2


def test_parse_weather_forecast():
    """TC-B-M19-02: _parse_weather returns 3 forecast days with correct date + label."""
    _, forecast = _parse_weather(_OPEN_METEO_RESPONSE)
    assert len(forecast) == 3
    assert forecast[0].date == "2026-06-26"
    assert forecast[0].temp_max_c == 15.0
    assert forecast[1].label == "Light Rain"  # WMO 61
    assert forecast[2].label == "Rain Showers"  # WMO 80


def test_derive_trail_status_unsafe_closed(db, trek_page):
    """TC-B-M19-03: trek_is_unsafe_closed=True overrides to 'closed' regardless of reports."""
    trek_page.trek_is_unsafe_closed = True
    db.commit()
    status = derive_trail_status(trek_page, db)
    assert status == "closed"
    trek_page.trek_is_unsafe_closed = False
    db.commit()


def test_derive_trail_status_from_reports(db, trek_page):
    """TC-B-M19-04: Trail status is 'caution' when 2+ recent approved reports say 'caution'."""
    reports = []
    for _ in range(3):
        r = TripReport(
            trek_slug=_SLUG,
            body="Trail is slippery.",
            condition="caution",
            trek_date=__import__("datetime").date.today(),
            status="approved",
        )
        db.add(r)
        reports.append(r)
    db.commit()

    status = derive_trail_status(trek_page, db)
    assert status == "caution"

    for r in reports:
        db.delete(r)
    db.commit()


def test_derive_trail_status_no_reports(db, trek_page):
    """TC-B-M19-05: No approved reports → trail defaults to 'open'."""
    status = derive_trail_status(trek_page, db)
    assert status == "open"


def test_derive_permit_status_not_required(db, trek_page):
    """TC-B-M19-06: trek_permit_required=False → permit_status 'not_required'."""
    trek_page.trek_permit_required = False
    db.commit()
    assert derive_permit_status(trek_page) == "not_required"


def test_derive_permit_status_required(db, trek_page):
    """TC-B-M19-07: trek_permit_required=True with no open_months → 'required'."""
    trek_page.trek_permit_required = True
    trek_page.trek_open_months = None
    db.commit()
    assert derive_permit_status(trek_page) == "required"


def test_build_condition_summary():
    """TC-B-M19-08: build_condition_summary returns a non-empty string with all 3 status pieces."""
    weather = WeatherOut(temp_c=12.5, label="Partly Cloudy")
    summary = build_condition_summary(weather, "open", "not_required", "Kedarkantha")
    assert "12" in summary
    assert "partly cloudy" in summary.lower() or "Partly Cloudy" in summary
    assert "open" in summary.lower() or "Trail is open" in summary
    assert "No permit" in summary or "not required" in summary.lower()


def test_get_conditions_api_returns_404_when_no_data():
    """TC-B-M19-09: GET /api/v1/public/treks/{slug}/conditions returns 404 for unknown slug."""
    resp = client.get("/api/v1/public/treks/completely-unknown-trek-xyz/conditions")
    assert resp.status_code == 404
