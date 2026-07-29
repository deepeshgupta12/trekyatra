from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.account import service as account_service
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.products.service import build_download_url
from app.modules.products.models import UserOrder
from sqlalchemy import select as sa_select
from app.schemas.account import (
    AnonPreferencesUpdate,
    BehaviorProfilePayload,
    BehaviorProfileResponse,
    BookmarkBySlugCreate,
    BookmarkCheckResponse,
    BookmarkCreate,
    BookmarkResponse,
    ComparisonCreate,
    ComparisonResponse,
    DownloadResponse,
    TrekAlertCreate,
    TrekAlertResponse,
    UserPreferencesResponse,
    UserPreferencesUpdate,
    UserProfileResponse,
    UserProfileUpdate,
)

router = APIRouter(prefix="/account", tags=["account"])


# --- Bookmarks ---

@router.post("/bookmarks", response_model=BookmarkResponse)
def add_bookmark(
    body: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return account_service.add_bookmark(db, current_user.id, body.cms_page_id)


@router.post("/bookmarks/by-slug", response_model=BookmarkResponse)
def add_bookmark_by_slug(
    body: BookmarkBySlugCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return account_service.add_bookmark_by_slug(
        db, current_user.id, body.trek_slug, body.title, body.hero_image_url
    )


@router.delete("/bookmarks/by-slug/{trek_slug}", status_code=204)
def remove_bookmark_by_slug(
    trek_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    removed = account_service.remove_bookmark_by_slug(db, current_user.id, trek_slug)
    if not removed:
        raise HTTPException(status_code=404, detail="Bookmark not found")


@router.get("/bookmarks/check/{trek_slug}", response_model=BookmarkCheckResponse)
def check_bookmark(
    trek_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return account_service.check_bookmark(db, current_user.id, trek_slug)


@router.delete("/bookmarks/{cms_page_id}", status_code=204)
def remove_bookmark(
    cms_page_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    removed = account_service.remove_bookmark(db, current_user.id, cms_page_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Bookmark not found")


@router.get("/bookmarks", response_model=list[BookmarkResponse])
def list_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return account_service.list_bookmarks(db, current_user.id)


# --- Downloads ---

@router.get("/downloads", response_model=list[DownloadResponse])
def list_downloads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return account_service.list_downloads(db, current_user.id)


@router.post("/downloads/{order_id}/url")
def get_download_url(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.scalar(
        sa_select(UserOrder).where(UserOrder.id == order_id, UserOrder.user_id == current_user.id, UserOrder.status == "paid")
    )
    if not order:
        raise HTTPException(status_code=404, detail="Paid order not found")
    return {"download_url": build_download_url(str(order_id))}


# --- Alerts ---

@router.post("/alerts", response_model=TrekAlertResponse)
def add_alert(
    body: TrekAlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return account_service.add_alert(db, current_user.id, body.trek_slug, body.alert_type)


@router.delete("/alerts/{trek_slug}", status_code=204)
def remove_alert(
    trek_slug: str,
    alert_type: str = "any",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    removed = account_service.remove_alert(db, current_user.id, trek_slug, alert_type)
    if not removed:
        raise HTTPException(status_code=404, detail="Alert not found")


@router.get("/alerts", response_model=list[TrekAlertResponse])
def list_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return account_service.list_alerts(db, current_user.id)


# --- Profile ---

@router.get("/profile", response_model=UserProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = account_service.get_profile(db, current_user.id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("/profile", response_model=UserProfileResponse)
def upsert_profile(
    body: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return account_service.upsert_profile(db, current_user.id, body.model_dump(exclude_none=True))


# --- Saved Comparisons ---

@router.get("/comparisons", response_model=list[ComparisonResponse])
def list_comparisons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return account_service.list_comparisons(db, current_user.id)


@router.post("/comparisons", response_model=ComparisonResponse, status_code=201)
def save_comparison(
    body: ComparisonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(body.slugs) < 2:
        raise HTTPException(status_code=422, detail="At least 2 slugs required for a comparison.")
    return account_service.save_comparison(db, current_user.id, body.name, body.slugs)


@router.delete("/comparisons/{comparison_id}", status_code=204)
def delete_comparison(
    comparison_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = account_service.delete_comparison(db, current_user.id, comparison_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comparison not found.")


# --- Behavior Profile ---

@router.get("/behavior-profile", response_model=BehaviorProfileResponse)
def get_behavior_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = account_service.get_behavior_profile(db, current_user.id)
    return BehaviorProfileResponse(**data) if data else BehaviorProfileResponse()


@router.put("/behavior-profile", response_model=BehaviorProfileResponse)
def put_behavior_profile(
    body: BehaviorProfilePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = account_service.update_behavior_profile(db, current_user.id, body.model_dump())
    return BehaviorProfileResponse(**data) if data else BehaviorProfileResponse()


# --- Onboarding preferences (v1.1 personalization) ---
@router.get("/preferences", response_model=UserPreferencesResponse)
def get_preferences(
    anonymous_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPreferencesResponse:
    # On first authed fetch, adopt any anon row for this device (merge-on-login).
    if anonymous_id:
        account_service.merge_anon_into_user(db, current_user.id, anonymous_id)
    prefs = account_service.get_preferences(db, user_id=current_user.id, anonymous_id=anonymous_id)
    if prefs is None:
        return UserPreferencesResponse()  # not onboarded yet → empty defaults
    return UserPreferencesResponse.model_validate(prefs)


@router.put("/preferences", response_model=UserPreferencesResponse)
def update_preferences(
    body: UserPreferencesUpdate,
    anonymous_id: str | None = None,
    device_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPreferencesResponse:
    """Write prefs for the logged-in user; adopts a matching anon row (merge-on-login)."""
    prefs = account_service.upsert_preferences(
        db, body, user_id=current_user.id, anonymous_id=anonymous_id, device_id=device_id
    )
    return UserPreferencesResponse.model_validate(prefs)


# --- Public anon preferences (logged-out; persists across uninstall via anon id) ---
public_router = APIRouter(prefix="/app", tags=["app-preferences"])


@public_router.get("/preferences", response_model=UserPreferencesResponse)
def get_anon_preferences(anonymous_id: str, db: Session = Depends(get_db)) -> UserPreferencesResponse:
    prefs = account_service.get_preferences(db, anonymous_id=anonymous_id)
    if prefs is None:
        return UserPreferencesResponse()
    return UserPreferencesResponse.model_validate(prefs)


@public_router.put("/preferences", response_model=UserPreferencesResponse)
def put_anon_preferences(body: AnonPreferencesUpdate, db: Session = Depends(get_db)) -> UserPreferencesResponse:
    patch = UserPreferencesUpdate(**body.model_dump(exclude={"anonymous_id", "device_id"}, exclude_unset=True))
    prefs = account_service.upsert_preferences(
        db, patch, anonymous_id=body.anonymous_id, device_id=body.device_id
    )
    return UserPreferencesResponse.model_validate(prefs)
