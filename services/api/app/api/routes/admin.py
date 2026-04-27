import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import require_admin
from app.modules.admin.service import (
    summarize_briefs,
    summarize_clusters,
    summarize_dashboard,
    summarize_drafts,
    summarize_system,
    summarize_topics,
)
from app.modules.content.models import ContentDraft, DraftClaim
from app.modules.content.service import update_draft_claim
from app.schemas.admin import (
    ClaimPatch,
    ClaimResponse,
    CountSummary,
    DashboardSummaryResponse,
    SystemSummaryResponse,
    TopicSummary,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


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


@router.patch("/fact-check/claims/{claim_id}", response_model=ClaimResponse)
def patch_fact_check_claim(
    claim_id: uuid.UUID,
    patch: ClaimPatch,
    db: Session = Depends(get_db),
) -> ClaimResponse:
    """Update flagged_for_review on a DraftClaim (mark verified or re-flag)."""
    # Fetch the draft_title for the response (need the join)
    claim = db.get(DraftClaim, claim_id)
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")
    draft = db.get(ContentDraft, claim.draft_id)
    draft_title = draft.title if draft else ""

    updated = update_draft_claim(db, claim_id, flagged_for_review=patch.flagged_for_review)
    return ClaimResponse(
        id=updated.id,
        draft_id=updated.draft_id,
        draft_title=draft_title,
        claim_text=updated.claim_text,
        claim_type=updated.claim_type,
        confidence_score=updated.confidence_score,
        flagged_for_review=updated.flagged_for_review,
        created_at=updated.created_at,
    )