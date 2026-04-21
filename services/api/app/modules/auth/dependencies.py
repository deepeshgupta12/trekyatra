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