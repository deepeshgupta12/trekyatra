"""Step 68 — Email infrastructure tests.

TC-B01: send_verification requires auth
TC-B02: send_verification returns 400 if already verified
TC-B03: send_verification returns 200 when SMTP not configured (graceful skip)
TC-B04: verify_email with valid token marks user as verified
TC-B05: verify_email with invalid token returns 400
TC-B06: verify_email with wrong typ (password_reset token) returns 400
TC-B07: send_trek_alerts_task returns {sent: False} when SMTP not configured
TC-B08: create/parse_email_verification_token round-trip
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.core.config import settings
from app.core.security import create_email_verification_token, create_reset_token, parse_email_verification_token
from app.db.session import SessionLocal
from app.main import app
from app.modules.auth.models import AuthIdentity, User, UserSession

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_users():
    client.cookies.clear()
    with SessionLocal() as db:
        db.execute(delete(UserSession))
        db.execute(delete(AuthIdentity))
        db.execute(delete(User))
        db.commit()
    yield
    client.cookies.clear()
    with SessionLocal() as db:
        db.execute(delete(UserSession))
        db.execute(delete(AuthIdentity))
        db.execute(delete(User))
        db.commit()


def _signup(email: str | None = None) -> str:
    email = email or f"testuser-{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post(
        "/api/v1/auth/signup/email",
        json={"email": email, "password": "strongpass123", "full_name": "Test User"},
    )
    assert resp.status_code == 201, resp.text
    return email


def test_send_verification_requires_auth():
    """TC-B01: POST /auth/send-verification without session returns 401."""
    resp = client.post("/api/v1/auth/send-verification")
    assert resp.status_code == 401


def test_send_verification_already_verified():
    """TC-B02: POST /auth/send-verification returns 400 if email already verified."""
    email = _signup()
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        user.is_verified_email = True
        db.commit()
    resp = client.post("/api/v1/auth/send-verification")
    assert resp.status_code == 400
    assert "already verified" in resp.json()["detail"].lower()


def test_send_verification_no_smtp_graceful():
    """TC-B03: POST /auth/send-verification with SMTP disabled still returns 200."""
    _signup()
    original = settings.smtp_host
    settings.smtp_host = None  # type: ignore[assignment]
    try:
        resp = client.post("/api/v1/auth/send-verification")
        assert resp.status_code == 200
        assert "sent" in resp.json()["message"].lower()
    finally:
        settings.smtp_host = original


def test_verify_email_valid_token():
    """TC-B04: POST /auth/verify-email with valid token marks user verified."""
    email = _signup()
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        user_id = user.id
        assert user.is_verified_email is False

    token, _ = create_email_verification_token(user_id)
    resp = client.post("/api/v1/auth/verify-email", json={"token": token})
    assert resp.status_code == 200
    assert "verified" in resp.json()["message"].lower()

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        assert user.is_verified_email is True


def test_verify_email_invalid_token():
    """TC-B05: POST /auth/verify-email with garbage token returns 400."""
    resp = client.post("/api/v1/auth/verify-email", json={"token": "not-a-valid-jwt"})
    assert resp.status_code == 400


def test_verify_email_wrong_typ_token():
    """TC-B06: POST /auth/verify-email with a password_reset token returns 400 (typ mismatch)."""
    user_id = uuid.uuid4()
    reset_token, _ = create_reset_token(user_id)
    resp = client.post("/api/v1/auth/verify-email", json={"token": reset_token})
    assert resp.status_code == 400


def test_send_trek_alerts_no_smtp():
    """TC-B07: send_trek_alerts_task returns {sent: False} when SMTP not configured."""
    from app.modules.account.tasks import send_trek_alerts_task

    original = settings.smtp_host
    settings.smtp_host = None  # type: ignore[assignment]
    try:
        result = send_trek_alerts_task()
        assert result["sent"] is False
        assert result["reason"] == "smtp_not_configured"
    finally:
        settings.smtp_host = original


def test_email_verification_token_round_trip():
    """TC-B08: create/parse_email_verification_token round-trips correctly."""
    user_id = uuid.uuid4()
    token, expires_at = create_email_verification_token(user_id)
    assert token
    parsed = parse_email_verification_token(token)
    assert parsed is not None
    assert parsed["sub"] == str(user_id)
    assert parsed["typ"] == "email_verification"

    wrong = parse_email_verification_token("garbage")
    assert wrong is None
