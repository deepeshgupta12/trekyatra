from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.newsletter.models import NewsletterCampaign, NewsletterSubscriber, SocialSnippet
from app.schemas.newsletter import NewsletterSubscribeCreate, NewsletterSubscribeResponse

logger = logging.getLogger(__name__)


def subscribe(db: Session, payload: NewsletterSubscribeCreate) -> NewsletterSubscribeResponse:
    from app.modules.newsletter.tasks import sync_subscriber_task
    existing = db.scalar(
        select(NewsletterSubscriber).where(NewsletterSubscriber.email == payload.email)
    )
    if existing:
        return NewsletterSubscribeResponse(
            id=existing.id,
            email=existing.email,
            source_page=existing.source_page,
            already_subscribed=True,
            created_at=existing.created_at,
        )

    subscriber = NewsletterSubscriber(
        id=uuid.uuid4(),
        email=payload.email,
        name=payload.name,
        source_page=payload.source_page,
        lead_magnet=payload.lead_magnet,
        created_at=datetime.now(timezone.utc),
    )
    db.add(subscriber)
    db.commit()
    db.refresh(subscriber)
    sync_subscriber_task.delay(subscriber.email, subscriber.name)
    return NewsletterSubscribeResponse(
        id=subscriber.id,
        email=subscriber.email,
        source_page=subscriber.source_page,
        already_subscribed=False,
        created_at=subscriber.created_at,
    )


# ── Campaign helpers ──────────────────────────────────────────────────────────

def list_campaigns(db: Session, status: str | None = None, limit: int = 20) -> list[NewsletterCampaign]:
    q = select(NewsletterCampaign).order_by(NewsletterCampaign.created_at.desc()).limit(limit)
    if status:
        q = q.where(NewsletterCampaign.status == status)
    return list(db.scalars(q).all())


def get_campaign(db: Session, campaign_id: uuid.UUID) -> NewsletterCampaign | None:
    return db.get(NewsletterCampaign, campaign_id)


def send_campaign(db: Session, campaign_id: uuid.UUID) -> dict:
    campaign = db.get(NewsletterCampaign, campaign_id)
    if campaign is None:
        return {"sent": False, "reason": "not_found"}
    if campaign.status == "sent":
        return {"sent": False, "reason": "already_sent"}

    platform = settings.newsletter_platform
    if not platform or not settings.newsletter_platform_api_key:
        logger.info("Newsletter platform not configured — marking as sent without external delivery")
        campaign.status = "sent"
        campaign.sent_at = datetime.now(timezone.utc)
        db.commit()
        return {"sent": True, "reason": "no_platform_configured"}

    try:
        if platform == "mailchimp":
            _send_mailchimp(campaign)
        elif platform == "brevo":
            _send_brevo(campaign)
        else:
            logger.warning("Unknown newsletter platform: %s", platform)
            return {"sent": False, "reason": f"unknown_platform:{platform}"}
    except Exception as exc:
        logger.exception("send_campaign failed for %s: %s", campaign_id, exc)
        return {"sent": False, "reason": str(exc)}

    campaign.status = "sent"
    campaign.sent_at = datetime.now(timezone.utc)
    db.commit()
    return {"sent": True, "platform": platform}


def _send_mailchimp(campaign: NewsletterCampaign) -> None:
    if not settings.newsletter_list_id or not settings.newsletter_platform_api_key:
        return
    dc = settings.newsletter_platform_api_key.split("-")[-1]
    # Create a campaign via Mailchimp API
    create_url = f"https://{dc}.api.mailchimp.com/3.0/campaigns"
    payload = {
        "type": "regular",
        "recipients": {"list_id": settings.newsletter_list_id},
        "settings": {
            "subject_line": campaign.subject,
            "preview_text": campaign.preview_text or "",
            "title": campaign.week_label,
            "from_name": "TrekYatra",
            "reply_to": "newsletter@trekyatra.com",
        },
    }
    resp = httpx.post(
        create_url,
        json=payload,
        auth=("anystring", settings.newsletter_platform_api_key),
        timeout=15,
    )
    resp.raise_for_status()
    mc_id = resp.json()["id"]
    # Set content
    content_url = f"https://{dc}.api.mailchimp.com/3.0/campaigns/{mc_id}/content"
    httpx.put(
        content_url,
        json={"html": campaign.body_html},
        auth=("anystring", settings.newsletter_platform_api_key),
        timeout=15,
    ).raise_for_status()
    # Send
    send_url = f"https://{dc}.api.mailchimp.com/3.0/campaigns/{mc_id}/actions/send"
    httpx.post(
        send_url,
        auth=("anystring", settings.newsletter_platform_api_key),
        timeout=15,
    ).raise_for_status()


def _send_brevo(campaign: NewsletterCampaign) -> None:
    if not settings.newsletter_list_id or not settings.newsletter_platform_api_key:
        return
    url = "https://api.brevo.com/v3/emailCampaigns"
    payload = {
        "name": campaign.week_label,
        "subject": campaign.subject,
        "sender": {"name": "TrekYatra", "email": "newsletter@trekyatra.com"},
        "type": "classic",
        "htmlContent": campaign.body_html,
        "recipients": {"listIds": [int(settings.newsletter_list_id)]},
        "scheduledAt": datetime.now(timezone.utc).isoformat(),
    }
    resp = httpx.post(
        url,
        json=payload,
        headers={"api-key": settings.newsletter_platform_api_key, "Content-Type": "application/json"},
        timeout=15,
    )
    resp.raise_for_status()


# ── Social snippet helpers ────────────────────────────────────────────────────

def list_snippets(db: Session, page_id: uuid.UUID | None = None, platform: str | None = None, limit: int = 50) -> list[SocialSnippet]:
    q = select(SocialSnippet).order_by(SocialSnippet.created_at.desc()).limit(limit)
    if page_id:
        q = q.where(SocialSnippet.page_id == page_id)
    if platform:
        q = q.where(SocialSnippet.platform == platform)
    return list(db.scalars(q).all())
