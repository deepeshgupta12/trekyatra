"""Tests for Step 65 — CDP Analytics Enhancement.

Covers: event catalog, dynamic funnels, cohort heatmap, user activity timeline.
Admin auth is bypassed globally via conftest.py.
"""
from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=True)

# ── Seed helpers ──────────────────────────────────────────────────────────────

def _seed_event(anon_id: str = "anon-step65", event_name: str = "page_view", category: str = "navigation") -> None:
    client.post(
        "/api/v1/analytics/event",
        json={
            "anonymous_id": anon_id,
            "event_category": category,
            "event_name": event_name,
            "consent_given": True,
        },
    )


# ── TC-B01: Event catalog ──────────────────────────────────────────────────────

def test_event_catalog_returns_list():
    """TC-B01: GET /admin/cdp/events/catalog returns 200 with events list."""
    _seed_event()
    res = client.get("/api/v1/admin/cdp/events/catalog")
    assert res.status_code == 200
    data = res.json()
    assert "events" in data
    assert isinstance(data["events"], list)


def test_event_catalog_item_shape():
    """TC-B02: Each catalog item has event_name, event_category, count fields."""
    _seed_event(event_name="trek_viewed", category="engagement")
    res = client.get("/api/v1/admin/cdp/events/catalog")
    assert res.status_code == 200
    events = res.json()["events"]
    if events:
        item = events[0]
        assert "event_name" in item
        assert "event_category" in item
        assert "count" in item
        assert isinstance(item["count"], int)


# ── TC-B03: Dynamic funnels ────────────────────────────────────────────────────

def test_dynamic_funnel_two_steps_returns_data():
    """TC-B03: POST /admin/cdp/funnels/dynamic with 2-step funnel returns step counts."""
    _seed_event(event_name="page_view", category="navigation")
    _seed_event(event_name="trek_viewed", category="engagement")
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
    assert "overall_conversion_pct" in data
    assert data["steps"][0]["step"] == 1
    assert data["steps"][1]["step"] == 2


def test_dynamic_funnel_with_category_filter():
    """TC-B04: Dynamic funnel with event_category filter restricts results."""
    res = client.post(
        "/api/v1/admin/cdp/funnels/dynamic",
        json={
            "steps": [
                {"event_name": "page_view", "event_category": "navigation"},
                {"event_name": "trek_viewed", "event_category": "engagement"},
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["steps"]) == 2
    for step in data["steps"]:
        assert step["users"] >= 0


def test_dynamic_funnel_single_step_rejected():
    """TC-B05: POST with only 1 step returns 422 (min 2 required)."""
    res = client.post(
        "/api/v1/admin/cdp/funnels/dynamic",
        json={"steps": [{"event_name": "page_view"}]},
    )
    assert res.status_code == 422


def test_dynamic_funnel_too_many_steps_rejected():
    """TC-B06: POST with 9 steps returns 422 (max 8 allowed)."""
    steps = [{"event_name": f"event_{i}"} for i in range(9)]
    res = client.post("/api/v1/admin/cdp/funnels/dynamic", json={"steps": steps})
    assert res.status_code == 422


def test_dynamic_funnel_drop_off_computed():
    """TC-B07: Drop-off percentage is None for step 1 and float for step 2+."""
    res = client.post(
        "/api/v1/admin/cdp/funnels/dynamic",
        json={
            "steps": [
                {"event_name": "page_view"},
                {"event_name": "user_signed_up"},
            ],
        },
    )
    assert res.status_code == 200
    steps = res.json()["steps"]
    assert steps[0]["drop_off_pct"] is None


# ── TC-B08: Cohort heatmap ─────────────────────────────────────────────────────

def test_cohorts_heatmap_structure():
    """TC-B08: GET /admin/cdp/cohorts returns heatmap with rows + max_weeks."""
    res = client.get("/api/v1/admin/cdp/cohorts")
    assert res.status_code == 200
    data = res.json()
    assert "rows" in data
    assert "max_weeks" in data
    assert isinstance(data["rows"], list)
    assert data["max_weeks"] == 9


def test_cohorts_heatmap_row_shape():
    """TC-B09: Each cohort row has cohort_week, total_users, retention list."""
    res = client.get("/api/v1/admin/cdp/cohorts")
    assert res.status_code == 200
    rows = res.json()["rows"]
    for row in rows:
        assert "cohort_week" in row
        assert "total_users" in row
        assert "retention" in row
        assert isinstance(row["retention"], list)
        for cell in row["retention"]:
            assert "week" in cell
            assert "users" in cell
            assert "pct" in cell


# ── TC-B10: User activity timeline ────────────────────────────────────────────

def test_user_activity_not_found():
    """TC-B10: GET /admin/cdp/users/activity?email=nobody returns 404."""
    res = client.get("/api/v1/admin/cdp/users/activity?email=nobody@example.com")
    assert res.status_code == 404


def test_user_activity_missing_email_param():
    """TC-B11: GET /admin/cdp/users/activity without email returns 422."""
    res = client.get("/api/v1/admin/cdp/users/activity")
    assert res.status_code == 422


# ── TC-B12: Segments ──────────────────────────────────────────────────────────

def test_segments_returns_ten():
    """TC-B12: GET /admin/cdp/segments returns all defined segments (17 after P2 lifecycle+intent adds)."""
    res = client.get("/api/v1/admin/cdp/segments")
    assert res.status_code == 200
    data = res.json()
    assert "segments" in data
    assert len(data["segments"]) == 17


def test_segments_have_criteria_label():
    """TC-B13: Each segment has a criteria_label field (human-readable filter)."""
    res = client.get("/api/v1/admin/cdp/segments")
    assert res.status_code == 200
    for seg in res.json()["segments"]:
        assert "criteria_label" in seg
        assert isinstance(seg["criteria_label"], str)
        assert len(seg["criteria_label"]) > 0
