from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.newsletter.models import NewsletterSubscriber
from app.schemas.newsletter import NewsletterSubscribeCreate, NewsletterSubscribeResponse


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
