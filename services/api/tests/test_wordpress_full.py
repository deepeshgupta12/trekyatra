"""Step 16 — WordPress full integration tests.

All tests mock WordPressClient methods so no live WP instance is needed.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.wordpress.cache import cache_delete, cache_get, cache_set, wp_post_key, wp_posts_key
from app.modules.wordpress.client import WordPressClientError, WordPressClientResult
from app.modules.wordpress.service import (
    _normalize_wp_post,
    ensure_wp_category,
    ensure_wp_tag,
    get_wp_post,
    list_wp_posts,
)

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ok_result(payload: dict | list) -> WordPressClientResult:
    return WordPressClientResult(
        endpoint="http://localhost:8080/wp-json/wp/v2/posts",
        status_code=200,
        ok=True,
        message="OK",
        payload=payload,
        total=len(payload) if isinstance(payload, list) else None,
        total_pages=1 if isinstance(payload, list) else None,
    )


def _err_result(status_code: int = 500) -> WordPressClientResult:
    return WordPressClientResult(
        endpoint="http://localhost:8080/wp-json/wp/v2/posts",
        status_code=status_code,
        ok=False,
        message=f"HTTP {status_code}",
        payload=None,
    )


_SAMPLE_RAW_POST = {
    "id": 42,
    "slug": "kedarkantha",
    "title": {"rendered": "Kedarkantha Trek"},
    "content": {"rendered": "<p>Full guide</p>"},
    "excerpt": {"rendered": "<p>Short intro</p>"},
    "status": "publish",
    "type": "trek_guide",
    "link": "http://localhost:8080/trek-guide/kedarkantha",
    "date": "2026-01-01T00:00:00",
    "meta": {"content_type": "trek_guide", "cluster_id": "abc"},
}

_SAMPLE_NORM = {
    "id": 42,
    "slug": "kedarkantha",
    "title": "Kedarkantha Trek",
    "content": "<p>Full guide</p>",
    "excerpt": "<p>Short intro</p>",
    "status": "publish",
    "post_type": "trek_guide",
    "link": "http://localhost:8080/trek-guide/kedarkantha",
    "date": "2026-01-01T00:00:00",
    "meta": {"content_type": "trek_guide", "cluster_id": "abc"},
}


# ---------------------------------------------------------------------------
# _normalize_wp_post
# ---------------------------------------------------------------------------

def test_normalize_wp_post_extracts_rendered_fields() -> None:
    result = _normalize_wp_post(_SAMPLE_RAW_POST)
    assert result["title"] == "Kedarkantha Trek"
    assert result["content"] == "<p>Full guide</p>"
    assert result["post_type"] == "trek_guide"
    assert result["meta"] == {"content_type": "trek_guide", "cluster_id": "abc"}


def test_normalize_wp_post_handles_plain_strings() -> None:
    raw = {**_SAMPLE_RAW_POST, "title": "Plain Title", "content": "Body"}
    result = _normalize_wp_post(raw)
    assert result["title"] == "Plain Title"
    assert result["content"] == "Body"


# ---------------------------------------------------------------------------
# list_wp_posts service
# ---------------------------------------------------------------------------

def test_list_wp_posts_returns_normalized_posts() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.list_posts.return_value = _ok_result([_SAMPLE_RAW_POST])
        mock_build.return_value = mock_client

        # clear any cached value
        cache_delete(wp_posts_key("trek_guide", 1))

        result = list_wp_posts(post_type="trek_guide", status="publish", per_page=10, page=1)

    assert result["total"] == 1
    assert result["posts"][0]["title"] == "Kedarkantha Trek"


def test_list_wp_posts_uses_cache_on_second_call() -> None:
    cache_key = wp_posts_key("trek_guide", 1)
    cached_data = {"posts": [_SAMPLE_NORM], "total": 1, "pages": 1}
    cache_set(cache_key, cached_data)

    with patch("app.modules.wordpress.service._build_client") as mock_build:
        result = list_wp_posts(post_type="trek_guide", page=1)
        mock_build.assert_not_called()

    assert result["posts"][0]["slug"] == "kedarkantha"
    cache_delete(cache_key)


def test_list_wp_posts_raises_on_wp_error() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.list_posts.return_value = _err_result(503)
        mock_build.return_value = mock_client
        cache_delete(wp_posts_key("post", 1))

        with pytest.raises(WordPressClientError, match="Failed to list WP posts"):
            list_wp_posts()


# ---------------------------------------------------------------------------
# get_wp_post service
# ---------------------------------------------------------------------------

def test_get_wp_post_returns_normalized() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.get_post.return_value = _ok_result([_SAMPLE_RAW_POST])
        mock_build.return_value = mock_client
        cache_delete(wp_post_key("kedarkantha"))

        result = get_wp_post(slug="kedarkantha")

    assert result["id"] == 42
    assert result["title"] == "Kedarkantha Trek"


def test_get_wp_post_uses_cache() -> None:
    cache_key = wp_post_key("kedarkantha")
    cache_set(cache_key, _SAMPLE_NORM)

    with patch("app.modules.wordpress.service._build_client") as mock_build:
        result = get_wp_post(slug="kedarkantha")
        mock_build.assert_not_called()

    assert result["slug"] == "kedarkantha"
    cache_delete(cache_key)


def test_get_wp_post_raises_when_not_found() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.get_post.return_value = _ok_result([])  # empty list = not found
        mock_build.return_value = mock_client
        cache_delete(wp_post_key("missing-slug"))

        with pytest.raises(WordPressClientError, match="No WP post found"):
            get_wp_post(slug="missing-slug")


def test_get_wp_post_raises_on_wp_error() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.get_post.return_value = _err_result(404)
        mock_build.return_value = mock_client
        cache_delete(wp_post_key("bad-slug"))

        with pytest.raises(WordPressClientError):
            get_wp_post(slug="bad-slug")


# ---------------------------------------------------------------------------
# ensure_wp_category
# ---------------------------------------------------------------------------

def test_ensure_category_returns_existing() -> None:
    existing = {"id": 5, "name": "Himalayan Treks", "slug": "himalayan-treks"}
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.ensure_category.return_value = _ok_result(existing)
        mock_build.return_value = mock_client

        result = ensure_wp_category(name="Himalayan Treks")

    assert result["id"] == 5
    assert result["name"] == "Himalayan Treks"


def test_ensure_category_raises_on_error() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.ensure_category.return_value = _err_result(400)
        mock_build.return_value = mock_client

        with pytest.raises(WordPressClientError, match="Failed to ensure WP category"):
            ensure_wp_category(name="Bad Category")


# ---------------------------------------------------------------------------
# ensure_wp_tag
# ---------------------------------------------------------------------------

def test_ensure_tag_returns_existing() -> None:
    existing = {"id": 7, "name": "beginner", "slug": "beginner"}
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.ensure_tag.return_value = _ok_result(existing)
        mock_build.return_value = mock_client

        result = ensure_wp_tag(name="beginner")

    assert result["id"] == 7


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

def test_api_list_posts_returns_503_when_wp_down() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.list_posts.side_effect = WordPressClientError("WP unreachable")
        mock_build.return_value = mock_client
        cache_delete(wp_posts_key("post", 1))

        r = client.get("/api/v1/wordpress/posts")

    assert r.status_code == 503


def test_api_get_post_returns_503_when_wp_down() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.get_post.side_effect = WordPressClientError("WP unreachable")
        mock_build.return_value = mock_client
        cache_delete(wp_post_key("some-slug"))

        r = client.get("/api/v1/wordpress/posts/some-slug")

    assert r.status_code == 503


def test_api_list_posts_200_with_mocked_data() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.list_posts.return_value = _ok_result([_SAMPLE_RAW_POST])
        mock_build.return_value = mock_client
        cache_delete(wp_posts_key("post", 1))

        r = client.get("/api/v1/wordpress/posts")

    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert body["posts"][0]["slug"] == "kedarkantha"


def test_api_get_post_200_with_mocked_data() -> None:
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.get_post.return_value = _ok_result([_SAMPLE_RAW_POST])
        mock_build.return_value = mock_client
        cache_delete(wp_post_key("kedarkantha"))

        r = client.get("/api/v1/wordpress/posts/kedarkantha")

    assert r.status_code == 200
    assert r.json()["id"] == 42


def test_api_create_category_200() -> None:
    cat = {"id": 3, "name": "Easy Treks", "slug": "easy-treks"}
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.ensure_category.return_value = _ok_result(cat)
        mock_build.return_value = mock_client

        r = client.post("/api/v1/wordpress/categories", json={"name": "Easy Treks"})

    assert r.status_code == 200
    assert r.json()["id"] == 3


def test_api_create_tag_200() -> None:
    tag = {"id": 9, "name": "winter", "slug": "winter"}
    with patch("app.modules.wordpress.service._build_client") as mock_build:
        mock_client = MagicMock()
        mock_client.ensure_tag.return_value = _ok_result(tag)
        mock_build.return_value = mock_client

        r = client.post("/api/v1/wordpress/tags", json={"name": "winter"})

    assert r.status_code == 200
    assert r.json()["name"] == "winter"
