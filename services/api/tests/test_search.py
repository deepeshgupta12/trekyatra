"""Tests for Step 44 — Search API."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=True)


# ---------------------------------------------------------------------------
# POST /search/log
# ---------------------------------------------------------------------------

def test_search_log_returns_204():
    res = client.post("/api/v1/search/log", json={"query": "kedarkantha trek", "results_count": 5})
    assert res.status_code == 204


def test_search_log_empty_query_is_no_op():
    res = client.post("/api/v1/search/log", json={"query": "   ", "results_count": 0})
    assert res.status_code == 204


def test_search_log_with_click():
    res = client.post(
        "/api/v1/search/log",
        json={
            "query": "valley of flowers permit",
            "results_count": 3,
            "clicked_slug": "valley-of-flowers",
            "clicked_page_type": "trek_guide",
            "session_id": "test-session-123",
        },
    )
    assert res.status_code == 204


# ---------------------------------------------------------------------------
# GET /search/suggestions
# ---------------------------------------------------------------------------

def test_search_suggestions_requires_min_2_chars():
    res = client.get("/api/v1/search/suggestions?q=k")
    assert res.status_code == 422  # FastAPI validates min_length=2


def test_search_suggestions_returns_list():
    res = client.get("/api/v1/search/suggestions?q=trek")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_search_suggestions_respects_limit():
    res = client.get("/api/v1/search/suggestions?q=trek&limit=3")
    assert res.status_code == 200
    assert len(res.json()) <= 3


def test_search_suggestions_fields():
    """Verify response shape has required fields."""
    res = client.get("/api/v1/search/suggestions?q=trekking")
    assert res.status_code == 200
    for item in res.json():
        assert "slug" in item
        assert "title" in item
        assert "page_type" in item
        assert "hero_image_url" in item
        assert "seo_description" in item


# ---------------------------------------------------------------------------
# GET /search/trending
# ---------------------------------------------------------------------------

def test_search_trending_returns_list():
    res = client.get("/api/v1/search/trending")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
