from __future__ import annotations

import hashlib
import hmac
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.modules.email_sequences.models import (
    EmailSequence,
    EmailSequenceStep,
    SubscriberSequenceEnrollment,
    SubscriberTag,
)
from app.modules.newsletter.models import NewsletterSubscriber

logger = logging.getLogger(__name__)

DEFAULT_SEQUENCES = [
    {
        "name": "Winter Trek Nurture",
        "slug": "winter_trek_nurture",
        "description": "3-step sequence for subscribers interested in winter trekking.",
        "steps": [
            {
                "step_number": 1,
                "subject": "Your winter trek guide is here ❄️",
                "body_template": (
                    "Hi {{ subscriber.name or 'Explorer' }},\n\n"
                    "Winter is the perfect season for crisp mountain air and clear skies. "
                    "Here are our top winter trek picks curated just for you.\n\n"
                    "{% for page in cms_pages %}- {{ page.title }}\n{% endfor %}\n"
                    "Stay warm and trek safe,\nThe TrekYatra Team"
                ),
                "delay_days": 0,
            },
            {
                "step_number": 2,
                "subject": "Essential gear for winter trekking",
                "body_template": (
                    "Hi {{ subscriber.name or 'Explorer' }},\n\n"
                    "Before you hit the winter trails, make sure your gear is ready. "
                    "Layering, insulated boots, and trekking poles are your best friends.\n\n"
                    "Browse our packing guides at trekyatra.com/packing.\n\n"
                    "— TrekYatra"
                ),
                "delay_days": 3,
            },
            {
                "step_number": 3,
                "subject": "Book your winter trek this week",
                "body_template": (
                    "Hi {{ subscriber.name or 'Explorer' }},\n\n"
                    "Spots fill up fast in winter. Have questions? Our experts can help you pick the right trek.\n\n"
                    "Reply to this email or visit trekyatra.com to connect with an operator.\n\n"
                    "Happy trekking,\nThe TrekYatra Team"
                ),
                "delay_days": 5,
            },
        ],
    },
    {
        "name": "Monsoon Prep",
        "slug": "monsoon_prep",
        "description": "Nurture sequence for monsoon trek enthusiasts.",
        "steps": [
            {
                "step_number": 1,
                "subject": "Monsoon trekking — what you need to know",
                "body_template": (
                    "Hi {{ subscriber.name or 'Explorer' }},\n\n"
                    "Monsoon treks are magical — lush valleys, misty peaks, and fewer crowds. "
                    "But preparation is key. Here's what to expect and pack.\n\n"
                    "{% for page in cms_pages %}- {{ page.title }}\n{% endfor %}\n"
                    "— TrekYatra"
                ),
                "delay_days": 0,
            },
            {
                "step_number": 2,
                "subject": "Top 5 monsoon-safe treks in India",
                "body_template": (
                    "Hi {{ subscriber.name or 'Explorer' }},\n\n"
                    "Not all treks are open during monsoon. Here are our top picks "
                    "where trails stay open and safety is prioritised.\n\n"
                    "Visit trekyatra.com/seasons/monsoon for the full guide.\n\n"
                    "— TrekYatra"
                ),
                "delay_days": 4,
            },
        ],
    },
    {
        "name": "General Trek Discovery",
        "slug": "general_trek_discovery",
        "description": "Onboarding sequence for new subscribers with no specific interest tag.",
        "steps": [
            {
                "step_number": 1,
                "subject": "Welcome to the TrekYatra community!",
                "body_template": (
                    "Hi {{ subscriber.name or 'Explorer' }},\n\n"
                    "We're glad you're here. TrekYatra is your guide to the best trekking routes in India — "
                    "from beginner-friendly trails to high-altitude adventures.\n\n"
                    "{% for page in cms_pages %}- {{ page.title }}\n{% endfor %}\n"
                    "Let's find your perfect trek,\nThe TrekYatra Team"
                ),
                "delay_days": 0,
            },
            {
                "step_number": 2,
                "subject": "Which trek is right for you?",
                "body_template": (
                    "Hi {{ subscriber.name or 'Explorer' }},\n\n"
                    "Choosing a trek can feel overwhelming. Use our comparison tool at "
                    "trekyatra.com/compare to find the right match for your fitness and schedule.\n\n"
                    "— TrekYatra"
                ),
                "delay_days": 3,
            },
            {
                "step_number": 3,
                "subject": "Your personalised trek shortlist",
                "body_template": (
                    "Hi {{ subscriber.name or 'Explorer' }},\n\n"
                    "Based on our most popular picks, here are 3 treks we think you'll love.\n\n"
                    "Visit trekyatra.com/explore to see the full list.\n\n"
                    "Happy trekking,\nThe TrekYatra Team"
                ),
                "delay_days": 5,
            },
        ],
    },
]

TAG_TO_SEQUENCE_SLUG: dict[str, str] = {
    "winter": "winter_trek_nurture",
    "monsoon": "monsoon_prep",
}


