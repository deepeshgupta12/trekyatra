"""Tests for Step 27 — Newsletter Automation + Repurposing Agent.

Covers: campaign model, list/get/send endpoints, generate (mocked LLM),
        social repurpose (mocked LLM), snippets list, error paths.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage
from app.modules.linking.models import Page
from app.modules.newsletter.models import NewsletterCampaign, SocialSnippet

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uid() -> str:
    return str(uuid.uuid4())[:8]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _create_cms_page(db, slug: str | None = None) -> CMSPage:
    now = _now()
    page = CMSPage(
        slug=slug or f"test-trek-{_uid()}",
        page_type="trek",
        title=f"Trek Guide {_uid()}",
        content_html="<p>Great trek for beginners. Beautiful views and easy trails.</p>",
        status="published",
        published_at=now,
        created_at=now,
        updated_at=now,
    )
    db.add(page)
    db.flush()
    return page


def _create_page_row(db, cms_page: CMSPage) -> Page:
    now = _now()
    page_row = Page(
        slug=cms_page.slug,
        title=cms_page.title,
        page_type=cms_page.page_type,
        cms_page_id=cms_page.id,
        cluster_id=None,
        created_at=now,
        updated_at=now,
    )
    db.add(page_row)
    db.flush()
    return page_row


def _create_campaign(db, status: str = "draft") -> NewsletterCampaign:
    campaign = NewsletterCampaign(
        id=uuid.uuid4(),
        week_label="2026-W18",
        subject="Best Himalayan Treks This Week",
        preview_text="Kedarkantha, Roopkund, and more",
        body_html="<html><body><h1>TrekYatra Weekly</h1></body></html>",
        status=status,
        sent_at=None,
        created_at=_now(),
    )
    db.add(campaign)
    db.commit()
    return campaign


# ---------------------------------------------------------------------------
# Model / ORM tests
# ---------------------------------------------------------------------------

class TestCampaignModel:
    def test_campaign_fields_stored_correctly(self):
        db = SessionLocal()
        try:
            campaign = _create_campaign(db)
            db.refresh(campaign)
            assert campaign.week_label == "2026-W18"
            assert campaign.status == "draft"
            assert campaign.sent_at is None
        finally:
            db.delete(campaign)
            db.commit()
            db.close()

    def test_social_snippet_fields_stored_correctly(self):
        db = SessionLocal()
        try:
            snippet = SocialSnippet(
                id=uuid.uuid4(),
                page_id=None,
                platform="instagram",
                copy="Amazing trek in the Himalayas! 🏔️ #trekking #india",
                copy_title=None,
                status="draft",
                created_at=_now(),
            )
            db.add(snippet)
            db.commit()
            db.refresh(snippet)
            assert snippet.platform == "instagram"
            assert snippet.page_id is None
        finally:
            db.delete(snippet)
            db.commit()
            db.close()


# ---------------------------------------------------------------------------
# List / get campaigns
# ---------------------------------------------------------------------------

class TestListCampaigns:
    def test_list_campaigns_empty(self):
        resp = client.get("/api/v1/admin/newsletter")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_campaigns_with_data(self):
        db = SessionLocal()
        campaign = _create_campaign(db)
        try:
            resp = client.get("/api/v1/admin/newsletter")
            assert resp.status_code == 200
            ids = [c["id"] for c in resp.json()]
            assert str(campaign.id) in ids
        finally:
            db.refresh(campaign)
            db.delete(campaign)
            db.commit()
            db.close()

    def test_list_campaigns_filter_by_status(self):
        db = SessionLocal()
        draft_c = _create_campaign(db, status="draft")
        sent_c = _create_campaign(db, status="sent")
        try:
            resp = client.get("/api/v1/admin/newsletter?status=draft")
            assert resp.status_code == 200
            statuses = [c["status"] for c in resp.json()]
            assert all(s == "draft" for s in statuses)
        finally:
            for c in [draft_c, sent_c]:
                db.refresh(c)
                db.delete(c)
            db.commit()
            db.close()

    def test_get_campaign_200(self):
        db = SessionLocal()
        campaign = _create_campaign(db)
        try:
            resp = client.get(f"/api/v1/admin/newsletter/{campaign.id}")
            assert resp.status_code == 200
            assert resp.json()["subject"] == "Best Himalayan Treks This Week"
        finally:
            db.refresh(campaign)
            db.delete(campaign)
            db.commit()
            db.close()

    def test_get_campaign_404(self):
        resp = client.get(f"/api/v1/admin/newsletter/{uuid.uuid4()}")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Send campaign
# ---------------------------------------------------------------------------

class TestSendCampaign:
    def test_send_campaign_404(self):
        resp = client.post(f"/api/v1/admin/newsletter/{uuid.uuid4()}/send")
        assert resp.status_code == 404

    def test_send_campaign_409_already_sent(self):
        db = SessionLocal()
        campaign = _create_campaign(db, status="sent")
        try:
            resp = client.post(f"/api/v1/admin/newsletter/{campaign.id}/send")
            assert resp.status_code == 409
        finally:
            db.refresh(campaign)
            db.delete(campaign)
            db.commit()
            db.close()

    def test_send_campaign_no_platform_marks_sent(self):
        db = SessionLocal()
        campaign = _create_campaign(db, status="draft")
        try:
            # With no platform configured, send_campaign marks it sent locally
            resp = client.post(f"/api/v1/admin/newsletter/{campaign.id}/send")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "sent"
        finally:
            db.refresh(campaign)
            db.delete(campaign)
            db.commit()
            db.close()


# ---------------------------------------------------------------------------
# Generate newsletter (mocked LLM)
# ---------------------------------------------------------------------------

MOCK_NEWSLETTER_RESPONSE = {
    "subject": "Top 5 Himalayan Treks This Week",
    "preview_text": "Kedarkantha and Roopkund top the list",
    "body_html": "<html><body><h1>TrekYatra Weekly</h1><p>Article 1</p></body></html>",
}


class TestGenerateNewsletter:
    def test_generate_no_pages_returns_400(self):
        # No CMS pages in DB — should return 400 with informative error
        # Use a fresh DB connection to check state
        db = SessionLocal()
        count = db.query(CMSPage).filter(CMSPage.status == "published").count()
        db.close()
        if count > 0:
            pytest.skip("Published pages exist — cannot test empty-state 400")

        resp = client.post("/api/v1/admin/newsletter/generate")
        assert resp.status_code == 400

    def test_generate_newsletter_mocked_llm(self):
        db = SessionLocal()
        cms_page = _create_cms_page(db)
        db.commit()
        try:
            mock_message = MagicMock()
            mock_message.content = [MagicMock(text=str(MOCK_NEWSLETTER_RESPONSE).replace("'", '"'))]
            mock_client = MagicMock()
            mock_client.messages.create.return_value = mock_message

            with patch(
                "app.modules.agents.newsletter.agent.get_anthropic_client",
                return_value=mock_client,
            ):
                # Also mock json.loads to return our dict
                import json
                with patch("app.modules.agents.newsletter.agent.json.loads", return_value=MOCK_NEWSLETTER_RESPONSE):
                    resp = client.post("/api/v1/admin/newsletter/generate")

            assert resp.status_code == 200
            data = resp.json()
            assert "campaign_id" in data
            assert "week_label" in data
        finally:
            db.delete(cms_page)
            db.commit()
            db.close()


# ---------------------------------------------------------------------------
# Social repurpose (mocked LLM)
# ---------------------------------------------------------------------------

MOCK_SNIPPETS_RESPONSE = {
    "instagram": {"copy": "🏔️ Kedarkantha Trek — breathtaking views! #trekking #himalayas #india"},
    "pinterest": {"copy_title": "Kedarkantha Trek Guide", "copy": "Complete guide for Kedarkantha winter trek in Uttarakhand."},
    "twitter": {"copy": "Why Kedarkantha is the best winter trek in India 🧵"},
}


class TestRepurposePage:
    def test_repurpose_page_not_found_returns_400(self):
        resp = client.post("/api/v1/admin/pages/nonexistent-slug-xyz/repurpose")
        assert resp.status_code == 400
        assert "not found" in resp.json()["detail"].lower()

    def test_repurpose_page_mocked_llm(self):
        db = SessionLocal()
        cms_page = _create_cms_page(db, slug=f"kedarkantha-guide-{_uid()}")
        db.commit()
        try:
            mock_message = MagicMock()
            mock_message.content = [MagicMock(text="{}")]
            mock_client = MagicMock()
            mock_client.messages.create.return_value = mock_message

            with patch(
                "app.modules.agents.social_repurpose.agent.get_anthropic_client",
                return_value=mock_client,
            ):
                with patch(
                    "app.modules.agents.social_repurpose.agent.json.loads",
                    return_value=MOCK_SNIPPETS_RESPONSE,
                ):
                    resp = client.post(f"/api/v1/admin/pages/{cms_page.slug}/repurpose")

            assert resp.status_code == 200
            data = resp.json()
            assert data["snippets_created"] == 3
            assert len(data["snippet_ids"]) == 3
        finally:
            # Clean up snippets
            snippets = db.query(SocialSnippet).all()
            for s in snippets:
                db.delete(s)
            db.delete(cms_page)
            db.commit()
            db.close()


# ---------------------------------------------------------------------------
# List snippets
# ---------------------------------------------------------------------------

class TestListSnippets:
    def test_list_snippets_empty(self):
        resp = client.get("/api/v1/admin/newsletter/snippets/list")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_snippets_filter_by_platform(self):
        db = SessionLocal()
        snippet = SocialSnippet(
            id=uuid.uuid4(),
            page_id=None,
            platform="pinterest",
            copy="Test pin copy",
            copy_title="Test pin title",
            status="draft",
            created_at=_now(),
        )
        db.add(snippet)
        db.commit()
        try:
            resp = client.get("/api/v1/admin/newsletter/snippets/list?platform=pinterest")
            assert resp.status_code == 200
            platforms = [s["platform"] for s in resp.json()]
            assert all(p == "pinterest" for p in platforms)
        finally:
            db.refresh(snippet)
            db.delete(snippet)
            db.commit()
            db.close()
