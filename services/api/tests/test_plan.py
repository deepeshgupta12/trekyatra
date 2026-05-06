"""Tests for Step 39 — trip planning assistant."""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.modules.cms.models import CMSPage
from app.modules.plan.models import TripPlan
from app.modules.plan import service as plan_service
from app.modules.agents.trip_planner import agent as planner_mod
from app.modules.agents.trip_planner.agent import (
    _fallback_itinerary,
    _score_trek,
    run_trip_planner,
)
from app.schemas.plan import PlanGenerateRequest

client = TestClient(app, raise_server_exceptions=True)


@pytest.fixture()
def db():
    gen = get_db()
    session = next(gen)
    try:
        yield session
    finally:
        session.rollback()
        try:
            next(gen)
        except StopIteration:
            pass


@pytest.fixture()
def trek_page(db: Session) -> CMSPage:
    page = CMSPage(
        slug=f"kedarkantha-trek-guide-{uuid.uuid4().hex[:6]}",
        page_type="trek_guide",
        title="Kedarkantha Trek Guide",
        content_html="<h1>Kedarkantha</h1>",
        status="published",
        language="en",
        content_json={
            "trek_facts": {
                "difficulty": "easy to moderate",
                "duration": "6 days",
                "season": "December to April",
                "altitude": "3800m",
                "permits": "Forest permit required",
                "base": "Sankri",
            },
            "sections": {
                "cost_estimate": "₹10,000–18,000",
                "itinerary": "Day 1: Sankri to Juda Ka Talab\nDay 2: Juda Ka Talab to Base Camp\n",
                "packing": "- Trekking shoes\n- Warm jacket\n- Rain cover\n",
            },
        },
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


# ---------------------------------------------------------------------------
# TC-B01: _fallback_itinerary produces correct number of days
# ---------------------------------------------------------------------------
def test_fallback_itinerary_day_count():
    itinerary = _fallback_itinerary({}, 5)
    assert len(itinerary) == 5
    assert itinerary[0]["day"] == 1
    assert itinerary[-1]["day"] == 5


# ---------------------------------------------------------------------------
# TC-B02: _score_trek matches region in slug
# ---------------------------------------------------------------------------
def test_score_trek_region_match():
    trek = {"slug": "kedarkantha-uttarakhand", "title": "Kedarkantha", "difficulty": "easy", "season": "winter", "duration": "6 days"}
    state = {"region": "uttarakhand", "experience": "beginner", "month": "december", "duration_days": 6, "budget_inr": None, "group_size": None}
    score = _score_trek(trek, state)
    assert score > 0


# ---------------------------------------------------------------------------
# TC-B03: run_trip_planner returns output dict without API key (fallback)
# ---------------------------------------------------------------------------
def test_run_trip_planner_no_api_key(db: Session, trek_page, monkeypatch):
    monkeypatch.setattr("app.modules.agents.trip_planner.agent.settings.anthropic_api_key", None)
    result = run_trip_planner(db, region=None, duration_days=5, experience="beginner", month=None, budget_inr=None, group_size=None)
    assert "output" in result
    assert result["fallback_used"] is True
    assert isinstance(result["output"], dict)
    assert "trek_title" in result["output"]


# ---------------------------------------------------------------------------
# TC-B04: run_trip_planner uses LLM when API key set (mocked)
# ---------------------------------------------------------------------------
def test_run_trip_planner_with_mocked_llm(db: Session, trek_page, monkeypatch):
    monkeypatch.setattr("app.modules.agents.trip_planner.agent.settings.anthropic_api_key", "sk-test")
    itinerary_json = '[{"day": 1, "title": "Arrival", "activities": ["Rest"], "notes": null}]'
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=itinerary_json)]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response
    with patch.object(planner_mod._anthropic, "Anthropic", return_value=mock_client):
        result = run_trip_planner(db, region=None, duration_days=1, experience="beginner", month=None, budget_inr=None, group_size=None)
    assert result["fallback_used"] is False
    assert result["output"]["itinerary"][0]["title"] == "Arrival"


# ---------------------------------------------------------------------------
# TC-B05: run_trip_planner swallows LLM exception, uses fallback
# ---------------------------------------------------------------------------
def test_run_trip_planner_swallows_exception(db: Session, trek_page, monkeypatch):
    monkeypatch.setattr("app.modules.agents.trip_planner.agent.settings.anthropic_api_key", "sk-test")
    mock_client = MagicMock()
    mock_client.messages.create.side_effect = RuntimeError("LLM error")
    with patch.object(planner_mod._anthropic, "Anthropic", return_value=mock_client):
        result = run_trip_planner(db, region=None, duration_days=5, experience="beginner", month=None, budget_inr=None, group_size=None)
    assert result["fallback_used"] is True


