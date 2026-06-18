"""Tests for Step 73 — TrekSage conversational chat agent and API routes."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db, SessionLocal
from app.modules.cms.models import CMSPage
from app.modules.trek_intelligence.models import TreksageChatSession, TreksageChatMessage
from app.modules.trek_intelligence import treksage_agent

client = TestClient(app, raise_server_exceptions=True)


@pytest.fixture()
def db():
    gen = get_db()
    session = next(gen)
    try:
        yield session
    finally:
        session.execute(delete(TreksageChatMessage))
        session.execute(delete(TreksageChatSession))
        session.commit()
        session.rollback()
        try:
            next(gen)
        except StopIteration:
            pass


def _make_text_response(text: str) -> MagicMock:
    block = MagicMock()
    block.type = "text"
    block.text = text
    response = MagicMock()
    response.content = [block]
    return response


# ---------------------------------------------------------------------------
# TC-B34: get_or_create_session — creates new session when no key given
# ---------------------------------------------------------------------------
def test_get_or_create_session_creates_new(db: Session):
    session = treksage_agent.get_or_create_session(db, None)
    assert session.session_key
    assert len(session.session_key) > 10
    assert session.id is not None


# ---------------------------------------------------------------------------
# TC-B35: get_or_create_session — returns existing session by key
# ---------------------------------------------------------------------------
def test_get_or_create_session_returns_existing(db: Session):
    first = treksage_agent.get_or_create_session(db, None)
    second = treksage_agent.get_or_create_session(db, first.session_key)
    assert second.id == first.id


# ---------------------------------------------------------------------------
# TC-B36: chat() — planning question dispatches recommend_treks tool call
# ---------------------------------------------------------------------------
def test_chat_tool_call_recommend_treks(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.treksage_agent.settings.anthropic_api_key", "sk-test")

    session = treksage_agent.get_or_create_session(db, None)

    # First LLM response: tool_use block for recommend_treks
    tool_block = MagicMock()
    tool_block.type = "tool_use"
    tool_block.name = "recommend_treks"
    tool_block.id = "tool_1"
    tool_block.input = {"months": ["June"], "limit": 3}

    first_response = MagicMock()
    first_response.content = [tool_block]

    # Second LLM response: final text
    final_response = _make_text_response("Here are 3 treks perfect for June!")

    mock_client = MagicMock()
    mock_client.messages.create.side_effect = [first_response, final_response]

    with patch("app.modules.trek_intelligence.treksage_agent.get_anthropic_client", return_value=mock_client):
        with patch("app.modules.trek_intelligence.treksage_agent._call_tool", return_value=[{"slug": "t1", "name": "Trek 1"}]):
            result = treksage_agent.chat(db, session, "Suggest treks for June")

    assert "June" in result["reply"] or "treks" in result["reply"].lower()
    assert result["session_key"] == session.session_key
    # LLM was called twice: tool dispatch + final reply
    assert mock_client.messages.create.call_count == 2


# ---------------------------------------------------------------------------
# TC-B37: chat() — max tool rounds enforced (loop stops at MAX_TOOL_ROUNDS)
# ---------------------------------------------------------------------------
def test_chat_tool_rounds_capped(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.treksage_agent.settings.anthropic_api_key", "sk-test")

    session = treksage_agent.get_or_create_session(db, None)

    # LLM always returns a tool_use block (infinite-tool scenario)
    def make_tool_response():
        block = MagicMock()
        block.type = "tool_use"
        block.name = "search_treks"
        block.id = str(uuid.uuid4())
        block.input = {"query": "himalaya"}
        resp = MagicMock()
        resp.content = [block]
        return resp

    # On the final (MAX_TOOL_ROUNDS) call, still returns tool_use — agent must stop.
    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = "Fallback answer."
    final_resp = MagicMock()
    final_resp.content = [text_block]

    responses = [make_tool_response() for _ in range(treksage_agent.MAX_TOOL_ROUNDS)] + [final_resp]
    mock_client = MagicMock()
    mock_client.messages.create.side_effect = responses

    with patch("app.modules.trek_intelligence.treksage_agent.get_anthropic_client", return_value=mock_client):
        with patch("app.modules.trek_intelligence.treksage_agent._call_tool", return_value=[]):
            result = treksage_agent.chat(db, session, "Find me a trek")

    assert isinstance(result["reply"], str)
    assert mock_client.messages.create.call_count == treksage_agent.MAX_TOOL_ROUNDS + 1


# ---------------------------------------------------------------------------
# TC-B38: GET /treksage/chat/{session_key}/history — returns messages in order
# ---------------------------------------------------------------------------
def test_treksage_history_endpoint(db: Session):
    session = treksage_agent.get_or_create_session(db, None)
    treksage_agent._persist_messages(db, session, "Hello", "Hi! How can I help?")

    res = client.get(f"/api/v1/treksage/chat/{session.session_key}/history")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["role"] == "user"
    assert data[0]["content"] == "Hello"
    assert data[1]["role"] == "assistant"


# ---------------------------------------------------------------------------
# TC-B39: GET /treksage/chat/{session_key}/history — 404 for unknown key
# ---------------------------------------------------------------------------
def test_treksage_history_not_found():
    res = client.get("/api/v1/treksage/chat/does-not-exist/history")
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B40: POST /treksage/chat — creates session + returns reply
# ---------------------------------------------------------------------------
def test_treksage_chat_endpoint_creates_session(db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.trek_intelligence.treksage_agent.settings.anthropic_api_key", "sk-test")

    with patch("app.modules.trek_intelligence.treksage_agent.get_anthropic_client") as mock_factory:
        mock_factory.return_value.messages.create.return_value = _make_text_response("Great question about Himalayan treks!")
        res = client.post("/api/v1/treksage/chat", json={"message": "What treks can I do in June?"})

    assert res.status_code == 200
    data = res.json()
    assert data["session_key"]
    assert data["reply"]

    # Second call with same session_key returns history on the history endpoint.
    hist_res = client.get(f"/api/v1/treksage/chat/{data['session_key']}/history")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert any(h["content"] == "What treks can I do in June?" for h in hist)


# ---------------------------------------------------------------------------
# TC-B41: search_treks — keyword tokenization finds trek by single keyword
# ---------------------------------------------------------------------------
def test_search_treks_keyword_match():
    """search_treks must match on any meaningful keyword, not the full phrase.

    Uses a UUID-based trek_state to guarantee the test page is the only result
    returned by the initial SQL fetch (search_treks caps DB fetch at 200 rows,
    and the test DB may have thousands of accumulated trek_guide pages).
    """
    from app.modules.trek_intelligence.service import search_treks

    unique_state = f"teststate-{uuid.uuid4().hex}"
    with SessionLocal() as db:
        page = CMSPage(
            id=uuid.uuid4(),
            slug=f"snowfall-test-{uuid.uuid4().hex[:6]}",
            page_type="trek_guide",
            status="published",
            title="Kedarkantha Trek",
            trek_name="Kedarkantha",
            seo_description="Famous for stunning snowfall views and snow-covered meadows in winter.",
            trek_state=unique_state,
            trek_difficulty="easy",
        )
        db.add(page)
        db.commit()
        try:
            results = search_treks(db, query="best snowfall treks in December", state=unique_state)
            slugs = [r.slug for r in results]
            assert page.slug in slugs, f"Expected {page.slug} in {slugs}"
        finally:
            from sqlalchemy import delete as sa_delete
            db.execute(sa_delete(CMSPage).where(CMSPage.id == page.id))
            db.commit()


# ---------------------------------------------------------------------------
# TC-B42: search_treks — stop-word-only query falls back to phrase match
# ---------------------------------------------------------------------------
def test_search_treks_all_stop_words():
    """When all tokens are stop words, exact phrase matching still works."""
    from app.modules.trek_intelligence.service import search_treks

    unique_state = f"teststate-{uuid.uuid4().hex}"
    with SessionLocal() as db:
        page = CMSPage(
            id=uuid.uuid4(),
            slug=f"stopword-test-{uuid.uuid4().hex[:6]}",
            page_type="trek_guide",
            status="published",
            title="Any Trek",
            trek_name="Any Trek",
            seo_description="A good great trek for all.",
            trek_state=unique_state,
        )
        db.add(page)
        db.commit()
        try:
            results = search_treks(db, query="a good great trek for all", state=unique_state)
            slugs = [r.slug for r in results]
            assert page.slug in slugs, f"Expected {page.slug} in {slugs}"
        finally:
            from sqlalchemy import delete as sa_delete
            db.execute(sa_delete(CMSPage).where(CMSPage.id == page.id))
            db.commit()


# ---------------------------------------------------------------------------
# TC-B43: search_treks — keyword match via structured month names
# ---------------------------------------------------------------------------
def test_search_treks_month_name_from_best_months():
    """search_treks expands best_months int list to month names in haystack."""
    from app.modules.trek_intelligence.service import search_treks

    unique_state = f"teststate-{uuid.uuid4().hex}"
    with SessionLocal() as db:
        page = CMSPage(
            id=uuid.uuid4(),
            slug=f"month-test-{uuid.uuid4().hex[:6]}",
            page_type="trek_guide",
            status="published",
            title="Chopta Trek",
            trek_name="Chopta Tungnath",
            seo_description="A beautiful Bugyals trek.",
            trek_state=unique_state,
            trek_best_months=[11, 12, 1, 2],
        )
        db.add(page)
        db.commit()
        try:
            results = search_treks(db, query="december treks", state=unique_state)
            slugs = [r.slug for r in results]
            assert page.slug in slugs, f"Expected {page.slug} in {slugs}"
        finally:
            from sqlalchemy import delete as sa_delete
            db.execute(sa_delete(CMSPage).where(CMSPage.id == page.id))
            db.commit()


# ---------------------------------------------------------------------------
# TC-B44: _MONTH_ORD — full month names map correctly
# ---------------------------------------------------------------------------
def test_month_ord_full_names():
    """_MONTH_ORD must resolve full month names so recommend_treks scores correctly."""
    from app.modules.trek_intelligence.matching import _MONTH_ORD

    assert _MONTH_ORD.get("December") == 12, "December must resolve to 12"
    assert _MONTH_ORD.get("January") == 1
    assert _MONTH_ORD.get("June") == 6
    assert _MONTH_ORD.get("September") == 9


# ---------------------------------------------------------------------------
# TC-B45: get_site_info tool — slug-based page fetch
# TC-B46: get_site_info tool — unknown topic returns error
# TC-B47: get_site_info tool — alias resolution (privacy_policy → privacy)
# ---------------------------------------------------------------------------

def test_get_site_info_slug_page():
    """get_site_info returns title + content for a published slug-based page."""
    from app.modules.trek_intelligence.treksage_agent import _call_get_site_info

    unique_slug = f"about-test-{uuid.uuid4().hex[:6]}"
    with SessionLocal() as db:
        page = CMSPage(
            id=uuid.uuid4(),
            slug=unique_slug,
            page_type="about",
            status="published",
            title="About TrekYatra",
            content_html="<p>TrekYatra is India's editorial trekking guide.</p>",
        )
        db.add(page)
        db.commit()
        # Temporarily monkeypatch the slug map so we don't need the real "about" slug
        from app.modules.trek_intelligence import treksage_agent as ta
        original_map = ta._SITE_INFO_MAP.copy()
        ta._SITE_INFO_MAP["about"] = {"slug": unique_slug}
        try:
            result = _call_get_site_info(db, "about")
            assert result.get("title") == "About TrekYatra"
            assert "TrekYatra" in result.get("content", "")
            assert "url" in result
        finally:
            ta._SITE_INFO_MAP.clear()
            ta._SITE_INFO_MAP.update(original_map)
            db.execute(delete(CMSPage).where(CMSPage.id == page.id))
            db.commit()


def test_get_site_info_unknown_topic_returns_error():
    """get_site_info returns a descriptive error for unrecognised topics."""
    from app.modules.trek_intelligence.treksage_agent import _call_get_site_info

    with SessionLocal() as db:
        result = _call_get_site_info(db, "weather_forecast")
        assert "error" in result
        assert "weather_forecast" in result["error"]


def test_get_site_info_alias_resolution():
    """privacy_policy alias resolves to the privacy config entry."""
    from app.modules.trek_intelligence.treksage_agent import _call_get_site_info
    from app.modules.trek_intelligence import treksage_agent as ta

    unique_slug = f"privacy-test-{uuid.uuid4().hex[:6]}"
    with SessionLocal() as db:
        page = CMSPage(
            id=uuid.uuid4(),
            slug=unique_slug,
            page_type="editorial",
            status="published",
            title="Privacy Policy",
            content_html="<p>We value your privacy.</p>",
        )
        db.add(page)
        db.commit()
        original_map = ta._SITE_INFO_MAP.copy()
        ta._SITE_INFO_MAP["privacy"] = {"slug": unique_slug}
        try:
            result = _call_get_site_info(db, "privacy_policy")
            assert result.get("title") == "Privacy Policy"
        finally:
            ta._SITE_INFO_MAP.clear()
            ta._SITE_INFO_MAP.update(original_map)
            db.execute(delete(CMSPage).where(CMSPage.id == page.id))
            db.commit()


# ---------------------------------------------------------------------------
# TC-B48: _call_tool("recommend_treks") iterates response.recommendations
#         correctly and does NOT access .trek (the old broken path)
# TC-B49: _slim_profile works on TrekRecommendation (getattr safety)
# ---------------------------------------------------------------------------

def test_call_tool_recommend_treks_iterates_recommendations(db: Session):
    """_call_tool('recommend_treks') returns a list of slim dicts, not an error."""
    from app.modules.trek_intelligence.treksage_agent import _call_tool
    from app.modules.trek_intelligence import service as ti_service
    from app.schemas.plan import PlanRecommendResponse, TrekRecommendation

    fake_rec = TrekRecommendation(
        slug="kedarkantha",
        name="Kedarkantha",
        match_score=82,
        category="best_match",
        why_this_matches="Kedarkantha is recommended because it fits your 5–7-day window.",
        state="Uttarakhand",
        difficulty="moderate",
        duration="6 days",
        season="Dec–Apr",
        hero_image_url="https://trekyatra.co.in/wp-content/uploads/kedarkantha.jpg",
        budget_min=8000,
        budget_max=15000,
    )
    fake_response = PlanRecommendResponse(
        recommendations=[fake_rec],
        total_treks_scored=10,
    )

    with patch.object(ti_service, "recommend_treks", return_value=fake_response):
        result = _call_tool(db, "recommend_treks", {"months": ["July"], "duration_min": 5, "duration_max": 7})

    assert isinstance(result, list), f"Expected list, got: {result}"
    assert len(result) == 1
    assert result[0]["slug"] == "kedarkantha"
    assert result[0]["name"] == "Kedarkantha"
    assert result[0]["hero_image_url"] == "https://trekyatra.co.in/wp-content/uploads/kedarkantha.jpg"
    assert result[0]["match_score"] == 82
    # Confirm the old broken path ("r.trek") is NOT what produces this
    assert "error" not in result[0]


def test_slim_profile_on_trek_recommendation():
    """_slim_profile handles TrekRecommendation objects without AttributeError."""
    from app.modules.trek_intelligence.treksage_agent import _slim_profile
    from app.schemas.plan import TrekRecommendation

    rec = TrekRecommendation(
        slug="brahmatal",
        name="Brahmatal Trek",
        match_score=75,
        category="best_match",
        why_this_matches="Good fit.",
        state="Uttarakhand",
        difficulty="easy",
        hero_image_url=None,
    )
    result = _slim_profile(rec)
    assert result["slug"] == "brahmatal"
    assert result["name"] == "Brahmatal Trek"
    assert result["hero_image_url"] is None
    # Fields absent on TrekRecommendation must default to None, not raise
    assert result["beginner_friendly"] is None
    assert result["solo_friendly"] is None
    assert result["max_altitude_ft"] is None
    assert result["match_score"] == 75
