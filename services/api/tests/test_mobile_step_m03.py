"""
Step M03 — Backend Mobile API Extensions

TC-B-M03-01: test_mobile_token_issuance
TC-B-M03-02: test_mobile_token_refresh
TC-B-M03-03: test_device_registration
TC-B-M03-04: test_device_upsert_updates_token
TC-B-M03-05: test_device_deletion
TC-B-M03-06: test_sync_endpoint_returns_pages
TC-B-M03-07: test_sync_incremental_after_timestamp
TC-B-M03-08: test_sync_requires_auth
"""

import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.session import SessionLocal
from app.main import app
from app.modules.auth.models import AuthIdentity, User, UserSession
from app.modules.mobile.models import MobileDevice

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state():
    client.cookies.clear()
    with SessionLocal() as db:
        db.execute(delete(MobileDevice))
        db.execute(delete(UserSession))
        db.execute(delete(AuthIdentity))
        db.execute(delete(User))
        db.commit()
    yield
    client.cookies.clear()
    with SessionLocal() as db:
        db.execute(delete(MobileDevice))
        db.execute(delete(UserSession))
        db.execute(delete(AuthIdentity))
        db.execute(delete(User))
        db.commit()


def _signup_and_get_cookie(email: str | None = None) -> str:
    """Sign up a new user and return their email."""
    email = email or f"mobile-{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post(
        "/api/v1/auth/signup/email",
        json={"email": email, "password": "strongpass123", "full_name": "Mobile User"},
    )
    assert resp.status_code == 201, resp.text
    return email