# ---------------------------------------------------------------------------
# TC-B06: plan_service.generate_plan stores TripPlan in DB
# ---------------------------------------------------------------------------
def test_generate_plan_stored(db: Session, trek_page, monkeypatch):
    monkeypatch.setattr("app.modules.agents.trip_planner.agent.settings.anthropic_api_key", None)
    payload = PlanGenerateRequest(session_id="test-session-001", region=None, duration_days=5, experience="beginner")
    plan = plan_service.generate_plan(db, payload)
    assert plan.id is not None
    assert plan.session_id == "test-session-001"
    assert plan.output is not None
    assert plan.fallback_used is True


# ---------------------------------------------------------------------------
# TC-B07: plan_service.generate_plan captures lead when email provided
# ---------------------------------------------------------------------------
def test_generate_plan_captures_lead(db: Session, trek_page, monkeypatch):
    monkeypatch.setattr("app.modules.agents.trip_planner.agent.settings.anthropic_api_key", None)
    from app.modules.leads.models import LeadSubmission
    from sqlalchemy import select
    count_before = db.scalar(select(LeadSubmission).where(LeadSubmission.cta_type == "trip_planner")) or 0

    payload = PlanGenerateRequest(session_id="test-session-002", region="uttarakhand", email="hiker@test.com")
    plan_service.generate_plan(db, payload)

    leads = list(db.scalars(select(LeadSubmission).where(LeadSubmission.cta_type == "trip_planner")).all())
    assert any(l.email == "hiker@test.com" for l in leads)


# ---------------------------------------------------------------------------
# TC-B08: POST /plan/generate — happy path (no API key)
# ---------------------------------------------------------------------------
def test_api_generate_plan(trek_page, monkeypatch):
    monkeypatch.setattr("app.modules.agents.trip_planner.agent.settings.anthropic_api_key", None)
    res = client.post("/api/v1/plan/generate", json={
        "session_id": "browser-session-abc123",
        "region": None,
        "duration_days": 5,
        "experience": "beginner",
    })
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert data["output"] is not None
    assert data["fallback_used"] is True


# ---------------------------------------------------------------------------
# TC-B09: GET /plan/{id} — retrieve saved plan
# ---------------------------------------------------------------------------
def test_api_get_plan(db: Session, trek_page, monkeypatch):
    monkeypatch.setattr("app.modules.agents.trip_planner.agent.settings.anthropic_api_key", None)
    create_res = client.post("/api/v1/plan/generate", json={
        "session_id": "sess-get-test",
        "duration_days": 3,
    })
    plan_id = create_res.json()["id"]
    get_res = client.get(f"/api/v1/plan/{plan_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == plan_id


# ---------------------------------------------------------------------------
# TC-B10: GET /plan/{id} — 404 for unknown plan
# ---------------------------------------------------------------------------
def test_api_get_plan_not_found():
    res = client.get(f"/api/v1/plan/{uuid.uuid4()}")
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B11: POST /plan/{id}/email — 404 for unknown plan
# ---------------------------------------------------------------------------
def test_api_email_plan_not_found():
    res = client.post(f"/api/v1/plan/{uuid.uuid4()}/email", json={"email": "x@x.com"})
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B12: POST /plan/{id}/email — success (SMTP skipped, no smtp_host)
# ---------------------------------------------------------------------------
def test_api_email_plan_no_smtp(db: Session, trek_page, monkeypatch):
    monkeypatch.setattr("app.modules.agents.trip_planner.agent.settings.anthropic_api_key", None)
    create_res = client.post("/api/v1/plan/generate", json={"session_id": "sess-email", "duration_days": 3})
    plan_id = create_res.json()["id"]
    monkeypatch.setattr("app.modules.plan.service.settings.smtp_host", None)
    res = client.post(f"/api/v1/plan/{plan_id}/email", json={"email": "user@test.com"})
    assert res.status_code == 200
    assert "email" in res.json()["message"].lower()


# ---------------------------------------------------------------------------
# TC-B13: Gear list parsed from CMS packing section
# ---------------------------------------------------------------------------
def test_gear_parsed_from_cms(db: Session, trek_page, monkeypatch):
    monkeypatch.setattr("app.modules.agents.trip_planner.agent.settings.anthropic_api_key", None)
    result = run_trip_planner(db, region=None, duration_days=5, experience="beginner", month=None, budget_inr=None, group_size=None)
    gear = result["output"].get("gear_essentials", [])
    assert len(gear) > 0
