"""Tests for Step 73 — TrekSage conversational chat agent and API routes."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
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
