"""Tests for Step 37 — multilingual content workflows."""
from __future__ import annotations

import json
import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.modules.cms.models import CMSPage
from app.modules.agents.translation import agent as translation_mod
from app.modules.agents.translation.agent import load_glossary, translate_page, SUPPORTED_LANGUAGES
from app.modules.auth.dependencies import get_current_admin

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
def override_admin():
    app.dependency_overrides[get_current_admin] = lambda: {"sub": "admin"}
    yield
    app.dependency_overrides.pop(get_current_admin, None)


@pytest.fixture()
def cms_page(db: Session) -> CMSPage:
    page = CMSPage(
        slug=f"test-trek-{uuid.uuid4().hex[:6]}",
        page_type="trek_guide",
        title="Kedarkantha Trek Guide",
        content_html="<h1>Kedarkantha Trek</h1><p>A beautiful winter trek.</p>",
        status="published",
        language="en",
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


# ---------------------------------------------------------------------------
# TC-B01: glossary loads and contains expected proper nouns
# ---------------------------------------------------------------------------
def test_glossary_loads():
    nouns = load_glossary()
    assert isinstance(nouns, list)
    assert len(nouns) > 0
    assert "Kedarkantha" in nouns
    assert "Uttarakhand" in nouns


# ---------------------------------------------------------------------------
# TC-B02: SUPPORTED_LANGUAGES contains hi and mr
# ---------------------------------------------------------------------------
def test_supported_languages():
    assert "hi" in SUPPORTED_LANGUAGES
    assert "mr" in SUPPORTED_LANGUAGES
    assert SUPPORTED_LANGUAGES["hi"] == "Hindi"


# ---------------------------------------------------------------------------
# TC-B03: translate_page falls back gracefully when no API key
# ---------------------------------------------------------------------------
def test_translate_page_no_api_key(monkeypatch):
    monkeypatch.setattr("app.modules.agents.translation.agent.settings.anthropic_api_key", None)
    result = translate_page("Test Title", "<p>Content</p>", "hi")
    assert result["title"] == "Test Title"
    assert result["content_html"] == "<p>Content</p>"
    assert result["fallback"] == "true"


# ---------------------------------------------------------------------------
# TC-B04: translate_page calls LLM when API key is set (mocked)
# ---------------------------------------------------------------------------
def test_translate_page_with_mocked_llm(monkeypatch):
    monkeypatch.setattr("app.modules.agents.translation.agent.settings.anthropic_api_key", "sk-test")
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"title": "केदारकंठा ट्रेक गाइड", "content_html": "<h1>केदारकंठा</h1>"}')]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response
    with patch.object(translation_mod._anthropic, "Anthropic", return_value=mock_client):
        result = translate_page("Kedarkantha Trek Guide", "<h1>Kedarkantha</h1>", "hi")
    assert result["title"] == "केदारकंठा ट्रेक गाइड"
    assert "केदारकंठा" in result["content_html"]
    assert result["fallback"] == "false"


# ---------------------------------------------------------------------------
# TC-B05: translate_page swallows LLM exceptions and falls back
# ---------------------------------------------------------------------------
def test_translate_page_swallows_exception(monkeypatch):
    monkeypatch.setattr("app.modules.agents.translation.agent.settings.anthropic_api_key", "sk-test")
    mock_client = MagicMock()
    mock_client.messages.create.side_effect = RuntimeError("LLM error")
    with patch.object(translation_mod._anthropic, "Anthropic", return_value=mock_client):
        result = translate_page("Title", "<p>Content</p>", "hi")
    assert result["fallback"] == "true"
    assert result["title"] == "Title"


# ---------------------------------------------------------------------------
# TC-B06: POST /admin/cms/{slug}/translate — 404 for unknown slug
# ---------------------------------------------------------------------------
def test_translate_endpoint_404(override_admin):
    res = client.post(
        "/api/v1/admin/cms/nonexistent-slug-xyz/translate",
        json={"target_language": "hi"},
    )
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B07: POST /admin/cms/{slug}/translate — 422 for unsupported language
# ---------------------------------------------------------------------------
def test_translate_endpoint_unsupported_language(override_admin, cms_page):
    res = client.post(
        f"/api/v1/admin/cms/{cms_page.slug}/translate",
        json={"target_language": "fr"},
    )
    assert res.status_code == 422
    assert "Unsupported" in res.json()["detail"]


