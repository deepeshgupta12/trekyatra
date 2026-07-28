"""M15 — Mobile CDP Analytics backend tests."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.modules.cdp.service import log_event
from app.schemas.cdp import EventIn

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def _event_in(**kwargs) -> EventIn:
    defaults = dict(
        anonymous_id="test-anon-m15",
        event_category="engagement",
        event_name="trek_view",
        properties={"trek_slug": "kedarkantha"},
    )
    defaults.update(kwargs)
    return EventIn(**defaults)


def test_mobile_event_platform_stored(db: Session):
    """TC-B-M15-01: event with platform=android stored correctly."""
    event = log_event(db, _event_in(platform="android", app_version="1.2.0"))
    assert event.platform == "android"
    assert event.app_version == "1.2.0"


def test_web_event_defaults_platform_web(db: Session):
    """TC-B-M15-02: event without platform defaults to 'web'."""
    event = log_event(db, _event_in())
    assert event.platform == "web"
    assert event.app_version is None


def test_batch_event_ingest_via_api():
    """TC-B-M15-03: POST /analytics/events/batch with 3 mobile events returns accepted=3."""
    payload = {
        "events": [
            {
                "anonymous_id": f"anon-m15-{i}",
                "event_category": "engagement",
                "event_name": "screen_view",
                "properties": {"screen": "home"},
                "platform": "ios",
                "app_version": "1.0.0",
            }
            for i in range(3)
        ]
    }
    resp = client.post("/api/v1/analytics/events/batch", json=payload)
    assert resp.status_code == 201
    assert resp.json()["ingested"] == 3


def test_batch_rejects_over_50_events():
    """TC-B-M15-04: batch of 55 events rejected (Pydantic max_length=50)."""
    payload = {
        "events": [
            {
                "anonymous_id": f"anon-m15-{i}",
                "event_category": "engagement",
                "event_name": "app_open",
                "properties": {},
                "platform": "android",
            }
            for i in range(55)
        ]
    }
    resp = client.post("/api/v1/analytics/events/batch", json=payload)
    assert resp.status_code == 422


def test_mobile_session_start_persists_device_metadata(db: Session):
    """POST /analytics/session/start with mobile fields → session row carries platform + device."""
    resp = client.post(
        "/api/v1/analytics/session/start",
        json={
            "anonymous_id": "anon-m15-ios-session",
            "platform": "ios",
            "app_version": "1.0.0",
            "device_model": "iPhone15,2",
            "os_version": "17.4",
            "landing_page": "/(tabs)/(home)",
        },
    )
    assert resp.status_code == 201, resp.text
    sid = resp.json()["id"]
    from app.modules.cdp.models import AnalyticsSession
    row = db.query(AnalyticsSession).filter(AnalyticsSession.id == sid).first()
    assert row is not None
    assert row.platform == "ios"
    assert row.device_model == "iPhone15,2"
    assert row.os_version == "17.4"
    db.query(AnalyticsSession).filter(AnalyticsSession.id == sid).delete()
    db.commit()
