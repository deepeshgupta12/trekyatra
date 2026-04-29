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
