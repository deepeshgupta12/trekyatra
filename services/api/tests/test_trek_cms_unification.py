"""Tests for Step 46 — Trek CMS Unification + Pipeline Quality Fixes.

Covers:
- _slugify_trek: noise-suffix stripping
- _strip_flagged_markers: extended regex for 'flagged for review' variants
- _state_from_base: state extraction from base field
- _suitability_from_difficulty: suitability label derivation
- trek metadata columns: populated at upsert_page_from_draft
- CMSPage schema includes trek metadata fields
"""
from __future__ import annotations

import re

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.cms.service import (
    _state_from_base,
    _suitability_from_difficulty,
    _strip_flagged_markers,
    _strip_flagged_markers_html,
)

client = TestClient(app, raise_server_exceptions=True)


# ---------------------------------------------------------------------------
# Import _slugify_trek from content writing agent
# ---------------------------------------------------------------------------
from app.modules.agents.content_writing.agent import _slugify_trek


# ---------------------------------------------------------------------------
# TC-B01 to TC-B06: _slugify_trek — noise stripping
# ---------------------------------------------------------------------------

def test_slugify_trek_strips_trek_suffix():
    assert _slugify_trek("Kedarkantha Trek") == "kedarkantha"


def test_slugify_trek_strips_pass_with_trek():
    assert _slugify_trek("Hampta Pass Trek") == "hampta-pass"


def test_slugify_trek_strips_complete_guide():
    assert _slugify_trek("Valley of Flowers Complete Guide") == "valley-of-flowers"


def test_slugify_trek_strips_trekking_guide():
    assert _slugify_trek("Brahmatal Trekking Guide") == "brahmatal"


def test_slugify_trek_no_suffix_unchanged():
    assert _slugify_trek("Kedarkantha") == "kedarkantha"


def test_slugify_trek_strips_year_suffix():
    assert _slugify_trek("Kedarkantha Trek 2026") == "kedarkantha"


def test_slugify_trek_multi_word_place():
    assert _slugify_trek("Kashmir Great Lakes Trek") == "kashmir-great-lakes"


# ---------------------------------------------------------------------------
# TC-B07 to TC-B12: _strip_flagged_markers — extended variants
# ---------------------------------------------------------------------------

def test_strip_flagged_parenthesis_verification():
    text = "The fee is ₹200 (flagged for verification — rates vary)"
    result = _strip_flagged_markers(text)
    assert "flagged" not in result.lower()
    assert "₹200" in result


def test_strip_flagged_parenthesis_review():
    text = "Altitude: 12,500 ft (flagged for review)"
    result = _strip_flagged_markers(text)
    assert "flagged" not in result.lower()
    assert "12,500 ft" in result


def test_strip_flagged_bracket_review():
    text = "Distance: 28 km [flagged for review — verify with operator]"
    result = _strip_flagged_markers(text)
    assert "flagged" not in result.lower()
    assert "28 km" in result


def test_strip_flagged_html_em():
    html = "Price is ₹1500 <em>(flagged for review)</em> per person."
    result = _strip_flagged_markers_html(html)
    assert "flagged" not in result.lower()
    assert "₹1500" in result


def test_strip_flagged_html_review_variant():
    html = "Cost: <em>(flagged for verification — 2026 rates pending)</em>"
    result = _strip_flagged_markers_html(html)
    assert "flagged" not in result.lower()


def test_strip_flagged_preserves_normal_text():
    text = "This is a great trek with stunning views."
    result = _strip_flagged_markers(text)
    assert result == text


# ---------------------------------------------------------------------------
# TC-B13 to TC-B16: _state_from_base and _suitability_from_difficulty
# ---------------------------------------------------------------------------

def test_state_from_base_village_state():
    assert _state_from_base("Sankri, Uttarakhand") == "Uttarakhand"


def test_state_from_base_multiple_parts():
    assert _state_from_base("Manali, Kullu, Himachal Pradesh") == "Himachal Pradesh"


def test_state_from_base_no_comma():
    assert _state_from_base("Uttarakhand") == ""


def test_state_from_base_empty():
    assert _state_from_base("") == ""


def test_suitability_easy():
    assert _suitability_from_difficulty("Easy") == "Beginners"


def test_suitability_beginner():
    assert _suitability_from_difficulty("Beginner Friendly") == "Beginners"


def test_suitability_moderate():
    assert "Intermediate" in _suitability_from_difficulty("Moderate")


def test_suitability_difficult():
    assert "Experienced" in _suitability_from_difficulty("Difficult")


# ---------------------------------------------------------------------------
# TC-B17: CMSPage API response includes trek metadata fields
# ---------------------------------------------------------------------------

def test_cms_page_response_has_trek_fields():
    """Verify the /cms/pages endpoint returns trek metadata keys."""
    res = client.get("/api/v1/cms/pages?page_type=trek_guide&limit=1")
    assert res.status_code == 200
    data = res.json()
    # API returns a list directly
    pages = data if isinstance(data, list) else data.get("pages", [])
    if pages:
        page = pages[0]
        # All trek metadata keys must be present (null is fine for non-trek pages)
        for field in ("trek_name", "trek_state", "trek_difficulty", "trek_duration", "trek_season", "trek_suitability"):
            assert field in page, f"Missing field: {field}"