def seed_default_sequences(db: Session) -> int:
    seeded = 0
    now = datetime.now(timezone.utc)
    for seq_data in DEFAULT_SEQUENCES:
        existing = db.scalar(
            select(EmailSequence).where(EmailSequence.slug == seq_data["slug"])
        )
        if existing:
            continue
        seq = EmailSequence(
            id=uuid.uuid4(),
            name=seq_data["name"],
            slug=seq_data["slug"],
            description=seq_data["description"],
            created_at=now,
        )
        db.add(seq)
        db.flush()
        for step_data in seq_data["steps"]:
            step = EmailSequenceStep(
                id=uuid.uuid4(),
                sequence_id=seq.id,
                step_number=step_data["step_number"],
                subject=step_data["subject"],
                body_template=step_data["body_template"],
                delay_days=step_data["delay_days"],
                created_at=now,
            )
            db.add(step)
        seeded += 1
    db.commit()
    return seeded


def list_sequences(db: Session) -> list[dict]:
    sequences = list(
        db.scalars(
            select(EmailSequence)
            .options(selectinload(EmailSequence.steps), selectinload(EmailSequence.enrollments))
            .order_by(EmailSequence.created_at)
        ).all()
    )
    result = []
    for seq in sequences:
        result.append(
            {
                "id": seq.id,
                "name": seq.name,
                "slug": seq.slug,
                "description": seq.description,
                "created_at": seq.created_at,
                "step_count": len(seq.steps),
                "enrollment_count": len(seq.enrollments),
            }
        )
    return result


def get_sequence_with_steps(db: Session, sequence_id: uuid.UUID) -> EmailSequence | None:
    return db.scalar(
        select(EmailSequence)
        .options(selectinload(EmailSequence.steps))
        .where(EmailSequence.id == sequence_id)
    )


def add_subscriber_tag(db: Session, subscriber_id: uuid.UUID, tag: str) -> SubscriberTag | None:
    existing = db.scalar(
        select(SubscriberTag).where(
            SubscriberTag.subscriber_id == subscriber_id,
            SubscriberTag.tag == tag,
        )
    )
    if existing:
        return existing
    new_tag = SubscriberTag(
        id=uuid.uuid4(),
        subscriber_id=subscriber_id,
        tag=tag,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag


def enroll_subscriber(
    db: Session, subscriber_id: uuid.UUID, sequence_id: uuid.UUID
) -> SubscriberSequenceEnrollment | None:
    existing = db.scalar(
        select(SubscriberSequenceEnrollment).where(
            SubscriberSequenceEnrollment.subscriber_id == subscriber_id,
            SubscriberSequenceEnrollment.sequence_id == sequence_id,
        )
    )
    if existing:
        return existing
    now = datetime.now(timezone.utc)
    enrollment = SubscriberSequenceEnrollment(
        id=uuid.uuid4(),
        subscriber_id=subscriber_id,
        sequence_id=sequence_id,
        current_step=0,
        next_send_at=now,
        enrolled_at=now,
        status="active",
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def enroll_by_tag(db: Session, subscriber_id: uuid.UUID, tag: str) -> str | None:
    tag_lower = tag.lower()
    sequence_slug = None
    for keyword, slug in TAG_TO_SEQUENCE_SLUG.items():
        if keyword in tag_lower:
            sequence_slug = slug
            break
    if sequence_slug is None:
        sequence_slug = "general_trek_discovery"

    seq = db.scalar(select(EmailSequence).where(EmailSequence.slug == sequence_slug))
    if seq is None:
        return None
    enroll_subscriber(db, subscriber_id, seq.id)
    return sequence_slug


def update_subscriber_preferences(
    db: Session, subscriber_id: uuid.UUID, prefs: dict
) -> NewsletterSubscriber | None:
    sub = db.get(NewsletterSubscriber, subscriber_id)
    if sub is None:
        return None
    current = dict(sub.preferences or {})
    current.update({k: v for k, v in prefs.items() if v is not None})
    sub.preferences = current
    db.commit()
    db.refresh(sub)
    return sub


def generate_preferences_token(subscriber_id: uuid.UUID) -> str:
    key = settings.auth_jwt_secret.encode()
    msg = str(subscriber_id).encode()
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def verify_preferences_token(subscriber_id: uuid.UUID, token: str) -> bool:
    expected = generate_preferences_token(subscriber_id)
    return hmac.compare_digest(expected, token)


def get_pending_enrollments(db: Session, limit: int = 100) -> list[SubscriberSequenceEnrollment]:
    now = datetime.now(timezone.utc)
    return list(
        db.scalars(
            select(SubscriberSequenceEnrollment)
            .where(
                SubscriberSequenceEnrollment.status == "active",
                SubscriberSequenceEnrollment.next_send_at <= now,
            )
            .limit(limit)
        ).all()
    )
