from __future__ import annotations

import logging
import smtplib
import uuid
from email.mime.text import MIMEText

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_reset_token, hash_password, parse_reset_token, validate_password_strength
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_session, get_current_user
from app.modules.auth.models import User, UserSession
from app.modules.auth.service import (
    authenticate_email_user,
    create_session_for_user,
    get_user_by_email,
    login_or_register_google_user,
    normalize_email,
    register_email_user,
    revoke_session,
)
from app.schemas.auth import (
    AccountSettingsUpdate,
    AuthResponse,
    EmailLoginRequest,
    EmailSignupRequest,
    ForgotPasswordRequest,
    GoogleAuthRequest,
    LeadResponse,
    MessageResponse,
    MobileOtpRequest,
    MobileOtpVerifyRequest,
    PlaceholderResponse,
    ResetPasswordRequest,
    UserResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        max_age=settings.auth_access_token_expire_minutes * 60,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        samesite=settings.auth_cookie_samesite,
        secure=settings.auth_cookie_secure,
        httponly=True,
    )


@router.post(
    "/signup/email",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup_email(
    payload: EmailSignupRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthResponse:
    try:
        user = register_email_user(
            db,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            display_name=payload.display_name,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    session, token = create_session_for_user(
        db,
        user=user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(user)
    db.refresh(session)

    _set_auth_cookie(response, token)
    try:
        from app.modules.email_sequences.tasks import send_welcome_email_task
        send_welcome_email_task.delay(user.email, user.full_name)
    except Exception:
        pass

    return AuthResponse(
        user=UserResponse.model_validate(
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "display_name": user.display_name,
                "is_verified_email": user.is_verified_email,
                "is_verified_mobile": user.is_verified_mobile,
                "primary_auth_method": user.primary_auth_method,
                "created_at": user.created_at,
            }
        ),
        session_expires_at=session.expires_at,
    )


@router.post("/login/email", response_model=AuthResponse)
def login_email(
    payload: EmailLoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthResponse:
    user = authenticate_email_user(
        db,
        email=payload.email,
        password=payload.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    session, token = create_session_for_user(
        db,
        user=user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(user)
    db.refresh(session)

    _set_auth_cookie(response, token)
    return AuthResponse(
        user=UserResponse.model_validate(
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "display_name": user.display_name,
                "is_verified_email": user.is_verified_email,
                "is_verified_mobile": user.is_verified_mobile,
                "primary_auth_method": user.primary_auth_method,
                "created_at": user.created_at,
            }
        ),
        session_expires_at=session.expires_at,
    )


@router.get("/me", response_model=UserResponse)
def read_current_user(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(
        {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "display_name": user.display_name,
            "is_verified_email": user.is_verified_email,
            "is_verified_mobile": user.is_verified_mobile,
            "primary_auth_method": user.primary_auth_method,
            "created_at": user.created_at,
            "subscription_plan": user.subscription_plan,
        }
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    session: UserSession | None = Depends(get_current_session),
) -> MessageResponse:
    if session is not None:
        revoke_session(db, session)
        db.commit()

    _clear_auth_cookie(response)
    return MessageResponse(message="Logged out successfully.")


@router.post("/google", response_model=AuthResponse)
def google_auth(
    payload: GoogleAuthRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> AuthResponse:
    try:
        with httpx.Client(timeout=10.0) as http:
            r = http.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {payload.access_token}"},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify Google token. Please try again.",
        ) from exc

    if r.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google access token.",
        )

    google_info = r.json()
    google_sub = google_info.get("sub")
    if not google_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not retrieve Google user identity.",
        )

    try:
        user = login_or_register_google_user(
            db,
            google_sub=google_sub,
            email=google_info.get("email"),
            full_name=google_info.get("name"),
            is_verified_email=bool(google_info.get("email_verified", False)),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    session, token = create_session_for_user(
        db,
        user=user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(user)
    db.refresh(session)

    _set_auth_cookie(response, token)
    return AuthResponse(
        user=UserResponse.model_validate(
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "display_name": user.display_name,
                "is_verified_email": user.is_verified_email,
                "is_verified_mobile": user.is_verified_mobile,
                "primary_auth_method": user.primary_auth_method,
                "created_at": user.created_at,
            }
        ),
        session_expires_at=session.expires_at,
    )


@router.post(
    "/mobile/request-otp",
    response_model=PlaceholderResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
def mobile_request_otp_placeholder(_: MobileOtpRequest) -> PlaceholderResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Mobile OTP request interface placeholder. Not implemented in Step 03.",
    )


@router.post(
    "/mobile/verify-otp",
    response_model=PlaceholderResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
def mobile_verify_otp_placeholder(_: MobileOtpVerifyRequest) -> PlaceholderResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Mobile OTP verify interface placeholder. Not implemented in Step 03.",
    )


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    """Request a password reset link. Always returns 200 to prevent email enumeration."""
    email = normalize_email(payload.email)
    user = get_user_by_email(db, email)
    if user:
        token, _ = create_reset_token(user.id)
        reset_url = f"{settings.product_download_base_url}/auth/reset-password?token={token}"
        _send_reset_email(email, reset_url)
    return MessageResponse(message="If an account with that email exists, a reset link has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    payload_data = parse_reset_token(payload.token)
    if not payload_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    try:
        validate_password_strength(payload.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    user_id = uuid.UUID(payload_data["sub"])
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return MessageResponse(message="Password updated successfully. Please sign in.")


def _send_reset_email(to_email: str, reset_url: str) -> None:
    if not settings.smtp_host:
        logger.info("SMTP not configured — password reset link: %s", reset_url)
        return
    try:
        body = (
            f"Hi,\n\nYou requested a password reset for your TrekYatra account.\n\n"
            f"Click the link below to set a new password (valid for 1 hour):\n{reset_url}\n\n"
            f"If you did not request this, ignore this email.\n\n— TrekYatra"
        )
        msg = MIMEText(body)
        msg["Subject"] = "Reset your TrekYatra password"
        msg["From"] = settings.smtp_from_email
        msg["To"] = to_email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_user and settings.smtp_password:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
    except Exception:
        logger.warning("Failed to send password reset email to %s", to_email)


# ---------------------------------------------------------------------------
# Account settings (update profile)
# ---------------------------------------------------------------------------

@router.patch("/me", response_model=UserResponse)
def update_account_settings(
    payload: AccountSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate({
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "display_name": current_user.display_name,
        "is_verified_email": current_user.is_verified_email,
        "is_verified_mobile": current_user.is_verified_mobile,
        "primary_auth_method": current_user.primary_auth_method,
        "created_at": current_user.created_at,
        "subscription_plan": current_user.subscription_plan,
    })


# ---------------------------------------------------------------------------
# Account enquiries (leads submitted by this user's email)
# ---------------------------------------------------------------------------

@router.get("/me/leads", response_model=list[LeadResponse])
def get_my_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[LeadResponse]:
    from sqlalchemy import select
    from app.modules.leads.models import LeadSubmission
    leads = list(db.scalars(
        select(LeadSubmission)
        .where(LeadSubmission.email == current_user.email)
        .order_by(LeadSubmission.created_at.desc())
        .limit(50)
    ).all())
    return [LeadResponse.model_validate({
        "id": str(l.id),
        "trek_interest": l.trek_interest,
        "status": l.status,
        "source_page": l.source_page,
        "cta_type": l.cta_type,
        "created_at": l.created_at,
    }) for l in leads]