"""Tests for Step 56 — News Agent + /news API routes.

Note: admin auth enforcement is globally bypassed by conftest.py for all non-rbac tests.
Admin-protected routes are tested for functionality (correct response shape, 404 etc.)
rather than auth enforcement (which lives in test_rbac.py).
"""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.modules.agents.news import agent as news_mod
from app.modules.agents.news.agent import (
    fetch_news,
    filter_relevant,
    write_article,
    store_cms,
    generate_news,
    _fallback_article,
    _current_week_label,
    _fetch_rss,
    NewsState,
)
from app.modules.cms.models import CMSPage

client = TestClient(app, raise_server_exceptions=True)
ADMIN_HEADERS = {"X-Admin-Token": "test-admin-token"}


@pytest.fixture()
def db():
    gen = get_db()
    session = next(gen)
    try:
        yield session
    finally:
        session.rollback()
        try:
            next(gen)
        except StopIteration:
            pass


@pytest.fixture()
def trek_guide_page(db: Session) -> CMSPage:
    slug = f"test-trek-{uuid.uuid4().hex[:8]}"
    page = CMSPage(
        slug=slug,
        page_type="trek_guide",
        title="Kedarkantha Trek Guide",
        content_html="<h1>Kedarkantha</h1>",
        status="published",
        trek_name="Kedarkantha",
        trek_state="Uttarakhand",
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@pytest.fixture()
def news_page(db: Session) -> CMSPage:
    # Always use a unique slug so parallel or repeated test runs don't conflict.
    week = _current_week_label()
    slug = f"kedarkantha-news-{week}-{uuid.uuid4().hex[:8]}"
    page = CMSPage(
        slug=slug,
        page_type="news_article",
        title=f"Kedarkantha Trek News — Week {week}",
        content_html="<article><h1>News</h1></article>",
        status="published",
        seo_title="Kedarkantha Trek Latest News",
        seo_description="Latest news for Kedarkantha trek.",
        content_json={"trek_slug": "kedarkantha", "week_label": week, "faqs": [], "news_items": []},
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


_MOCK_RSS = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Google News</title>
    <item>
      <title>Kedarkantha Trek Trail Opens for Winter Season</title>
      <link>https://example.com/kedarkantha-opens</link>
      <pubDate>Mon, 26 May 2026 10:00:00 GMT</pubDate>
      <description>The Kedarkantha trail is now open for the winter season with fresh snowfall.</description>
      <source url="https://example.com">Hiking India</source>
    </item>
    <item>
      <title>Unrelated Article About Cricket</title>
      <link>https://example.com/cricket</link>
      <pubDate>Mon, 26 May 2026 09:00:00 GMT</pubDate>
      <description>India wins cricket match.</description>
      <source url="https://example.com">Sports News</source>
    </item>
  </channel>
</rss>"""


# ---------------------------------------------------------------------------
# TC-B01: _fetch_rss parses valid RSS XML and returns structured items
# ---------------------------------------------------------------------------
def test_fetch_rss_returns_items():
    mock_resp = MagicMock()
    mock_resp.text = _MOCK_RSS
    mock_resp.raise_for_status = MagicMock()

    with patch("app.modules.agents.news.agent.httpx.get", return_value=mock_resp):
        items = _fetch_rss("Kedarkantha trek")

    assert len(items) == 2
    assert items[0]["title"] == "Kedarkantha Trek Trail Opens for Winter Season"
    assert items[0]["source"] == "Hiking India"
    assert "link" in items[0]
    assert "summary" in items[0]


# ---------------------------------------------------------------------------
# TC-B02: _fetch_rss returns empty list on network failure
# ---------------------------------------------------------------------------
def test_fetch_rss_handles_error():
    with patch("app.modules.agents.news.agent.httpx.get", side_effect=Exception("network error")):
        items = _fetch_rss("Kedarkantha trek")
    assert items == []


# ---------------------------------------------------------------------------
# TC-B03: filter_relevant keeps trek-specific items and drops unrelated ones
# ---------------------------------------------------------------------------
def test_filter_relevant_filters():
    state: NewsState = {
        "trek_slug": "kedarkantha",
        "trek_name": "Kedarkantha",
        "trek_state": "Uttarakhand",
        "db": None,
        "raw_items": [
            {"title": "Kedarkantha Trek Trail Opens", "link": "", "published": "", "summary": "Kedarkantha snow trail", "source": ""},
            {"title": "Unrelated Cricket News", "link": "", "published": "", "summary": "India wins match", "source": ""},
        ],
        "relevant_items": [],
        "article_html": "",
        "article_title": "",
        "week_label": "2026-22",
        "news_slug": "kedarkantha-news-2026-22",
        "seo_title": "",
        "seo_description": "",
        "faqs": [],
        "result": None,
        "error": None,
    }
    result = filter_relevant(state)
    assert len(result["relevant_items"]) == 1
    assert "Kedarkantha" in result["relevant_items"][0]["title"]


# ---------------------------------------------------------------------------
# TC-B04: filter_relevant falls back to all raw items when nothing matches
# ---------------------------------------------------------------------------
def test_filter_relevant_fallback_to_raw():
    state: NewsState = {
        "trek_slug": "kedarkantha",
        "trek_name": "Kedarkantha",
        "trek_state": "Uttarakhand",
        "db": None,
        "raw_items": [
            {"title": "Generic News Article", "link": "", "published": "", "summary": "No mention of the trek.", "source": ""},
        ],
        "relevant_items": [],
        "article_html": "",
        "article_title": "",
        "week_label": "2026-22",
        "news_slug": "kedarkantha-news-2026-22",
        "seo_title": "",
        "seo_description": "",
        "faqs": [],
        "result": None,
        "error": None,
    }
    result = filter_relevant(state)
    # Falls back to raw items when nothing passes keyword filter
    assert len(result["relevant_items"]) == 1


# ---------------------------------------------------------------------------
# TC-B05: write_article generates fallback when no ANTHROPIC_API_KEY
# ---------------------------------------------------------------------------
def test_write_article_fallback_no_api_key():
    items = [{"title": "Kedarkantha Opens", "link": "http://x.com", "published": "", "summary": "Trail open.", "source": "HikingIndia"}]
    state: NewsState = {
        "trek_slug": "kedarkantha",
        "trek_name": "Kedarkantha",
        "trek_state": "Uttarakhand",
        "db": None,
        "raw_items": items,
        "relevant_items": items,
        "article_html": "",
        "article_title": "",
        "week_label": "2026-22",
        "news_slug": "kedarkantha-news-2026-22",
        "seo_title": "",
        "seo_description": "",
        "faqs": [],
        "result": None,
        "error": None,
    }
    with patch.object(news_mod.settings, "anthropic_api_key", None):
        result = write_article(state)

    assert "<h1>" in result["article_html"]
    assert "Kedarkantha" in result["article_title"]
    assert result["seo_title"]
    assert result["seo_description"]
    assert isinstance(result["faqs"], list) and len(result["faqs"]) >= 3


# ---------------------------------------------------------------------------
# TC-B06: write_article calls LLM and parses response when API key is set
# ---------------------------------------------------------------------------
def test_write_article_llm_called():
    items = [{"title": "Kedarkantha Opens", "link": "http://x.com", "published": "", "summary": "Trail open.", "source": "X"}]
    state: NewsState = {
        "trek_slug": "kedarkantha",
        "trek_name": "Kedarkantha",
        "trek_state": "Uttarakhand",
        "db": None,
        "raw_items": items,
        "relevant_items": items,
        "article_html": "",
        "article_title": "",
        "week_label": "2026-22",
        "news_slug": "kedarkantha-news-2026-22",
        "seo_title": "",
        "seo_description": "",
        "faqs": [],
        "result": None,
        "error": None,
    }

    mock_content = MagicMock()
    mock_content.text = (
        "<article><h1>Kedarkantha Trek News — Week 22, 2026</h1><p>Test content.</p></article>\n"
        "|||\n"
        '{"seo_title": "Kedarkantha Latest News", "seo_description": "Latest Kedarkantha news this week.", "faqs": [{"q": "Is it open?", "a": "Yes."}]}'
    )
    mock_response = MagicMock()
    mock_response.content = [mock_content]

    with patch.object(news_mod.settings, "anthropic_api_key", "test-key"):
        with patch("anthropic.Anthropic") as mock_anthropic:
            mock_anthropic.return_value.messages.create.return_value = mock_response
            result = write_article(state)

    assert "<article>" in result["article_html"]
    assert result["seo_title"] == "Kedarkantha Latest News"
    assert result["faqs"] == [{"q": "Is it open?", "a": "Yes."}]


# ---------------------------------------------------------------------------
# TC-B07: store_cms creates a new CMSPage when slug doesn't exist
# ---------------------------------------------------------------------------
def test_store_cms_creates_page(db: Session):
    week = _current_week_label()
    unique_slug = f"test-store-{uuid.uuid4().hex[:10]}-news-{week}"
    state: NewsState = {
        "trek_slug": "test-trek",
        "trek_name": "Test Trek",
        "trek_state": "Uttarakhand",
        "db": db,
        "raw_items": [],
        "relevant_items": [{"title": "Trail open", "link": "http://x.com", "published": "", "summary": "", "source": ""}],
        "article_html": "<article><h1>Test Trek News</h1></article>",
        "article_title": "Test Trek News",
        "week_label": week,
        "news_slug": unique_slug,
        "seo_title": "Test Trek Latest News",
        "seo_description": "Latest news for Test Trek.",
        "faqs": [{"q": "Is it open?", "a": "Yes."}],
        "result": None,
        "error": None,
    }
    result = store_cms(state)
    assert result["error"] is None
    assert result["result"] is not None
    assert result["result"]["slug"] == unique_slug
    assert result["result"]["updated"] is False
    assert result["result"]["items_count"] == 1


# ---------------------------------------------------------------------------
# TC-B08: store_cms updates an existing page when slug exists (idempotent)
# ---------------------------------------------------------------------------
def test_store_cms_updates_existing(db: Session, news_page: CMSPage):
    week = _current_week_label()
    state: NewsState = {
        "trek_slug": "kedarkantha",
        "trek_name": "Kedarkantha",
        "trek_state": "Uttarakhand",
        "db": db,
        "raw_items": [],
        "relevant_items": [],
        "article_html": "<article><h1>Updated News</h1></article>",
        "article_title": "Updated Title",
        "week_label": week,
        "news_slug": news_page.slug,
        "seo_title": "Updated SEO Title",
        "seo_description": "Updated description.",
        "faqs": [],
        "result": None,
        "error": None,
    }
    result = store_cms(state)
    assert result["error"] is None
    assert result["result"]["updated"] is True
    assert result["result"]["slug"] == news_page.slug


# ---------------------------------------------------------------------------
# TC-B09: generate_news end-to-end (mocked httpx + no LLM key)
# ---------------------------------------------------------------------------
def test_generate_news_end_to_end(db: Session):
    mock_resp = MagicMock()
    mock_resp.text = _MOCK_RSS
    mock_resp.raise_for_status = MagicMock()

    with patch("app.modules.agents.news.agent.httpx.get", return_value=mock_resp):
        with patch.object(news_mod.settings, "anthropic_api_key", None):
            result = generate_news(
                trek_slug=f"e2e-trek-{uuid.uuid4().hex[:8]}",
                trek_name="Kedarkantha",
                trek_state="Uttarakhand",
                db=db,
            )
    assert "slug" in result


# ---------------------------------------------------------------------------
# TC-B10: GET /public/news returns list including our fixture page
# ---------------------------------------------------------------------------
def test_api_list_news(news_page: CMSPage):
    resp = client.get("/api/v1/public/news")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    slugs = [item["slug"] for item in data]
    assert news_page.slug in slugs


# ---------------------------------------------------------------------------
# TC-B11: GET /public/news/{slug} returns the article
# ---------------------------------------------------------------------------
def test_api_get_news_article(news_page: CMSPage):
    resp = client.get(f"/api/v1/public/news/{news_page.slug}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == news_page.slug
    assert data["page_type"] == "news_article"
    assert "content_html" in data


# ---------------------------------------------------------------------------
# TC-B12: GET /public/news/{slug} — 404 for unknown slug
# ---------------------------------------------------------------------------
def test_api_get_news_article_404():
    resp = client.get("/api/v1/public/news/definitely-not-a-real-slug-xyz")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TC-B13: GET /public/news/by-trek/{trek_slug} returns only that trek's news
# ---------------------------------------------------------------------------
def test_api_get_news_by_trek(news_page: CMSPage):
    # news_page.slug starts with "kedarkantha-news-"
    resp = client.get("/api/v1/public/news/by-trek/kedarkantha")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    # All returned items must match the trek prefix
    for item in data:
        assert item["slug"].startswith("kedarkantha-news-")


# ---------------------------------------------------------------------------
# TC-B14: GET /public/news/by-trek/{trek_slug} — empty list for unknown trek
# ---------------------------------------------------------------------------
def test_api_get_news_by_trek_empty():
    resp = client.get("/api/v1/public/news/by-trek/nonexistent-trek-zzz")
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# TC-B15: POST /admin/news/generate/{trek_slug} — 404 when trek_guide not found
# ---------------------------------------------------------------------------
def test_api_generate_news_trek_not_found():
    resp = client.post(
        "/api/v1/admin/news/generate/nonexistent-trek-slug-xyz",
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TC-B16: POST /admin/news/generate/{trek_slug} — queues task for valid trek
# ---------------------------------------------------------------------------
def test_api_generate_news_queues_task(trek_guide_page: CMSPage):
    with patch("app.worker.tasks.news.generate_news_for_trek") as mock_task:
        mock_task.delay.return_value = MagicMock(id="test-task-id-123")
        resp = client.post(
            f"/api/v1/admin/news/generate/{trek_guide_page.slug}",
            headers=ADMIN_HEADERS,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "queued"
    assert data["trek_slug"] == trek_guide_page.slug
    assert data["trek_name"] == "Kedarkantha"
    assert "task_id" in data


# ---------------------------------------------------------------------------
# TC-B17: _fallback_article returns valid HTML with h1 and article tags
# ---------------------------------------------------------------------------
def test_fallback_article_structure():
    html = _fallback_article("Kedarkantha", "Week 22, 2026", [
        {"title": "Test News", "link": "http://x.com", "published": "", "summary": "Summary text.", "source": "Source"},
    ])
    assert "<h1>" in html
    assert "Kedarkantha" in html
    assert "<article>" in html
    assert "nofollow" in html  # outbound links should have nofollow


# ---------------------------------------------------------------------------
# TC-B18: _current_week_label returns YYYY-WW format
# ---------------------------------------------------------------------------
def test_current_week_label_format():
    label = _current_week_label()
    parts = label.split("-")
    assert len(parts) == 2
    year, week = int(parts[0]), int(parts[1])
    assert 2024 <= year <= 2030
    assert 1 <= week <= 53
