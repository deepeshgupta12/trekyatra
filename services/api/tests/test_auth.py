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


def test_google_auth_creates_user_and_sets_cookie() -> None:
    from unittest.mock import patch

    with patch("app.api.routes.auth.httpx.Client") as mock_cls:
        mock_http = mock_cls.return_value.__enter__.return_value
        mock_http.get.return_value.status_code = 200
        mock_http.get.return_value.json.return_value = {
            "sub": "google-sub-test-001",
            "email": "googleuser@example.com",
            "name": "Google User",
            "email_verified": True,
        }
        response = client.post(
            "/api/v1/auth/google",
            json={"access_token": "fake-google-access-token"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "googleuser@example.com"
    assert data["user"]["is_verified_email"] is True
    assert data["user"]["primary_auth_method"] == "google"
    assert settings.auth_cookie_name in client.cookies


def test_google_auth_returns_401_for_invalid_token() -> None:
    from unittest.mock import patch

    with patch("app.api.routes.auth.httpx.Client") as mock_cls:
        mock_http = mock_cls.return_value.__enter__.return_value
        mock_http.get.return_value.status_code = 401
        mock_http.get.return_value.json.return_value = {"error": "invalid_token"}
        response = client.post(
            "/api/v1/auth/google",
            json={"access_token": "invalid-token"},
        )

    assert response.status_code == 401


def test_google_auth_links_to_existing_email_account() -> None:
    from unittest.mock import patch

    email = f"linked-{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/v1/auth/signup/email",
        json={"email": email, "password": "strongpass123"},
    )
    client.post("/api/v1/auth/logout")

    with patch("app.api.routes.auth.httpx.Client") as mock_cls:
        mock_http = mock_cls.return_value.__enter__.return_value
        mock_http.get.return_value.status_code = 200
        mock_http.get.return_value.json.return_value = {
            "sub": "google-sub-link-001",
            "email": email,
            "name": "Linked User",
            "email_verified": True,
        }
        response = client.post(
            "/api/v1/auth/google",
            json={"access_token": "fake-google-token"},
        )

    assert response.status_code == 200
    assert response.json()["user"]["email"] == email
    assert settings.auth_cookie_name in client.cookies


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