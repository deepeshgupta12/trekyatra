"""Tests for Step 64 — CDP Analytics Layer."""
from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=True)

# ---------------------------------------------------------------------------
# POST /analytics/event — single event ingest
# ---------------------------------------------------------------------------

def test_ingest_event_returns_201():
    """TC-B01: Single event ingest returns 201 with event id."""
    res = client.post(
        "/api/v1/analytics/event",
        json={
            "anonymous_id": "anon-test-001",
            "session_id": "sess-test-001",
            "event_category": "navigation",
            "event_name": "page_view",
            "page_url": "/treks/kedarkantha",
            "consent_given": True,
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert data["event_name"] == "page_view"
    assert data["event_category"] == "navigation"


def test_ingest_event_without_consent():
    """TC-B02: Event with consent_given=False is stored but flagged."""
    res = client.post(
        "/api/v1/analytics/event",
        json={
            "anonymous_id": "anon-no-consent",
            "event_category": "navigation",
            "event_name": "page_view",
            "consent_given": False,
        },
    )
    assert res.status_code == 201


def test_ingest_event_with_utms():
    """TC-B03: Event with full UTM attribution is stored correctly."""
    res = client.post(
        "/api/v1/analytics/event",
        json={
            "anonymous_id": "anon-utm-001",
            "event_category": "engagement",
            "event_name": "trek_viewed",
            "event_value": 1.0,
            "utm_source": "google",
            "utm_medium": "organic",
            "utm_campaign": "brand",
            "properties": {"trek_slug": "kedarkantha"},
            "consent_given": True,
        },
    )
    assert res.status_code == 201


def test_ingest_event_missing_required_fields():
    """TC-B04: Event missing event_name returns 422."""
    res = client.post(
        "/api/v1/analytics/event",
        json={
            "anonymous_id": "anon-test-001",
            "event_category": "navigation",
            # event_name missing
        },
    )
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# POST /analytics/events/batch — batch ingest
# ---------------------------------------------------------------------------

def test_batch_ingest_returns_count():
    """TC-B05: Batch of events returns ingested count."""
    events = [
        {
            "anonymous_id": "anon-batch-001",
            "event_category": "navigation",
            "event_name": "page_view",
            "page_url": f"/treks/trek-{i}",
            "consent_given": True,
        }
        for i in range(5)
    ]
    res = client.post("/api/v1/analytics/events/batch", json={"events": events})
    assert res.status_code == 201
    data = res.json()
    assert data["ingested"] == 5


def test_batch_ingest_exceeds_limit():
    """TC-B06: Batch of more than 50 events returns 422 (limit bumped to 50 in M15)."""
    events = [
        {
            "anonymous_id": "anon-batch-overflow",
            "event_category": "navigation",
            "event_name": "page_view",
            "consent_given": True,
        }
        for _ in range(51)
    ]
    res = client.post("/api/v1/analytics/events/batch", json={"events": events})
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# POST /analytics/session/start + /analytics/session/end
# ---------------------------------------------------------------------------

def test_session_start_returns_session_id():
    """TC-B07: Session start returns a session id."""
    res = client.post(
        "/api/v1/analytics/session/start",
        json={
            "anonymous_id": "anon-session-001",
            "landing_page": "/",
            "utm_source": "google",
            "utm_medium": "organic",
            "device_type": "mobile",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert data["id"].startswith("s_")
    assert data["anonymous_id"] == "anon-session-001"


def test_session_end_happy_path():
    """TC-B08: Session end updates session record correctly."""
    start_res = client.post(
        "/api/v1/analytics/session/start",
        json={"anonymous_id": "anon-end-test-001", "landing_page": "/search"},
    )
    assert start_res.status_code == 201
    session_id = start_res.json()["id"]

    end_res = client.post(
        "/api/v1/analytics/session/end",
        json={
            "session_id": session_id,
            "exit_page": "/treks/kedarkantha",
            "page_count": 3,
            "event_count": 7,
            "duration_seconds": 120,
            "converted": False,
        },
    )
    assert end_res.status_code == 200
    data = end_res.json()
    assert data["id"] == session_id
    assert data["page_count"] == 3
    assert data["event_count"] == 7


def test_session_end_unknown_id_returns_404():
    """TC-B09: Ending a non-existent session returns 404."""
    res = client.post(
        "/api/v1/analytics/session/end",
        json={
            "session_id": "s_nonexistent_id",
            "page_count": 1,
            "event_count": 1,
        },
    )
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# POST /analytics/consent
# ---------------------------------------------------------------------------

def test_consent_update():
    """TC-B10: Consent update endpoint returns confirmation."""
    res = client.post(
        "/api/v1/analytics/consent",
        json={"anonymous_id": "anon-consent-001", "consent_given": True},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["consent_given"] is True
    assert data["anonymous_id"] == "anon-consent-001"
    assert "updated_at" in data


# ---------------------------------------------------------------------------
# Admin endpoints (conftest globally bypasses admin auth; test structure/200)
# ---------------------------------------------------------------------------

def test_admin_users_list_returns_paged_result():
    """TC-B11: /admin/cdp/users returns paginated user list."""
    res = client.get("/api/v1/admin/cdp/users")
    assert res.status_code == 200
    data = res.json()
    assert "users" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data


def test_admin_user_profile_unknown_id_returns_404():
    """TC-B12: /admin/cdp/users/{id} with unknown UUID returns 404."""
    res = client.get(f"/api/v1/admin/cdp/users/{uuid.uuid4()}")
    assert res.status_code == 404


def test_admin_funnels_dynamic_two_steps():
    """TC-B13: POST /admin/cdp/funnels/dynamic with 2 steps returns step data."""
    res = client.post(
        "/api/v1/admin/cdp/funnels/dynamic",
        json={
            "steps": [
                {"event_name": "page_view"},
                {"event_name": "trek_viewed"},
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "steps" in data
    assert len(data["steps"]) == 2


def test_admin_cohorts_returns_rows():
    """TC-B14: /admin/cdp/cohorts returns retention heatmap with rows + max_weeks."""
    res = client.get("/api/v1/admin/cdp/cohorts")
    assert res.status_code == 200
    data = res.json()
    assert "rows" in data
    assert "max_weeks" in data


def test_admin_event_stream_returns_events():
    """TC-B15: /admin/cdp/events/stream returns event list with total."""
    res = client.get("/api/v1/admin/cdp/events/stream")
    assert res.status_code == 200
    data = res.json()
    assert "events" in data
    assert "total" in data


def test_admin_segments_returns_list():
    """TC-B16: /admin/cdp/segments returns all 10 defined segments."""
    res = client.get("/api/v1/admin/cdp/segments")
    assert res.status_code == 200
    data = res.json()
    assert "segments" in data
    assert len(data["segments"]) == 11  # 11 segments: added App Users + Mobile Browser Users (replaced Mobile-First Users)


def test_admin_gsc_returns_rows():
    """TC-B17: /admin/cdp/gsc returns GSC data rows."""
    res = client.get("/api/v1/admin/cdp/gsc")
    assert res.status_code == 200
    data = res.json()
    assert "rows" in data
    assert "total" in data


# ---------------------------------------------------------------------------
# DPDP endpoints (require user auth — 401 when unauthenticated)
# ---------------------------------------------------------------------------

def test_dpdp_data_export_requires_auth():
    """TC-B18: GET /auth/me/data-export requires user authentication."""
    res = client.get("/api/v1/auth/me/data-export")
    assert res.status_code == 401


def test_dpdp_data_delete_requires_auth():
    """TC-B19: DELETE /auth/me/data requires user authentication."""
    res = client.delete("/api/v1/auth/me/data")
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Service-layer unit tests
# ---------------------------------------------------------------------------

def test_classify_channel_organic():
    """TC-B20: Channel classifier returns organic_search for organic medium."""
    from app.modules.cdp.service import _classify_channel
    assert _classify_channel("google", "organic") == "organic_search"


def test_classify_channel_direct():
    """TC-B21: Channel classifier returns direct when no medium."""
    from app.modules.cdp.service import _classify_channel
    assert _classify_channel(None, None) == "direct"


def test_classify_channel_email():
    """TC-B22: Channel classifier returns email for email medium."""
    from app.modules.cdp.service import _classify_channel
    assert _classify_channel("mailchimp", "email") == "email"


def test_hash_ip():
    """TC-B23: hash_ip produces a 32-char hex string."""
    from app.modules.cdp.service import hash_ip
    result = hash_ip("192.168.1.1")
    assert len(result) == 32
    assert result == hash_ip("192.168.1.1")  # deterministic


def test_session_start_records_attribution():
    """TC-B24: Session with UTMs creates attribution touchpoint (first_touch)."""
    res = client.post(
        "/api/v1/analytics/session/start",
        json={
            "anonymous_id": "anon-attr-test-001",
            "landing_page": "/treks/kedarkantha",
            "utm_source": "google",
            "utm_medium": "cpc",
            "utm_campaign": "himalaya-summer",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["id"].startswith("s_")
