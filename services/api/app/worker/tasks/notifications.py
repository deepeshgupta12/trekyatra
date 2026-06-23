"""Celery tasks for push notification delivery (M14)."""
from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone

from app.worker.celery_app import celery_app
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


@celery_app.task(name="notifications.send_permit_alerts", max_retries=2)
def send_permit_alerts() -> dict:
    """Daily 09:00 — push permit window alerts to users who have saved treks with upcoming windows."""
    from app.modules.account.models import TrekAlert
    from app.modules.notifications.service import get_devices_for_users, send_batch_push

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        window_open = now + timedelta(days=7)

        alerts = (
            db.query(TrekAlert)
            .filter(
                TrekAlert.alert_type == "permit",
                TrekAlert.is_active == True,
            )
            .all()
        )

        user_trek: dict[uuid.UUID, list[str]] = {}
        for a in alerts:
            user_trek.setdefault(a.user_id, []).append(a.trek_slug)

        total_sent = 0
        for user_id, slugs in user_trek.items():
            devices = get_devices_for_users(db, [user_id])
            if not devices:
                continue
            for slug in slugs[:3]:
                result = asyncio.run(
                    send_batch_push(
                        db,
                        devices,
                        title="Permit Window Opening Soon",
                        body=f"The permit window for {slug.replace('-', ' ').title()} opens in 7 days. Book your slot!",
                        data={"trek_slug": slug, "screen": "trek"},
                        category="permit_alert",
                    )
                )
                total_sent += result.get("sent", 0)

        logger.info("[notifications] send_permit_alerts: %d pushes sent", total_sent)
        return {"task": "send_permit_alerts", "sent": total_sent}
    except Exception as exc:
        logger.error("[notifications] send_permit_alerts error: %s", exc)
        raise
    finally:
        db.close()


@celery_app.task(name="notifications.send_seasonal_alerts", max_retries=2)
def send_seasonal_alerts() -> dict:
    """Weekly Monday 10:00 — push seasonal CTAs for treks in user's saved list."""
    from app.modules.account.models import UserBookmark
    from app.modules.cms.models import CMSPage
    from app.modules.notifications.service import get_devices_for_users, send_batch_push

    db = SessionLocal()
    try:
        current_month = datetime.now(timezone.utc).month
        month_names = ["", "January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"]
        month_name = month_names[current_month]

        bookmarks = db.query(UserBookmark).filter(UserBookmark.page_type == "trek_guide").all()

        user_slugs: dict[uuid.UUID, list[str]] = {}
        for bm in bookmarks:
            if bm.trek_slug:
                user_slugs.setdefault(bm.user_id, []).append(bm.trek_slug)

        total_sent = 0
        for user_id, slugs in user_slugs.items():
            devices = get_devices_for_users(db, [user_id])
            if not devices:
                continue
            for slug in slugs[:2]:
                page = db.query(CMSPage).filter(CMSPage.slug == slug).first()
                if not page:
                    continue
                best = page.trek_best_months or ""
                if month_name.lower() not in best.lower():
                    continue
                result = asyncio.run(
                    send_batch_push(
                        db,
                        devices,
                        title=f"Perfect time for {page.title}!",
                        body=f"{month_name} is one of the best months for this trek. Plan your trip now.",
                        data={"trek_slug": slug, "screen": "trek"},
                        category="seasonal_alert",
                    )
                )
                total_sent += result.get("sent", 0)

        logger.info("[notifications] send_seasonal_alerts: %d pushes sent", total_sent)
        return {"task": "send_seasonal_alerts", "sent": total_sent}
    except Exception as exc:
        logger.error("[notifications] send_seasonal_alerts error: %s", exc)
        raise
    finally:
        db.close()


@celery_app.task(name="notifications.send_news_alerts", max_retries=2)
def send_news_alerts(news_slug: str, trek_slug: str, news_title: str) -> dict:
    """Called after a news article is published. Pushes to users who viewed that trek."""
    from app.modules.notifications.service import send_batch_push
    from app.modules.mobile.models import MobileDevice
    from app.modules.auth.models import User

    db = SessionLocal()
    try:
        devices = (
            db.query(MobileDevice)
            .join(User, MobileDevice.user_id == User.id)
            .filter(User.behavior_profile.isnot(None))
            .all()
        )

        targeted: list[MobileDevice] = []
        for device in devices:
            profile = device.user.behavior_profile if hasattr(device, "user") else {}
            views = profile.get("views", []) if isinstance(profile, dict) else []
            if any(v.get("slug") == trek_slug for v in views):
                targeted.append(device)

        if not targeted:
            return {"task": "send_news_alerts", "sent": 0, "reason": "no_targeted_users"}

        result = asyncio.run(
            send_batch_push(
                db,
                targeted,
                title="New Trek Update",
                body=news_title,
                data={"trek_slug": trek_slug, "news_slug": news_slug, "screen": "trek"},
                category="news_article",
            )
        )
        logger.info("[notifications] send_news_alerts for trek=%s: %d sent", trek_slug, result.get("sent", 0))
        return {"task": "send_news_alerts", "trek_slug": trek_slug, **result}
    except Exception as exc:
        logger.error("[notifications] send_news_alerts error: %s", exc)
        raise
    finally:
        db.close()
