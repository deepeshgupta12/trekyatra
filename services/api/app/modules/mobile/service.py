from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_mobile_access_token,
    create_mobile_refresh_token,
    hash_token,
    parse_mobile_refresh_token,
)
from app.modules.mobile.models import MobileDevice, UserTrekHistory
from app.modules.cms.models import CMSPage
from app.schemas.mobile import DeviceIn, SyncPageOut, SyncOut, CheckinIn, CheckinOut, TrekHistoryStatsOut


def mobile_login(
    db: Session,
    email: str,
    password: str,
    device_id: str,
    platform: str,
) -> dict | None:
    """Authenticate with email/password and return mobile Bearer tokens directly."""
    from app.modules.auth.service import authenticate_email_user, create_session_for_user

    user = authenticate_email_user(db, email=email, password=password)
    if not user:
        return None

    # Create a short-lived web session (needed for session record, then tokens issued)
    _session, _token = create_session_for_user(db, user=user, ip_address=None, user_agent="mobile")
    db.commit()

    token_result = issue_mobile_token(db=db, user_id=user.id, device_id=device_id, platform=platform)
    return {**token_result, "user_id": str(user.id), "email": user.email, "full_name": user.full_name}


def mobile_signup(
    db: Session,
    email: str,
    password: str,
    full_name: str | None,
    device_id: str,
    platform: str,
) -> dict:
    """Register a new user and return mobile Bearer tokens directly."""
    from app.modules.auth.service import register_email_user, create_session_for_user

    user = register_email_user(db, email=email, password=password, full_name=full_name, display_name=None)
    _session, _token = create_session_for_user(db, user=user, ip_address=None, user_agent="mobile")
    db.commit()

    token_result = issue_mobile_token(db=db, user_id=user.id, device_id=device_id, platform=platform)
    return {**token_result, "user_id": str(user.id), "email": user.email, "full_name": user.full_name}


def issue_mobile_token(
    db: Session,
    user_id: uuid.UUID,
    device_id: str,
    platform: str,
) -> dict:
    """Issue a long-lived access + refresh token pair for mobile clients."""
    from app.core.config import settings

    access_token, access_expires = create_mobile_access_token(user_id=user_id, device_id=device_id)
    refresh_token, _ = create_mobile_refresh_token(user_id=user_id, device_id=device_id)
    refresh_hash = hash_token(refresh_token)

    # Upsert device record with new refresh_token_hash
    device = db.scalar(select(MobileDevice).where(MobileDevice.device_id == device_id))
    if device:
        device.refresh_token_hash = refresh_hash
        device.last_seen = datetime.now(timezone.utc)
        device.platform = platform
        device.user_id = user_id
    else:
        device = MobileDevice(
            user_id=user_id,
            device_id=device_id,
            platform=platform,
            refresh_token_hash=refresh_hash,
        )
        db.add(device)
    db.commit()

    expires_in = int((access_expires - datetime.now(timezone.utc)).total_seconds())
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": expires_in,
    }


def refresh_mobile_token(
    db: Session,
    refresh_token: str,
    device_id: str,
) -> dict:
    """Validate a refresh token and issue a new access token."""
    from app.core.config import settings

    payload = parse_mobile_refresh_token(refresh_token)
    if not payload:
        return {}

    user_id_raw = payload.get("sub")
    token_device_id = payload.get("did")
    if not user_id_raw or token_device_id != device_id:
        return {}

    try:
        user_id = uuid.UUID(str(user_id_raw))
    except ValueError:
        return {}

    refresh_hash = hash_token(refresh_token)
    device = db.scalar(
        select(MobileDevice).where(
            MobileDevice.device_id == device_id,
            MobileDevice.user_id == user_id,
            MobileDevice.refresh_token_hash == refresh_hash,
        )
    )
    if not device:
        return {}

    device.last_seen = datetime.now(timezone.utc)
    db.commit()

    access_token, access_expires = create_mobile_access_token(user_id=user_id, device_id=device_id)
    expires_in = int((access_expires - datetime.now(timezone.utc)).total_seconds())
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": expires_in,
    }


def register_device(
    db: Session,
    user_id: uuid.UUID,
    device_in: DeviceIn,
) -> tuple[MobileDevice, bool]:
    """Upsert a device record. Returns (device, created)."""
    device = db.scalar(select(MobileDevice).where(MobileDevice.device_id == device_in.device_id))
    created = False
    if device:
        device.user_id = user_id
        device.fcm_token = device_in.fcm_token
        device.apns_token = device_in.apns_token
        device.platform = device_in.platform
        device.app_version = device_in.app_version
        device.os_version = device_in.os_version
        device.last_seen = datetime.now(timezone.utc)
    else:
        device = MobileDevice(
            user_id=user_id,
            device_id=device_in.device_id,
            platform=device_in.platform,
            fcm_token=device_in.fcm_token,
            apns_token=device_in.apns_token,
            app_version=device_in.app_version,
            os_version=device_in.os_version,
        )
        db.add(device)
        created = True
    db.commit()
    db.refresh(device)
    return device, created


