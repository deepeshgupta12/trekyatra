from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.content.models import (
    ContentBrief,
    ContentDraft,
    KeywordCluster,
    TopicOpportunity,
)
from app.schemas.content import (
    ContentBriefCreate,
    ContentDraftCreate,
    KeywordClusterCreate,
    TopicOpportunityCreate,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def list_topics(db: Session) -> list[TopicOpportunity]:
    return list(
        db.scalars(
            select(TopicOpportunity).order_by(TopicOpportunity.created_at.desc())
        ).all()
    )


def create_topic(db: Session, payload: TopicOpportunityCreate) -> TopicOpportunity:
    now = _utc_now()
    topic = TopicOpportunity(
        id=uuid.uuid4(),
        created_at=now,
        updated_at=now,
        title=payload.title,
        slug=payload.slug,
        primary_keyword=payload.primary_keyword,
        source=payload.source,
        intent=payload.intent,
        page_type=payload.page_type,
        trend_score=payload.trend_score,
        urgency_score=payload.urgency_score,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(topic)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Unable to create topic opportunity.") from exc
    db.refresh(topic)
    return topic


def list_clusters(db: Session) -> list[KeywordCluster]:
    return list(
        db.scalars(
            select(KeywordCluster).order_by(KeywordCluster.created_at.desc())
        ).all()
    )


def create_cluster(db: Session, payload: KeywordClusterCreate) -> KeywordCluster:
    now = _utc_now()
    cluster = KeywordCluster(
        id=uuid.uuid4(),
        created_at=now,
        updated_at=now,
        name=payload.name,
        primary_keyword=payload.primary_keyword,
        supporting_keywords=payload.supporting_keywords,
        intent=payload.intent,
        pillar_title=payload.pillar_title,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(cluster)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Unable to create keyword cluster.") from exc
    db.refresh(cluster)
    return cluster


def list_briefs(db: Session) -> list[ContentBrief]:
    return list(
        db.scalars(
            select(ContentBrief).order_by(ContentBrief.created_at.desc())
        ).all()
    )


def create_brief(db: Session, payload: ContentBriefCreate) -> ContentBrief:
    now = _utc_now()
    topic_id = uuid.UUID(payload.topic_opportunity_id) if payload.topic_opportunity_id else None
    cluster_id = uuid.UUID(payload.keyword_cluster_id) if payload.keyword_cluster_id else None

    brief = ContentBrief(
        id=uuid.uuid4(),
        created_at=now,
        updated_at=now,
        topic_opportunity_id=topic_id,
        keyword_cluster_id=cluster_id,
        title=payload.title,
        slug=payload.slug,
        target_keyword=payload.target_keyword,
        secondary_keywords=payload.secondary_keywords,
        intent=payload.intent,
        page_type=payload.page_type,
        heading_outline=payload.heading_outline,
        faqs=payload.faqs,
        internal_link_targets=payload.internal_link_targets,
        schema_recommendations=payload.schema_recommendations,
        monetization_notes=payload.monetization_notes,
        status=payload.status,
    )
    db.add(brief)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Unable to create content brief.") from exc
    db.refresh(brief)
    return brief


def list_drafts(db: Session) -> list[ContentDraft]:
    return list(
        db.scalars(
            select(ContentDraft).order_by(ContentDraft.created_at.desc())
        ).all()
    )


def create_draft(db: Session, payload: ContentDraftCreate) -> ContentDraft:
    now = _utc_now()
    brief_id = uuid.UUID(payload.brief_id)

    draft = ContentDraft(
        id=uuid.uuid4(),
        created_at=now,
        updated_at=now,
        brief_id=brief_id,
        title=payload.title,
        slug=payload.slug,
        content_markdown=payload.content_markdown,
        excerpt=payload.excerpt,
        meta_title=payload.meta_title,
        meta_description=payload.meta_description,
        version=payload.version,
        confidence_score=payload.confidence_score,
        status=payload.status,
    )
    db.add(draft)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Unable to create content draft.") from exc
    db.refresh(draft)
    return draft