"""Tests for Step 56 — News Agent + /news API routes.

Rewritten for per-item article architecture: one CMS page per RSS item.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
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
    write_and_store_articles,
    generate_news,
    _fallback_for_item,
    _current_week_label,
    _slug_from_title,
    _clean_title,
    _fetch_rss,
    _is_recent,
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
    uid = uuid.uuid4().hex[:8]
    slug = f"kedarkantha-trail-opens-{uid}-2026-05"
    page = CMSPage(
        slug=slug,
        page_type="news_article",
        title="Kedarkantha Trail Opens for Winter Season",
        content_html=(
            '<article><h1>Kedarkantha Trail Opens</h1>'
            '<h2 id="what-happened">What Happened</h2>'
            '<p>The trail opened.</p></article>'
        ),
        status="published",
        seo_title="Kedarkantha Trail Opens | Kedarkantha News",
        seo_description="The trail is open for winter season.",
        content_json={
            "trek_slug": "kedarkantha",
            "news_item": {
                "title": "Kedarkantha Trail Opens — Hiking India",
                "link": "http://x.com",
                "published": "",
                "summary": "Trail open for winter.",
                "source": "Hiking India",
            },
            "faqs": [],
        },
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
        "articles": [],
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
        "articles": [],
        "error": None,
    }
    result = filter_relevant(state)
    assert len(result["relevant_items"]) == 1


# ---------------------------------------------------------------------------
# TC-B05: _fallback_for_item returns valid HTML with h1 and article tags
# ---------------------------------------------------------------------------
def test_fallback_for_item_structure():
    item = {
        "title": "Kedarkantha Opens — Hiking India",
        "link": "http://x.com",
        "published": "",
        "summary": "Trail open for winter.",
        "source": "Hiking India",
    }
    html = _fallback_for_item("Kedarkantha", item)
    assert "<article>" in html
    assert "<h1>" in html
    assert "Kedarkantha" in html
    assert "nofollow" in html
    assert 'id="what-happened"' in html
    assert 'id="impact-on-trekkers"' in html


# ---------------------------------------------------------------------------
# TC-B06: _slug_from_title strips source attribution and appends YYYY-MM
# ---------------------------------------------------------------------------
def test_slug_from_title_strips_attribution():
    ym = datetime.now(timezone.utc).strftime("%Y-%m")
    slug = _slug_from_title("kedarkantha", "Kedarkantha Trail Opens — Hiking India")
    assert "hiking-india" not in slug
    assert slug.endswith(f"-{ym}")
    assert "kedarkantha" in slug


def test_slug_from_title_dash_source():
    ym = datetime.now(timezone.utc).strftime("%Y-%m")
    slug = _slug_from_title("triund", "Triund Trek News - Times of India")
    assert "times-of-india" not in slug
    assert slug.endswith(f"-{ym}")


# ---------------------------------------------------------------------------
# TC-B07: _clean_title removes source attribution suffix
# ---------------------------------------------------------------------------
def test_clean_title_strips_attribution():
    assert _clean_title("Kedarkantha Opens — Hiking India") == "Kedarkantha Opens"
    assert _clean_title("Triund Trek News - Times of India") == "Triund Trek News"
    assert _clean_title("No attribution here") == "No attribution here"


# ---------------------------------------------------------------------------
# TC-B08: write_and_store_articles creates one CMS page per item (no LLM key)
# ---------------------------------------------------------------------------
def test_write_and_store_articles_creates_per_item(db: Session):
    uid = uuid.uuid4().hex[:8]
    items = [
        {"title": f"Trail Opens {uid} — Hiking India", "link": "http://x.com/1", "published": "", "summary": "Trail open.", "source": "HikingIndia"},
        {"title": f"Permits Required {uid} — News", "link": "http://x.com/2", "published": "", "summary": "Permit update.", "source": "News"},
    ]
    state: NewsState = {
        "trek_slug": f"kedarkantha-{uid}",
        "trek_name": "Kedarkantha",
        "trek_state": "Uttarakhand",
        "db": db,
        "raw_items": items,
        "relevant_items": items,
        "articles": [],
        "error": None,
    }
    with patch.object(news_mod.settings, "anthropic_api_key", None):
        result = write_and_store_articles(state)

    assert result["error"] is None
    assert len(result["articles"]) == 2
    created = [a for a in result["articles"] if not a.get("skipped") and "error" not in a]
    assert len(created) == 2
    # Each article gets a distinct slug
    slugs = {a["slug"] for a in result["articles"]}
    assert len(slugs) == 2


# ---------------------------------------------------------------------------
# TC-B09: write_and_store_articles skips existing slugs (idempotent)
# ---------------------------------------------------------------------------
def test_write_and_store_articles_skips_existing(db: Session):
    uid = uuid.uuid4().hex[:8]
    item = {"title": f"Trail Opens {uid} — HikingIndia", "link": "http://x.com", "published": "", "summary": "Trail open.", "source": "HikingIndia"}
    state: NewsState = {
        "trek_slug": f"kedarkantha-{uid}",
        "trek_name": "Kedarkantha",
        "trek_state": "Uttarakhand",
        "db": db,
        "raw_items": [item],
        "relevant_items": [item],
        "articles": [],
        "error": None,
    }
    with patch.object(news_mod.settings, "anthropic_api_key", None):
        write_and_store_articles(state)
    # Run again — same item should be skipped
    state2: NewsState = {**state, "articles": []}  # type: ignore[misc]
    with patch.object(news_mod.settings, "anthropic_api_key", None):
        result2 = write_and_store_articles(state2)

    skipped = [a for a in result2["articles"] if a.get("skipped")]
    assert len(skipped) == 1


# ---------------------------------------------------------------------------
# TC-B10: generate_news returns articles_created / articles_skipped / articles
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
    assert "articles_created" in result
    assert "articles_skipped" in result
    assert "articles" in result
    assert isinstance(result["articles"], list)


# ---------------------------------------------------------------------------
# TC-B11: GET /public/news returns list including our fixture page
# ---------------------------------------------------------------------------
def test_api_list_news(news_page: CMSPage):
    resp = client.get("/api/v1/public/news")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    slugs = [item["slug"] for item in data]
    assert news_page.slug in slugs


# ---------------------------------------------------------------------------
# TC-B12: GET /public/news/{slug} returns the article
# ---------------------------------------------------------------------------
def test_api_get_news_article(news_page: CMSPage):
    resp = client.get(f"/api/v1/public/news/{news_page.slug}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == news_page.slug
    assert data["page_type"] == "news_article"
    assert "content_html" in data


# ---------------------------------------------------------------------------
# TC-B13: GET /public/news/{slug} — 404 for unknown slug
# ---------------------------------------------------------------------------
def test_api_get_news_article_404():
    resp = client.get("/api/v1/public/news/definitely-not-a-real-slug-xyz")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TC-B14: GET /public/news/by-trek/{trek_slug} returns that trek's news
# ---------------------------------------------------------------------------
def test_api_get_news_by_trek(news_page: CMSPage):
    resp = client.get("/api/v1/public/news/by-trek/kedarkantha")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert any(item["slug"] == news_page.slug for item in data)


# ---------------------------------------------------------------------------
# TC-B15: GET /public/news/by-trek/{trek_slug} — empty list for unknown trek
# ---------------------------------------------------------------------------
def test_api_get_news_by_trek_empty():
    resp = client.get("/api/v1/public/news/by-trek/nonexistent-trek-zzz")
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# TC-B16: POST /admin/news/generate/{trek_slug} — 404 when trek_guide not found
# ---------------------------------------------------------------------------
def test_api_generate_news_trek_not_found():
    resp = client.post(
        "/api/v1/admin/news/generate/nonexistent-trek-slug-xyz",
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TC-B17: POST /admin/news/generate/{trek_slug} — queues task for valid trek
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
# TC-B18: _current_week_label returns YYYY-WW format
# ---------------------------------------------------------------------------
def test_current_week_label_format():
    label = _current_week_label()
    parts = label.split("-")
    assert len(parts) == 2
    year, week = int(parts[0]), int(parts[1])
    assert 2024 <= year <= 2030
    assert 1 <= week <= 53


# ---------------------------------------------------------------------------
# TC-B19: _is_recent accepts items within 90-day window
# ---------------------------------------------------------------------------
def test_is_recent_recent_date():
    # RFC 2822 date within last 30 days — should be kept
    assert _is_recent("Mon, 26 May 2026 10:00:00 GMT", days=90) is True


# ---------------------------------------------------------------------------
# TC-B20: _is_recent rejects items older than the cutoff
# ---------------------------------------------------------------------------
def test_is_recent_old_date():
    # RFC 2822 date well over 90 days ago — should be filtered
    assert _is_recent("Mon, 01 Jan 2024 10:00:00 GMT", days=90) is False


# ---------------------------------------------------------------------------
# TC-B21: _is_recent keeps items with missing or unparseable date (safe default)
# ---------------------------------------------------------------------------
def test_is_recent_missing_date():
    assert _is_recent("", days=90) is True
    assert _is_recent("not-a-date", days=90) is True
