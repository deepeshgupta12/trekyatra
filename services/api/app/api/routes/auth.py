from __future__ import annotations

import logging
import smtplib
import uuid
from email.mime.text import MIMEText

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_email_verification_token,
    create_reset_token,
    hash_password,
    parse_email_verification_token,
    parse_reset_token,
    validate_password_strength,
)
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_session, get_current_user
from app.modules.auth.models import User, UserSession
from app.modules.auth.service import (
    authenticate_email_user,
    create_session_for_user,
    delete_account,
    get_user_by_email,
    login_or_register_google_user,
    mark_email_verified,
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
    VerifyEmailRequest,
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
    background_tasks: BackgroundTasks,
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
    # Send the account welcome email in the API process (BackgroundTask), not via Celery, so it does
    # not depend on the worker being up/restarted (same model as the verification email below).
    from app.modules.email_sequences.tasks import send_account_welcome_email
    background_tasks.add_task(send_account_welcome_email, user.email, user.full_name)

    # Send email verification link immediately on signup (Z04)
    try:
        token_str, _ = create_email_verification_token(user.id)
        verify_url = f"{settings.frontend_url}/auth/verify-email?token={token_str}"
        _send_verification_email_helper(user.email, user.full_name, verify_url)
    except Exception:
        logger.warning("Failed to send signup verification email for %s", user.email)

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
    try:
        user = authenticate_email_user(
            db,
            email=payload.email,
            password=payload.password,
        )
    except ValueError as exc:
        # Specific case: account exists but has no password (e.g. registered via Google)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
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
# Email verification (Z04)
# ---------------------------------------------------------------------------

@router.post("/send-verification", response_model=MessageResponse)
def send_verification_email(
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """Send an email verification link to the authenticated user's address."""
    if current_user.is_verified_email:
        raise HTTPException(status_code=400, detail="Email is already verified.")
    token, _ = create_email_verification_token(current_user.id)
    verify_url = f"{settings.frontend_url}/auth/verify-email?token={token}"
    _send_verification_email_helper(current_user.email, current_user.full_name, verify_url)
    return MessageResponse(message="Verification email sent. Check your inbox.")


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Consume a verification token and mark the user's email as verified."""
    parsed = parse_email_verification_token(payload.token)
    if not parsed:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")
    user_id = uuid.UUID(parsed["sub"])
    mark_email_verified(db, user_id)
    db.commit()
    return MessageResponse(message="Email verified successfully.")


def _send_verification_email_helper(to_email: str, name: str | None, verify_url: str) -> None:
    if not settings.smtp_host:
        logger.info("SMTP not configured — email verification link: %s", verify_url)
        return
    try:
        greeting = f"Hi {name}," if name else "Hi,"
        body = (
            f"{greeting}\n\n"
            f"Please verify your email address for TrekYatra by clicking the link below:\n\n"
            f"{verify_url}\n\n"
            f"This link is valid for 24 hours. If you did not create an account, ignore this email.\n\n"
            f"— TrekYatra Team\nexplore@trekyatra.co.in"
        )
        msg = MIMEText(body)
        msg["Subject"] = "Verify your TrekYatra email address"
        msg["From"] = settings.smtp_from_email
        msg["To"] = to_email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_user and settings.smtp_password:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
    except Exception:
        logger.warning("Failed to send verification email to %s", to_email)


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


# ---------------------------------------------------------------------------
# DPDP Act 2023 — data export and deletion rights
# ---------------------------------------------------------------------------

@router.get("/me/data-export")
def data_export(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Return all personal data held for the authenticated user (DPDP Art. 11)."""
    from app.modules.cdp.models import AnalyticsEvent, AnalyticsSession, AttributionTouchpoint, UserTrait

    events = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.user_id == current_user.id)
        .order_by(AnalyticsEvent.created_at.desc())
        .limit(1000)
        .all()
    )
    sessions = (
        db.query(AnalyticsSession)
        .filter(AnalyticsSession.user_id == current_user.id)
        .order_by(AnalyticsSession.started_at.desc())
        .limit(200)
        .all()
    )
    traits = (
        db.query(UserTrait)
        .filter(UserTrait.user_id == current_user.id)
        .first()
    )
    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "analytics_events": [
            {
                "event_category": e.event_category,
                "event_name": e.event_name,
                "page_url": e.page_url,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
        "sessions": [
            {
                "id": s.id,
                "started_at": s.started_at.isoformat(),
                "duration_seconds": s.duration_seconds,
                "page_count": s.page_count,
            }
            for s in sessions
        ],
        "traits": {
            "total_sessions": traits.total_sessions if traits else 0,
            "total_events": traits.total_events if traits else 0,
            "first_seen_at": traits.first_seen_at.isoformat() if traits and traits.first_seen_at else None,
            "acquisition_source": traits.acquisition_source if traits else None,
        },
    }


@router.delete("/me/data", status_code=204)
def delete_my_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete all behavioural data for the authenticated user (DPDP Art. 12). Account stays active."""
    from app.modules.cdp.models import AnalyticsEvent, AnalyticsSession, AttributionTouchpoint, UserTrait

    db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == current_user.id).delete()
    db.query(AnalyticsSession).filter(AnalyticsSession.user_id == current_user.id).delete()
    db.query(AttributionTouchpoint).filter(AttributionTouchpoint.user_id == current_user.id).delete()
    db.query(UserTrait).filter(UserTrait.user_id == current_user.id).delete()
    db.commit()


@router.delete("/me", status_code=204)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Permanently delete the authenticated user's ACCOUNT in-app (Apple App Store Guideline 5.1.1).

    Anonymises all PII, disables the account (auth blocks is_active=False), and removes OAuth identities,
    sessions, and behavioural data. Distinct from `/me/data` (which only clears analytics and keeps the
    account active). After this, the caller's token is invalid — the client must clear it and sign out.
    """
    delete_account(db, current_user)