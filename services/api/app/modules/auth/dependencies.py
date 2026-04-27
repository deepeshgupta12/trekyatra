from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_token, parse_access_token
from app.db.session import get_db
from app.modules.auth.models import User, UserSession


def get_current_admin(request: Request) -> dict:
    """FastAPI dependency for CMS admin routes.

    Validates the trekyatra_admin_token cookie (completely separate from the public
    user cookie). Returns the decoded JWT payload on success. Raises 401 otherwise.
    """
    token = request.cookies.get(settings.admin_cookie_name)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required.",
        )
    payload = parse_access_token(token)
    if not payload or payload.get("typ") != "admin_access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin session.",
        )
    return payload


def _unauthorized(detail: str = "Authentication required.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
    )


def get_current_session(
    request: Request,
    db: Session = Depends(get_db),
) -> UserSession:
    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        raise _unauthorized()

    payload = parse_access_token(token)
    if not payload:
        raise _unauthorized("Invalid or expired session.")

    raw_user_id = payload.get("sub")
    raw_session_id = payload.get("sid")
    token_type = payload.get("typ")

    if not raw_user_id or not raw_session_id or token_type != "access":
        raise _unauthorized("Invalid session payload.")

    try:
        user_id = uuid.UUID(str(raw_user_id))
        session_id = uuid.UUID(str(raw_session_id))
    except ValueError as exc:
        raise _unauthorized("Invalid session payload.") from exc

    statement = select(UserSession).where(
        UserSession.id == session_id,
        UserSession.user_id == user_id,
    )
    session = db.scalar(statement)
    if not session:
        raise _unauthorized("Session not found.")

    if session.revoked_at is not None:
        raise _unauthorized("Session has been revoked.")

    if session.expires_at <= datetime.now(timezone.utc):
        raise _unauthorized("Session has expired.")

    if session.session_token_hash != hash_token(token):
        raise _unauthorized("Session token mismatch.")

    return session


def get_current_user(
    session: UserSession = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> User:
    statement = select(User).where(User.id == session.user_id)
    user = db.scalar(statement)
    if not user or not user.is_active:
        raise _unauthorized("User not found or inactive.")
    return user


# ──────────────────────────────────────────────────────────────────────────────
# Role-based access control
# ──────────────────────────────────────────────────────────────────────────────

class RequireRole:
    """FastAPI dependency that enforces role-based access control.

    Superusers (is_superuser=True) bypass all role checks.

    Named singletons at the bottom of this module are the keys used in
    ``app.dependency_overrides`` during testing.
    """

    def __init__(self, roles: list[str]) -> None:
        self.roles = set(roles)

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.is_superuser:
            return user
        user_slugs = {r.slug for r in user.roles}
        if not user_slugs & self.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )
        return user


# Named singletons — import these in route files and in conftest.py overrides
require_super_admin = RequireRole(["super_admin"])
require_admin = RequireRole(["admin", "super_admin"])
require_editor = RequireRole(["admin", "editor", "super_admin"])
require_pipeline = RequireRole(["admin", "super_admin"])
require_agent_admin = RequireRole(["admin", "super_admin"])
