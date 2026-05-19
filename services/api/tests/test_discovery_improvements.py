"""Tests for Step 44 — Discovery Engine Improvements (remaining items).

Covers:
- POST /track/page-view
- GET/POST/DELETE /account/comparisons
- record_page_view service
- save/list/delete_comparison service
- get_anonymous_recommendations with popularity weighting
"""
from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.account.models import AccountComparison
from app.modules.account.service import (
    delete_comparison,
    list_comparisons,
    save_comparison,
)
from app.modules.search.service import record_page_view
from app.modules.recommendations.service import get_anonymous_recommendations

client = TestClient(app, raise_server_exceptions=True)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db) -> User:
    user = db.query(User).filter(User.email == "discovery_test@trekyatra.com").first()
    if not user:
        user = User(
            email="discovery_test@trekyatra.com",
            full_name="Discovery Test",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def authed_client(test_user):
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# TC-B01: POST /track/page-view — happy path
# ---------------------------------------------------------------------------

def test_page_view_returns_204():
    res = client.post(
        "/api/v1/track/page-view",
        json={"page_slug": "kedarkantha", "page_type": "trek_guide", "session_id": "sess-abc"},
    )
    assert res.status_code == 204


# TC-B02: POST /track/page-view — empty slug is no-op
def test_page_view_empty_slug_is_noop():
    res = client.post("/api/v1/track/page-view", json={"page_slug": "   "})
    assert res.status_code == 204


# TC-B03: record_page_view service persists row
def test_record_page_view_service(db):
    slug = f"test-trek-{uuid.uuid4().hex[:8]}"
    view = record_page_view(db, page_slug=slug, page_type="trek_guide", session_id="s123")
    assert view.id is not None
    assert view.page_slug == slug
    assert view.page_type == "trek_guide"


# ---------------------------------------------------------------------------
# TC-B04: GET /account/comparisons — requires auth (401 without)
# ---------------------------------------------------------------------------

def test_list_comparisons_requires_auth():
    res = client.get("/api/v1/account/comparisons")
    assert res.status_code == 401


# TC-B05: POST /account/comparisons — happy path
def test_save_comparison_happy_path(authed_client):
    res = authed_client.post(
        "/api/v1/account/comparisons",
        json={"name": "Winter picks", "slugs": ["kedarkantha", "brahmatal"]},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Winter picks"
    assert "kedarkantha" in data["slugs"]
    assert "brahmatal" in data["slugs"]


# TC-B06: POST /account/comparisons — rejects fewer than 2 slugs
def test_save_comparison_rejects_one_slug(authed_client):
    res = authed_client.post(
        "/api/v1/account/comparisons",
        json={"name": "Bad list", "slugs": ["kedarkantha"]},
    )
    assert res.status_code == 422


# TC-B07: GET /account/comparisons — returns list with saved item
def test_list_comparisons_returns_saved(authed_client, test_user, db):
    save_comparison(db, test_user.id, "Test list", ["hampta-pass", "kedarkantha"])
    res = authed_client.get("/api/v1/account/comparisons")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    names = [c["name"] for c in data]
    assert "Test list" in names


# TC-B08: DELETE /account/comparisons/{id} — deletes owned comparison
def test_delete_comparison(authed_client, test_user, db):
    comp = save_comparison(db, test_user.id, "To delete", ["kedarkantha", "hampta-pass"])
    res = authed_client.delete(f"/api/v1/account/comparisons/{comp.id}")
    assert res.status_code == 204


# TC-B09: DELETE /account/comparisons/{id} — 404 for non-existent
def test_delete_comparison_not_found(authed_client):
    res = authed_client.delete(f"/api/v1/account/comparisons/{uuid.uuid4()}")
    assert res.status_code == 404


# TC-B10: save_comparison clamps to max 3 slugs
def test_save_comparison_clamps_to_3(db, test_user):
    comp = save_comparison(db, test_user.id, "Long list", ["a", "b", "c", "d", "e"])
    assert len(comp.slugs) == 3


# TC-B11: get_anonymous_recommendations returns list (popularity weighting)
def test_anonymous_recommendations_returns_list(db):
    results = get_anonymous_recommendations(db, limit=6)
    assert isinstance(results, list)
    for item in results:
        assert "slug" in item
        assert "page_type" in item
