"""Tests for ContentBriefAgent + brief admin API endpoints (Step 14)."""
from __future__ import annotations

import json
import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.session import SessionLocal, get_db
from app.main import app
from app.modules.content.models import (
    BriefVersion,
    ContentBrief,
    ContentDraft,
    KeywordCluster,
    TopicOpportunity,
)
from app.modules.content import service as content_service
from app.schemas.content import BriefStatusPatch, ContentBriefCreate

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state() -> None:
    with SessionLocal() as db:
        db.execute(delete(BriefVersion))
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
        db.commit()
    yield
    with SessionLocal() as db:
        db.execute(delete(BriefVersion))
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
        db.commit()


# ── helpers ───────────────────────────────────────────────────────────────────

def _make_topic(db, keyword: str = "kedarkantha trek guide") -> TopicOpportunity:
    from app.schemas.content import TopicOpportunityCreate
    return content_service.create_topic(
        db,
        TopicOpportunityCreate(
            title=f"Topic {uuid.uuid4().hex[:6]}",
            slug=f"topic-{uuid.uuid4().hex[:8]}",
            primary_keyword=keyword,
            intent="informational",
            page_type="trek_guide",
            status="new",
        ),
    )


def _make_brief(db, status: str = "draft") -> ContentBrief:
    return content_service.create_brief(
        db,
        ContentBriefCreate(
            title=f"Brief {uuid.uuid4().hex[:6]}",
            slug=f"brief-{uuid.uuid4().hex[:8]}",
            target_keyword="kedarkantha trek guide",
            status=status,
        ),
    )


MOCK_BRIEF_JSON = {
    "page_objective": "Help trekkers plan the Kedarkantha trek",
    "audience": "beginner to intermediate trekkers",
    "target_keyword": "kedarkantha trek guide",
    "secondary_keywords": ["kedarkantha difficulty", "kedarkantha best time"],
    "heading_structure": [
        {"level": "H1", "text": "Kedarkantha Trek Complete Guide", "notes": "overview"},
        {"level": "H2", "text": "Overview", "notes": "quick summary"},
        {"level": "H2", "text": "Difficulty", "notes": "rating"},
        {"level": "H2", "text": "Best Time to Visit", "notes": "seasonal guide"},
        {"level": "H2", "text": "Permits & Costs", "notes": "permit details"},
    ],
    "faqs": [
        {"question": "Is Kedarkantha hard?", "answer_hint": "discuss difficulty level"},
        {"question": "When is the best time?", "answer_hint": "Dec-Feb for snow"},
        {"question": "How long is the trek?", "answer_hint": "6 days"},
        {"question": "What permits are needed?", "answer_hint": "forest permit"},
        {"question": "What is the altitude?", "answer_hint": "12,500 ft"},
    ],
    "key_entities": ["Kedarkantha", "Uttarakhand", "Uttarkashi"],
    "internal_link_targets": ["/treks/kedarkantha"],
    "schema_recommendations": ["Article", "FAQPage"],
    "monetization_slots": [
        {"location": "after packing H2", "type": "affiliate_card", "notes": "sleeping bag"}
    ],
    "freshness_interval_days": 180,
    "word_count_target": 2500,
    "editorial_brief_markdown": "# Kedarkantha Trek Complete Guide\n\nFull brief here.",
}


# ── ContentBriefAgent unit tests (mocked LLM) ─────────────────────────────────

def test_content_brief_agent_no_topic_id_returns_error():
    from app.modules.agents.content_brief.agent import ContentBriefAgent

    db = next(get_db())
    try:
        agent = ContentBriefAgent(db=db)
        result = agent.run({"target_keyword": "kedarkantha", "page_type": "trek_guide"}, run_id=0)
        assert result.get("errors")
    finally:
        db.close()


def test_content_brief_agent_invalid_topic_id_returns_error():
    from app.modules.agents.content_brief.agent import ContentBriefAgent

    db = next(get_db())
    try:
        agent = ContentBriefAgent(db=db)
        result = agent.run(
            {
                "topic_id": str(uuid.uuid4()),
                "target_keyword": "kedarkantha",
                "page_type": "trek_guide",
            },
            run_id=0,
        )
        assert result.get("errors")
        assert "not found" in result["errors"][0].lower()
    finally:
        db.close()


def test_content_brief_agent_with_mocked_llm_creates_brief():
    from app.modules.agents.content_brief.agent import ContentBriefAgent

    db = next(get_db())
    try:
        topic = _make_topic(db)

        mock_message = MagicMock()
        mock_message.content = [MagicMock(text=json.dumps(MOCK_BRIEF_JSON))]

        with (
            patch("anthropic.Anthropic") as mock_cls,
            patch("app.core.config.settings.anthropic_api_key", "sk-test"),
        ):
            mock_client = MagicMock()
            mock_cls.return_value = mock_client
            mock_client.messages.create.return_value = mock_message

            agent = ContentBriefAgent(db=db)
            result = agent.run(
                {"topic_id": str(topic.id), "target_keyword": "kedarkantha trek guide", "page_type": "trek_guide"},
                run_id=0,
            )

        assert not result.get("errors"), result.get("errors")
        assert "brief_id" in result.get("output", {})
        brief_id = uuid.UUID(result["output"]["brief_id"])

        brief = content_service.get_brief(db, brief_id)
        assert brief is not None
        assert brief.status == "review"
        assert brief.structured_brief is not None
        assert brief.word_count_target == 2500

        versions = content_service.list_brief_versions(db, brief_id)
        assert len(versions) == 1
        assert versions[0].version_number == 1
    finally:
        db.close()


