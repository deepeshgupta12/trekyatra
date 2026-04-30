from __future__ import annotations

import logging
import smtplib
import uuid
from email.mime.text import MIMEText

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.leads.models import LeadSubmission
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


def _send_email(to: str, subject: str, body: str) -> None:
    """Send a plain-text email via configured SMTP. Raises on failure."""
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, [to], msg.as_string())


@celery_app.task(name="leads.notify_admin_new_lead", bind=True, max_retries=3)
def notify_admin_new_lead_task(self, lead_id: str) -> dict:
    """Send an email notification to the admin when a new lead is submitted."""
    if not settings.smtp_host or not settings.smtp_user:
        logger.info("SMTP not configured — skipping lead notification (lead_id=%s)", lead_id)
        return {"sent": False, "reason": "smtp_not_configured"}

    try:
        with SessionLocal() as db:
            lead = db.scalar(
                select(LeadSubmission)
                .options(selectinload(LeadSubmission.assigned_operator))
                .where(LeadSubmission.id == uuid.UUID(lead_id))
            )
        if lead is None:
            logger.warning("notify_admin_new_lead_task: lead %s not found", lead_id)
            return {"sent": False, "reason": "lead_not_found"}

        operator_line = ""
        if lead.assigned_operator:
            operator_line = f"Operator:     {lead.assigned_operator.name} <{lead.assigned_operator.contact_email}>\n"

        body = (
            f"New lead submitted on TrekYatra.\n\n"
            f"Name:         {lead.name}\n"
            f"Email:        {lead.email}\n"
            f"Phone:        {lead.phone or '—'}\n"
            f"Trek:         {lead.trek_interest}\n"
            f"Source page:  {lead.source_page}\n"
            f"CTA type:     {lead.cta_type or '—'}\n"
            f"{operator_line}"
            f"Message:\n{lead.message or '—'}\n"
        )
        _send_email(settings.admin_email, f"[TrekYatra] New lead — {lead.trek_interest}", body)
        logger.info("notify_admin_new_lead_task: admin email sent for lead %s", lead_id)
        return {"sent": True, "recipient": "admin"}

    except Exception as exc:
        logger.exception("notify_admin_new_lead_task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="leads.notify_operator_new_lead", bind=True, max_retries=3)
def notify_operator_new_lead_task(self, lead_id: str) -> dict:
    """Send a lead notification email to the matched operator."""
    if not settings.smtp_host or not settings.smtp_user:
        logger.info("SMTP not configured — skipping operator notification (lead_id=%s)", lead_id)
        return {"sent": False, "reason": "smtp_not_configured"}

    try:
        with SessionLocal() as db:
            lead = db.scalar(
                select(LeadSubmission)
                .options(selectinload(LeadSubmission.assigned_operator))
                .where(LeadSubmission.id == uuid.UUID(lead_id))
            )
        if lead is None or lead.assigned_operator is None:
            return {"sent": False, "reason": "no_operator_assigned"}

        op = lead.assigned_operator
        body = (
            f"Hello {op.name},\n\n"
            f"A new trek enquiry has been routed to you via TrekYatra.\n\n"
            f"Lead details:\n"
            f"  Name:    {lead.name}\n"
            f"  Email:   {lead.email}\n"
            f"  Phone:   {lead.phone or '—'}\n"
            f"  Trek:    {lead.trek_interest}\n"
            f"  Message: {lead.message or '—'}\n\n"
            f"Please follow up directly with the enquirer within 24 hours.\n\n"
            f"— TrekYatra Team\n"
        )
        _send_email(op.contact_email, f"[TrekYatra] New enquiry — {lead.trek_interest}", body)
        logger.info("notify_operator_new_lead_task: operator email sent for lead %s", lead_id)
        return {"sent": True, "recipient": op.contact_email}

    except Exception as exc:
        logger.exception("notify_operator_new_lead_task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)
