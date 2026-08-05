from __future__ import annotations

import logging
import smtplib
import uuid
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)

_DEFAULT_TREK_BULLETS = [
    "Kedarkantha Trek — a classic winter snow trail in Uttarakhand",
    "Brahmatal Trek — frozen lake and Himalayan panoramas",
    "Hampta Pass — dramatic valley crossings in Kullu",
]


def _send_email(to: str, subject: str, body: str) -> None:
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, [to], msg.as_string())


def send_account_welcome_email(user_email: str, user_name: str | None = None) -> dict:
    """Synchronous, self-contained account welcome email. Runs from a FastAPI BackgroundTask in the API
    process (no Celery worker needed, same model as the working verification email). Graceful no-op when
    SMTP is unset; never raises to the caller."""
    if not settings.smtp_host or not settings.smtp_user:
        logger.info("SMTP not configured — skipping welcome email for %s", user_email)
        return {"sent": False, "reason": "smtp_not_configured"}

    try:
        from app.modules.cms.models import CMSPage
        with SessionLocal() as db:
            pages = list(
                db.scalars(
                    select(CMSPage)
                    .where(CMSPage.status == "published", CMSPage.page_type == "trek_guide")
                    .order_by(CMSPage.published_at.desc())
                    .limit(3)
                ).all()
            )
        trek_lines = [f"- {p.title}" for p in pages] if pages else [f"- {b}" for b in _DEFAULT_TREK_BULLETS]

        name = user_name or "Explorer"
        body = (
            f"Hi {name},\n\n"
            f"Welcome to TrekYatra! You've just joined a growing community of trekkers across India.\n\n"
            f"Here are 3 top trek guides to get you started:\n"
            + "\n".join(trek_lines)
            + "\n\n"
            f"Browse all treks at trekyatra.com/explore — and don't hesitate to reach out if you need help planning.\n\n"
            f"Happy trekking,\nThe TrekYatra Team\n"
        )
        _send_email(user_email, "Welcome to TrekYatra — your trail starts here", body)
        logger.info("send_account_welcome_email: sent to %s", user_email)
        return {"sent": True, "recipient": user_email}

    except Exception as exc:  # noqa: BLE001 — never crash the request / background task
        logger.exception("send_account_welcome_email failed for %s: %s", user_email, exc)
        return {"sent": False, "reason": str(exc)}


@celery_app.task(name="email_sequences.send_welcome_email", bind=True, max_retries=3)
def send_welcome_email_task(self, user_email: str, user_name: str | None = None) -> dict:
    """Celery wrapper (back-compat). The live signup flow sends the welcome via a FastAPI
    BackgroundTask so it does not depend on the Celery worker being up/restarted."""
    return send_account_welcome_email(user_email, user_name)


@celery_app.task(name="email_sequences.process_nurture_sequences", bind=True, max_retries=3)
def process_nurture_sequences_task(self) -> dict:
    if not settings.smtp_host or not settings.smtp_user:
        logger.info("SMTP not configured — skipping nurture processing")
        return {"processed": 0, "reason": "smtp_not_configured"}

    try:
        from jinja2 import Template
        from app.modules.email_sequences.models import (
            EmailSequence,
            EmailSequenceStep,
            SubscriberSequenceEnrollment,
        )
        from app.modules.newsletter.models import NewsletterSubscriber
        from app.modules.cms.models import CMSPage
        from app.modules.email_sequences.service import get_pending_enrollments

        with SessionLocal() as db:
            enrollments = get_pending_enrollments(db, limit=100)
            processed = 0

            for enrollment in enrollments:
                try:
                    subscriber = db.get(NewsletterSubscriber, enrollment.subscriber_id)
                    if subscriber is None or not subscriber.active:
                        enrollment.status = "paused"
                        db.commit()
                        continue

                    prefs = subscriber.preferences or {}
                    if not prefs.get("nurture", True):
                        enrollment.status = "paused"
                        db.commit()
                        continue

                    next_step_number = enrollment.current_step + 1
                    step = db.scalar(
                        select(EmailSequenceStep).where(
                            EmailSequenceStep.sequence_id == enrollment.sequence_id,
                            EmailSequenceStep.step_number == next_step_number,
                        )
                    )
                    if step is None:
                        enrollment.status = "completed"
                        db.commit()
                        continue

                    pages = list(
                        db.scalars(
                            select(CMSPage)
                            .where(CMSPage.status == "published")
                            .order_by(CMSPage.published_at.desc())
                            .limit(3)
                        ).all()
                    )

                    body = Template(step.body_template).render(
                        subscriber={"name": subscriber.name, "email": subscriber.email},
                        cms_pages=[{"title": p.title, "slug": p.slug} for p in pages],
                    )
                    _send_email(subscriber.email, step.subject, body)

                    now = datetime.now(timezone.utc)
                    next_step = db.scalar(
                        select(EmailSequenceStep).where(
                            EmailSequenceStep.sequence_id == enrollment.sequence_id,
                            EmailSequenceStep.step_number == next_step_number + 1,
                        )
                    )
                    enrollment.current_step = next_step_number
                    if next_step is None:
                        enrollment.status = "completed"
                    else:
                        enrollment.next_send_at = now + timedelta(days=next_step.delay_days or 1)
                    db.commit()
                    processed += 1

                except Exception as inner_exc:
                    logger.exception(
                        "process_nurture_sequences_task: failed for enrollment %s: %s",
                        enrollment.id,
                        inner_exc,
                    )

        return {"processed": processed}

    except Exception as exc:
        logger.exception("process_nurture_sequences_task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)
