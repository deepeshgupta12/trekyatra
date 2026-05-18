"""Tests for Step 45 — Image Gathering Agent."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.modules.agents.image_search.service import (
    _slug_to_search_terms,
    find_trek_image,
)
from app.modules.agents.image_search.agent import run_image_search


# ---------------------------------------------------------------------------
# Service unit tests
# ---------------------------------------------------------------------------

def test_slug_to_search_terms_returns_list():
    terms = _slug_to_search_terms("Kedarkantha Trek", "Uttarakhand")
    assert isinstance(terms, list)
    assert len(terms) >= 2
    assert any("Kedarkantha" in t for t in terms)
    assert any("Uttarakhand" in t for t in terms)


def test_find_trek_image_returns_none_when_no_keys(monkeypatch):
    """When no API keys are set and Wikimedia times out, returns (None, None)."""
    monkeypatch.setattr("app.core.config.settings.unsplash_access_key", None)
    monkeypatch.setattr("app.core.config.settings.pixabay_api_key", None)
    with patch("app.modules.agents.image_search.service.httpx.get") as mock_get:
        # Make all HTTP calls raise so Wikimedia also fails
        mock_get.side_effect = Exception("timeout")
        url, source = find_trek_image("Kedarkantha Trek", "Uttarakhand")
        assert url is None
        assert source is None


def test_find_trek_image_uses_unsplash_when_key_available(monkeypatch):
    """When Unsplash key is set and returns a result, uses it."""
    monkeypatch.setattr("app.core.config.settings.unsplash_access_key", "test-key")
    monkeypatch.setattr("app.core.config.settings.pixabay_api_key", None)

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {"urls": {"regular": "https://images.unsplash.com/test.jpg"}, "width": 1200}
    ]

    with patch("app.modules.agents.image_search.service.httpx.get", return_value=mock_response):
        url, source = find_trek_image("Kedarkantha Trek", "Uttarakhand")
        assert url == "https://images.unsplash.com/test.jpg"
        assert source == "unsplash"


def test_find_trek_image_falls_back_to_pixabay(monkeypatch):
    """Falls back to Pixabay when Unsplash is not configured."""
    monkeypatch.setattr("app.core.config.settings.unsplash_access_key", None)
    monkeypatch.setattr("app.core.config.settings.pixabay_api_key", "px-key")

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "hits": [{"webformatURL": "https://pixabay.com/img_640.jpg", "webformatWidth": 1280}]
    }

    with patch("app.modules.agents.image_search.service.httpx.get", return_value=mock_response):
        url, source = find_trek_image("Hampta Pass", "Himachal Pradesh")
        assert url is not None
        assert source == "pixabay"


# ---------------------------------------------------------------------------
# Agent integration tests
# ---------------------------------------------------------------------------

def test_run_image_search_skips_when_page_has_image():
    """Does not overwrite an existing hero_image_url."""
    db = MagicMock()
    mock_page = MagicMock()
    mock_page.hero_image_url = "https://existing.com/image.jpg"
    db.query.return_value.filter.return_value.first.return_value = mock_page

    with patch("app.modules.cms.service.get_page_by_slug", return_value=mock_page):
        result = run_image_search(db, page_slug="kedarkantha", trek_name="Kedarkantha Trek")
        assert result is False


def test_run_image_search_returns_false_when_no_image_found():
    """Returns False gracefully when no image is found."""
    db = MagicMock()
    mock_page = MagicMock()
    mock_page.hero_image_url = None

    with patch("app.modules.cms.service.get_page_by_slug", return_value=mock_page):
        with patch("app.modules.agents.image_search.service.find_trek_image", return_value=(None, None)):
            result = run_image_search(db, page_slug="unknown-trek", trek_name="Unknown Trek")
            assert result is False


def test_run_image_search_never_raises():
    """Agent is always safe to call — never propagates exceptions."""
    db = MagicMock()
    db.side_effect = Exception("DB connection lost")

    with patch("app.modules.cms.service.get_page_by_slug", side_effect=Exception("error")):
        # Should not raise
        result = run_image_search(db, page_slug="any", trek_name="Any Trek")
        assert result is False
