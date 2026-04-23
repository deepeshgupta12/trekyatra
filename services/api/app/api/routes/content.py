import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.content.service import (
    create_brief,
    create_brief_version,
    create_cluster,
    create_draft,
    create_topic,
    get_brief,
    get_draft,
    list_brief_versions,
    list_briefs,
    list_clusters,
    list_draft_claims,
    list_drafts,
    list_topics,
    update_brief_status,
)
from app.schemas.content import (
    BriefStatusPatch,
    BriefVersionResponse,
    ContentBriefCreate,
    ContentBriefResponse,
    ContentDraftCreate,
    ContentDraftResponse,
    DraftClaimResponse,
    KeywordClusterCreate,
    KeywordClusterResponse,
    TopicOpportunityCreate,
    TopicOpportunityResponse,
)

router = APIRouter(tags=["content"])


@router.get("/topics", response_model=list[TopicOpportunityResponse])
def get_topics(db: Session = Depends(get_db)) -> list[TopicOpportunityResponse]:
    rows = list_topics(db)
    return [
        TopicOpportunityResponse.model_validate(
            {
                "id": str(row.id),
                "title": row.title,
                "slug": row.slug,
                "primary_keyword": row.primary_keyword,
                "source": row.source,
                "intent": row.intent,
                "page_type": row.page_type,
                "trend_score": row.trend_score,
                "urgency_score": row.urgency_score,
                "status": row.status,
                "notes": row.notes,
                "created_at": row.created_at,
            }
        )
        for row in rows
    ]


