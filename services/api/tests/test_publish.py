"""Tests for publish workflow: status transitions, WordPress push, publish log."""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.session import SessionLocal
from app.main import app
from app.modules.content.models import ContentBrief, ContentDraft, KeywordCluster, PublishLog, TopicOpportunity

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state():
    with SessionLocal() as db:
        db.execute(delete(PublishLog))
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
        db.commit()
    yield
    with SessionLocal() as db:
        db.execute(delete(PublishLog))
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
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


def test_publish_skipped_when_wordpress_not_configured() -> None:
    draft_id = _create_draft_in_state("approved")

    with patch("app.modules.publish.service.settings") as mock_settings:
        mock_settings.wordpress_credentials_configured = False

        r = client.post(f"/api/v1/admin/drafts/{draft_id}/publish")

    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "skipped"
    assert "not configured" in data["message"].lower() or "locally" in data["message"].lower()


def test_publish_succeeds_with_mocked_wordpress() -> None:
    draft_id = _create_draft_in_state("approved")

    mock_result = MagicMock()
    mock_result.ok = True
    mock_result.status_code = 201
    mock_result.message = "OK"
    mock_result.payload = {"id": 42, "link": "http://localhost:8080/?p=42"}

    with patch("app.modules.publish.service.settings") as mock_settings, \
         patch("app.modules.publish.service.WordPressClient") as mock_client_cls:
        mock_settings.wordpress_credentials_configured = True
        mock_settings.wordpress_base_url = "http://localhost:8080"
        mock_settings.wordpress_username = "admin"
        mock_settings.wordpress_app_password = "test"
        mock_settings.wordpress_timeout_seconds = 10.0
        mock_settings.wordpress_verify_ssl = False

        mock_instance = mock_client_cls.return_value
        mock_instance.create_post.return_value = mock_result

        r = client.post(f"/api/v1/admin/drafts/{draft_id}/publish")

    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "succeeded"
    assert data["wordpress_post_id"] == 42
    assert data["wordpress_url"] == "http://localhost:8080/?p=42"


def test_publish_log_recorded_after_push() -> None:
    draft_id = _create_draft_in_state("approved")

    with patch("app.modules.publish.service.settings") as mock_settings:
        mock_settings.wordpress_credentials_configured = False
        client.post(f"/api/v1/admin/drafts/{draft_id}/publish")

    r = client.get(f"/api/v1/admin/drafts/{draft_id}/publish-log")
    assert r.status_code == 200
    logs = r.json()
    assert len(logs) == 1
    assert logs[0]["status"] == "skipped"
    assert logs[0]["draft_id"] == draft_id


def test_publish_log_empty_for_unpublished_draft() -> None:
    draft_id = _create_draft_in_state("draft")
    r = client.get(f"/api/v1/admin/drafts/{draft_id}/publish-log")
    assert r.status_code == 200
    assert r.json() == []
