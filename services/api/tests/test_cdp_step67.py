"""Step 67 CDP Analytics Revamp — backend tests.

Admin auth is bypassed globally via conftest.py (bypass_admin_auth_for_existing_tests).
All tests use module-level TestClient matching the project's existing test pattern.
"""
from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=True)


# ── Seed helpers ──────────────────────────────────────────────────────────────

def _seed_event(
    anon_id: str = "anon-step67",
    event_name: str = "page_view",
    category: str = "navigation",
    is_internal: bool = False,
) -> None:
    client.post(
        "/api/v1/analytics/event",
        json={
            "anonymous_id": anon_id,
            "event_category": category,
            "event_name": event_name,
            "consent_given": True,
            "is_internal": is_internal,
        },
    )


# ── TC-B01: GET /admin/cdp/kpis returns 8 tiles ──────────────────────────────

def test_kpis_returns_eight_tiles() -> None:
    resp = client.get("/api/v1/admin/cdp/kpis")
    assert resp.status_code == 200
    body = resp.json()
    assert "tiles" in body
    assert len(body["tiles"]) == 8
    tile_keys = {t["key"] for t in body["tiles"]}
    assert "dau" in tile_keys
    assert "mau" in tile_keys
    assert "plan_completions" in tile_keys


# ── TC-B02: KPI tile structure has required fields ────────────────────────────

def test_kpis_tile_structure() -> None:
    resp = client.get("/api/v1/admin/cdp/kpis")
    assert resp.status_code == 200
    tile = resp.json()["tiles"][0]
    assert "key" in tile
    assert "label" in tile
    assert "value" in tile
    assert "delta" in tile
    assert "delta_pct" in tile
    assert "trend" in tile
    assert "sparkline" in tile
    assert isinstance(tile["sparkline"], list)


# ── TC-B03: GET /admin/cdp/realtime-feed returns events list ──────────────────

def test_realtime_feed() -> None:
    resp = client.get("/api/v1/admin/cdp/realtime-feed")
    assert resp.status_code == 200
    body = resp.json()
    assert "events" in body
    assert isinstance(body["events"], list)


# ── TC-B04: GET /admin/cdp/alerts returns alert list ─────────────────────────

def test_alerts_returns_list() -> None:
    resp = client.get("/api/v1/admin/cdp/alerts")
    assert resp.status_code == 200
    body = resp.json()
    assert "alerts" in body
    assert isinstance(body["alerts"], list)


# ── TC-B05: Each alert item has required fields ───────────────────────────────

def test_alert_item_structure() -> None:
    # Seed a recent event so no pipeline gap alert fires; verify structure of any returned alerts
    _seed_event("anon-alert-test", "page_view")
    resp = client.get("/api/v1/admin/cdp/alerts")
    assert resp.status_code == 200
    alerts = resp.json()["alerts"]
    # Structure check on any returned alert
    for alert in alerts:
        assert "id" in alert
        assert "severity" in alert
        assert "title" in alert
        assert "body" in alert
        assert alert["severity"] in ("info", "warning", "critical")


# ── TC-B06: GET /admin/cdp/events/definitions returns seeded events ───────────

def test_event_definitions_returns_seeded_events() -> None:
    resp = client.get("/api/v1/admin/cdp/events/definitions")
    assert resp.status_code == 200
    body = resp.json()
    assert "events" in body
    assert body["total"] >= 30
    names = {e["event_name"] for e in body["events"]}
    assert "page_view" in names
    assert "plan_wizard_completed" in names
    assert "user_signed_up" in names


# ── TC-B07: GET /admin/cdp/events returns paginated list ─────────────────────

def test_events_explorer_paginated() -> None:
    _seed_event("anon-explorer")
    resp = client.get("/api/v1/admin/cdp/events?page=1&page_size=10")
    assert resp.status_code == 200
    body = resp.json()
    assert "events" in body
    assert "total" in body
    assert "page" in body
    assert body["page"] == 1


# ── TC-B08: GET /admin/cdp/events/export returns CSV ─────────────────────────

def test_events_export_csv() -> None:
    resp = client.get("/api/v1/admin/cdp/events/export")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")


# ── TC-B09: GET /admin/cdp/funnels/templates returns 6 templates ─────────────

def test_funnel_templates_returns_six() -> None:
    resp = client.get("/api/v1/admin/cdp/funnels/templates")
    assert resp.status_code == 200
    body = resp.json()
    assert "templates" in body
    assert len(body["templates"]) == 6
    for tmpl in body["templates"]:
        assert "id" in tmpl
        assert "name" in tmpl
        assert "steps" in tmpl
        assert len(tmpl["steps"]) >= 2


# ── TC-B10: POST /admin/cdp/cohorts/custom with session_started ──────────────