@router.post(
    "/topics",
    response_model=TopicOpportunityResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_topic(
    payload: TopicOpportunityCreate,
    db: Session = Depends(get_db),
) -> TopicOpportunityResponse:
    try:
        row = create_topic(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return TopicOpportunityResponse.model_validate(
        {
            "id": str(row.id),
            "title": row.title,
            "slug": row.slug,
            "primary_keyword": row.primary_keyword,
            "source": row.source,
            "intent": row.intent,
            "page_type": row.page_type,
            "trend_score": row.trend_score,
            "urgency_score": row.urgency_score,
            "status": row.status,
            "notes": row.notes,
            "created_at": row.created_at,
        }
    )


@router.get("/clusters", response_model=list[KeywordClusterResponse])
def get_clusters(db: Session = Depends(get_db)) -> list[KeywordClusterResponse]:
    rows = list_clusters(db)
    return [
        KeywordClusterResponse.model_validate(
            {
                "id": str(row.id),
                "name": row.name,
                "primary_keyword": row.primary_keyword,
                "supporting_keywords": row.supporting_keywords,
                "intent": row.intent,
                "pillar_title": row.pillar_title,
                "status": row.status,
                "notes": row.notes,
                "created_at": row.created_at,
            }
        )
        for row in rows
    ]


@router.post(
    "/clusters",
    response_model=KeywordClusterResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_cluster(
    payload: KeywordClusterCreate,
    db: Session = Depends(get_db),
) -> KeywordClusterResponse:
    try:
        row = create_cluster(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return KeywordClusterResponse.model_validate(
        {
            "id": str(row.id),
            "name": row.name,
            "primary_keyword": row.primary_keyword,
            "supporting_keywords": row.supporting_keywords,
            "intent": row.intent,
            "pillar_title": row.pillar_title,
            "status": row.status,
            "notes": row.notes,
            "created_at": row.created_at,
        }
    )


@router.get("/briefs", response_model=list[ContentBriefResponse])
def get_briefs(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
) -> list[ContentBriefResponse]:
    rows = list_briefs(db, status_filter=status_filter)
    return [_brief_to_response(row) for row in rows]


@router.post(
    "/briefs",
    response_model=ContentBriefResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_brief(
    payload: ContentBriefCreate,
    db: Session = Depends(get_db),
) -> ContentBriefResponse:
    try:
        row = create_brief(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return _brief_to_response(row)


@router.get("/drafts", response_model=list[ContentDraftResponse])
def get_drafts(db: Session = Depends(get_db)) -> list[ContentDraftResponse]:
    rows = list_drafts(db)
    return [_draft_to_response(row) for row in rows]


@router.post(
    "/drafts",
    response_model=ContentDraftResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_draft(
    payload: ContentDraftCreate,
    db: Session = Depends(get_db),
) -> ContentDraftResponse:
    try:
        row = create_draft(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return _draft_to_response(row)


def _draft_to_response(row) -> ContentDraftResponse:
    return ContentDraftResponse.model_validate(
        {
            "id": str(row.id),
            "brief_id": str(row.brief_id),
            "title": row.title,
            "slug": row.slug,
            "content_markdown": row.content_markdown,
            "optimized_content": row.optimized_content,
            "excerpt": row.excerpt,
            "meta_title": row.meta_title,
            "meta_description": row.meta_description,
            "version": row.version,
            "confidence_score": row.confidence_score,
            "status": row.status,
            "created_at": row.created_at,
        }
    )


def _brief_to_response(row) -> ContentBriefResponse:
    return ContentBriefResponse.model_validate(
        {
            "id": str(row.id),
            "topic_opportunity_id": str(row.topic_opportunity_id) if row.topic_opportunity_id else None,
            "keyword_cluster_id": str(row.keyword_cluster_id) if row.keyword_cluster_id else None,
            "title": row.title,
            "slug": row.slug,
            "target_keyword": row.target_keyword,
            "secondary_keywords": row.secondary_keywords,
            "intent": row.intent,
            "page_type": row.page_type,
            "heading_outline": row.heading_outline,
            "faqs": row.faqs,
            "internal_link_targets": row.internal_link_targets,
            "schema_recommendations": row.schema_recommendations,
            "monetization_notes": row.monetization_notes,
            "structured_brief": row.structured_brief,
            "word_count_target": row.word_count_target,
            "status": row.status,
            "created_at": row.created_at,
        }
    )


@router.get("/admin/drafts/{draft_id}/claims", response_model=list[DraftClaimResponse])
def get_draft_claims(
    draft_id: str,
    db: Session = Depends(get_db),
) -> list[DraftClaimResponse]:
    try:
        uid = uuid.UUID(draft_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid draft ID format")
    rows = list_draft_claims(db, uid)
    return [
        DraftClaimResponse.model_validate(
            {
                "id": str(r.id),
                "draft_id": str(r.draft_id),
                "claim_text": r.claim_text,
                "claim_type": r.claim_type,
                "confidence_score": r.confidence_score,
                "flagged_for_review": r.flagged_for_review,
                "created_at": r.created_at,
            }
        )
        for r in rows
    ]


@router.get("/admin/briefs/{brief_id}", response_model=ContentBriefResponse)
def get_brief_detail(
    brief_id: str,
    db: Session = Depends(get_db),
) -> ContentBriefResponse:
    try:
        uid = uuid.UUID(brief_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid brief ID format")
    row = get_brief(db, uid)
    if row is None:
        raise HTTPException(status_code=404, detail="Brief not found")
    return _brief_to_response(row)


@router.patch("/admin/briefs/{brief_id}/status", response_model=ContentBriefResponse)
def patch_brief_status(
    brief_id: str,
    payload: BriefStatusPatch,
    db: Session = Depends(get_db),
) -> ContentBriefResponse:
    try:
        uid = uuid.UUID(brief_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid brief ID format")
    try:
        row = update_brief_status(db, uid, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _brief_to_response(row)


@router.get("/admin/briefs/{brief_id}/versions", response_model=list[BriefVersionResponse])
def get_brief_versions(
    brief_id: str,
    db: Session = Depends(get_db),
) -> list[BriefVersionResponse]:
    try:
        uid = uuid.UUID(brief_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid brief ID format")
    rows = list_brief_versions(db, uid)
    return [
        BriefVersionResponse.model_validate(
            {
                "id": str(r.id),
                "brief_id": str(r.brief_id),
                "version_number": r.version_number,
                "structured_brief": r.structured_brief,
                "created_at": r.created_at,
            }
        )
        for r in rows
    ]