def _get_mobile_tokens(device_id: str | None = None) -> dict:
    """Sign up, get cookie, exchange for mobile tokens."""
    _signup_and_get_cookie()
    device_id = device_id or str(uuid.uuid4())
    resp = client.post(
        "/api/v1/auth/mobile/token",
        json={"device_id": device_id, "platform": "ios"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    return {**data, "device_id": device_id}


# ── TC-B-M03-01 ───────────────────────────────────────────────────────────────

def test_mobile_token_issuance():
    """POST /auth/mobile/token returns access_token, refresh_token, expires_in."""
    _signup_and_get_cookie()
    device_id = str(uuid.uuid4())
    resp = client.post(
        "/api/v1/auth/mobile/token",
        json={"device_id": device_id, "platform": "ios"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert isinstance(data["expires_in"], int)
    assert data["expires_in"] > 0


# ── TC-B-M03-02 ───────────────────────────────────────────────────────────────

def test_mobile_token_refresh():
    """POST /auth/mobile/token/refresh with valid refresh token returns new access_token."""
    tokens = _get_mobile_tokens()
    # Clear cookie so only Bearer works
    client.cookies.clear()

    resp = client.post(
        "/api/v1/auth/mobile/token/refresh",
        json={"refresh_token": tokens["refresh_token"], "device_id": tokens["device_id"]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert isinstance(data["expires_in"], int)


def test_mobile_token_refresh_invalid():
    """POST /auth/mobile/token/refresh with garbage token returns 401."""
    resp = client.post(
        "/api/v1/auth/mobile/token/refresh",
        json={"refresh_token": "invalid.token.here", "device_id": str(uuid.uuid4())},
    )
    assert resp.status_code == 401


# ── TC-B-M03-03 ───────────────────────────────────────────────────────────────

def test_device_registration():
    """POST /mobile/device with a NEW device_id returns created=true."""
    tokens = _get_mobile_tokens()
    client.cookies.clear()
    # Use a device_id distinct from the one used for token issuance
    new_device_id = str(uuid.uuid4())

    resp = client.post(
        "/api/v1/mobile/device",
        json={
            "device_id": new_device_id,
            "platform": "ios",
            "fcm_token": None,
            "apns_token": "apns-test-token",
            "app_version": "1.0.0",
            "os_version": "iOS 18",
        },
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["device_id"] == new_device_id
    assert data["created"] is True
    assert "id" in data


# ── TC-B-M03-04 ───────────────────────────────────────────────────────────────

def test_device_upsert_updates_token():
    """Second POST /mobile/device with same device_id updates fcm_token, returns created=false."""
    tokens = _get_mobile_tokens()
    client.cookies.clear()
    # Fresh device_id for this test
    fresh_device_id = str(uuid.uuid4())
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # First registration — fresh device, should be created=True
    resp1 = client.post(
        "/api/v1/mobile/device",
        json={"device_id": fresh_device_id, "platform": "android", "fcm_token": "token-v1"},
        headers=headers,
    )
    assert resp1.status_code == 200
    assert resp1.json()["created"] is True

    # Second registration — same device_id, updated fcm_token
    resp2 = client.post(
        "/api/v1/mobile/device",
        json={"device_id": fresh_device_id, "platform": "android", "fcm_token": "token-v2"},
        headers=headers,
    )
    assert resp2.status_code == 200
    assert resp2.json()["created"] is False

    # Verify token was updated in DB
    with SessionLocal() as db:
        from sqlalchemy import select
        device = db.scalar(select(MobileDevice).where(MobileDevice.device_id == fresh_device_id))
        assert device is not None
        assert device.fcm_token == "token-v2"


# ── TC-B-M03-05 ───────────────────────────────────────────────────────────────

def test_device_deletion():
    """DELETE /mobile/device/{device_id} removes the device record."""
    tokens = _get_mobile_tokens()
    client.cookies.clear()
    device_id = tokens["device_id"]
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # Register first
    r = client.post(
        "/api/v1/mobile/device",
        json={"device_id": device_id, "platform": "ios"},
        headers=headers,
    )
    assert r.status_code == 200

    # Delete
    del_resp = client.delete(f"/api/v1/mobile/device/{device_id}", headers=headers)
    assert del_resp.status_code == 204

    # Verify gone from DB
    with SessionLocal() as db:
        from sqlalchemy import select
        device = db.scalar(select(MobileDevice).where(MobileDevice.device_id == device_id))
        assert device is None

    # Second delete returns 404
    del_resp2 = client.delete(f"/api/v1/mobile/device/{device_id}", headers=headers)
    assert del_resp2.status_code == 404


# ── TC-B-M03-06 ───────────────────────────────────────────────────────────────

def test_sync_endpoint_returns_pages():
    """GET /mobile/sync returns SyncOut structure with correct fields."""
    tokens = _get_mobile_tokens()
    client.cookies.clear()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    resp = client.get("/api/v1/mobile/sync", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "updated" in data
    assert "deleted_slugs" in data
    assert "sync_timestamp" in data
    assert "has_more" in data
    assert "total_updated" in data
    assert isinstance(data["updated"], list)
    assert isinstance(data["deleted_slugs"], list)


# ── TC-B-M03-07 ───────────────────────────────────────────────────────────────

def test_sync_incremental_after_timestamp():
    """GET /mobile/sync?last_sync=<future> returns empty updated list."""
    tokens = _get_mobile_tokens()
    client.cookies.clear()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    future = "2099-01-01T00:00:00Z"
    resp = client.get(f"/api/v1/mobile/sync?last_sync={future}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["updated"] == []
    assert data["total_updated"] == 0
    assert data["has_more"] is False


# ── TC-B-M03-08 ───────────────────────────────────────────────────────────────

def test_sync_requires_auth():
    """GET /mobile/sync without Authorization header returns 401."""
    resp = client.get("/api/v1/mobile/sync")
    assert resp.status_code == 401


# ── TC-B-M03-09 ───────────────────────────────────────────────────────────────

def test_mobile_login_returns_tokens():
    """POST /auth/mobile/login returns access_token, refresh_token, user_id."""
    email = f"mobile-{uuid.uuid4().hex[:8]}@example.com"
    device_id = str(uuid.uuid4())

    # Register first via web endpoint
    client.post(
        "/api/v1/auth/signup/email",
        json={"email": email, "password": "strongpass123", "full_name": "Mobile User"},
    )
    client.cookies.clear()

    resp = client.post(
        "/api/v1/auth/mobile/login",
        json={"email": email, "password": "strongpass123", "device_id": device_id, "platform": "ios"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == email
    assert "user_id" in data


# ── TC-B-M03-10 ───────────────────────────────────────────────────────────────

def test_mobile_signup_returns_tokens():
    """POST /auth/mobile/signup registers user and returns Bearer tokens directly."""
    email = f"mobile-new-{uuid.uuid4().hex[:8]}@example.com"
    device_id = str(uuid.uuid4())

    resp = client.post(
        "/api/v1/auth/mobile/signup",
        json={
            "email": email,
            "password": "strongpass123",
            "full_name": "New Trekker",
            "device_id": device_id,
            "platform": "android",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["email"] == email

    # Bearer token from signup should be usable for mobile sync
    resp2 = client.get(
        "/api/v1/mobile/sync",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert resp2.status_code == 200
