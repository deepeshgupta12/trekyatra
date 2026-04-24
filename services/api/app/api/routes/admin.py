import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.service import (
    summarize_briefs,
    summarize_clusters,
    summarize_dashboard,
    summarize_drafts,
    summarize_system,
    summarize_topics,
)
from app.modules.content.models import ContentDraft, DraftClaim
from app.schemas.admin import (
    ClaimResponse,
    CountSummary,
    DashboardSummaryResponse,
    SystemSummaryResponse,
    TopicSummary,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_admin_dashboard_summary(
    db: Session = Depends(get_db),
) -> DashboardSummaryResponse:
    return summarize_dashboard(db)


@router.get("/topics/summary", response_model=TopicSummary)
def get_admin_topics_summary(
    db: Session = Depends(get_db),
) -> TopicSummary:
    return summarize_topics(db)


@router.get("/clusters/summary", response_model=CountSummary)
def get_admin_clusters_summary(
    db: Session = Depends(get_db),
) -> CountSummary:
    return summarize_clusters(db)


@router.get("/briefs/summary", response_model=CountSummary)
def get_admin_briefs_summary(
    db: Session = Depends(get_db),
) -> CountSummary:
    return summarize_briefs(db)


@router.get("/drafts/summary", response_model=CountSummary)
def get_admin_drafts_summary(
    db: Session = Depends(get_db),
) -> CountSummary:
    return summarize_drafts(db)


@router.get("/system/summary", response_model=SystemSummaryResponse)
def get_admin_system_summary(
    db: Session = Depends(get_db),
) -> SystemSummaryResponse:
    return summarize_system(db)


@router.get("/fact-check/claims", response_model=list[ClaimResponse])
def list_fact_check_claims(
    flagged_only: bool = False,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[ClaimResponse]:
    """Return DraftClaims across all drafts, optionally filtered to flagged-only."""
    q = (
        select(DraftClaim, ContentDraft.title.label("draft_title"))
        .join(ContentDraft, DraftClaim.draft_id == ContentDraft.id)
        .order_by(DraftClaim.created_at.desc())
    )
    if flagged_only:
        q = q.where(DraftClaim.flagged_for_review == True)  # noqa: E712
    q = q.limit(limit).offset(offset)
    rows = db.execute(q).all()
    return [
        ClaimResponse(
            id=row.DraftClaim.id,
            draft_id=row.DraftClaim.draft_id,
            draft_title=row.draft_title,
            claim_text=row.DraftClaim.claim_text,
            claim_type=row.DraftClaim.claim_type,
            confidence_score=row.DraftClaim.confidence_score,
            flagged_for_review=row.DraftClaim.flagged_for_review,
            created_at=row.DraftClaim.created_at,
        )
        for row in rows
    ]