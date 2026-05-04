from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.account.models import TrekAlert, UserBookmark, UserDownload, UserProfile
from app.modules.cms.models import CMSPage

logger = logging.getLogger(__name__)


# --- Bookmarks ---

def add_bookmark(db: Session, user_id: UUID, cms_page_id: UUID) -> UserBookmark:
    existing = db.scalar(
        select(UserBookmark).where(
            UserBookmark.user_id == user_id,
            UserBookmark.cms_page_id == cms_page_id,
        )
    )
    if existing:
        return existing
    bookmark = UserBookmark(user_id=user_id, cms_page_id=cms_page_id)
    db.add(bookmark)
    try:
        db.commit()
        db.refresh(bookmark)
    except IntegrityError:
        db.rollback()
        bookmark = db.scalar(
            select(UserBookmark).where(
                UserBookmark.user_id == user_id,
                UserBookmark.cms_page_id == cms_page_id,
            )
        )
    return bookmark


def remove_bookmark(db: Session, user_id: UUID, cms_page_id: UUID) -> bool:
    bookmark = db.scalar(
        select(UserBookmark).where(
            UserBookmark.user_id == user_id,
            UserBookmark.cms_page_id == cms_page_id,
        )
    )
    if not bookmark:
        return False
    db.delete(bookmark)
    db.commit()
    return True


def list_bookmarks(db: Session, user_id: UUID) -> list[dict]:
    bookmarks = list(db.scalars(
        select(UserBookmark).where(UserBookmark.user_id == user_id).order_by(UserBookmark.created_at.desc())
    ).all())
    result = []
    for b in bookmarks:
        page = None
        if b.cms_page_id:
            page = db.scalar(select(CMSPage).where(CMSPage.id == b.cms_page_id))
        elif b.trek_slug:
            page = db.scalar(select(CMSPage).where(CMSPage.slug == b.trek_slug))
        result.append({
            "id": b.id,
            "user_id": b.user_id,
            "cms_page_id": b.cms_page_id,
            "trek_slug": b.trek_slug,
            "created_at": b.created_at,
            "slug": page.slug if page else b.trek_slug,
            "title": page.title if page else b.bookmark_title,
            "page_type": page.page_type if page else ("trek_guide" if b.trek_slug else None),
            "hero_image_url": page.hero_image_url if page else b.bookmark_image_url,
        })
    return result


def add_bookmark_by_slug(
    db: Session,
    user_id: UUID,
    trek_slug: str,
    title: str | None = None,
    hero_image_url: str | None = None,
) -> UserBookmark:
    # First try to resolve to a CMS page
    page = db.scalar(select(CMSPage).where(CMSPage.slug == trek_slug))
    if page:
        return add_bookmark(db, user_id, page.id)

    # No CMS page — store by slug directly
    existing = db.scalar(
        select(UserBookmark).where(
            UserBookmark.user_id == user_id,
            UserBookmark.trek_slug == trek_slug,
        )
    )
    if existing:
        # Update title/image if provided and not already set
        if title and not existing.bookmark_title:
            existing.bookmark_title = title
        if hero_image_url and not existing.bookmark_image_url:
            existing.bookmark_image_url = hero_image_url
        db.commit()
        db.refresh(existing)
        return existing

    bookmark = UserBookmark(
        user_id=user_id,
        trek_slug=trek_slug,
        bookmark_title=title,
        bookmark_image_url=hero_image_url,
    )
    db.add(bookmark)
    try:
        db.commit()
        db.refresh(bookmark)
    except IntegrityError:
        db.rollback()
        bookmark = db.scalar(
            select(UserBookmark).where(
                UserBookmark.user_id == user_id,
                UserBookmark.trek_slug == trek_slug,
            )
        )
    return bookmark


