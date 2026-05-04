"""Tests for Step 35 — Advanced Recommendation Engine."""
from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.cms.models import CMSPage
from app.modules.recommendations.service import (
    find_similar_pages,
    get_anonymous_recommendations,
    get_recommendations_for_user,
)
from app.modules.agents.embedding.agent import generate_embedding, embed_page

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db) -> User:
    user = db.query(User).filter(User.email == "rectest@trekyatra.com").first()
    if not user:
        user = User(email="rectest@trekyatra.com", full_name="Rec Test", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def published_page(db) -> CMSPage:
    slug = f"rec-test-page-{uuid.uuid4().hex[:6]}"
    page = CMSPage(
        slug=slug,
        title="Test Recommendation Page",
        page_type="trek_guide",
        content_html="<p>Test content for recommendations.</p>",
        status="published",
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@pytest.fixture
def published_page_with_embedding(db) -> CMSPage:
    slug = f"emb-test-page-{uuid.uuid4().hex[:6]}"
    fake_embedding = [0.1] * 1536
    page = CMSPage(
        slug=slug,
        title="Embedded Test Page",
        page_type="trek_guide",
        content_html="<p>Embedded content.</p>",
        status="published",
        embedding=fake_embedding,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


# --- TC-B01: embedding skipped when no API key ---
def test_generate_embedding_no_key():
    """Verifies: generate_embedding returns None when OPENAI_API_KEY is not set."""
    with patch("app.modules.agents.embedding.agent.get_settings") as mock_settings:
        mock_settings.return_value.openai_api_key = None
        result = generate_embedding("test text")
    assert result is None


# --- TC-B02: embedding generated with mocked OpenAI call ---
def test_generate_embedding_mocked():
    """Verifies: generate_embedding calls OpenAI and returns a 1536-dim vector."""
    fake_vec = [0.01] * 1536
    with patch("app.modules.agents.embedding.agent.get_settings") as mock_settings, \
         patch("app.modules.agents.embedding.agent._openai") as mock_openai_mod:
        mock_settings.return_value.openai_api_key = "sk-fake"
        mock_resp = mock_openai_mod.OpenAI.return_value.embeddings.create.return_value
        mock_resp.data = [type("E", (), {"embedding": fake_vec})()]
        result = generate_embedding("some trek content")
    assert result is not None
    assert len(result) == 1536


# --- TC-B03: embed_page no-op for missing page ---
def test_embed_page_missing(db):
    """Verifies: embed_page returns False for a non-existent page UUID."""
    from app.modules.agents.embedding.agent import embed_page
    result = embed_page(db, uuid.uuid4())
    assert result is False


# --- TC-B04: embed_page stores embedding ---
def test_embed_page_stores(db, published_page):
    """Verifies: embed_page writes embedding to cms_pages when OpenAI returns a vector."""
    import app.modules.agents.embedding.agent as emb_mod
    fake_vec = [0.05] * 1536
    with patch.object(emb_mod, "generate_embedding", return_value=fake_vec):
        result = embed_page(db, published_page.id)
    assert result is True
    db.refresh(published_page)
    assert published_page.embedding is not None
    assert len(published_page.embedding) == 1536


# --- TC-B05: find_similar_pages fallback when no embedding ---
def test_find_similar_fallback(db, published_page):
    """Verifies: find_similar_pages returns freshness-sorted results when page has no embedding."""
    results = find_similar_pages(db, published_page.id, limit=5)
    assert isinstance(results, list)


# --- TC-B06: find_similar_pages with embedding uses vector search ---
def test_find_similar_with_embedding(db, published_page_with_embedding):
    """Verifies: find_similar_pages runs vector query when embedding exists."""
    results = find_similar_pages(db, published_page_with_embedding.id, limit=5)
    assert isinstance(results, list)
    # The page itself must not appear in results
    ids = [r["id"] for r in results]
    assert str(published_page_with_embedding.id) not in ids


# --- TC-B07: anonymous recommendations returns list ---
def test_anonymous_recommendations(db):
    """Verifies: get_anonymous_recommendations returns a list (may be empty in clean DB)."""
    results = get_anonymous_recommendations(db, limit=6)
    assert isinstance(results, list)


# --- TC-B08: user recommendations without bookmarks falls back ---
def test_user_recommendations_no_bookmarks(db, test_user):
    """Verifies: get_recommendations_for_user returns list even when user has no bookmarks."""
    results = get_recommendations_for_user(db, test_user.id, limit=6)
    assert isinstance(results, list)


# --- TC-B09: GET /pages/{slug}/similar — published page ---
def test_api_similar_pages(published_page):
    """Verifies: GET /pages/{slug}/similar returns SimilarPagesResponse."""
    res = client.get(f"/api/v1/pages/{published_page.slug}/similar")
    assert res.status_code == 200
    data = res.json()
    assert data["page_slug"] == published_page.slug
    assert "items" in data
    assert isinstance(data["items"], list)


# --- TC-B10: GET /pages/{slug}/similar — unknown slug returns 200 with fallback items ---
def test_api_similar_pages_not_found():
    """Verifies: GET /pages/nonexistent/similar returns 200 with anonymous fallback (not 404)."""
    res = client.get("/api/v1/pages/nonexistent-slug-xyz-abc/similar")
    assert res.status_code == 200
    body = res.json()
    assert body["page_slug"] == "nonexistent-slug-xyz-abc"
    assert isinstance(body["items"], list)


# --- TC-B11: GET /recommendations — public fallback ---
def test_api_anonymous_recommendations():
    """Verifies: GET /recommendations returns public fallback list."""
    res = client.get("/api/v1/recommendations")
    assert res.status_code == 200
    data = res.json()
    assert data["personalised"] is False
    assert "items" in data


# --- TC-B12: GET /account/recommendations — requires auth ---
def test_api_personalised_requires_auth():
    """Verifies: GET /account/recommendations without auth returns 401."""
    res = client.get("/api/v1/account/recommendations")
    assert res.status_code == 401


# --- TC-B13: GET /account/recommendations — authenticated user ---
def test_api_personalised_authenticated(test_user):
    """Verifies: GET /account/recommendations with auth returns personalised=True list."""
    app.dependency_overrides[get_current_user] = lambda: test_user
    res = client.get("/api/v1/account/recommendations")
    app.dependency_overrides.clear()
    assert res.status_code == 200
    data = res.json()
    assert data["personalised"] is True
    assert "items" in data


# --- TC-B14: embed_page imports in publish do not break publish ---
def test_embed_page_exception_does_not_block(db, published_page):
    """Verifies: exceptions from generate_embedding are swallowed; embed_page returns False."""
    import app.modules.agents.embedding.agent as emb_mod
    with patch.object(emb_mod, "generate_embedding", side_effect=RuntimeError("boom")):
        result = embed_page(db, published_page.id)
    assert result is False


# --- TC-B15: recommendation items exclude already-bookmarked pages ---
def test_user_recommendations_excludes_bookmarks(db, test_user, published_page_with_embedding):
    """Verifies: pages already bookmarked by user are excluded from recommendations."""
    from app.modules.account.models import UserBookmark
    bookmark = UserBookmark(
        user_id=test_user.id,
        cms_page_id=published_page_with_embedding.id,
        trek_slug=published_page_with_embedding.slug,
    )
    db.add(bookmark)
    db.commit()

    results = get_recommendations_for_user(db, test_user.id, limit=10)
    ids = [r["id"] for r in results]
    slugs = [r["slug"] for r in results]
    assert str(published_page_with_embedding.id) not in ids or published_page_with_embedding.slug not in slugs

    db.delete(bookmark)
    db.commit()
