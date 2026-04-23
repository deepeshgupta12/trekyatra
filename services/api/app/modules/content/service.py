from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.content.models import (
    BriefVersion,
    ContentBrief,
    ContentDraft,
    DraftClaim,
    KeywordCluster,
    TopicOpportunity,
)
from app.schemas.content import (
    BRIEF_STATUS_TRANSITIONS,
    BriefStatusPatch,
    ContentBriefCreate,
    ContentDraftCreate,
    DraftClaimCreate,
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


def list_briefs(db: Session, status_filter: str | None = None) -> list[ContentBrief]:
    q = select(ContentBrief).order_by(ContentBrief.created_at.desc())
    if status_filter:
        q = q.where(ContentBrief.status == status_filter)
    return list(db.scalars(q).all())


def get_brief(db: Session, brief_id: uuid.UUID) -> ContentBrief | None:
    return db.get(ContentBrief, brief_id)


def update_brief_status(db: Session, brief_id: uuid.UUID, patch: BriefStatusPatch) -> ContentBrief:
    brief = db.get(ContentBrief, brief_id)
    if brief is None:
        raise ValueError("Brief not found")
    allowed = BRIEF_STATUS_TRANSITIONS.get(brief.status, [])
    if patch.status not in allowed:
        raise ValueError(
            f"Cannot transition from '{brief.status}' to '{patch.status}'. "
            f"Allowed: {allowed or 'none'}"
        )
    brief.status = patch.status
    brief.updated_at = _utc_now()
    db.commit()
    db.refresh(brief)
    return brief


def create_brief_version(db: Session, brief_id: uuid.UUID, structured_brief: dict) -> BriefVersion:
    from sqlalchemy import func as sqlfunc
    max_version = db.scalar(
        select(sqlfunc.max(BriefVersion.version_number)).where(BriefVersion.brief_id == brief_id)
    )
    next_version = (max_version or 0) + 1

    version = BriefVersion(
        id=uuid.uuid4(),
        brief_id=brief_id,
        version_number=next_version,
        structured_brief=structured_brief,
        created_at=_utc_now(),
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def list_brief_versions(db: Session, brief_id: uuid.UUID) -> list[BriefVersion]:
    return list(
        db.scalars(
            select(BriefVersion)
            .where(BriefVersion.brief_id == brief_id)
            .order_by(BriefVersion.version_number.desc())
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
        structured_brief=payload.structured_brief,
        word_count_target=payload.word_count_target,
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


def get_draft(db: Session, draft_id: uuid.UUID) -> ContentDraft | None:
    return db.get(ContentDraft, draft_id)


def update_draft_optimized_content(db: Session, draft_id: uuid.UUID, optimized_content: str) -> ContentDraft:
    draft = db.get(ContentDraft, draft_id)
    if draft is None:
        raise ValueError("Draft not found")
    draft.optimized_content = optimized_content
    draft.updated_at = _utc_now()
    db.commit()
    db.refresh(draft)
    return draft


def create_draft_claim(db: Session, payload: DraftClaimCreate) -> DraftClaim:
    claim = DraftClaim(
        id=uuid.uuid4(),
        draft_id=uuid.UUID(payload.draft_id),
        claim_text=payload.claim_text,
        claim_type=payload.claim_type,
        confidence_score=payload.confidence_score,
        flagged_for_review=payload.flagged_for_review,
        created_at=_utc_now(),
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


def list_draft_claims(db: Session, draft_id: uuid.UUID) -> list[DraftClaim]:
    return list(
        db.scalars(
            select(DraftClaim)
            .where(DraftClaim.draft_id == draft_id)
            .order_by(DraftClaim.confidence_score.asc())
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
        optimized_content=payload.optimized_content,
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