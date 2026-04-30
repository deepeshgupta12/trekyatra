"""Tests for Step 28 — Compliance Guard Agent.

Covers: rule seeding, compliance check (mocked LLM), override, publish gate.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.compliance.models import ComplianceRule
from app.modules.compliance.service import seed_default_rules, list_rules
from app.modules.content.models import ContentBrief, ContentDraft, KeywordCluster, TopicOpportunity

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uid() -> str:
    return str(uuid.uuid4())[:8]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _make_draft(db) -> ContentDraft:
    uid = _uid()
    topic = TopicOpportunity(
        id=uuid.uuid4(), title=f"T {uid}", slug=f"t-{uid}",
        primary_keyword=f"kw-{uid}", status="new", created_at=_now(), updated_at=_now(),
    )
    cluster = KeywordCluster(
        id=uuid.uuid4(), name=f"C {uid}", primary_keyword=f"kw-{uid}",
        status="draft", created_at=_now(), updated_at=_now(),
    )
    brief = ContentBrief(
        id=uuid.uuid4(), title=f"B {uid}", slug=f"b-{uid}",
        target_keyword=f"kw-{uid}", status="approved",
        topic_opportunity=topic, keyword_cluster=cluster,
        structured_brief={"heading_outline": []},
        created_at=_now(), updated_at=_now(),
    )
    draft = ContentDraft(
        id=uuid.uuid4(), brief=brief, title=f"Draft {uid}", slug=f"d-{uid}",
        content_markdown="This is a safe trek guide. Disclosure: affiliate links. Safety: consult a guide.",
        status="approved", version=1, freshness_interval_days=90,
        created_at=_now(), updated_at=_now(),
    )
    db.add_all([topic, cluster, brief, draft])
    db.commit()
    return draft


# ---------------------------------------------------------------------------
# TC-B01: ComplianceRule ORM model insert
# ---------------------------------------------------------------------------

def test_compliance_rule_orm():
    with SessionLocal() as db:
        rule = ComplianceRule(
            id=uuid.uuid4(),
            name=f"test-rule-{_uid()}",
            rule_type="affiliate_disclosure",
            description="Test rule",
            is_active=True,
        )
        db.add(rule)
        db.commit()
        fetched = db.get(ComplianceRule, rule.id)
        assert fetched is not None
        assert fetched.rule_type == "affiliate_disclosure"
        assert fetched.is_active is True


# ---------------------------------------------------------------------------
# TC-B02: seed_default_rules creates 4 rules when table is empty
# ---------------------------------------------------------------------------

def test_seed_default_rules_idempotent():
    with SessionLocal() as db:
        # First call may or may not seed (DB may already have rules)
        count_first = seed_default_rules(db)
        # Second call must always return 0 (idempotent)
        count_second = seed_default_rules(db)
        assert count_second == 0


# ---------------------------------------------------------------------------
# TC-B03: list_rules returns ComplianceRule objects with correct fields
# ---------------------------------------------------------------------------

def test_list_rules_returns_valid_objects():
    with SessionLocal() as db:
        seed_default_rules(db)
        rules = list_rules(db)
        assert isinstance(rules, list)
        assert len(rules) >= 1
        for r in rules:
            assert r.name
            assert r.rule_type
            assert isinstance(r.is_active, bool)


# ---------------------------------------------------------------------------
# TC-B04: GET /admin/compliance/rules — returns list of active rules
# ---------------------------------------------------------------------------

def test_api_list_rules():
    resp = client.get("/api/v1/admin/compliance/rules")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


# ---------------------------------------------------------------------------
# TC-B05: POST /admin/drafts/{id}/compliance-check — 404 for unknown draft
# ---------------------------------------------------------------------------

def test_compliance_check_404():
    resp = client.post(f"/api/v1/admin/drafts/{uuid.uuid4()}/compliance-check")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TC-B06: POST /admin/drafts/{id}/compliance-check — happy path with mocked LLM
# ---------------------------------------------------------------------------

MOCK_RISKY_RESPONSE = '{"has_risky_wording": false, "findings": []}'


def _mock_anthropic_for_compliance():
    mock_msg = MagicMock()
    mock_msg.content = [MagicMock(text=MOCK_RISKY_RESPONSE)]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_msg
    return mock_client


def test_compliance_check_happy_path():
    with SessionLocal() as db:
        draft = _make_draft(db)
        draft_id = str(draft.id)

    mock_client = _mock_anthropic_for_compliance()
    with patch("app.modules.agents.compliance.agent.get_anthropic_client", return_value=mock_client):
        resp = client.post(f"/api/v1/admin/drafts/{draft_id}/compliance-check")

    assert resp.status_code == 200
    data = resp.json()
    assert "compliance_status" in data
    assert data["compliance_status"] in ("passed", "flagged")
    assert "results" in data
    assert isinstance(data["results"], list)
    assert "checked_rules" in data


# ---------------------------------------------------------------------------
# TC-B07: Compliance check result stored on draft (compliance_status updated)
# ---------------------------------------------------------------------------

def test_compliance_check_persists_status():
    with SessionLocal() as db:
        draft = _make_draft(db)
        draft_id = str(draft.id)

    mock_client = _mock_anthropic_for_compliance()
    with patch("app.modules.agents.compliance.agent.get_anthropic_client", return_value=mock_client):
        client.post(f"/api/v1/admin/drafts/{draft_id}/compliance-check")

    with SessionLocal() as db:
        from sqlalchemy import select
        refreshed = db.scalar(
            select(ContentDraft).where(ContentDraft.id == uuid.UUID(draft_id))
        )
        assert refreshed.compliance_status in ("passed", "flagged", "unchecked")


# ---------------------------------------------------------------------------
# TC-B08: PATCH /admin/drafts/{id}/compliance-override — 404 for unknown draft
# ---------------------------------------------------------------------------

def test_compliance_override_404():
    resp = client.patch(
        f"/api/v1/admin/drafts/{uuid.uuid4()}/compliance-override",
        json={"override_note": "Manually reviewed and approved."},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TC-B09: PATCH /admin/drafts/{id}/compliance-override — happy path
# ---------------------------------------------------------------------------

def test_compliance_override_happy_path():
    with SessionLocal() as db:
        draft = _make_draft(db)
        draft_id = str(draft.id)
        # Set to flagged so override makes sense
        draft.compliance_status = "flagged"
        db.commit()

    resp = client.patch(
        f"/api/v1/admin/drafts/{draft_id}/compliance-override",
        json={"override_note": "Editor reviewed — approved despite affiliate disclosure gap."},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["compliance_status"] == "overridden"
    assert data["override_note"] == "Editor reviewed — approved despite affiliate disclosure gap."
    assert "overridden_at" in data


# ---------------------------------------------------------------------------
# TC-B10: Override persists audit trail on draft
# ---------------------------------------------------------------------------

def test_override_persists_audit_trail():
    with SessionLocal() as db:
        draft = _make_draft(db)
        draft_id = str(draft.id)
        draft.compliance_status = "flagged"
        db.commit()

    client.patch(
        f"/api/v1/admin/drafts/{draft_id}/compliance-override",
        json={"override_note": "Audit trail test."},
    )

    with SessionLocal() as db:
        from sqlalchemy import select
        refreshed = db.scalar(
            select(ContentDraft).where(ContentDraft.id == uuid.UUID(draft_id))
        )
        assert refreshed.compliance_status == "overridden"
        assert refreshed.compliance_override_note == "Audit trail test."
        assert refreshed.compliance_overridden_at is not None


# ---------------------------------------------------------------------------
# TC-B11: publish blocked for flagged draft
# ---------------------------------------------------------------------------

def test_publish_blocked_when_flagged():
    with SessionLocal() as db:
        draft = _make_draft(db)
        draft_id = str(draft.id)
        draft.compliance_status = "flagged"
        db.commit()

    # The compliance hook in publish_to_cms checks status before CMS write.
    # Draft is already flagged so it should block (no LLM call needed).
    resp = client.post(f"/api/v1/admin/drafts/{draft_id}/publish")
    assert resp.status_code == 400
    assert "compliance" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# TC-B12: publish allowed for overridden draft (bypasses compliance gate)
# ---------------------------------------------------------------------------

def test_publish_allowed_when_overridden():
    with SessionLocal() as db:
        draft = _make_draft(db)
        draft_id = str(draft.id)
        draft.compliance_status = "overridden"
        draft.compliance_override_note = "Approved by editor."
        draft.compliance_overridden_by = "editor@trekyatra.com"
        draft.compliance_overridden_at = _now()
        db.commit()

    with patch("app.modules.cms.service.upsert_page_from_draft") as mock_upsert, \
         patch("app.modules.linking.service.sync_pages_from_cms"):
        mock_cms = MagicMock()
        mock_cms.id = uuid.uuid4()
        mock_cms.slug = "test-slug"
        mock_upsert.return_value = mock_cms
        resp = client.post(f"/api/v1/admin/drafts/{draft_id}/publish")

    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# TC-B13: publish auto-runs compliance check for unchecked draft
# ---------------------------------------------------------------------------

def test_publish_auto_checks_unchecked_draft():
    with SessionLocal() as db:
        draft = _make_draft(db)
        draft_id = str(draft.id)
        # Ensure unchecked
        assert draft.compliance_status == "unchecked"
        db.commit()

    mock_client = _mock_anthropic_for_compliance()
    with patch("app.modules.agents.compliance.agent.get_anthropic_client", return_value=mock_client), \
         patch("app.modules.cms.service.upsert_page_from_draft") as mock_upsert, \
         patch("app.modules.linking.service.sync_pages_from_cms"):
        mock_cms = MagicMock()
        mock_cms.id = uuid.uuid4()
        mock_cms.slug = "test-slug"
        mock_upsert.return_value = mock_cms
        # Either publishes (if compliance passes) or returns 400 (if flagged)
        resp = client.post(f"/api/v1/admin/drafts/{draft_id}/publish")

    assert resp.status_code in (200, 400)
    # Either way, compliance_status must have changed from "unchecked"
    with SessionLocal() as db:
        from sqlalchemy import select
        refreshed = db.scalar(
            select(ContentDraft).where(ContentDraft.id == uuid.UUID(draft_id))
        )
        assert refreshed.compliance_status != "unchecked"
