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
    BookmarkBySlugCreate,
    BookmarkCheckResponse,
    BookmarkCreate,
    BookmarkResponse,
    DownloadResponse,
    TrekAlertCreate,
    TrekAlertResponse,
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