def remove_bookmark_by_slug(db: Session, user_id: UUID, trek_slug: str) -> bool:
    # Try slug-based bookmark first
    bookmark = db.scalar(
        select(UserBookmark).where(
            UserBookmark.user_id == user_id,
            UserBookmark.trek_slug == trek_slug,
        )
    )
    if not bookmark:
        # Fall back: bookmark was stored via CMS page whose slug matches
        page = db.scalar(select(CMSPage).where(CMSPage.slug == trek_slug))
        if page:
            bookmark = db.scalar(
                select(UserBookmark).where(
                    UserBookmark.user_id == user_id,
                    UserBookmark.cms_page_id == page.id,
                )
            )
    if not bookmark:
        return False
    db.delete(bookmark)
    db.commit()
    return True


def check_bookmark(db: Session, user_id: UUID, trek_slug: str) -> dict:
    # Check slug-based bookmark
    bookmark = db.scalar(
        select(UserBookmark).where(
            UserBookmark.user_id == user_id,
            UserBookmark.trek_slug == trek_slug,
        )
    )
    if not bookmark:
        # Check CMS-page-based bookmark for this slug
        page = db.scalar(select(CMSPage).where(CMSPage.slug == trek_slug))
        if page:
            bookmark = db.scalar(
                select(UserBookmark).where(
                    UserBookmark.user_id == user_id,
                    UserBookmark.cms_page_id == page.id,
                )
            )
    return {"bookmarked": bookmark is not None, "bookmark_id": bookmark.id if bookmark else None}


# --- Downloads ---

def list_downloads(db: Session, user_id: UUID) -> list[UserDownload]:
    return list(db.scalars(
        select(UserDownload).where(UserDownload.user_id == user_id).order_by(UserDownload.downloaded_at.desc())
    ).all())


def record_download(
    db: Session,
    user_id: UUID,
    filename: str,
    product_id: str | None = None,
    download_url: str | None = None,
    order_id: UUID | None = None,
) -> UserDownload:
    dl = UserDownload(
        user_id=user_id,
        filename=filename,
        product_id=product_id,
        download_url=download_url,
        order_id=order_id,
    )
    db.add(dl)
    db.commit()
    db.refresh(dl)
    return dl


# --- Alerts ---

def add_alert(db: Session, user_id: UUID, trek_slug: str, alert_type: str = "any") -> TrekAlert:
    existing = db.scalar(
        select(TrekAlert).where(
            TrekAlert.user_id == user_id,
            TrekAlert.trek_slug == trek_slug,
            TrekAlert.alert_type == alert_type,
        )
    )
    if existing:
        existing.active = True
        db.commit()
        db.refresh(existing)
        return existing
    alert = TrekAlert(user_id=user_id, trek_slug=trek_slug, alert_type=alert_type, active=True)
    db.add(alert)
    try:
        db.commit()
        db.refresh(alert)
    except IntegrityError:
        db.rollback()
        alert = db.scalar(
            select(TrekAlert).where(
                TrekAlert.user_id == user_id,
                TrekAlert.trek_slug == trek_slug,
                TrekAlert.alert_type == alert_type,
            )
        )
    return alert


def remove_alert(db: Session, user_id: UUID, trek_slug: str, alert_type: str = "any") -> bool:
    alert = db.scalar(
        select(TrekAlert).where(
            TrekAlert.user_id == user_id,
            TrekAlert.trek_slug == trek_slug,
            TrekAlert.alert_type == alert_type,
        )
    )
    if not alert:
        return False
    db.delete(alert)
    db.commit()
    return True


def list_alerts(db: Session, user_id: UUID) -> list[TrekAlert]:
    return list(db.scalars(
        select(TrekAlert).where(TrekAlert.user_id == user_id, TrekAlert.active == True).order_by(TrekAlert.created_at.desc())
    ).all())


# --- Profile ---

def get_profile(db: Session, user_id: UUID) -> UserProfile | None:
    return db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))


def upsert_profile(db: Session, user_id: UUID, data: dict) -> UserProfile:
    profile = get_profile(db, user_id)
    if profile is None:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
    for field in ("fitness_level", "trek_experience", "preferred_regions", "budget_range"):
        if field in data and data[field] is not None:
            setattr(profile, field, data[field])
    profile.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile
