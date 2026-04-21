from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_session, get_current_user
from app.modules.auth.models import User, UserSession
from app.modules.auth.service import (
    authenticate_email_user,
    create_session_for_user,
    register_email_user,
    revoke_session,
)
from app.schemas.auth import (
    AuthResponse,
    EmailLoginRequest,
    EmailSignupRequest,
    GoogleAuthRequest,
    MessageResponse,
    MobileOtpRequest,
    MobileOtpVerifyRequest,
    PlaceholderResponse,
    UserResponse,
)

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


@router.post(
    "/google",
    response_model=PlaceholderResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
def google_auth_placeholder(_: GoogleAuthRequest) -> PlaceholderResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google auth interface placeholder. Not implemented in Step 03.",
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