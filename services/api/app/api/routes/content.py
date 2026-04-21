from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.content.service import (
    create_brief,
    create_cluster,
    create_draft,
    create_topic,
    list_briefs,
    list_clusters,
    list_drafts,
    list_topics,
)
from app.schemas.content import (
    ContentBriefCreate,
    ContentBriefResponse,
    ContentDraftCreate,
    ContentDraftResponse,
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
def get_briefs(db: Session = Depends(get_db)) -> list[ContentBriefResponse]:
    rows = list_briefs(db)
    return [
        ContentBriefResponse.model_validate(
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
                "status": row.status,
                "created_at": row.created_at,
            }
        )
        for row in rows
    ]


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
            "status": row.status,
            "created_at": row.created_at,
        }
    )


@router.get("/drafts", response_model=list[ContentDraftResponse])
def get_drafts(db: Session = Depends(get_db)) -> list[ContentDraftResponse]:
    rows = list_drafts(db)
    return [
        ContentDraftResponse.model_validate(
            {
                "id": str(row.id),
                "brief_id": str(row.brief_id),
                "title": row.title,
                "slug": row.slug,
                "content_markdown": row.content_markdown,
                "excerpt": row.excerpt,
                "meta_title": row.meta_title,
                "meta_description": row.meta_description,
                "version": row.version,
                "confidence_score": row.confidence_score,
                "status": row.status,
                "created_at": row.created_at,
            }
        )
        for row in rows
    ]


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

    return ContentDraftResponse.model_validate(
        {
            "id": str(row.id),
            "brief_id": str(row.brief_id),
            "title": row.title,
            "slug": row.slug,
            "content_markdown": row.content_markdown,
            "excerpt": row.excerpt,
            "meta_title": row.meta_title,
            "meta_description": row.meta_description,
            "version": row.version,
            "confidence_score": row.confidence_score,
            "status": row.status,
            "created_at": row.created_at,
        }
    )