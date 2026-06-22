import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.auth.service import login_or_register_google_user
from app.modules.mobile.service import issue_mobile_token, mobile_login, mobile_signup, refresh_mobile_token
from app.schemas.mobile import (
    MobileAccessOut,
    MobileAuthOut,
    MobileGoogleIn,
    MobileRefreshIn,
    MobileSignInIn,
    MobileSignUpIn,
    MobileTokenIn,
    MobileTokenOut,
)

router = APIRouter(prefix="/auth/mobile", tags=["mobile-auth"])


@router.post("/login", response_model=MobileAuthOut)
def mobile_login_endpoint(
    body: MobileSignInIn,
    db: Session = Depends(get_db),
) -> MobileAuthOut:
    """Sign in with email/password and get mobile Bearer tokens (no cookie required)."""
    try:
        result = mobile_login(
            db=db,
            email=body.email,
            password=body.password,
            device_id=body.device_id,
            platform=body.platform,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    return MobileAuthOut(**result)


@router.post("/signup", response_model=MobileAuthOut, status_code=status.HTTP_201_CREATED)
def mobile_signup_endpoint(
    body: MobileSignUpIn,
    db: Session = Depends(get_db),
) -> MobileAuthOut:
    """Sign up with email/password and get mobile Bearer tokens directly."""
    try:
        result = mobile_signup(
            db=db,
            email=body.email,
            password=body.password,
            full_name=body.full_name,
            device_id=body.device_id,
            platform=body.platform,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return MobileAuthOut(**result)


@router.post("/token", response_model=MobileTokenOut)
def get_mobile_token(
    body: MobileTokenIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MobileTokenOut:
    """Exchange an existing web session for long-lived mobile Bearer tokens."""
    result = issue_mobile_token(
        db=db,
        user_id=current_user.id,
        device_id=body.device_id,
        platform=body.platform,
    )
    return MobileTokenOut(**result)


@router.post("/google", response_model=MobileAuthOut)
def mobile_google_auth(
    body: MobileGoogleIn,
    db: Session = Depends(get_db),
) -> MobileAuthOut:
    """Exchange a Google access token for mobile Bearer tokens (no cookie required)."""
    try:
        with httpx.Client(timeout=10.0) as http:
            r = http.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {body.access_token}"},
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

    tokens = issue_mobile_token(
        db=db,
        user_id=user.id,
        device_id=body.device_id,
        platform=body.platform,
    )
    return MobileAuthOut(
        **tokens,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
    )


@router.post("/token/refresh", response_model=MobileAccessOut)
def refresh_mobile_token_endpoint(
    body: MobileRefreshIn,
    db: Session = Depends(get_db),
) -> MobileAccessOut:
    """Use a refresh token to obtain a new access token."""
    result = refresh_mobile_token(db=db, refresh_token=body.refresh_token, device_id=body.device_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )
    return MobileAccessOut(**result)
