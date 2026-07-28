"""
Step M04 — Sign in with Apple (mobile)

TC-B-M04-01: test_apple_signin_registers_new_user
TC-B-M04-02: test_apple_signin_existing_identity_returns_same_user
TC-B-M04-03: test_apple_signin_links_to_existing_email_user
TC-B-M04-04: test_apple_signin_invalid_token_401
"""
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.main import app
from app.modules.auth.models import AuthIdentity, User, UserSession

client = TestClient(app)

_APPLE_URL = "/api/v1/auth/mobile/apple"


def _wipe():
    with SessionLocal() as db:
        db.execute(delete(UserSession))
        db.execute(delete(AuthIdentity))
        db.execute(delete(User))
        db.commit()


@pytest.fixture(autouse=True)
def clean_state():
    client.cookies.clear()
    _wipe()
    yield
    _wipe()


def _apple_post(sub="apple-sub-123", email="trekker@example.com", full_name="Test Trekker", email_verified="true"):
    """POST the Apple route with verify_apple_identity_token mocked to return fixed claims."""
    with patch(
        "app.api.routes.auth_mobile.verify_apple_identity_token",
        return_value={"sub": sub, "email": email, "email_verified": email_verified},
    ):
        return client.post(
            _APPLE_URL,
            json={
                "identity_token": "mock.jwt.token",
                "full_name": full_name,
                "device_id": str(uuid.uuid4()),
                "platform": "ios",
            },
        )


def test_apple_signin_registers_new_user():
    resp = _apple_post()
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["access_token"] and data["refresh_token"]
    assert data["email"] == "trekker@example.com"
    assert data["full_name"] == "Test Trekker"
    with SessionLocal() as db:
        ident = db.scalar(
            select(AuthIdentity).where(
                AuthIdentity.provider == "apple",
                AuthIdentity.provider_user_id == "apple-sub-123",
            )
        )
        assert ident is not None


def test_apple_signin_existing_identity_returns_same_user():
    r1 = _apple_post()
    r2 = _apple_post()  # same Apple sub → same account, no duplicate
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["user_id"] == r2.json()["user_id"]
    with SessionLocal() as db:
        assert len(list(db.scalars(select(User)))) == 1


def test_apple_signin_links_to_existing_email_user():
    # Pre-create an email user, then Apple sign-in with the same email links (no new user).
    with SessionLocal() as db:
        db.add(User(email="trekker@example.com", password_hash="x", is_active=True))
        db.commit()
    resp = _apple_post(email="trekker@example.com")
    assert resp.status_code == 200, resp.text
    with SessionLocal() as db:
        assert len(list(db.scalars(select(User)))) == 1
        ident = db.scalar(select(AuthIdentity).where(AuthIdentity.provider == "apple"))
        assert ident is not None


def test_apple_signin_invalid_token_401():
    with patch(
        "app.api.routes.auth_mobile.verify_apple_identity_token",
        side_effect=ValueError("Invalid or expired Apple identity token."),
    ):
        resp = client.post(
            _APPLE_URL,
            json={"identity_token": "bad", "device_id": str(uuid.uuid4()), "platform": "ios"},
        )
    assert resp.status_code == 401
