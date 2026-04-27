from __future__ import annotations

from datetime import datetime, timezone
from typing import Final

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    generate_placeholder_hash,
    hash_password,
    hash_token,
    validate_password_strength,
    verify_password,
)
from app.modules.auth.models import AuthIdentity, User, UserSession

EMAIL_PROVIDER: Final[str] = "email"
GOOGLE_PROVIDER: Final[str] = "google"


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    normalized_email = normalize_email(email)
    statement = select(User).where(User.email == normalized_email)
    return db.scalar(statement)


def register_email_user(
    db: Session,
    *,
    email: str,
    password: str,
    full_name: str | None,
    display_name: str | None,
) -> User:
    normalized_email = normalize_email(email)
    validate_password_strength(password)

    existing_user = get_user_by_email(db, normalized_email)
    if existing_user:
        raise ValueError("An account with this email already exists.")

    user = User(
        email=normalized_email,
        password_hash=hash_password(password),
        full_name=full_name,
        display_name=display_name,
        primary_auth_method=EMAIL_PROVIDER,
        is_active=True,
        is_verified_email=False,
        is_verified_mobile=False,
    )

    identity = AuthIdentity(
        user=user,
        provider=EMAIL_PROVIDER,
        provider_user_id=normalized_email,
        email=normalized_email,
        is_primary=True,
        is_verified=False,
    )

    db.add(user)
    db.add(identity)

    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Unable to create account with this email.") from exc

    return user


def authenticate_email_user(db: Session, *, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def create_session_for_user(
    db: Session,
    *,
    user: User,
    ip_address: str | None,
    user_agent: str | None,
) -> tuple[UserSession, str]:
    session = UserSession(
        user_id=user.id,
        session_token_hash=generate_placeholder_hash(),
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.flush()

    role_slugs = [r.slug for r in user.roles]
    token, expires_at = create_access_token(
        user_id=user.id,
        session_id=session.id,
        roles=role_slugs,
    )
    session.session_token_hash = hash_token(token)
    session.expires_at = expires_at
    user.last_login_at = datetime.now(timezone.utc)
    db.flush()

    return session, token


def revoke_session(db: Session, session: UserSession) -> None:
    session.revoked_at = datetime.now(timezone.utc)
    db.flush()


def login_or_register_google_user(
    db: Session,
    *,
    google_sub: str,
    email: str | None,
    full_name: str | None,
    is_verified_email: bool,
) -> User:
    # 1. Existing Google identity → return linked user
    existing_identity = db.scalar(
        select(AuthIdentity).where(
            AuthIdentity.provider == GOOGLE_PROVIDER,
            AuthIdentity.provider_user_id == google_sub,
        )
    )
    if existing_identity:
        existing_identity.last_used_at = datetime.now(timezone.utc)
        db.flush()
        user = db.scalar(select(User).where(User.id == existing_identity.user_id))
        if not user or not user.is_active:
            raise ValueError("Account linked to this Google identity is inactive.")
        return user

    # 2. Email matches an existing user → link Google identity
    if email:
        existing_user = get_user_by_email(db, email)
        if existing_user:
            db.add(AuthIdentity(
                user_id=existing_user.id,
                provider=GOOGLE_PROVIDER,
                provider_user_id=google_sub,
                email=email,
                is_primary=False,
                is_verified=is_verified_email,
                last_used_at=datetime.now(timezone.utc),
            ))
            if is_verified_email:
                existing_user.is_verified_email = True
            db.flush()
            return existing_user

    # 3. Brand new user via Google
    normalized_email = normalize_email(email) if email else None
    user = User(
        email=normalized_email,
        password_hash=None,
        full_name=full_name,
        display_name=full_name.split()[0] if full_name else None,
        primary_auth_method=GOOGLE_PROVIDER,
        is_active=True,
        is_verified_email=is_verified_email,
        is_verified_mobile=False,
    )
    db.add(user)
    db.add(AuthIdentity(
        user=user,
        provider=GOOGLE_PROVIDER,
        provider_user_id=google_sub,
        email=normalized_email,
        is_primary=True,
        is_verified=is_verified_email,
        last_used_at=datetime.now(timezone.utc),
    ))
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Unable to create account with this Google identity.") from exc
    return user