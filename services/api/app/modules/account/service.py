from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.account.models import AccountComparison, TrekAlert, UserBookmark, UserDownload, UserPreferences, UserProfile
from app.modules.auth.models import User
from app.modules.cms.models import CMSPage
from app.schemas.account import UserPreferencesUpdate

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


# --- Saved Comparisons ---

def list_comparisons(db: Session, user_id: UUID) -> list[AccountComparison]:
    return list(db.scalars(
        select(AccountComparison)
        .where(AccountComparison.user_id == user_id)
        .order_by(AccountComparison.updated_at.desc())
    ).all())


def save_comparison(db: Session, user_id: UUID, name: str, slugs: list[str]) -> AccountComparison:
    comp = AccountComparison(user_id=user_id, name=name[:255], slugs=slugs[:3])
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp


def delete_comparison(db: Session, user_id: UUID, comparison_id: UUID) -> bool:
    comp = db.scalar(
        select(AccountComparison).where(
            AccountComparison.id == comparison_id,
            AccountComparison.user_id == user_id,
        )
    )
    if comp is None:
        return False
    db.delete(comp)
    db.commit()
    return True


# --- Behavior Profile (cross-platform personalization sync) ---

def get_preferences(
    db: Session, *, user_id: UUID | None = None, anonymous_id: str | None = None
) -> UserPreferences | None:
    """Prefer the user row (logged-in / cross-web); fall back to the anon row (persists
    across uninstall)."""
    if user_id is not None:
        row = db.scalar(select(UserPreferences).where(UserPreferences.user_id == user_id))
        if row is not None:
            return row
    if anonymous_id:
        return db.scalar(select(UserPreferences).where(UserPreferences.anonymous_id == anonymous_id))
    return None


def upsert_preferences(
    db: Session,
    patch: UserPreferencesUpdate,
    *,
    user_id: UUID | None = None,
    anonymous_id: str | None = None,
    device_id: str | None = None,
) -> UserPreferences:
    """Create/update the prefs row for a user_id or anonymous_id key.

    A logged-in write also adopts a matching anon row (links user_id) so the pre-login
    onboarding carries over. Used by onboarding sync + merge-on-login.
    """
    row: UserPreferences | None = None
    if user_id is not None:
        row = db.scalar(select(UserPreferences).where(UserPreferences.user_id == user_id))
    if row is None and anonymous_id:
        row = db.scalar(select(UserPreferences).where(UserPreferences.anonymous_id == anonymous_id))

    if row is None:
        row = UserPreferences(user_id=user_id, anonymous_id=anonymous_id, device_id=device_id)
        db.add(row)
    else:
        if user_id is not None and row.user_id is None:
            row.user_id = user_id  # adopt the anon row on login
        if anonymous_id and not row.anonymous_id:
            row.anonymous_id = anonymous_id
        if device_id:
            row.device_id = device_id

    for field, value in patch.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return row


def merge_anon_into_user(db: Session, user_id: UUID, anonymous_id: str | None) -> UserPreferences | None:
    """On login: if the user has no prefs yet but an anon row exists for this device, adopt
    it (link user_id). If the user already has prefs, keep them (leave the anon row for
    device continuity)."""
    if not anonymous_id:
        return db.scalar(select(UserPreferences).where(UserPreferences.user_id == user_id))
    existing_user = db.scalar(select(UserPreferences).where(UserPreferences.user_id == user_id))
    if existing_user is not None:
        return existing_user
    anon = db.scalar(
        select(UserPreferences).where(
            UserPreferences.anonymous_id == anonymous_id, UserPreferences.user_id.is_(None)
        )
    )
    if anon is not None:
        anon.user_id = user_id
        db.commit()
        db.refresh(anon)
    return anon


def get_behavior_profile(db: Session, user_id: UUID) -> dict:
    user = db.get(User, user_id)
    if user is None:
        return {}
    return user.behavior_profile or {}


def update_behavior_profile(db: Session, user_id: UUID, profile: dict) -> dict:
    user = db.get(User, user_id)
    if user is None:
        return {}
    # Cap views at 50 entries to bound storage
    views = profile.get("views", [])
    if len(views) > 50:
        profile = {**profile, "views": views[:50]}
    user.behavior_profile = profile
    db.commit()
    db.refresh(user)
    return user.behavior_profile
