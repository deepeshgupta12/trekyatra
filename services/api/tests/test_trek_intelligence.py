"""Tests for Step 72 — TrekSage trek intelligence (matching, compare, Q&A, leads, logging)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.modules.cms.models import CMSPage
from app.modules.trek_intelligence import service as ti_service
from app.modules.trek_intelligence.models import AIInteractionLog
from app.schemas.plan import PlanRecommendRequest

client = TestClient(app, raise_server_exceptions=True)


@pytest.fixture()
def db():
    gen = get_db()
    session = next(gen)
    pre_ids = list(r[0] for r in session.execute(select(CMSPage.id)).all())
    try:
        yield session
    finally:
        session.execute(delete(CMSPage).where(CMSPage.id.not_in(pre_ids)) if pre_ids else delete(CMSPage))
        session.commit()
        session.rollback()
        try:
            next(gen)
        except StopIteration:
            pass


def _make_page(db: Session, **overrides) -> CMSPage:
    defaults = dict(
        slug=f"trek-{uuid.uuid4().hex[:8]}",
        page_type="trek_guide",
        title="Test Trek Guide",
        content_html="<h1>Test</h1>",
        status="published",
        language="en",
        trek_name="Test Trek",
        trek_state="Uttarakhand",
        trek_difficulty="moderate",
        trek_duration="6 days",
        trek_season="Dec – Apr",
    )
    defaults.update(overrides)
    page = CMSPage(**defaults)
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


def _hide_other_trek_guides(db: Session) -> list:
    """Temporarily un-publish existing trek_guide pages so bulk operations only see test pages."""
    ids = [r[0] for r in db.execute(
        select(CMSPage.id).where(CMSPage.page_type == "trek_guide", CMSPage.status == "published")
    ).all()]
    if ids:
        db.execute(update(CMSPage).where(CMSPage.id.in_(ids)).values(status="draft"))
        db.commit()
    return ids


def _restore_trek_guides(db: Session, ids: list) -> None:
    if ids:
        db.execute(update(CMSPage).where(CMSPage.id.in_(ids)).values(status="published"))
        db.commit()


# ---------------------------------------------------------------------------
# TC-B01: recommend_treks excludes treks marked trek_is_unsafe_closed
# ---------------------------------------------------------------------------
def test_recommend_excludes_unsafe_closed(db: Session):
    good = _make_page(db, trek_name="Safe Trek")
    _make_page(db, trek_name="Closed Trek", trek_is_unsafe_closed=True)

    req = PlanRecommendRequest(months=["Dec"], duration_min=1, duration_max=10)
    resp = ti_service.recommend_treks(db, req)

    slugs = [r.slug for r in resp.recommendations]
    assert good.slug in slugs or resp.total_treks_scored >= 1
    assert all(r.name != "Closed Trek" for r in resp.recommendations)


# ---------------------------------------------------------------------------
# TC-B02: recommend_treks excludes a trek during its declared avoid-months
# ---------------------------------------------------------------------------
def test_recommend_excludes_avoid_month(db: Session):
    page = _make_page(db, trek_name="Monsoon-Closed Trek", trek_avoid_months=[7, 8])

    req = PlanRecommendRequest(months=["Jul"], duration_min=1, duration_max=10)
    resp = ti_service.recommend_treks(db, req)

    assert all(r.slug != page.slug for r in resp.recommendations)


# ---------------------------------------------------------------------------
# TC-B03: recommend_treks budget scoring — within-budget trek scores higher
# ---------------------------------------------------------------------------
def test_recommend_budget_scoring(db: Session):
    from app.modules.trek_intelligence.matching import _budget_score

    cheap = _make_page(db, trek_name="Cheap Trek", trek_budget_min=5000, trek_budget_max=8000)
    pricey = _make_page(db, trek_name="Pricey Trek", trek_budget_min=50000, trek_budget_max=70000)

    assert _budget_score(cheap, 4000, 10000) == 1.0
    assert _budget_score(pricey, 4000, 10000) == 0.0
    assert _budget_score(cheap, 4000, 10000) > _budget_score(pricey, 4000, 10000)


# ---------------------------------------------------------------------------
# TC-B04: compare_treks — 2 valid slugs returns rows + treks
# ---------------------------------------------------------------------------
def test_compare_treks_two_valid(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", None)
    a = _make_page(db, trek_name="Trek A", trek_budget_min=8000, trek_budget_max=12000)
    b = _make_page(db, trek_name="Trek B", trek_budget_min=15000, trek_budget_max=20000)

    result = ti_service.compare_treks(db, [a.slug, b.slug])
    assert len(result.treks) == 2
    assert len(result.rows) > 0
    assert result.ai_summary is None  # no API key -> skip LLM


# ---------------------------------------------------------------------------
# TC-B05: compare_treks — invalid slug raises ValueError
# ---------------------------------------------------------------------------
def test_compare_treks_invalid_slug(db: Session):
    a = _make_page(db, trek_name="Trek A")
    with pytest.raises(ValueError):
        ti_service.compare_treks(db, [a.slug, "does-not-exist"])


# ---------------------------------------------------------------------------
# TC-B06: POST /treks/compare — 3 treks via API
# ---------------------------------------------------------------------------
def test_api_compare_treks(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", None)
    a = _make_page(db, trek_name="Trek A")
    b = _make_page(db, trek_name="Trek B")
    c = _make_page(db, trek_name="Trek C")

    res = client.post("/api/v1/treks/compare", json={"slugs": [a.slug, b.slug, c.slug]})
    assert res.status_code == 200
    data = res.json()
    assert len(data["treks"]) == 3


# ---------------------------------------------------------------------------
# TC-B07: POST /treks/compare — invalid slug -> 404
# ---------------------------------------------------------------------------
def test_api_compare_treks_404(db: Session):
    a = _make_page(db, trek_name="Trek A")
    res = client.post("/api/v1/treks/compare", json={"slugs": [a.slug, "nope-not-real"]})
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B08: ask_trek_question — missing-data field returns "not verified" disclaimer (zero LLM cost)
# ---------------------------------------------------------------------------
def test_ask_trek_question_missing_data_disclaimer(db: Session, monkeypatch):
    page = _make_page(db, trek_name="Trek With No Permit Info", trek_data_confidence={"permit_required": "missing"})

    mock_client = MagicMock()
    with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
        result = ti_service.ask_trek_question(db, page.slug, "Do I need a permit for this trek?")

    assert result.not_verified is True
    mock_client.messages.create.assert_not_called()


# ---------------------------------------------------------------------------
# TC-B09: ask_trek_question — cold call hits LLM (mocked) and caches result
# ---------------------------------------------------------------------------
def test_ask_trek_question_cold_then_cached(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", "sk-test")
    page = _make_page(db, trek_name="Trek With Crowd Info", trek_crowd_level="low")

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="It's a quiet trail, great for solo hikers.")]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
        first = ti_service.ask_trek_question(db, page.slug, "How crowded is this trek?")
        assert first.cached is False
        assert "quiet" in first.answer

        second = ti_service.ask_trek_question(db, page.slug, "How crowded is this trek?")
        assert second.cached is True
        assert second.answer == first.answer

    # LLM should only have been called once (second hit cache)
    assert mock_client.messages.create.call_count == 1


# ---------------------------------------------------------------------------
# TC-B10: ask_trek_question — unknown slug raises ValueError
# ---------------------------------------------------------------------------
def test_ask_trek_question_unknown_slug(db: Session):
    with pytest.raises(ValueError):
        ti_service.ask_trek_question(db, "does-not-exist", "Is this trek open in winter?")


# ---------------------------------------------------------------------------
# TC-B11: POST /leads/operator-help — consent required, else 422
# ---------------------------------------------------------------------------
def test_operator_help_lead_requires_consent(db: Session):
    res = client.post("/api/v1/leads/operator-help", json={
        "name": "Test User",
        "email": "test@example.com",
        "trek_interest": "Kedarkantha",
        "consent": False,
        "source_page": "/plan",
    })
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# TC-B12: POST /leads/operator-help — happy path with consent
# ---------------------------------------------------------------------------
def test_operator_help_lead_with_consent(db: Session, monkeypatch):
    from app.modules.leads import tasks as leads_tasks
    monkeypatch.setattr(leads_tasks.notify_admin_new_lead_task, "delay", lambda *a, **k: None)

    res = client.post("/api/v1/leads/operator-help", json={
        "name": "Test User",
        "email": "test2@example.com",
        "trek_interest": "Kedarkantha",
        "consent": True,
        "source_page": "/plan",
        "travel_month": "December",
        "traveller_count": 2,
        "city": "Delhi",
        "budget_preference": "mid-range",
        "transport_required": True,
    })
    assert res.status_code == 201
    data = res.json()
    assert data["details_json"]["travel_month"] == "December"
    assert data["status"] == "new"


# ---------------------------------------------------------------------------
# TC-B13: log_ai_interaction never raises, even on bad db state
# ---------------------------------------------------------------------------
def test_log_ai_interaction_never_raises(db: Session):
    ti_service.log_ai_interaction(
        db,
        source="web",
        tool_name="search_treks",
        query_summary="beginner treks in Uttarakhand",
        result_summary="3 results",
        trek_slugs=["kedarkantha-trek-guide"],
    )  # should not raise


# ---------------------------------------------------------------------------
# TC-B14: POST /ai/log — API smoke test
# ---------------------------------------------------------------------------
def test_api_ai_log(db: Session):
    res = client.post("/api/v1/ai/log", json={
        "source": "mobile",
        "tool_name": "ask_trek_question",
        "query_summary": "is this beginner friendly?",
    })
    assert res.status_code == 202
    assert res.json()["status"] == "logged"


# ---------------------------------------------------------------------------
# TC-B15: GET /treks/{slug}/profile — full structured profile
# ---------------------------------------------------------------------------
def test_api_trek_profile(db: Session):
    page = _make_page(db, trek_name="Profile Trek", trek_budget_min=9000, trek_budget_max=15000)
    res = client.get(f"/api/v1/treks/{page.slug}/profile")
    assert res.status_code == 200
    data = res.json()
    assert data["slug"] == page.slug
    assert data["budget_min"] == 9000


# ---------------------------------------------------------------------------
# TC-B16: GET /treks/{slug}/profile — 404 for unknown slug
# ---------------------------------------------------------------------------
def test_api_trek_profile_404():
    res = client.get("/api/v1/treks/does-not-exist/profile")
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B17: GET /admin/treks/data-quality — verified/draft/missing counts
# ---------------------------------------------------------------------------
def test_admin_data_quality(db: Session):
    page = _make_page(
        db,
        trek_name="Quality Trek",
        trek_region="Garhwal",
        trek_budget_min=10000,
        trek_data_confidence={"trek_region": "verified", "trek_budget_min": "draft"},
    )

    res = client.get("/api/v1/admin/treks/data-quality")
    assert res.status_code == 200
    rows = {row["slug"]: row for row in res.json()}
    assert page.slug in rows
    row = rows[page.slug]
    assert row["verified_count"] == 1
    assert row["draft_count"] == 1
    assert row["missing_count"] == len(ti_service._BACKFILL_FIELDS) - 2
    assert row["is_unsafe_closed"] is False


# ---------------------------------------------------------------------------
# TC-B18: PATCH /admin/treks/{slug}/meta — updates fields, marks them verified
# ---------------------------------------------------------------------------
def test_admin_patch_trek_meta(db: Session):
    page = _make_page(db, trek_name="Editable Trek")

    res = client.patch(f"/api/v1/admin/treks/{page.slug}/meta", json={
        "trek_region": "Kumaon",
        "trek_budget_min": 7000,
        "trek_budget_max": 12000,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["region"] == "Kumaon"
    assert data["budget_min"] == 7000
    assert data["data_confidence"]["trek_region"] == "verified"
    assert data["data_confidence"]["trek_budget_min"] == "verified"
    assert data["last_verified_at"] is not None


# ---------------------------------------------------------------------------
# TC-B19: PATCH /admin/treks/{slug}/meta — 404 for unknown slug
# ---------------------------------------------------------------------------
def test_admin_patch_trek_meta_404(db: Session):
    res = client.patch("/api/v1/admin/treks/does-not-exist/meta", json={"trek_region": "Kumaon"})
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B20: POST /admin/treks/{slug}/backfill — queues the Celery task
# ---------------------------------------------------------------------------
def test_admin_trigger_backfill(db: Session):
    page = _make_page(db, trek_name="Backfill Trek")

    with patch("app.worker.tasks.trek_intelligence_tasks.backfill_trek_meta_task.apply_async") as mock_apply:
        res = client.post(f"/api/v1/admin/treks/{page.slug}/backfill")

    assert res.status_code == 200
    assert res.json() == {"slug": page.slug, "status": "queued"}
    mock_apply.assert_called_once_with(args=[page.slug])


# ---------------------------------------------------------------------------
# TC-B21: POST /admin/treks/{slug}/backfill — 404 for unknown slug
# ---------------------------------------------------------------------------
def test_admin_trigger_backfill_404(db: Session):
    res = client.post("/api/v1/admin/treks/does-not-exist/backfill")
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B22: GET /admin/treks/ai-logs — recent AI/MCP interaction logs
# ---------------------------------------------------------------------------
def test_admin_ai_logs(db: Session):
    log = AIInteractionLog(
        source="mobile",
        tool_name="ask_trek_question",
        query_summary="is this beginner friendly?",
        result_summary="Yes, beginner friendly.",
        page_url=None,
        session_id=None,
        trek_slugs=["test-slug"],
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        res = client.get("/api/v1/admin/treks/ai-logs")
        assert res.status_code == 200
        data = res.json()
        assert any(entry["id"] == str(log.id) for entry in data)
        entry = next(e for e in data if e["id"] == str(log.id))
        assert entry["source"] == "mobile"
        assert entry["tool_name"] == "ask_trek_question"
        assert entry["trek_slugs"] == ["test-slug"]
    finally:
        db.execute(delete(AIInteractionLog).where(AIInteractionLog.id == log.id))
        db.commit()


# ---------------------------------------------------------------------------
# TC-B23: backfill_all_trek_meta — skips fully-verified treks, processes the rest
# ---------------------------------------------------------------------------
def test_backfill_all_trek_meta_skips_verified(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", "sk-test")

    hidden_ids = _hide_other_trek_guides(db)
    try:
        verified_confidence = {field: "verified" for field in ti_service._BACKFILL_FIELDS}
        verified_page = _make_page(db, trek_name="Fully Verified Trek", trek_data_confidence=verified_confidence)
        draft_page = _make_page(db, trek_name="Needs Backfill Trek")

        drafted = {field: None for field in ti_service._BACKFILL_FIELDS}
        drafted["trek_region"] = "Ladakh"
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=__import__("json").dumps(drafted))]
        mock_client = MagicMock()
        mock_client.messages.create.return_value = mock_response

        with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
            result = ti_service.backfill_all_trek_meta(db)

        assert verified_page.slug in result["skipped"]
        assert draft_page.slug in result["processed"]
        assert result["failed"] == []
        # Only the non-verified trek should have triggered an LLM call.
        assert mock_client.messages.create.call_count == 1
    finally:
        _restore_trek_guides(db, hidden_ids)


# ---------------------------------------------------------------------------
# TC-B24: backfill_all_trek_meta — never overwrites verified fields, aggregates per-trek failures
# ---------------------------------------------------------------------------
def test_backfill_all_trek_meta_never_overwrites_verified_and_aggregates_failures(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", "sk-test")

    hidden_ids = _hide_other_trek_guides(db)
    try:
        page = _make_page(
            db,
            trek_name="Partially Verified Trek",
            trek_region="Garhwal",
            trek_data_confidence={"trek_region": "verified"},
        )

        drafted = {field: None for field in ti_service._BACKFILL_FIELDS}
        drafted["trek_region"] = "Should Not Overwrite"
        drafted["trek_max_altitude_ft"] = 14500
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=__import__("json").dumps(drafted))]
        mock_client = MagicMock()
        mock_client.messages.create.return_value = mock_response

        with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
            result = ti_service.backfill_all_trek_meta(db)

        assert page.slug in result["processed"]
        db.refresh(page)
        assert page.trek_region == "Garhwal"  # verified field untouched
        assert page.trek_max_altitude_ft == 14500  # missing field drafted

        # Now simulate a failure on a second trek (no API key) without aborting the batch.
        monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", None)
        failing_page = _make_page(db, trek_name="Failing Trek")

        with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
            result2 = ti_service.backfill_all_trek_meta(db)

        failed_slugs = [f["slug"] for f in result2["failed"]]
        assert failing_page.slug in failed_slugs
        # The already-processed trek (no remaining unverified fields besides region) is processed again
        # without raising, since failures are isolated per-trek.
        assert isinstance(result2["processed"], list)
    finally:
        _restore_trek_guides(db, hidden_ids)


# ---------------------------------------------------------------------------
# TC-B25: POST /admin/treks/backfill-all — queues the bulk Celery task
# ---------------------------------------------------------------------------
def test_admin_trigger_backfill_all(db: Session):
    _make_page(db, trek_name="Bulk Backfill Trek A")
    _make_page(db, trek_name="Bulk Backfill Trek B")

    with patch("app.worker.tasks.trek_intelligence_tasks.backfill_all_trek_meta_task.apply_async") as mock_apply:
        res = client.post("/api/v1/admin/treks/backfill-all")

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "queued"
    assert data["trek_count"] >= 2
    mock_apply.assert_called_once_with()


# ---------------------------------------------------------------------------
# TC-B26: compare summary prompt includes permit/themes/solo/suitability/months facts
# ---------------------------------------------------------------------------
def test_compare_summary_includes_extended_facts(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", "sk-test")

    a = _make_page(
        db,
        trek_name="Trek With Rich Meta",
        trek_permit_required=True,
        trek_permit_notes="Inner Line Permit required for non-locals",
        trek_themes=["wildlife", "high-altitude"],
        trek_solo_friendly=True,
        trek_best_months=[5, 6],
        trek_avoid_months=[12, 1],
    )
    b = _make_page(db, trek_name="Trek B")

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Trade-off summary.")]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
        result = ti_service.compare_treks(db, [a.slug, b.slug])

    assert result.ai_summary == "Trade-off summary."
    prompt_input = mock_client.messages.create.call_args.kwargs["messages"][0]["content"]
    assert "permit_required=True" in prompt_input
    assert "Inner Line Permit" in prompt_input
    assert "themes=['wildlife', 'high-altitude']" in prompt_input
    assert "solo_friendly=True" in prompt_input
    assert "best_months=[5, 6]" in prompt_input
    assert "avoid_months=[12, 1]" in prompt_input
    assert "suitability=" in prompt_input


# ---------------------------------------------------------------------------
# TC-B27: compare summary cache is keyed by _SUMMARY_PROMPT_VERSION (old caches invalidated)
# ---------------------------------------------------------------------------
def test_compare_summary_cache_busted_by_prompt_version(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", "sk-test")

    a = _make_page(db, trek_name="Cache Bust Trek A")
    b = _make_page(db, trek_name="Cache Bust Trek B")

    # Simulate a stale cache entry written under the old (pre-v2) key.
    sorted_slugs = sorted([a.slug, b.slug])
    old_cache_key = "compare:" + __import__("hashlib").sha256("|".join(sorted_slugs).encode()).hexdigest()[:32]
    ti_service._cache_put(db, old_cache_key, "STALE SHALLOW SUMMARY", ti_service._HAIKU_MODEL)

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Fresh rich summary.")]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
        result = ti_service.compare_treks(db, [a.slug, b.slug])

    assert result.ai_summary == "Fresh rich summary."
    mock_client.messages.create.assert_called_once()


# ---------------------------------------------------------------------------
# TC-B28: ask_trek_question — packing question with CMS section calls LLM grounded on section
# ---------------------------------------------------------------------------
def test_ask_trek_question_grounds_in_cms_section(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", "sk-test")

    content_json = {
        "sections": {
            "packing": "<ul><li>Layered clothing</li><li>Crampons for ice</li><li>Rain poncho</li></ul>"
        }
    }
    # No structured packing fields, but CMS packing section exists.
    page = _make_page(
        db,
        trek_name="Packing Trek",
        trek_data_confidence={"trek_themes": "missing"},
        content_json=content_json,
    )

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Bring layered clothing and crampons for ice.")]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
        result = ti_service.ask_trek_question(db, page.slug, "What should I pack for this trek?")

    assert result.not_verified is False
    assert "layered clothing" in result.answer.lower() or mock_client.messages.create.called
    # The CMS section text must be included in the prompt.
    call_args = mock_client.messages.create.call_args
    user_msg = call_args.kwargs["messages"][0]["content"]
    assert "Layered clothing" in user_msg or "crampons" in user_msg.lower()
    assert "CMS SECTION CONTENT" in user_msg


# ---------------------------------------------------------------------------
# TC-B29: ask_trek_question — topic with no structured fields AND no CMS section → not_verified
# ---------------------------------------------------------------------------
def test_ask_trek_question_no_section_match_returns_not_verified(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", "sk-test")

    page = _make_page(
        db,
        trek_name="Sparse Trek",
        trek_data_confidence={"permit_required": "missing"},
    )

    mock_client = MagicMock()
    with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
        result = ti_service.ask_trek_question(db, page.slug, "Do I need a permit for this trek?")

    assert result.not_verified is True
    mock_client.messages.create.assert_not_called()


# ---------------------------------------------------------------------------
# TC-B30: ask_trek_question with history bypasses cache and includes prior turns in prompt
# ---------------------------------------------------------------------------
def test_ask_trek_question_history_bypasses_cache_and_includes_turns(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", "sk-test")
    page = _make_page(db, trek_name="History Trek", trek_crowd_level="moderate")

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Follow-up answer.")]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    from app.schemas.trek_intelligence import ChatTurn
    history_turns = [
        ChatTurn(role="user", content="How crowded is this trek?"),
        ChatTurn(role="assistant", content="It has moderate crowd levels."),
    ]

    with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
        result = ti_service.ask_trek_question(db, page.slug, "What does that mean for a solo trekker?", history=history_turns)

    assert result.not_verified is False
    assert result.cached is False
    call_args = mock_client.messages.create.call_args
    messages_sent = call_args.kwargs["messages"]
    assert len(messages_sent) == 3  # 2 history + 1 current question
    assert messages_sent[0]["role"] == "user"
    assert "How crowded" in messages_sent[0]["content"]
    assert messages_sent[1]["role"] == "assistant"
    assert messages_sent[2]["role"] == "user"
    assert "solo trekker" in messages_sent[2]["content"]


# ---------------------------------------------------------------------------
# TC-B31: ask_trek_question without history still hits cache on second identical call
# ---------------------------------------------------------------------------
def test_ask_trek_question_no_history_uses_cache(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.service.settings.anthropic_api_key", "sk-test")
    page = _make_page(db, trek_name="Cache Crowd Trek", trek_crowd_level="low")

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Very quiet trail.")]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    with patch("app.modules.trek_intelligence.service.get_anthropic_client", return_value=mock_client):
        first = ti_service.ask_trek_question(db, page.slug, "How crowded is this trek?")
        second = ti_service.ask_trek_question(db, page.slug, "How crowded is this trek?")

    assert first.cached is False
    assert second.cached is True
    assert mock_client.messages.create.call_count == 1  # LLM called once; second from cache


# ---------------------------------------------------------------------------
# TC-B32: page_to_profile includes content_sections keyed by CMS section IDs
# ---------------------------------------------------------------------------
def test_page_to_profile_includes_content_sections(db: Session):
    content_json = {
        "sections": {
            "packing": "<ul><li>Rain jacket</li><li>Trekking poles</li></ul>",
            "itinerary": "<p>Day 1: Drive to base camp. Day 2: Summit.</p>",
        },
        "faqs": [
            {"question": "Is it hard?", "answer": "Moderate difficulty."},
        ],
    }
    page = _make_page(db, trek_name="Bible Trek", content_json=content_json)

    profile = ti_service.page_to_profile(page)

    assert "packing" in profile.content_sections
    assert "Rain jacket" in profile.content_sections["packing"]
    assert "<ul>" not in profile.content_sections["packing"]  # HTML stripped
    assert "itinerary" in profile.content_sections
    assert len(profile.faqs) == 1
    assert profile.faqs[0]["question"] == "Is it hard?"
    assert profile.faqs[0]["answer"] == "Moderate difficulty."


# ---------------------------------------------------------------------------
# TC-B33: GET /treks/{slug}/profile returns content_sections + faqs
# ---------------------------------------------------------------------------
def test_api_trek_profile_includes_bible_fields(db: Session):
    content_json = {
        "sections": {"safety": "<p>Watch for altitude sickness above 4000m.</p>"},
        "faqs": [{"question": "Safe for solo?", "answer": "Yes with guide."}],
    }
    page = _make_page(db, trek_name="Safety Trek", content_json=content_json)

    res = client.get(f"/api/v1/treks/{page.slug}/profile")
    assert res.status_code == 200
    data = res.json()
    assert "safety" in data["content_sections"]
    assert "altitude sickness" in data["content_sections"]["safety"]
    assert len(data["faqs"]) == 1
    assert data["faqs"][0]["question"] == "Safe for solo?"
