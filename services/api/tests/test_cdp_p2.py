"""P2 CDP — expanded segments (lifecycle/high-intent), attribution report,
segmented cohorts, and saved (named) funnels."""
from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.modules.cdp import service as cdp_service
from app.modules.cdp.models import UserTrait

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


# ── TC-B01: lifecycle + high-intent segments are in the catalog with counts ───
def test_segments_include_lifecycle_and_high_intent(db: Session):
    result = cdp_service.get_segments(db)
    names = {s["name"] for s in result["segments"]}
    assert {"New Users", "Active Users", "Dormant Users", "Churned Users"} <= names
    assert {"Trek Lovers, No Signup", "Lead Drop-offs"} <= names
    # every segment carries a non-negative integer count
    assert all(isinstance(s["user_count"], int) and s["user_count"] >= 0 for s in result["segments"])


def test_lifecycle_segment_count_matches_traits(db: Session):
    anon = f"p2-life-{uuid.uuid4().hex[:8]}"
    db.add(UserTrait(anonymous_id=anon, lifecycle_stage="dormant"))
    db.commit()
    result = cdp_service.get_segments(db)
    dormant = next(s for s in result["segments"] if s["name"] == "Dormant Users")
    assert dormant["user_count"] >= 1


# ── TC-B02: attribution report shape (service + API) ──────────────────────────
def test_attribution_report_shape(db: Session):
    report = cdp_service.get_attribution_report(db, days=90)
    assert report["window_days"] == 90
    assert "channels" in report and isinstance(report["channels"], list)
    assert {"total_touchpoints", "total_first_touch", "total_last_touch"} <= report.keys()
    for ch in report["channels"]:
        assert {"channel", "first_touch", "last_touch", "touchpoints", "linear_pct"} <= ch.keys()


def test_attribution_api_returns_200():
    resp = client.get("/api/v1/admin/cdp/attribution?days=30")
    assert resp.status_code == 200
    assert resp.json()["window_days"] == 30


# ── TC-B03: segmented cohorts accept source + behavior filters ────────────────
def test_cohorts_accept_source_and_behavior_params():
    for q in ("source=organic", "behavior_event=trek_viewed", ""):
        resp = client.get(f"/api/v1/admin/cdp/cohorts?{q}")
        assert resp.status_code == 200
        body = resp.json()
        assert "rows" in body and "max_weeks" in body


def test_behavior_cohort_filters_to_event_users(db: Session):
    # A behavior cohort restricted to a never-seen event yields no cohort rows.
    result = cdp_service.get_cohort_heatmap(db, behavior_event=f"never_{uuid.uuid4().hex}")
    assert result["rows"] == []


# ── TC-B04: saved (named) funnels — full CRUD + run ───────────────────────────
def test_saved_funnel_crud_and_run():
    payload = {
        "name": f"Plan conversion {uuid.uuid4().hex[:6]}",
        "steps": [{"event_name": "trek_viewed"}, {"event_name": "plan_wizard_started"}],
        "conversion_window_days": 30,
        "count_type": "unique_users",
    }
    # create
    created = client.post("/api/v1/admin/cdp/funnels/saved", json=payload)
    assert created.status_code == 201
    fid = created.json()["id"]
    assert created.json()["conversion_window_days"] == 30

    # list contains it
    listed = client.get("/api/v1/admin/cdp/funnels/saved")
    assert listed.status_code == 200
    assert any(f["id"] == fid for f in listed.json()["funnels"])

    # run returns a funnel result with 2 steps
    run = client.post(f"/api/v1/admin/cdp/funnels/saved/{fid}/run")
    assert run.status_code == 200
    assert len(run.json()["steps"]) == 2

    # delete → 204, then run 404
    dele = client.delete(f"/api/v1/admin/cdp/funnels/saved/{fid}")
    assert dele.status_code == 204
    assert client.post(f"/api/v1/admin/cdp/funnels/saved/{fid}/run").status_code == 404


def test_saved_funnel_requires_min_two_steps():
    resp = client.post(
        "/api/v1/admin/cdp/funnels/saved",
        json={"name": "too short", "steps": [{"event_name": "trek_viewed"}]},
    )
    assert resp.status_code == 422  # Pydantic min_length=2