def unregister_device(db: Session, user_id: uuid.UUID, device_id: str) -> bool:
    """Hard-delete a device by device_id owned by user_id. Returns True if deleted."""
    device = db.scalar(
        select(MobileDevice).where(
            MobileDevice.device_id == device_id,
            MobileDevice.user_id == user_id,
        )
    )
    if not device:
        return False
    db.delete(device)
    db.commit()
    return True


def get_sync_pages(
    db: Session,
    last_sync: Optional[datetime],
    page_types: Optional[List[str]],
    limit: int,
    offset: int,
) -> SyncOut:
    """Return CMS pages changed since last_sync, paginated."""
    now = datetime.now(timezone.utc)

    # Build updated pages query
    stmt = select(CMSPage).where(CMSPage.status == "published")
    if last_sync:
        stmt = stmt.where(CMSPage.updated_at > last_sync)
    if page_types:
        stmt = stmt.where(CMSPage.page_type.in_(page_types))
    stmt = stmt.order_by(CMSPage.updated_at.desc())

    total_stmt = stmt.with_only_columns(CMSPage.id)
    total_updated = len(db.scalars(total_stmt).all())

    stmt = stmt.limit(limit).offset(offset)
    pages = db.scalars(stmt).all()

    updated = []
    for page in pages:
        trek_altitude: Optional[str] = None
        if page.content_json and isinstance(page.content_json, dict):
            trek_facts = page.content_json.get("trek_facts") or {}
            trek_altitude = trek_facts.get("altitude") or trek_facts.get("max_altitude")

        updated.append(SyncPageOut(
            slug=page.slug,
            title=page.title,
            page_type=page.page_type,
            hero_image_url=page.hero_image_url,
            trek_state=page.trek_state,
            trek_difficulty=page.trek_difficulty,
            trek_duration=page.trek_duration,
            trek_altitude=trek_altitude,
            trek_season=page.trek_season,
            body_json=page.content_json,
            seo_description=page.seo_description,
            updated_at=page.updated_at,
        ))

    # Deleted slugs: pages that have a deleted_at since last_sync
    deleted_slugs: List[str] = []
    if last_sync and hasattr(CMSPage, "deleted_at"):
        deleted_stmt = select(CMSPage.slug).where(
            CMSPage.deleted_at.isnot(None),
            CMSPage.deleted_at > last_sync,
        )
        deleted_slugs = list(db.scalars(deleted_stmt).all())

    return SyncOut(
        updated=updated,
        deleted_slugs=deleted_slugs,
        sync_timestamp=now,
        has_more=(offset + limit) < total_updated,
        total_updated=total_updated,
    )


# ── Trek Check-in / History (M16) ─────────────────────────────────────────────

def create_checkin(
    db: Session,
    user_id: uuid.UUID,
    checkin_in: CheckinIn,
) -> UserTrekHistory:
    entry = UserTrekHistory(
        user_id=user_id,
        trek_slug=checkin_in.trek_slug,
        trek_title=checkin_in.trek_title,
        completion_date=checkin_in.completion_date,
        duration_days=checkin_in.duration_days,
        rating=checkin_in.rating,
        notes=checkin_in.notes,
        trek_state=checkin_in.trek_state,
        max_altitude_ft=checkin_in.max_altitude_ft,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_user_history(
    db: Session,
    user_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> List[UserTrekHistory]:
    stmt = (
        select(UserTrekHistory)
        .where(UserTrekHistory.user_id == user_id)
        .order_by(UserTrekHistory.completion_date.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(stmt).all())


def has_user_done_trek(db: Session, user_id: uuid.UUID, trek_slug: str) -> bool:
    stmt = select(UserTrekHistory.id).where(
        UserTrekHistory.user_id == user_id,
        UserTrekHistory.trek_slug == trek_slug,
    ).limit(1)
    return db.scalars(stmt).first() is not None


_BADGE_RULES = {
    "First Trek": lambda entries: len(entries) >= 1,
    "5-Trek Club": lambda entries: len(entries) >= 5,
    "10-Trek Veteran": lambda entries: len(entries) >= 10,
    "Himalayan Explorer": lambda entries: sum(
        1 for e in entries
        if e.trek_state and e.trek_state.lower() in ("uttarakhand", "himachal pradesh", "ladakh", "sikkim", "arunachal pradesh")
    ) >= 5,
    "Monsoon Warrior": lambda entries: any(
        e.completion_date.month in (6, 7, 8) for e in entries
    ),
    "High Altitude Ace": lambda entries: any(
        (e.max_altitude_ft or 0) >= 14000 for e in entries
    ),
}


def get_history_stats(db: Session, user_id: uuid.UUID) -> TrekHistoryStatsOut:
    entries = get_user_history(db, user_id, limit=500)
    total_treks = len(entries)
    total_days = sum(e.duration_days or 0 for e in entries)
    states = [e.trek_state for e in entries if e.trek_state]
    states_visited = list(dict.fromkeys(states))  # deduplicated, order preserved
    from collections import Counter
    favourite_state = Counter(states).most_common(1)[0][0] if states else None
    badges = [name for name, fn in _BADGE_RULES.items() if fn(entries)]
    return TrekHistoryStatsOut(
        total_treks=total_treks,
        total_days=total_days,
        states_visited=states_visited,
        favourite_state=favourite_state,
        badges=badges,
    )
