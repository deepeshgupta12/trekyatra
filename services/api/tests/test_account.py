"""Tests for Step 33 — Premium User Accounts + Bookmarks."""
from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.account.models import TrekAlert, UserBookmark, UserDownload, UserProfile
from app.modules.account.service import (
    add_alert,
    add_bookmark,
    list_alerts,
    list_bookmarks,
    list_downloads,
    record_download,
    remove_alert,
    remove_bookmark,
    upsert_profile,
    get_profile,
)
from app.modules.cms.models import CMSPage

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db) -> User:
    """Create a real test user for account tests."""
    user = db.query(User).filter(User.email == "accounttest@trekyatra.com").first()
    if not user:
        user = User(
            email="accounttest@trekyatra.com",
            full_name="Account Test",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def test_cms_page(db) -> CMSPage:
    """Create a test CMS page for bookmark tests."""
    page = db.query(CMSPage).filter(CMSPage.slug == "test-bookmark-page").first()
    if not page:
        page = CMSPage(
            slug="test-bookmark-page",
            page_type="trek_guide",
            title="Test Bookmark Page",
            content_html="<p>Test</p>",
            status="published",
        )
        db.add(page)
        db.commit()
        db.refresh(page)
    return page


@pytest.fixture
def authed_client(test_user):
    """TestClient with get_current_user overridden to return test_user."""
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)


# TC-B01: add_bookmark service creates bookmark
def test_add_bookmark_service(db, test_user, test_cms_page):
    b = add_bookmark(db, test_user.id, test_cms_page.id)
    assert b.user_id == test_user.id
    assert b.cms_page_id == test_cms_page.id


# TC-B02: add_bookmark is idempotent
def test_add_bookmark_idempotent(db, test_user, test_cms_page):
    b1 = add_bookmark(db, test_user.id, test_cms_page.id)
    b2 = add_bookmark(db, test_user.id, test_cms_page.id)
    assert b1.id == b2.id


# TC-B03: remove_bookmark removes existing bookmark
def test_remove_bookmark(db, test_user, test_cms_page):
    add_bookmark(db, test_user.id, test_cms_page.id)
    removed = remove_bookmark(db, test_user.id, test_cms_page.id)
    assert removed is True


# TC-B04: remove_bookmark returns False for non-existent
def test_remove_bookmark_not_found(db, test_user):
    removed = remove_bookmark(db, test_user.id, uuid.uuid4())
    assert removed is False


# TC-B05: list_bookmarks returns bookmarks with page metadata
def test_list_bookmarks(db, test_user, test_cms_page):
    add_bookmark(db, test_user.id, test_cms_page.id)
    bookmarks = list_bookmarks(db, test_user.id)
    assert isinstance(bookmarks, list)
    slugs = [b["slug"] for b in bookmarks]
    assert "test-bookmark-page" in slugs


# TC-B06: record_download creates download record
def test_record_download(db, test_user):
    dl = record_download(db, test_user.id, "himalaya-packing-list.pdf", "packing-guide-v1")
    assert dl.user_id == test_user.id
    assert dl.filename == "himalaya-packing-list.pdf"
    assert dl.product_id == "packing-guide-v1"


# TC-B07: list_downloads returns user downloads
def test_list_downloads(db, test_user):
    record_download(db, test_user.id, "test-file.pdf")
    downloads = list_downloads(db, test_user.id)
    assert isinstance(downloads, list)
    filenames = [d.filename for d in downloads]
    assert "test-file.pdf" in filenames


# TC-B08: add_alert creates trek alert
def test_add_alert(db, test_user):
    alert = add_alert(db, test_user.id, "roopkund-trek", "any")
    assert alert.trek_slug == "roopkund-trek"
    assert alert.active is True


# TC-B09: add_alert is idempotent (reactivates inactive)
def test_add_alert_idempotent(db, test_user):
    a1 = add_alert(db, test_user.id, "kedarkantha-trek", "any")
    a2 = add_alert(db, test_user.id, "kedarkantha-trek", "any")
    assert a1.id == a2.id


# TC-B10: remove_alert removes existing alert
def test_remove_alert(db, test_user):
    add_alert(db, test_user.id, "chopta-trek-removable", "any")
    removed = remove_alert(db, test_user.id, "chopta-trek-removable", "any")
    assert removed is True


# TC-B11: remove_alert returns False for non-existent
def test_remove_alert_not_found(db, test_user):
    removed = remove_alert(db, test_user.id, "nonexistent-slug-xyz", "any")
    assert removed is False


# TC-B12: upsert_profile creates and updates profile
def test_upsert_profile(db, test_user):
    p1 = upsert_profile(db, test_user.id, {
        "fitness_level": "intermediate",
        "trek_experience": "casual",
        "preferred_regions": ["Himachal Pradesh", "Uttarakhand"],
        "budget_range": "10000-20000",
    })
    assert p1.user_id == test_user.id
    assert p1.fitness_level == "intermediate"
    assert p1.preferred_regions == ["Himachal Pradesh", "Uttarakhand"]
    p2 = upsert_profile(db, test_user.id, {"fitness_level": "expert"})
    assert p2.id == p1.id
    assert p2.fitness_level == "expert"


# TC-B13: get_profile returns None when not found
def test_get_profile_not_found(db):
    result = get_profile(db, uuid.uuid4())
    assert result is None


# TC-B14: GET /account/bookmarks requires auth (401 without override)
def test_bookmarks_requires_auth():
    resp = client.get("/api/v1/account/bookmarks")
    assert resp.status_code == 401


# TC-B15: GET /account/bookmarks returns 200 when authed
def test_api_list_bookmarks(authed_client, test_user, test_cms_page, db):
    add_bookmark(db, test_user.id, test_cms_page.id)
    resp = authed_client.get("/api/v1/account/bookmarks")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# TC-B16: POST /account/bookmarks creates bookmark
def test_api_add_bookmark(authed_client, test_cms_page):
    resp = authed_client.post("/api/v1/account/bookmarks", json={"cms_page_id": str(test_cms_page.id)})
    assert resp.status_code == 200
    data = resp.json()
    assert data["cms_page_id"] == str(test_cms_page.id)


# TC-B17: DELETE /account/bookmarks/{id} removes bookmark
def test_api_remove_bookmark(authed_client, test_user, test_cms_page, db):
    add_bookmark(db, test_user.id, test_cms_page.id)
    resp = authed_client.delete(f"/api/v1/account/bookmarks/{test_cms_page.id}")
    assert resp.status_code == 204


# TC-B18: PATCH /account/profile saves profile
def test_api_upsert_profile(authed_client):
    resp = authed_client.patch("/api/v1/account/profile", json={
        "fitness_level": "beginner",
        "trek_experience": "beginner",
        "preferred_regions": ["Kerala"],
        "budget_range": "5000-10000",
    })
    assert resp.status_code == 200
    assert resp.json()["fitness_level"] == "beginner"


# TC-B19: GET /account/alerts returns 200 when authed
def test_api_list_alerts(authed_client):
    resp = authed_client.get("/api/v1/account/alerts")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# TC-B20: POST /account/alerts creates alert
def test_api_add_alert(authed_client):
    resp = authed_client.post("/api/v1/account/alerts", json={"trek_slug": "valley-of-flowers", "alert_type": "any"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["trek_slug"] == "valley-of-flowers"
    assert data["active"] is True
