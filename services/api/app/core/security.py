import base64
import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from jwt import InvalidTokenError

from app.core.config import settings


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value.encode("utf-8"))


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    iterations = 390_000
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return f"pbkdf2_sha256${iterations}${_b64encode(salt)}${_b64encode(derived_key)}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False

    try:
        algorithm, iterations_raw, salt_raw, expected_raw = password_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    iterations = int(iterations_raw)
    salt = _b64decode(salt_raw)
    expected = _b64decode(expected_raw)

    candidate = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(candidate, expected)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_placeholder_hash() -> str:
    return hash_token(secrets.token_urlsafe(48))


def create_access_token(
    *, user_id: uuid.UUID, session_id: uuid.UUID, roles: list[str] | None = None
) -> tuple[str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.auth_access_token_expire_minutes
    )
    payload = {
        "sub": str(user_id),
        "sid": str(session_id),
        "typ": "access",
        "iat": datetime.now(timezone.utc),
        "exp": expires_at,
        "roles": roles or [],
    }
    token = jwt.encode(
        payload,
        settings.auth_jwt_secret,
        algorithm=settings.auth_jwt_algorithm,
    )
    return token, expires_at


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.auth_jwt_secret,
        algorithms=[settings.auth_jwt_algorithm],
    )


def parse_access_token(token: str) -> dict | None:
    try:
        return decode_access_token(token)
    except InvalidTokenError:
        return None


def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")