"""Tests for SEOAEOAgent + optimize-draft trigger endpoint (Step 15)."""
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
from app.schemas.content import ContentBriefCreate, ContentDraftCreate

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

def _make_brief_and_draft(db) -> tuple[ContentBrief, ContentDraft]:
    brief = content_service.create_brief(
        db,
        ContentBriefCreate(
            title="Kedarkantha Trek Brief",
            slug=f"brief-{uuid.uuid4().hex[:8]}",
            target_keyword="kedarkantha trek guide",
            status="approved",
        ),
    )
    draft = content_service.create_draft(
        db,
        ContentDraftCreate(
            brief_id=str(brief.id),
            title="Kedarkantha Trek Guide",
            slug=f"kedarkantha-trek-{uuid.uuid4().hex[:8]}",
            content_markdown="# Kedarkantha Trek Guide\n\n## Overview\nKedarkantha is a 12,500 ft peak.",
            status="draft",
        ),
    )
    return brief, draft


MOCK_SEO_JSON = {
    "optimized_content": "# Kedarkantha Trek Guide 2024\n\nKedarkantha (12,500 ft) is one of India's best winter treks.\n\n## Overview\nLocated in Uttarakhand, Kedarkantha offers stunning views.\n\n## FAQ\n**Is Kedarkantha suitable for beginners?** Yes, with proper preparation.\n",
    "changes_summary": [
        "Added direct-answer opener under 160 chars",
        "Improved H2 to question form",
        "Added 3 FAQ pairs",
    ],
    "snippet_intro": "Kedarkantha (12,500 ft) is a beginner-friendly winter trek in Uttarakhand offering stunning Himalayan views.",
    "faq_schema": [
        {"question": "Is Kedarkantha good for beginners?", "answer": "Yes, Kedarkantha is suitable for beginners with moderate fitness."},
        {"question": "What is the best time for Kedarkantha?", "answer": "December to February for snow trek; March to April for clear views."},
        {"question": "How long is the Kedarkantha trek?", "answer": "The trek is typically completed in 6 days from Sankri base camp."},
    ],
    "internal_link_opportunities": [
        {"anchor_text": "Kedarkantha trek permits", "target_slug": "/treks/kedarkantha/permits"},
    ],
    "schema_payload": {
        "types": ["Article", "FAQPage"],
        "notes": "Add FAQPage schema with the 3 Q&A pairs; Article schema for main content.",
    },
}


# ── SEOAEOAgent unit tests ────────────────────────────────────────────────────

def test_seo_aeo_agent_missing_draft_id_returns_error():
    from app.modules.agents.seo_aeo.agent import SEOAEOAgent

    db = next(get_db())
    try:
        agent = SEOAEOAgent(db=db)
        result = agent.run({}, run_id=0)
        assert result.get("errors")
        assert "draft_id" in result["errors"][0].lower()
    finally:
        db.close()


def test_seo_aeo_agent_invalid_draft_id_format_returns_error():
    from app.modules.agents.seo_aeo.agent import SEOAEOAgent

    db = next(get_db())
    try:
        agent = SEOAEOAgent(db=db)
        result = agent.run({"draft_id": "not-a-uuid"}, run_id=0)
        assert result.get("errors")
    finally:
        db.close()


def test_seo_aeo_agent_draft_not_found_returns_error():
    from app.modules.agents.seo_aeo.agent import SEOAEOAgent

    db = next(get_db())
    try:
        agent = SEOAEOAgent(db=db)
        result = agent.run({"draft_id": str(uuid.uuid4())}, run_id=0)
        assert result.get("errors")
        assert "not found" in result["errors"][0].lower()
    finally:
        db.close()


def test_seo_aeo_agent_with_mocked_llm_optimizes_draft():
    from app.modules.agents.seo_aeo.agent import SEOAEOAgent

    db = next(get_db())
    try:
        _, draft = _make_brief_and_draft(db)
        draft_id = str(draft.id)

        mock_message = MagicMock()
        mock_message.content = [MagicMock(text=json.dumps(MOCK_SEO_JSON))]

        with (
            patch("anthropic.Anthropic") as mock_cls,
            patch("app.core.config.settings.anthropic_api_key", "sk-test"),
        ):
            mock_client = MagicMock()
            mock_cls.return_value = mock_client
            mock_client.messages.create.return_value = mock_message

            agent = SEOAEOAgent(db=db)
            result = agent.run({"draft_id": draft_id}, run_id=0)

        assert not result.get("errors"), result.get("errors")
        output = result.get("output", {})
        assert output["draft_id"] == draft_id
        assert output["changes_count"] == 3
        assert output["faq_count"] == 3

        refreshed = content_service.get_draft(db, uuid.UUID(draft_id))
        assert refreshed.optimized_content is not None
        assert "Kedarkantha Trek Guide 2024" in refreshed.optimized_content
    finally:
        db.close()


def test_seo_aeo_agent_stores_optimized_content_on_draft():
    from app.modules.agents.seo_aeo.agent import SEOAEOAgent

    db = next(get_db())
    try:
        _, draft = _make_brief_and_draft(db)
        original_content = draft.content_markdown
        draft_id = str(draft.id)

        mock_message = MagicMock()
        mock_message.content = [MagicMock(text=json.dumps(MOCK_SEO_JSON))]

        with (
            patch("anthropic.Anthropic") as mock_cls,
            patch("app.core.config.settings.anthropic_api_key", "sk-test"),
        ):
            mock_client = MagicMock()
            mock_cls.return_value = mock_client
            mock_client.messages.create.return_value = mock_message

            agent = SEOAEOAgent(db=db)
            agent.run({"draft_id": draft_id}, run_id=0)

        refreshed = content_service.get_draft(db, uuid.UUID(draft_id))
        assert refreshed.content_markdown == original_content
        assert refreshed.optimized_content != original_content
    finally:
        db.close()


# ── optimize-draft trigger endpoint ──────────────────────────────────────────

def test_optimize_draft_trigger_dispatches_task():
    db = next(get_db())
    try:
        _, draft = _make_brief_and_draft(db)
        draft_id = str(draft.id)
    finally:
        db.close()

    with patch("app.worker.tasks.agent_tasks.optimize_draft_task.apply_async") as mock_task:
        mock_task.return_value = MagicMock()
        response = client.post(
            "/api/v1/admin/agents/optimize-draft",
            json={"draft_id": draft_id},
        )

    assert response.status_code == 200
    data = response.json()
    assert "agent_run_id" in data
    assert data["status"] == "running"
    mock_task.assert_called_once()
