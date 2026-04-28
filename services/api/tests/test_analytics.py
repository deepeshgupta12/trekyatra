"""Tests for analytics: affiliate click tracking and summary endpoint."""
from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.main import app
from app.modules.analytics.models import AffiliateClick

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_affiliate_clicks():
    with SessionLocal() as db:
        pre_ids = [r[0] for r in db.execute(select(AffiliateClick.id)).all()]
    yield
    with SessionLocal() as db:
        if pre_ids:
            db.execute(delete(AffiliateClick).where(AffiliateClick.id.not_in(pre_ids)))
        else:
            db.execute(delete(AffiliateClick))
        db.commit()


def test_track_affiliate_click_returns_201() -> None:
    r = client.post(
        "/api/v1/track/affiliate-click",
        json={"page_slug": "/trek/kedarkantha", "affiliate_program": "amazon"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["page_slug"] == "/trek/kedarkantha"
    assert data["affiliate_program"] == "amazon"
    assert data["id"] is not None
    assert data["clicked_at"] is not None


def test_track_affiliate_click_with_optional_fields() -> None:
    r = client.post(
        "/api/v1/track/affiliate-click",
        json={
            "page_slug": "/packing/hampta-pass",
            "affiliate_program": "flipkart",
            "affiliate_link_url": "https://flipkart.com/product/123",
            "session_id": "abc123",
        },
    )
    assert r.status_code == 201
    data = r.json()
    assert data["affiliate_link_url"] == "https://flipkart.com/product/123"


def test_track_affiliate_click_missing_program_returns_422() -> None:
    r = client.post(
        "/api/v1/track/affiliate-click",
        json={"page_slug": "/trek/kedarkantha"},
    )
    assert r.status_code == 422


def test_analytics_summary_returns_expected_shape() -> None:
    r = client.get("/api/v1/admin/analytics/summary")
    assert r.status_code == 200
    data = r.json()
    assert "leads_last_30d" in data
    assert "affiliate_clicks_last_30d" in data
    assert "newsletter_subscribers_total" in data
    assert "pages_published_total" in data
    assert "pipeline_runs_last_30d" in data
    assert "agent_runs_last_30d" in data
    for v in data.values():
        assert isinstance(v, int)
        assert v >= 0


def test_analytics_summary_click_count_increments() -> None:
    r_before = client.get("/api/v1/admin/analytics/summary")
    before = r_before.json()["affiliate_clicks_last_30d"]

    client.post(
        "/api/v1/track/affiliate-click",
        json={"page_slug": "/trek/rupin-pass", "affiliate_program": "amazon"},
    )

    r_after = client.get("/api/v1/admin/analytics/summary")
    after = r_after.json()["affiliate_clicks_last_30d"]
    assert after == before + 1
