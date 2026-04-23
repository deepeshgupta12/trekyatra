"""Tests for ContentWritingAgent + draft claims endpoint (Step 15)."""
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
    DraftClaim,
    KeywordCluster,
    TopicOpportunity,
)
from app.modules.content import service as content_service
from app.schemas.content import ContentBriefCreate, ContentDraftCreate  # noqa: F401 (used in _make_orphan_draft)

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state() -> None:
    with SessionLocal() as db:
        db.execute(delete(DraftClaim))
        db.execute(delete(BriefVersion))
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
        db.commit()
    yield
    with SessionLocal() as db:
        db.execute(delete(DraftClaim))
        db.execute(delete(BriefVersion))
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
        db.commit()


# ── helpers ───────────────────────────────────────────────────────────────────

def _make_brief(db, status: str = "approved", with_structured: bool = True) -> ContentBrief:
    brief = content_service.create_brief(
        db,
        ContentBriefCreate(
            title=f"Brief {uuid.uuid4().hex[:6]}",
            slug=f"brief-{uuid.uuid4().hex[:8]}",
            target_keyword="kedarkantha trek guide",
            status=status,
        ),
    )
    if with_structured:
        brief.structured_brief = {
            "heading_structure": [
                {"level": "H1", "text": "Kedarkantha Trek Guide", "notes": "overview"},
                {"level": "H2", "text": "Overview", "notes": "quick facts"},
            ],
            "faqs": [{"question": "Is it hard?", "answer_hint": "moderate difficulty"}],
            "key_entities": ["Kedarkantha", "Uttarakhand"],
            "internal_link_targets": ["/treks/kedarkantha"],
            "schema_recommendations": ["Article"],
            "word_count_target": 1800,
        }
        db.commit()
        db.refresh(brief)
    return brief


MOCK_DRAFT_JSON = {
    "title": "Kedarkantha Trek Guide 2024",
    "meta_description": "Complete guide to Kedarkantha trek — difficulty, permits, best time, and costs.",
    "excerpt": "Kedarkantha is a beautiful winter trek in Uttarakhand.",
    "slug": "kedarkantha-trek-guide",
    "content_markdown": "# Kedarkantha Trek Guide\n\n## Overview\nKedarkantha is a 12,500 ft peak.\n\n## FAQ\n**Is it hard?** Moderate difficulty.\n",
    "confidence_score": 0.85,
    "fact_check_claims": [
        {
            "claim_text": "Kedarkantha is 12,500 ft",
            "claim_type": "altitude",
            "confidence_score": 0.9,
            "flagged_for_review": False,
        },
        {
            "claim_text": "Trek duration is 6 days",
            "claim_type": "route_distance",
            "confidence_score": 0.6,
            "flagged_for_review": True,
        },
    ],
}


# ── ContentWritingAgent unit tests ────────────────────────────────────────────

def test_content_writing_agent_missing_brief_id_returns_error():
    from app.modules.agents.content_writing.agent import ContentWritingAgent

    db = next(get_db())
    try:
        agent = ContentWritingAgent(db=db)
        result = agent.run({}, run_id=0)
        assert result.get("errors")
        assert "brief_id" in result["errors"][0].lower()
    finally:
        db.close()


def test_content_writing_agent_invalid_brief_id_format_returns_error():
    from app.modules.agents.content_writing.agent import ContentWritingAgent

    db = next(get_db())
    try:
        agent = ContentWritingAgent(db=db)
        result = agent.run({"brief_id": "not-a-uuid"}, run_id=0)
        assert result.get("errors")
    finally:
        db.close()


def test_content_writing_agent_brief_not_found_returns_error():
    from app.modules.agents.content_writing.agent import ContentWritingAgent

    db = next(get_db())
    try:
        agent = ContentWritingAgent(db=db)
        result = agent.run({"brief_id": str(uuid.uuid4())}, run_id=0)
        assert result.get("errors")
        assert "not found" in result["errors"][0].lower()
    finally:
        db.close()


def test_content_writing_agent_unapproved_brief_returns_error():
    from app.modules.agents.content_writing.agent import ContentWritingAgent

    db = next(get_db())
    try:
        brief = _make_brief(db, status="review")
        agent = ContentWritingAgent(db=db)
        result = agent.run({"brief_id": str(brief.id)}, run_id=0)
        assert result.get("errors")
        assert "approved" in result["errors"][0].lower()
    finally:
        db.close()


def test_content_writing_agent_brief_without_structured_data_returns_error():
    from app.modules.agents.content_writing.agent import ContentWritingAgent

    db = next(get_db())
    try:
        brief = _make_brief(db, status="approved", with_structured=False)
        agent = ContentWritingAgent(db=db)
        result = agent.run({"brief_id": str(brief.id)}, run_id=0)
        assert result.get("errors")
        assert "structured_brief" in result["errors"][0].lower()
    finally:
        db.close()


