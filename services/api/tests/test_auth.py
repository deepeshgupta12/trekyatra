import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.modules.auth.models import AuthIdentity, User, UserSession

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_auth_state() -> None:
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


def test_email_signup_sets_cookie_and_returns_user() -> None:
    email = f"user-{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        "/api/v1/auth/signup/email",
        json={
            "email": email,
            "password": "strongpass123",
            "full_name": "Deepesh Gupta",
            "display_name": "Deepesh",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == email
    assert settings.auth_cookie_name in client.cookies


def test_me_and_logout_flow() -> None:
    email = f"user-{uuid.uuid4().hex[:8]}@example.com"
    signup_response = client.post(
        "/api/v1/auth/signup/email",
        json={
            "email": email,
            "password": "strongpass123",
            "full_name": "Deepesh Gupta",
        },
    )
    assert signup_response.status_code == 201

    me_response = client.get("/api/v1/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email

    logout_response = client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 200
    assert logout_response.json()["message"] == "Logged out successfully."

    me_after_logout = client.get("/api/v1/auth/me")
    assert me_after_logout.status_code == 401


def test_email_login_works_after_signup() -> None:
    email = f"user-{uuid.uuid4().hex[:8]}@example.com"
    signup_response = client.post(
        "/api/v1/auth/signup/email",
        json={
            "email": email,
            "password": "strongpass123",
        },
    )
    assert signup_response.status_code == 201

    client.post("/api/v1/auth/logout")

    login_response = client.post(
        "/api/v1/auth/login/email",
        json={
            "email": email,
            "password": "strongpass123",
        },
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["email"] == email
    assert settings.auth_cookie_name in client.cookies


def test_google_placeholder_returns_not_implemented() -> None:
    response = client.post(
        "/api/v1/auth/google",
        json={"id_token": "placeholder-token"},
    )
    assert response.status_code == 501


def test_mobile_otp_placeholders_return_not_implemented() -> None:
    request_response = client.post(
        "/api/v1/auth/mobile/request-otp",
        json={"mobile_number": "9999999999"},
    )
    verify_response = client.post(
        "/api/v1/auth/mobile/verify-otp",
        json={"mobile_number": "9999999999", "otp": "123456"},
    )

    assert request_response.status_code == 501
    assert verify_response.status_code == 501