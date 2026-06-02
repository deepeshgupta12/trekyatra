from __future__ import annotations

import logging
import smtplib
from email.mime.text import MIMEText

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="account.send_trek_alerts", bind=True, max_retries=3)
def send_trek_alerts_task(self) -> dict:
    """
    Scheduled daily task (08:00 IST) — send a digest email to users with active
    trek alerts. Reminds them of which treks they are following.

    Full conditional delivery (only when trek data actually changes) is a V6 enhancement.
    For V5 this sends a weekly digest every Monday.
    """
    if not settings.smtp_host or not settings.smtp_user:
        logger.info("SMTP not configured — skipping trek alert digest")
        return {"sent": False, "reason": "smtp_not_configured"}

    try:
        from app.modules.account.models import TrekAlert
        from app.modules.auth.models import User

        with SessionLocal() as db:
            # Load active alerts grouped by user
            alerts = list(
                db.scalars(
                    select(TrekAlert).where(TrekAlert.active == True)  # noqa: E712
                ).all()
            )

        if not alerts:
            logger.info("send_trek_alerts_task: no active alerts found")
            return {"sent": False, "reason": "no_active_alerts"}

        # Group trek slugs per user_id
        from collections import defaultdict
        user_slugs: dict = defaultdict(list)
        for alert in alerts:
            user_slugs[str(alert.user_id)].append(alert.trek_slug)

        with SessionLocal() as db:
            users = {
                str(u.id): u
                for u in db.scalars(
                    select(User).where(
                        User.id.in_([alert.user_id for alert in alerts]),
                        User.is_active == True,  # noqa: E712
                    )
                ).all()
            }

        sent_count = 0
        for user_id_str, slugs in user_slugs.items():
            user = users.get(user_id_str)
            if not user or not user.email:
                continue
            _send_trek_alert_digest(user.email, user.full_name, slugs)
            sent_count += 1

        logger.info("send_trek_alerts_task: sent digests to %d users", sent_count)
        return {"sent": True, "count": sent_count}

    except Exception as exc:
        logger.exception("send_trek_alerts_task failed: %s", exc)
        raise self.retry(exc=exc, countdown=300)


def _send_trek_alert_digest(to_email: str, name: str | None, trek_slugs: list[str]) -> None:
    greeting = f"Hi {name}," if name else "Hi,"
    trek_lines = "\n".join(
        f"  • https://trekyatra.co.in/trek/{slug}" for slug in trek_slugs
    )
    body = (
        f"{greeting}\n\n"
        f"Here is a reminder of the treks you are following on TrekYatra:\n\n"
        f"{trek_lines}\n\n"
        f"Visit each trek page for the latest permit information, best season, "
        f"and operator options.\n\n"
        f"Happy trekking!\n— TrekYatra Team\nexplore@trekyatra.co.in\n\n"
        f"To manage your alerts, visit: https://trekyatra.co.in/account"
    )
    try:
        msg = MIMEText(body)
        msg["Subject"] = f"Your TrekYatra alerts — {len(trek_slugs)} trek{'s' if len(trek_slugs) != 1 else ''} followed"
        msg["From"] = settings.smtp_from_email
        msg["To"] = to_email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_user and settings.smtp_password:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
    except Exception:
        logger.warning("_send_trek_alert_digest: failed to send to %s", to_email)