def test_content_writing_agent_with_mocked_llm_creates_draft():
    from app.modules.agents.content_writing.agent import ContentWritingAgent

    db = next(get_db())
    try:
        brief = _make_brief(db, status="approved")
        brief_id = str(brief.id)

        mock_message = MagicMock()
        mock_message.content = [MagicMock(text=json.dumps(MOCK_DRAFT_JSON))]

        with (
            patch("anthropic.Anthropic") as mock_cls,
            patch("app.core.config.settings.anthropic_api_key", "sk-test"),
        ):
            mock_client = MagicMock()
            mock_cls.return_value = mock_client
            mock_client.messages.create.return_value = mock_message

            agent = ContentWritingAgent(db=db)
            result = agent.run({"brief_id": brief_id}, run_id=0)

        assert not result.get("errors"), result.get("errors")
        output = result.get("output", {})
        assert "draft_id" in output
        assert output["status"] == "requires_review"
        assert output["flagged_claims"] == 1

        draft_id = uuid.UUID(output["draft_id"])
        draft = content_service.get_draft(db, draft_id)
        assert draft is not None
        assert draft.status == "requires_review"
        assert draft.content_markdown is not None

        claims = content_service.list_draft_claims(db, draft_id)
        assert len(claims) == 2
        flagged = [c for c in claims if c.flagged_for_review]
        assert len(flagged) == 1
    finally:
        db.close()


def test_content_writing_agent_no_flagged_claims_sets_draft_status():
    from app.modules.agents.content_writing.agent import ContentWritingAgent

    clean_draft_json = {**MOCK_DRAFT_JSON, "fact_check_claims": [
        {
            "claim_text": "Kedarkantha is 12,500 ft",
            "claim_type": "altitude",
            "confidence_score": 0.95,
            "flagged_for_review": False,
        }
    ]}

    db = next(get_db())
    try:
        brief = _make_brief(db, status="approved")

        mock_message = MagicMock()
        mock_message.content = [MagicMock(text=json.dumps(clean_draft_json))]

        with (
            patch("anthropic.Anthropic") as mock_cls,
            patch("app.core.config.settings.anthropic_api_key", "sk-test"),
        ):
            mock_client = MagicMock()
            mock_cls.return_value = mock_client
            mock_client.messages.create.return_value = mock_message

            agent = ContentWritingAgent(db=db)
            result = agent.run({"brief_id": str(brief.id)}, run_id=0)

        assert not result.get("errors"), result.get("errors")
        assert result["output"]["status"] == "draft"
        assert result["output"]["flagged_claims"] == 0
    finally:
        db.close()


# ── GET /admin/drafts/{id}/claims endpoint tests ──────────────────────────────

def _make_orphan_draft(db) -> ContentDraft:
    brief = content_service.create_brief(
        db,
        ContentBriefCreate(
            title=f"Brief {uuid.uuid4().hex[:6]}",
            slug=f"brief-{uuid.uuid4().hex[:8]}",
            target_keyword="test keyword",
            status="draft",
        ),
    )
    return content_service.create_draft(
        db,
        ContentDraftCreate(
            brief_id=str(brief.id),
            title="Test Draft",
            slug=f"test-draft-{uuid.uuid4().hex[:8]}",
            content_markdown="Test content here for claim testing.",
            status="draft",
        ),
    )


def test_get_draft_claims_empty():
    db = next(get_db())
    try:
        draft = _make_orphan_draft(db)
        draft_id = str(draft.id)
    finally:
        db.close()

    response = client.get(f"/api/v1/admin/drafts/{draft_id}/claims")
    assert response.status_code == 200
    assert response.json() == []


def test_get_draft_claims_returns_claims():
    from app.schemas.content import DraftClaimCreate

    db = next(get_db())
    try:
        draft = _make_orphan_draft(db)
        content_service.create_draft_claim(
            db,
            DraftClaimCreate(
                draft_id=str(draft.id),
                claim_text="Peak is 12,500 ft",
                claim_type="altitude",
                confidence_score=0.9,
                flagged_for_review=False,
            ),
        )
        content_service.create_draft_claim(
            db,
            DraftClaimCreate(
                draft_id=str(draft.id),
                claim_text="Permit costs ₹200",
                claim_type="permit_requirement",
                confidence_score=0.5,
                flagged_for_review=True,
            ),
        )
        draft_id = str(draft.id)
    finally:
        db.close()

    response = client.get(f"/api/v1/admin/drafts/{draft_id}/claims")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    flagged = [c for c in data if c["flagged_for_review"]]
    assert len(flagged) == 1
    assert flagged[0]["claim_type"] == "permit_requirement"


def test_get_draft_claims_invalid_id_returns_400():
    response = client.get("/api/v1/admin/drafts/not-a-uuid/claims")
    assert response.status_code == 400


# ── write-draft trigger endpoint ──────────────────────────────────────────────

def test_write_draft_trigger_dispatches_task():
    db = next(get_db())
    try:
        brief = _make_brief(db, status="approved")
        brief_id = str(brief.id)
    finally:
        db.close()

    with patch("app.worker.tasks.agent_tasks.write_draft_task.apply_async") as mock_task:
        mock_task.return_value = MagicMock()
        response = client.post(
            "/api/v1/admin/agents/write-draft",
            json={"brief_id": brief_id},
        )

    assert response.status_code == 200
    data = response.json()
    assert "agent_run_id" in data
    assert data["status"] == "running"
    mock_task.assert_called_once()
