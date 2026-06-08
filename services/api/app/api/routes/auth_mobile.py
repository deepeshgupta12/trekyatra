from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.mobile.service import issue_mobile_token, mobile_login, mobile_signup, refresh_mobile_token
from app.schemas.mobile import (
    MobileAccessOut,
    MobileAuthOut,
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
