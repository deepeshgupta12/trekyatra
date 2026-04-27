"""CMS admin authentication endpoints.

Completely separate from the public user auth system:
- Uses trekyatra_admin_token cookie (not trekyatra_access_token)
- Credentials stored in env (ADMIN_EMAIL + ADMIN_PASSWORD), no DB table
- Only the configured admin email can log in
"""

from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import create_admin_token
from app.modules.auth.dependencies import get_current_admin

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminMeResponse(BaseModel):
    email: str


@router.post("/login")
def admin_login(payload: AdminLoginRequest, response: Response) -> dict:
    if not settings.admin_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin authentication is not configured on this server.",
        )

    email_match = secrets.compare_digest(payload.email, settings.admin_email)
    password_match = secrets.compare_digest(payload.password, settings.admin_password)
    if not (email_match and password_match):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
        )

    token, expires_at = create_admin_token(payload.email)
    response.set_cookie(
        key=settings.admin_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        max_age=int(settings.admin_token_expire_hours * 3600),
    )
    return {"email": payload.email, "expires_at": expires_at.isoformat()}


@router.post("/logout")
def admin_logout(response: Response) -> dict:
    response.delete_cookie(key=settings.admin_cookie_name)
    return {"message": "Logged out."}


@router.get("/me", response_model=AdminMeResponse)
def admin_me(admin: dict = Depends(get_current_admin)) -> AdminMeResponse:
    return AdminMeResponse(email=admin.get("sub", ""))
