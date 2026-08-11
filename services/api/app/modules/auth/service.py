from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Final

import jwt
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
from app.core.config import settings

EMAIL_PROVIDER: Final[str] = "email"
GOOGLE_PROVIDER: Final[str] = "google"
APPLE_PROVIDER: Final[str] = "apple"

# Sign in with Apple: verify identity tokens against Apple's public keys.
_APPLE_ISSUER: Final[str] = "https://appleid.apple.com"
_apple_jwks_client = jwt.PyJWKClient("https://appleid.apple.com/auth/keys")


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

    # User registered via Google OAuth — no password is set.
    # Return a descriptive error so the frontend can show a helpful message.
    if user.password_hash is None:
        raise ValueError(
            "This account was created with Google sign-in. "
            "Please click 'Continue with Google' to sign in, "
            "or use 'Forgot password?' to set a password."
        )

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


def mark_email_verified(db: Session, user_id: uuid.UUID) -> None:
    """Mark user's email as verified. No-op if already verified or user not found."""
    user = db.scalar(select(User).where(User.id == user_id))
    if user and not user.is_verified_email:
        user.is_verified_email = True
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


def verify_apple_identity_token(identity_token: str) -> dict:
    """Verify a Sign-in-with-Apple identity token (JWT) against Apple's public keys.

    Checks the RS256 signature, issuer (appleid.apple.com), audience (our bundle ID) and
    expiry. Returns the decoded claims (sub, email, email_verified). Raises ValueError on
    any failure so the route can return 401.
    """
    try:
        signing_key = _apple_jwks_client.get_signing_key_from_jwt(identity_token)
        return jwt.decode(
            identity_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.apple_bundle_id,
            issuer=_APPLE_ISSUER,
        )
    except Exception as exc:  # PyJWKClientError / InvalidTokenError / network
        raise ValueError("Invalid or expired Apple identity token.") from exc


def login_or_register_apple_user(
    db: Session,
    *,
    apple_sub: str,
    email: str | None,
    full_name: str | None,
    is_verified_email: bool,
) -> User:
    # 1. Existing Apple identity → return linked user
    existing_identity = db.scalar(
        select(AuthIdentity).where(
            AuthIdentity.provider == APPLE_PROVIDER,
            AuthIdentity.provider_user_id == apple_sub,
        )
    )
    if existing_identity:
        existing_identity.last_used_at = datetime.now(timezone.utc)
        db.flush()
        user = db.scalar(select(User).where(User.id == existing_identity.user_id))
        if not user or not user.is_active:
            raise ValueError("Account linked to this Apple identity is inactive.")
        return user

    # 2. Email matches an existing user → link Apple identity
    if email:
        existing_user = get_user_by_email(db, email)
        if existing_user:
            db.add(AuthIdentity(
                user_id=existing_user.id,
                provider=APPLE_PROVIDER,
                provider_user_id=apple_sub,
                email=email,
                is_primary=False,
                is_verified=is_verified_email,
                last_used_at=datetime.now(timezone.utc),
            ))
            if is_verified_email:
                existing_user.is_verified_email = True
            db.flush()
            return existing_user

    # 3. Brand new user via Apple
    normalized_email = normalize_email(email) if email else None
    user = User(
        email=normalized_email,
        password_hash=None,
        full_name=full_name,
        display_name=full_name.split()[0] if full_name else None,
        primary_auth_method=APPLE_PROVIDER,
        is_active=True,
        is_verified_email=is_verified_email,
        is_verified_mobile=False,
    )
    db.add(user)
    db.add(AuthIdentity(
        user=user,
        provider=APPLE_PROVIDER,
        provider_user_id=apple_sub,
        email=normalized_email,
        is_primary=True,
        is_verified=is_verified_email,
        last_used_at=datetime.now(timezone.utc),
    ))
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Unable to create account with this Apple identity.") from exc
    return user


def delete_account(db: Session, user: User) -> None:
    """Permanently delete the user's own account in-app (Apple App Store Guideline 5.1.1).

    Anonymises ALL personal data and disables the account (auth already rejects is_active=False, so
    existing tokens stop working immediately and login is blocked). Removes OAuth identities + sessions
    so the account can never be re-authenticated or re-linked — a subsequent Sign in with Apple/Google
    creates a fresh account. The (now anonymised) user row is retained so referential integrity of any
    orders/reports is preserved. Not just "data deletion" and not a deactivation — the account is gone.
    """
    # 1) Purge behavioural / CDP data (same scope as delete_my_data).
    from app.modules.cdp.models import AnalyticsEvent, AnalyticsSession, AttributionTouchpoint, UserTrait
    db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == user.id).delete()
    db.query(AnalyticsSession).filter(AnalyticsSession.user_id == user.id).delete()
    db.query(AttributionTouchpoint).filter(AttributionTouchpoint.user_id == user.id).delete()
    db.query(UserTrait).filter(UserTrait.user_id == user.id).delete()

    # 2) Remove auth identities + sessions (block re-auth / re-link).
    db.query(AuthIdentity).filter(AuthIdentity.user_id == user.id).delete()
    db.query(UserSession).filter(UserSession.user_id == user.id).delete()

    # 3) Anonymise PII + disable the account.
    user.email = None
    user.password_hash = None
    user.full_name = None
    user.display_name = "Deleted user"
    user.behavior_profile = {}
    user.primary_auth_method = None
    user.subscription_plan = "free"
    user.is_active = False
    user.deleted_at = datetime.now(timezone.utc)
    db.commit()