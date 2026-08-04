from __future__ import annotations

import logging

import httpx

from app.core.config import settings
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


def _sync_mailchimp(email: str, name: str | None) -> None:
    if not settings.newsletter_list_id or not settings.newsletter_platform_api_key:
        logger.info("Mailchimp not fully configured — skipping sync for %s", email)
        return
    # Mailchimp datacenter is derived from the API key suffix (e.g. "us1")
    dc = settings.newsletter_platform_api_key.split("-")[-1]
    url = f"https://{dc}.api.mailchimp.com/3.0/lists/{settings.newsletter_list_id}/members"
    payload: dict = {"email_address": email, "status": "subscribed"}
    if name:
        payload["merge_fields"] = {"FNAME": name}
    resp = httpx.post(
        url,
        json=payload,
        auth=("anystring", settings.newsletter_platform_api_key),
        timeout=10,
    )
    if resp.status_code not in (200, 400):  # 400 = already member (ok)
        resp.raise_for_status()
    logger.info("Mailchimp sync done for %s (status %s)", email, resp.status_code)


def _sync_brevo(email: str, name: str | None) -> None:
    if not settings.newsletter_list_id or not settings.newsletter_platform_api_key:
        logger.info("Brevo not fully configured — skipping sync for %s", email)
        return
    url = "https://api.brevo.com/v3/contacts"
    payload: dict = {"email": email, "listIds": [int(settings.newsletter_list_id)], "updateEnabled": True}
    if name:
        payload["attributes"] = {"FIRSTNAME": name}
    resp = httpx.post(
        url,
        json=payload,
        headers={"api-key": settings.newsletter_platform_api_key, "Content-Type": "application/json"},
        timeout=10,
    )
    if resp.status_code not in (201, 204):
        resp.raise_for_status()
    logger.info("Brevo sync done for %s (status %s)", email, resp.status_code)


def send_subscribe_welcome_email(email: str, source_page: str | None = None) -> dict:
    """Send a source-aware welcome email to a NEW subscriber. SYNCHRONOUS and self-contained so it can
    run from a FastAPI BackgroundTask (in the API process, no Celery worker needed) or from the Celery
    task below. Graceful no-op when SMTP is unset; never raises to the caller.

    iOS-waitlist signups get waitlist-specific copy; everyone else gets the Trail Letter welcome.
    """
    if not settings.smtp_host or not settings.smtp_user:
        logger.info("SMTP not configured — skipping subscribe welcome for %s", email)
        return {"sent": False, "reason": "smtp_not_configured"}

    from app.modules.email_sequences.tasks import _send_email

    site = settings.frontend_url.rstrip("/")
    is_waitlist = (source_page or "").lower() == "ios_waitlist"
    if is_waitlist:
        subject = "You're on the TrekYatra iOS waitlist 🏔️"
        body = (
            "Hi there,\n\n"
            "You're on the list! We'll email you the moment the TrekYatra iOS app goes live on the "
            "App Store.\n\n"
            "In the meantime, everything the app does is already on the web:\n"
            "- TrekSage AI — ask anything and plan a full trek in ~60 seconds\n"
            "- 250+ deep trek guides: route maps, permits, packing & cost breakdowns\n"
            "- Live weather, trail conditions and real trip reports\n\n"
            f"Start exploring: {site}/explore\n\n"
            "See you on the trail,\nThe TrekYatra Team\n"
        )
    else:
        subject = "Welcome to the TrekYatra Trail Letter 🏔️"
        body = (
            "Hi there,\n\n"
            "Thanks for subscribing to the TrekYatra Trail Letter — trail intel, seasonal picks, and "
            "planning tips for trekking across India and the Himalaya.\n\n"
            f"Browse all treks: {site}/explore\n"
            f"Plan your next trek: {site}/plan\n\n"
            "Happy trekking,\nThe TrekYatra Team\n"
        )

    try:
        _send_email(email, subject, body)
        logger.info("send_subscribe_welcome_email: sent to %s (waitlist=%s)", email, is_waitlist)
        return {"sent": True, "waitlist": is_waitlist}
    except Exception as exc:  # noqa: BLE001 — never crash the request / background task
        logger.exception("send_subscribe_welcome_email failed for %s: %s", email, exc)
        return {"sent": False, "reason": str(exc)}


@celery_app.task(name="newsletter.send_welcome_email", bind=True, max_retries=3)
def send_subscribe_welcome_email_task(self, email: str, source_page: str | None = None) -> dict:
    """Celery wrapper (kept for backward compatibility / manual dispatch). The live subscribe flow now
    sends the welcome via a FastAPI BackgroundTask so it does not depend on the Celery worker."""
    return send_subscribe_welcome_email(email, source_page)


@celery_app.task(name="newsletter.auto_generate")
def auto_generate_newsletter_task() -> dict:
    """Weekly beat task: auto-generate a newsletter draft (human approves before send)."""
    from app.db.session import SessionLocal
    from app.modules.agents.newsletter.agent import NewsletterAgent
    db = SessionLocal()
    try:
        agent = NewsletterAgent(db=db)
        result = agent.run(input_data={})
        if result.get("errors"):
            logger.warning("auto_generate_newsletter_task errors: %s", result["errors"])
            return {"generated": False, "errors": result["errors"]}
        campaign_id = result.get("output", {}).get("campaign_id")
        logger.info("auto_generate_newsletter_task: campaign %s created", campaign_id)
        return {"generated": True, "campaign_id": campaign_id}
    except Exception as exc:
        logger.exception("auto_generate_newsletter_task failed: %s", exc)
        return {"generated": False, "error": str(exc)}
    finally:
        db.close()


@celery_app.task(name="newsletter.sync_subscriber", bind=True, max_retries=3)
def sync_subscriber_task(self, email: str, name: str | None = None) -> dict:
    """Sync a new subscriber to the configured newsletter platform (Mailchimp or Brevo).

    Gracefully skips if NEWSLETTER_PLATFORM is not set.
    """
    platform = settings.newsletter_platform
    if not platform:
        logger.info("NEWSLETTER_PLATFORM not configured — skipping sync for %s", email)
        return {"synced": False, "reason": "not_configured"}

    try:
        if platform == "mailchimp":
            _sync_mailchimp(email, name)
        elif platform == "brevo":
            _sync_brevo(email, name)
        else:
            logger.warning("Unknown newsletter platform: %s", platform)
            return {"synced": False, "reason": f"unknown_platform:{platform}"}
        return {"synced": True, "platform": platform}
    except Exception as exc:
        logger.exception("sync_subscriber_task failed for %s: %s", email, exc)
        raise self.retry(exc=exc, countdown=60)