# ── Brief status state machine tests ─────────────────────────────────────────

def test_update_brief_status_valid_transition():
    db = next(get_db())
    try:
        brief = _make_brief(db, status="review")
        updated = content_service.update_brief_status(db, brief.id, BriefStatusPatch(status="approved"))
        assert updated.status == "approved"
    finally:
        db.close()


def test_update_brief_status_invalid_transition_raises():
    db = next(get_db())
    try:
        brief = _make_brief(db, status="draft")
        with pytest.raises(ValueError, match="Cannot transition"):
            content_service.update_brief_status(db, brief.id, BriefStatusPatch(status="approved"))
    finally:
        db.close()


def test_update_brief_status_not_found_raises():
    db = next(get_db())
    try:
        with pytest.raises(ValueError, match="not found"):
            content_service.update_brief_status(db, uuid.uuid4(), BriefStatusPatch(status="review"))
    finally:
        db.close()


# ── Brief version tests ───────────────────────────────────────────────────────

def test_create_brief_version_increments_correctly():
    db = next(get_db())
    try:
        brief = _make_brief(db)
        v1 = content_service.create_brief_version(db, brief.id, {"v": 1})
        v2 = content_service.create_brief_version(db, brief.id, {"v": 2})
        assert v1.version_number == 1
        assert v2.version_number == 2
    finally:
        db.close()


# ── Admin API endpoint tests ──────────────────────────────────────────────────

def test_get_brief_detail_returns_structured_brief():
    db = next(get_db())
    try:
        brief = _make_brief(db)
        brief.structured_brief = MOCK_BRIEF_JSON
        db.commit()
        db.refresh(brief)
        brief_id = str(brief.id)
    finally:
        db.close()

    response = client.get(f"/api/v1/admin/briefs/{brief_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == brief_id
    assert data["structured_brief"] is not None


def test_get_brief_detail_not_found():
    response = client.get(f"/api/v1/admin/briefs/{uuid.uuid4()}")
    assert response.status_code == 404


def test_patch_brief_status_valid():
    db = next(get_db())
    try:
        brief = _make_brief(db, status="review")
        brief_id = str(brief.id)
    finally:
        db.close()

    response = client.patch(
        f"/api/v1/admin/briefs/{brief_id}/status",
        json={"status": "approved"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_patch_brief_status_invalid_transition():
    db = next(get_db())
    try:
        brief = _make_brief(db, status="draft")
        brief_id = str(brief.id)
    finally:
        db.close()

    response = client.patch(
        f"/api/v1/admin/briefs/{brief_id}/status",
        json={"status": "approved"},
    )
    assert response.status_code == 400
    assert "Cannot transition" in response.json()["detail"]


def test_get_brief_versions_empty():
    db = next(get_db())
    try:
        brief = _make_brief(db)
        brief_id = str(brief.id)
    finally:
        db.close()

    response = client.get(f"/api/v1/admin/briefs/{brief_id}/versions")
    assert response.status_code == 200
    assert response.json() == []


def test_get_brief_versions_returns_versions():
    db = next(get_db())
    try:
        brief = _make_brief(db)
        content_service.create_brief_version(db, brief.id, {"v": 1})
        content_service.create_brief_version(db, brief.id, {"v": 2})
        brief_id = str(brief.id)
    finally:
        db.close()

    response = client.get(f"/api/v1/admin/briefs/{brief_id}/versions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["version_number"] == 2  # desc order


def test_generate_brief_trigger_missing_topic_and_cluster_returns_400():
    with patch("app.worker.tasks.agent_tasks.generate_brief_task.apply_async") as mock_task:
        mock_task.return_value = MagicMock()
        response = client.post(
            "/api/v1/admin/agents/generate-brief",
            json={"target_keyword": "kedarkantha trek"},
        )
    assert response.status_code == 400


def test_generate_brief_trigger_dispatches_task():
    db = next(get_db())
    try:
        topic = _make_topic(db)
        topic_id = str(topic.id)
    finally:
        db.close()

    with patch("app.worker.tasks.agent_tasks.generate_brief_task.apply_async") as mock_task:
        mock_task.return_value = MagicMock()
        response = client.post(
            "/api/v1/admin/agents/generate-brief",
            json={"topic_id": topic_id, "target_keyword": "kedarkantha trek guide", "page_type": "trek_guide"},
        )

    assert response.status_code == 200
    data = response.json()
    assert "agent_run_id" in data
    assert data["status"] == "running"
    mock_task.assert_called_once()
