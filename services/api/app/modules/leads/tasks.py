from __future__ import annotations

import logging
import smtplib
import uuid
from email.mime.text import MIMEText

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.leads.models import LeadSubmission
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="leads.notify_admin_new_lead", bind=True, max_retries=3)
def notify_admin_new_lead_task(self, lead_id: str) -> dict:
    """Send an email notification to the admin when a new lead is submitted."""
    if not settings.smtp_host or not settings.smtp_user:
        logger.info("SMTP not configured — skipping lead notification (lead_id=%s)", lead_id)
        return {"sent": False, "reason": "smtp_not_configured"}

    try:
        with SessionLocal() as db:
            lead = db.scalar(
                select(LeadSubmission).where(LeadSubmission.id == uuid.UUID(lead_id))
            )
        if lead is None:
            logger.warning("notify_admin_new_lead_task: lead %s not found", lead_id)
            return {"sent": False, "reason": "lead_not_found"}

        body = (
            f"New lead submitted on TrekYatra.\n\n"
            f"Name:         {lead.name}\n"
            f"Email:        {lead.email}\n"
            f"Phone:        {lead.phone or '—'}\n"
            f"Trek:         {lead.trek_interest}\n"
            f"Source page:  {lead.source_page}\n"
            f"CTA type:     {lead.cta_type or '—'}\n"
            f"Message:\n{lead.message or '—'}\n"
        )
        msg = MIMEText(body)
        msg["Subject"] = f"[TrekYatra] New lead — {lead.trek_interest}"
        msg["From"] = settings.smtp_from_email
        msg["To"] = settings.admin_email

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, [settings.admin_email], msg.as_string())

        logger.info("notify_admin_new_lead_task: email sent for lead %s", lead_id)
        return {"sent": True}

    except Exception as exc:
        logger.exception("notify_admin_new_lead_task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)