def test_custom_cohort_session_started() -> None:
    resp = client.post(
        "/api/v1/admin/cdp/cohorts/custom",
        json={"cohort_event": "session_started", "max_weeks": 4},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "rows" in body
    assert "max_weeks" in body


# ── TC-B11: POST /admin/cdp/cohorts/custom with trek_view event ──────────────

def test_custom_cohort_trek_view() -> None:
    resp = client.post(
        "/api/v1/admin/cdp/cohorts/custom",
        json={"cohort_event": "trek_view", "retention_event": "trek_view", "max_weeks": 4},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "rows" in body


# ── TC-B12: GET /admin/cdp/segments/custom returns empty on fresh DB ──────────

def test_list_custom_segments_empty() -> None:
    resp = client.get("/api/v1/admin/cdp/segments/custom")
    assert resp.status_code == 200
    body = resp.json()
    assert "segments" in body
    assert isinstance(body["segments"], list)


# ── TC-B13: POST /admin/cdp/segments/custom creates a segment ─────────────────

def test_create_custom_segment() -> None:
    payload = {
        "name": "High Intent Trekkers",
        "description": "Viewed 3+ treks in 30 days",
        "conditions": [
            {
                "type": "event_count",
                "event_name": "trek_view",
                "operator": "gte",
                "value": 3,
                "time_window_days": 30,
            }
        ],
    }
    resp = client.post("/api/v1/admin/cdp/segments/custom", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "High Intent Trekkers"
    assert "id" in body
    assert len(body["conditions"]) == 1


# ── TC-B14: POST /admin/cdp/segments/preview returns estimated count ──────────

def test_segment_preview() -> None:
    payload = {
        "conditions": [
            {
                "type": "event_count",
                "event_name": "trek_view",
                "operator": "gte",
                "value": 1,
                "time_window_days": 30,
            }
        ]
    }
    resp = client.post("/api/v1/admin/cdp/segments/preview", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert "estimated_count" in body
    assert "evaluated_in_ms" in body
    assert body["estimated_count"] >= 0


# ── TC-B15: GET /admin/cdp/segments/{id}/export — unknown id → 404 ───────────

def test_segment_export_not_found() -> None:
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/v1/admin/cdp/segments/{fake_id}/export")
    assert resp.status_code == 404


# ── TC-B16: GET /admin/cdp/content/pages returns page analytics ──────────────

def test_content_pages_analytics() -> None:
    resp = client.get("/api/v1/admin/cdp/content/pages")
    assert resp.status_code == 200
    body = resp.json()
    assert "pages" in body
    assert "total" in body
    assert isinstance(body["pages"], list)


# ── TC-B17: GET /admin/cdp/content/treks returns trek analytics ──────────────

def test_trek_analytics() -> None:
    resp = client.get("/api/v1/admin/cdp/content/treks")
    assert resp.status_code == 200
    body = resp.json()
    assert "treks" in body
    assert "total" in body


# ── TC-B18: POST /admin/cdp/webhooks creates a webhook rule ──────────────────

def test_create_webhook_rule() -> None:
    payload = {
        "name": "Plan Completion Hook",
        "trigger_event": "plan_wizard_completed",
        "webhook_url": "https://hooks.example.com/test",
    }
    resp = client.post("/api/v1/admin/cdp/webhooks", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["trigger_event"] == "plan_wizard_completed"
    assert body["is_active"] is True
    assert "id" in body


# ── TC-B19: GET /admin/cdp/webhooks returns list ─────────────────────────────

def test_list_webhooks() -> None:
    resp = client.get("/api/v1/admin/cdp/webhooks")
    assert resp.status_code == 200
    body = resp.json()
    assert "rules" in body
    assert "total" in body


# ── TC-B20: DELETE /admin/cdp/webhooks/{id} — unknown id → 404 ───────────────

def test_delete_webhook_not_found() -> None:
    fake_id = str(uuid.uuid4())
    resp = client.delete(f"/api/v1/admin/cdp/webhooks/{fake_id}")
    assert resp.status_code == 404


# ── TC-B21: DELETE /admin/cdp/webhooks/{id} deletes an existing rule ─────────

def test_delete_webhook_existing() -> None:
    payload = {
        "name": "Temp Hook",
        "trigger_event": "trek_view",
        "webhook_url": "https://example.com/hook",
    }
    create_resp = client.post("/api/v1/admin/cdp/webhooks", json=payload)
    assert create_resp.status_code == 201
    rule_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/admin/cdp/webhooks/{rule_id}")
    assert del_resp.status_code == 204


# ── TC-B22: GET /admin/cdp/suppressions returns list ─────────────────────────

def test_suppressions_list() -> None:
    resp = client.get("/api/v1/admin/cdp/suppressions")
    assert resp.status_code == 200
    body = resp.json()
    assert "users" in body
    assert "total" in body


# ── TC-B23: POST /analytics/event with is_internal=True marks event ───────────

def test_event_ingest_is_internal_flag() -> None:
    anon = f"internal-anon-{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/v1/analytics/event",
        json={
            "anonymous_id": anon,
            "event_category": "navigation",
            "event_name": "page_view",
            "is_internal": True,
        },
    )
    assert resp.status_code == 201
    # Verify the explorer excludes it by default
    check = client.get(f"/api/v1/admin/cdp/events?anonymous_id={anon}&exclude_internal=true")
    assert check.status_code == 200
    assert check.json()["total"] == 0


# ── TC-B24: POST /analytics/event without is_internal defaults to False ────────

def test_event_ingest_is_internal_defaults_false() -> None:
    anon = f"ext-anon-{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/v1/analytics/event",
        json={
            "anonymous_id": anon,
            "event_category": "engagement",
            "event_name": "trek_view",
        },
    )
    assert resp.status_code == 201
    # Explorer should find this event (not excluded)
    check = client.get(f"/api/v1/admin/cdp/events?anonymous_id={anon}&exclude_internal=true")
    assert check.status_code == 200
    assert check.json()["total"] >= 1


# ── TC-B25: GET /admin/cdp/events excludes internal when flag set ─────────────

def test_events_explorer_excludes_internal() -> None:
    anon = f"dev-{uuid.uuid4().hex[:8]}"
    _seed_event(anon_id=anon, event_name="page_view", is_internal=True)

    resp = client.get(f"/api/v1/admin/cdp/events?anonymous_id={anon}&exclude_internal=true")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0

    resp_all = client.get(f"/api/v1/admin/cdp/events?anonymous_id={anon}&exclude_internal=false")
    assert resp_all.status_code == 200
    assert resp_all.json()["total"] >= 1
