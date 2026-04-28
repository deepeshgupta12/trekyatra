"""Tests for publish workflow: status transitions, CMS publish, publish log."""
from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage
from app.modules.content.models import ContentBrief, ContentDraft, KeywordCluster, PublishLog, TopicOpportunity

client = TestClient(app)


def _delete_new(db, model, pre_ids: list) -> None:
    """Delete rows created during a test, preserving pre-existing real data."""
    if pre_ids:
        db.execute(delete(model).where(model.id.not_in(pre_ids)))
    else:
        db.execute(delete(model))


@pytest.fixture(autouse=True)
def clean_state():
    # Snapshot all content table IDs to preserve real pipeline data
    with SessionLocal() as db:
        pre_cms = list(r[0] for r in db.execute(select(CMSPage.id)).all())
        pre_draft = list(r[0] for r in db.execute(select(ContentDraft.id)).all())
        pre_brief = list(r[0] for r in db.execute(select(ContentBrief.id)).all())
        pre_cluster = list(r[0] for r in db.execute(select(KeywordCluster.id)).all())
        pre_topic = list(r[0] for r in db.execute(select(TopicOpportunity.id)).all())
    yield
    with SessionLocal() as db:
        # FK-safe order: ContentBrief first (CASCADE → ContentDraft → PublishLog)
        _delete_new(db, ContentBrief, pre_brief)
        _delete_new(db, ContentDraft, pre_draft)  # safety: drafts without a brief
        _delete_new(db, CMSPage, pre_cms)
        _delete_new(db, KeywordCluster, pre_cluster)
        _delete_new(db, TopicOpportunity, pre_topic)
        db.commit()


def _create_draft_in_state(status: str) -> str:
    brief_slug = f"brief-{uuid.uuid4().hex[:8]}"
    brief_r = client.post(
        "/api/v1/briefs",
        json={
            "title": "Test Brief",
            "slug": brief_slug,
            "target_keyword": "test keyword",
            "status": "draft",
        },
    )
    assert brief_r.status_code == 201
    brief_id = brief_r.json()["id"]

    draft_r = client.post(
        "/api/v1/drafts",
        json={
            "brief_id": brief_id,
            "title": "Test Draft",
            "slug": f"draft-{uuid.uuid4().hex[:8]}",
            "content_markdown": "## Hello\nThis is the content.",
            "status": status,
        },
    )
    assert draft_r.status_code == 201
    return draft_r.json()["id"]


def test_status_transition_draft_to_review() -> None:
    draft_id = _create_draft_in_state("draft")
    r = client.patch(f"/api/v1/admin/drafts/{draft_id}/status", json={"status": "review"})
    assert r.status_code == 200
    assert r.json()["status"] == "review"


def test_status_transition_review_to_approved() -> None:
    draft_id = _create_draft_in_state("review")
    r = client.patch(f"/api/v1/admin/drafts/{draft_id}/status", json={"status": "approved"})
    assert r.status_code == 200
    assert r.json()["status"] == "approved"


def test_status_transition_review_back_to_draft() -> None:
    draft_id = _create_draft_in_state("review")
    r = client.patch(f"/api/v1/admin/drafts/{draft_id}/status", json={"status": "draft"})
    assert r.status_code == 200
    assert r.json()["status"] == "draft"


def test_invalid_status_transition_returns_400() -> None:
    draft_id = _create_draft_in_state("draft")
    r = client.patch(f"/api/v1/admin/drafts/{draft_id}/status", json={"status": "published"})
    assert r.status_code == 400


def test_publish_requires_approved_status() -> None:
    draft_id = _create_draft_in_state("draft")
    r = client.post(f"/api/v1/admin/drafts/{draft_id}/publish")
    assert r.status_code == 400
    assert "approved" in r.json()["detail"]


def test_publish_to_cms_succeeds() -> None:
    draft_id = _create_draft_in_state("approved")
    r = client.post(f"/api/v1/admin/drafts/{draft_id}/publish")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "succeeded"
    assert data["cms_page_id"] is not None
    assert data["published_url"] is not None
    assert "CMS" in data["message"]


def test_publish_creates_cms_page_in_db() -> None:
    with SessionLocal() as db:
        before = db.query(CMSPage).count()
    draft_id = _create_draft_in_state("approved")
    client.post(f"/api/v1/admin/drafts/{draft_id}/publish")
    with SessionLocal() as db:
        pages = db.query(CMSPage).all()
        new_pages = [p for p in pages if p.status == "published"]
    assert len(pages) == before + 1
    assert any(p.status == "published" for p in new_pages)


def test_publish_log_recorded_after_publish() -> None:
    draft_id = _create_draft_in_state("approved")
    client.post(f"/api/v1/admin/drafts/{draft_id}/publish")
    r = client.get(f"/api/v1/admin/drafts/{draft_id}/publish-log")
    assert r.status_code == 200
    logs = r.json()
    assert len(logs) == 1
    assert logs[0]["status"] == "succeeded"
    assert logs[0]["draft_id"] == draft_id
    assert logs[0]["cms_page_id"] is not None


def test_publish_log_empty_for_unpublished_draft() -> None:
    draft_id = _create_draft_in_state("draft")
    r = client.get(f"/api/v1/admin/drafts/{draft_id}/publish-log")
    assert r.status_code == 200
    assert r.json() == []
