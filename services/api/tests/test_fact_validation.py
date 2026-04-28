"""Tests for Step 25 — ClaimExtractionAgent and fact-check trigger endpoint."""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.main import app
from app.modules.content.models import ContentBrief, ContentDraft, DraftClaim

client = TestClient(app)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc)


@pytest.fixture()
def draft_with_content(tmp_draft_id=None):
    """Create a ContentBrief + ContentDraft with markdown content, clean up after."""
    brief_id = uuid.uuid4()
    draft_id = uuid.uuid4()
    with SessionLocal() as db:
        brief = ContentBrief(
            id=brief_id,
            created_at=_now(),
            updated_at=_now(),
            title="Kedarkantha Trek Guide",
            slug=f"kedarkantha-test-{brief_id.hex[:8]}",
            target_keyword="kedarkantha trek",
            status="approved",
        )
        db.add(brief)
        db.flush()
        draft = ContentDraft(
            id=draft_id,
            created_at=_now(),
            updated_at=_now(),
            brief_id=brief_id,
            title="Kedarkantha Trek Guide",
            slug=f"kedarkantha-draft-{draft_id.hex[:8]}",
            content_markdown=(
                "Kedarkantha is a 12,500 ft peak in Uttarakhand. "
                "The trek is 20 km long. Permits cost ₹600 per person. "
                "Always carry altitude sickness medication above 10,000 ft."
            ),
            status="approved",
        )
        db.add(draft)
        db.commit()

    yield str(draft_id), str(brief_id)

    with SessionLocal() as db:
        db.execute(delete(DraftClaim).where(DraftClaim.draft_id == draft_id))
        db.execute(delete(ContentDraft).where(ContentDraft.id == draft_id))
        db.execute(delete(ContentBrief).where(ContentBrief.id == brief_id))
        db.commit()


# ---------------------------------------------------------------------------
# Model / schema tests
# ---------------------------------------------------------------------------

def test_draft_claim_has_ymyl_and_evidence_fields():
    """DraftClaim ORM has the new Step 25 columns."""
    assert hasattr(DraftClaim, "ymyl_flag")
    assert hasattr(DraftClaim, "evidence_url")


def test_create_draft_claim_with_new_fields(draft_with_content):
    draft_id, _ = draft_with_content
    with SessionLocal() as db:
        claim = DraftClaim(
            id=uuid.uuid4(),
            draft_id=uuid.UUID(draft_id),
            claim_text="Permits cost ₹600.",
            claim_type="permit_requirement",
            confidence_score=0.6,
            flagged_for_review=True,
            ymyl_flag=True,
            evidence_url=None,
            created_at=_now(),
        )
        db.add(claim)
        db.commit()
        fetched = db.get(DraftClaim, claim.id)
        assert fetched is not None
        assert fetched.ymyl_flag is True
        assert fetched.evidence_url is None
        db.delete(fetched)
        db.commit()


# ---------------------------------------------------------------------------
# ClaimExtractionAgent unit tests (mocked LLM)
# ---------------------------------------------------------------------------

MOCK_LLM_CLAIMS = [
    {
        "claim_text": "Kedarkantha is a 12,500 ft peak.",
        "claim_type": "altitude",
        "confidence_score": 0.85,
        "flagged_for_review": False,
    },
    {
        "claim_text": "The trek is 20 km long.",
        "claim_type": "route_distance",
        "confidence_score": 0.7,
        "flagged_for_review": False,
    },
    {
        "claim_text": "Permits cost ₹600 per person.",
        "claim_type": "permit_requirement",
        "confidence_score": 0.55,
        "flagged_for_review": True,
    },
    {
        "claim_text": "Always carry altitude sickness medication above 10,000 ft.",
        "claim_type": "safety_advisory",
        "confidence_score": 0.9,
        "flagged_for_review": False,
    },
]


def _mock_anthropic_response(claims):
    import json
    msg = MagicMock()
    msg.content = [MagicMock(text=json.dumps(claims))]
    return msg


def test_claim_extraction_agent_inserts_claims(draft_with_content):
    """ClaimExtractionAgent extracts and stores claims with correct ymyl_flag."""
    from app.modules.agents.fact_validation.agent import ClaimExtractionAgent

    draft_id, _ = draft_with_content
    mock_resp = _mock_anthropic_response(MOCK_LLM_CLAIMS)

    with patch(
        "app.modules.agents.fact_validation.agent.get_anthropic_client"
    ) as mock_client:
        mock_client.return_value.messages.create.return_value = mock_resp
        with SessionLocal() as db:
            agent = ClaimExtractionAgent(db=db, draft_id=draft_id)
            result = agent.run(input_data={"draft_id": draft_id})

    assert not result.get("errors"), result.get("errors")
    assert result["output"]["inserted"] == 4

    with SessionLocal() as db:
        claims = db.scalars(
            select(DraftClaim).where(DraftClaim.draft_id == uuid.UUID(draft_id))
        ).all()

    assert len(claims) == 4
    ymyl = [c for c in claims if c.ymyl_flag]
    # altitude + safety_advisory + permit_requirement → 3 ymyl claims
    assert len(ymyl) == 3
    # evidence_url is None in V2.0 (mocked)
    assert all(c.evidence_url is None for c in claims)


def test_claim_extraction_clears_existing_claims(draft_with_content):
    """Running agent twice replaces old claims — no duplicates."""
    from app.modules.agents.fact_validation.agent import ClaimExtractionAgent

    draft_id, _ = draft_with_content
    mock_resp = _mock_anthropic_response(MOCK_LLM_CLAIMS)

    with patch("app.modules.agents.fact_validation.agent.get_anthropic_client") as mock_client:
        mock_client.return_value.messages.create.return_value = mock_resp
        with SessionLocal() as db:
            ClaimExtractionAgent(db=db, draft_id=draft_id).run(input_data={})
        with SessionLocal() as db:
            ClaimExtractionAgent(db=db, draft_id=draft_id).run(input_data={})

    with SessionLocal() as db:
        count = db.scalar(
            select(DraftClaim).where(DraftClaim.draft_id == uuid.UUID(draft_id)).with_only_columns(
                DraftClaim.id
            )
        )
    # Should be exactly 4 claims, not 8
    with SessionLocal() as db:
        all_claims = db.scalars(
            select(DraftClaim).where(DraftClaim.draft_id == uuid.UUID(draft_id))
        ).all()
    assert len(all_claims) == 4


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------

def test_trigger_fact_check_returns_200(draft_with_content):
    """POST /admin/drafts/{id}/fact-check returns 200 with extraction summary."""
    draft_id, _ = draft_with_content
    mock_resp = _mock_anthropic_response(MOCK_LLM_CLAIMS)

    with patch("app.modules.agents.fact_validation.agent.get_anthropic_client") as mock_client:
        mock_client.return_value.messages.create.return_value = mock_resp
        r = client.post(f"/api/v1/admin/drafts/{draft_id}/fact-check")

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["draft_id"] == draft_id
    assert body["claims_extracted"] == 4
    assert body["ymyl_claims"] == 3
    assert body["flagged_claims"] == 1


def test_trigger_fact_check_404_on_missing_draft():
    """POST /admin/drafts/{random_id}/fact-check returns 404."""
    r = client.post(f"/api/v1/admin/drafts/{uuid.uuid4()}/fact-check")
    assert r.status_code == 404


def test_trigger_fact_check_400_on_bad_uuid():
    """POST /admin/drafts/not-a-uuid/fact-check returns 400."""
    r = client.post("/api/v1/admin/drafts/not-a-uuid/fact-check")
    assert r.status_code == 400