# ---------------------------------------------------------------------------
# TC-B08: POST /admin/cms/{slug}/translate — creates draft page (fallback mode)
# ---------------------------------------------------------------------------
def test_translate_endpoint_creates_draft(override_admin, cms_page, db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.agents.translation.agent.settings.anthropic_api_key", None)
    res = client.post(
        f"/api/v1/admin/cms/{cms_page.slug}/translate",
        json={"target_language": "hi"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["source_slug"] == cms_page.slug
    assert data["target_language"] == "hi"
    assert data["page_slug"].endswith("-hi")
    assert data["fallback"] is True
    assert data["page_id"] is not None

    # Verify new CMSPage created in DB
    db.expire_all()
    new_page = db.get(CMSPage, uuid.UUID(data["page_id"]))
    assert new_page is not None
    assert new_page.language == "hi"
    assert new_page.status == "draft"
    assert new_page.source_page_id == cms_page.id


# ---------------------------------------------------------------------------
# TC-B09: POST translate — updates source page translations JSON
# ---------------------------------------------------------------------------
def test_translate_updates_source_translations(override_admin, cms_page, db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.agents.translation.agent.settings.anthropic_api_key", None)
    res = client.post(
        f"/api/v1/admin/cms/{cms_page.slug}/translate",
        json={"target_language": "hi"},
    )
    assert res.status_code == 200
    page_id = res.json()["page_id"]

    db.expire_all()
    source = db.get(CMSPage, cms_page.id)
    assert source.translations is not None
    assert "hi" in source.translations
    assert source.translations["hi"] == page_id


# ---------------------------------------------------------------------------
# TC-B10: POST translate — returns existing translation on second call
# ---------------------------------------------------------------------------
def test_translate_returns_existing(override_admin, cms_page, db: Session, monkeypatch):
    monkeypatch.setattr("app.modules.agents.translation.agent.settings.anthropic_api_key", None)
    res1 = client.post(f"/api/v1/admin/cms/{cms_page.slug}/translate", json={"target_language": "hi"})
    assert res1.status_code == 200
    first_id = res1.json()["page_id"]

    res2 = client.post(f"/api/v1/admin/cms/{cms_page.slug}/translate", json={"target_language": "hi"})
    assert res2.status_code == 200
    assert res2.json()["page_id"] == first_id
    assert "already exists" in res2.json()["message"]


# ---------------------------------------------------------------------------
# TC-B11: POST translate — requires admin auth (401 when bypass is removed)
# ---------------------------------------------------------------------------
def test_translate_requires_admin_auth(cms_page):
    # Temporarily remove the global conftest bypass so real auth is enforced
    original = app.dependency_overrides.pop(get_current_admin, None)
    try:
        res = client.post(
            f"/api/v1/admin/cms/{cms_page.slug}/translate",
            json={"target_language": "hi"},
        )
        assert res.status_code in (401, 403)
    finally:
        if original is not None:
            app.dependency_overrides[get_current_admin] = original


# ---------------------------------------------------------------------------
# TC-B12: GET /cms/pages/{slug}?lang=hi — returns translated page if published
# ---------------------------------------------------------------------------
def test_get_cms_page_with_lang(db: Session, cms_page: CMSPage, monkeypatch):
    # Create a published Hindi translation
    hi_page = CMSPage(
        slug=f"{cms_page.slug}-hi",
        page_type="trek_guide",
        title="केदारकंठा ट्रेक गाइड",
        content_html="<h1>केदारकंठा</h1>",
        status="published",
        language="hi",
        source_page_id=cms_page.id,
    )
    db.add(hi_page)
    db.flush()
    cms_page.translations = {"hi": str(hi_page.id)}
    db.commit()

    res = client.get(f"/api/v1/cms/pages/{cms_page.slug}?lang=hi")
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "hi"
    assert data["title"] == "केदारकंठा ट्रेक गाइड"


# ---------------------------------------------------------------------------
# TC-B13: GET /cms/pages/{slug}?lang=hi — falls back to English if translation is draft
# ---------------------------------------------------------------------------
def test_get_cms_page_lang_fallback_draft(db: Session, cms_page: CMSPage):
    # Translation exists but is in draft status
    hi_page = CMSPage(
        slug=f"{cms_page.slug}-hi-draft",
        page_type="trek_guide",
        title="केदारकंठा",
        content_html="<p>draft</p>",
        status="draft",  # not published
        language="hi",
        source_page_id=cms_page.id,
    )
    db.add(hi_page)
    db.flush()
    cms_page.translations = {"hi": str(hi_page.id)}
    db.commit()

    res = client.get(f"/api/v1/cms/pages/{cms_page.slug}?lang=hi")
    assert res.status_code == 200
    data = res.json()
    # Should fall back to English source page
    assert data["language"] == "en"


# ---------------------------------------------------------------------------
# TC-B14: GET /cms/pages/{slug} — new language/translations fields in response
# ---------------------------------------------------------------------------
def test_cms_page_response_has_language_fields(cms_page):
    res = client.get(f"/api/v1/cms/pages/{cms_page.slug}")
    assert res.status_code == 200
    data = res.json()
    assert "language" in data
    assert data["language"] == "en"
    assert "translations" in data
    assert "source_page_id" in data
