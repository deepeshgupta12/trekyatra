"""Push notification service — send, batch, log, and opt-out checking."""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.modules.mobile.models import MobileDevice
from app.modules.notifications.models import MobilePushLog
from app.modules.notifications.push_provider import get_apns_provider, get_fcm_provider

logger = logging.getLogger(__name__)

NOTIF_PREF_KEYS = {
    "permit_alert": "permit_alerts",
    "trek_condition": "trek_conditions",
    "seasonal_alert": "seasonal",
    "news_article": "news",
    "plan_followup": "plan_followup",
}


def _get_user_notif_prefs(db: Session, user_id: uuid.UUID) -> dict:
    """Return stored notification_prefs for a user (from their mobile device metadata).

    Since notification_prefs are stored in AsyncStorage on-device, we treat them as
    opt-in by default on the backend. A future enhancement can persist prefs server-side.
    For now: all categories ON unless the backend ever receives an explicit opt-out.
    """
    return {v: True for v in NOTIF_PREF_KEYS.values()}


def _log_push(
    db: Session,
    device_id: uuid.UUID | None,
    title: str,
    body: str,
    data: dict,
    category: str,
    status: str = "sent",
    error: str | None = None,
) -> MobilePushLog:
    entry = MobilePushLog(
        device_id=device_id,
        title=title,
        body=body,
        data=data,
        category=category,
        status=status,
        error=error,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


async def send_push(
    db: Session,
    device: MobileDevice,
    title: str,
    body: str,
    data: dict,
    category: str,
) -> bool:
    """Send a push to a single device. Returns True if the send succeeded."""
    try:
        if device.platform == "ios" and device.apns_token:
            ok = await get_apns_provider().send(device.apns_token, title, body, data)
        elif device.platform == "android" and device.fcm_token:
            ok = await get_fcm_provider().send(device.fcm_token, title, body, data)
        else:
            logger.info("[push] device %s has no push token for platform %s", device.id, device.platform)
            return False

        _log_push(db, device.id, title, body, data, category, "sent" if ok else "failed")
        return ok
    except Exception as exc:
        logger.error("[push] send_push error for device %s: %s", device.id, exc)
        _log_push(db, device.id, title, body, data, category, "failed", str(exc))
        return False


async def send_batch_push(
    db: Session,
    devices: list[MobileDevice],
    title: str,
    body: str,
    data: dict,
    category: str,
) -> dict:
    """Send push to multiple devices. Returns {sent, failed, skipped} counts."""
    sent = failed = skipped = 0
    for device in devices:
        if not (device.fcm_token or device.apns_token):
            skipped += 1
            continue
        ok = await send_push(db, device, title, body, data, category)
        if ok:
            sent += 1
        else:
            failed += 1
    return {"sent": sent, "failed": failed, "skipped": skipped}


def get_devices_for_users(db: Session, user_ids: list[uuid.UUID]) -> list[MobileDevice]:
    """Return all active devices for a list of user IDs."""
    if not user_ids:
        return []
    return (
        db.query(MobileDevice)
        .filter(MobileDevice.user_id.in_(user_ids))
        .all()
    )


def get_push_logs(db: Session, limit: int = 100, category: str | None = None) -> list[MobilePushLog]:
    q = db.query(MobilePushLog).order_by(MobilePushLog.sent_at.desc())
    if category:
        q = q.filter(MobilePushLog.category == category)
    return q.limit(limit).all()
