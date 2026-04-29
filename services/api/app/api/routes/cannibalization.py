from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.agents.consolidation.agent import ConsolidationAgent
from app.modules.cannibalization import service as svc
from app.schemas.cannibalization import (
    CannibalizationIssueResponse,
    DetectResponse,
    MergeResponse,
    ResolveRequest,
    VALID_RESOLVE_STATUSES,
)
from app.modules.linking.models import Page

router = APIRouter(
    prefix="/admin/cannibalization",
    tags=["cannibalization"],
    dependencies=[Depends(get_current_admin)],
)


def _enrich(issue, db: Session) -> CannibalizationIssueResponse:
    page_a = db.get(Page, issue.page_a_id)
    page_b = db.get(Page, issue.page_b_id)
    return CannibalizationIssueResponse(
        id=issue.id,
        page_a_id=issue.page_a_id,
        page_b_id=issue.page_b_id,
        page_a_slug=page_a.slug if page_a else "",
        page_b_slug=page_b.slug if page_b else "",
        page_a_title=page_a.title if page_a else "",
        page_b_title=page_b.title if page_b else "",
        shared_keywords=issue.shared_keywords,
        severity=issue.severity,
        recommendation=issue.recommendation,
        status=issue.status,
        resolved_at=issue.resolved_at,
        created_at=issue.created_at,
    )


@router.get("", response_model=list[CannibalizationIssueResponse])
def list_issues(
    severity: str | None = Query(None, description="Filter: low / medium / high"),
    status: str | None = Query(None, description="Filter: open / accepted / dismissed / resolved"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[CannibalizationIssueResponse]:
    issues = svc.get_issues(db, severity=severity, status=status, limit=limit)
    return [_enrich(i, db) for i in issues]


@router.post("/detect", response_model=DetectResponse)
def run_detect(db: Session = Depends(get_db)) -> DetectResponse:
    """Scan all pages for keyword overlap and upsert CannibalizationIssue rows."""
    found, new = svc.detect_cannibalization(db)
    return DetectResponse(issues_found=found, new_issues=new)


@router.post("/{issue_id}/resolve", response_model=CannibalizationIssueResponse)
def resolve_issue(
    issue_id: str,
    body: ResolveRequest,
    db: Session = Depends(get_db),
) -> CannibalizationIssueResponse:
    try:
        uid = uuid.UUID(issue_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid issue ID format")

    if body.status not in VALID_RESOLVE_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"status must be one of {sorted(VALID_RESOLVE_STATUSES)}",
        )

    issue = svc.resolve_issue(db, uid, body.status)
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")
    return _enrich(issue, db)


@router.post("/{issue_id}/merge", response_model=MergeResponse)
def trigger_merge(
    issue_id: str,
    db: Session = Depends(get_db),
) -> MergeResponse:
    try:
        uid = uuid.UUID(issue_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid issue ID format")

    issue = svc.get_issue(db, uid)
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")

    agent = ConsolidationAgent(db=db, issue_id=issue_id)
    result = agent.run(input_data={"issue_id": issue_id})

    if result.get("errors"):
        raise HTTPException(status_code=500, detail="; ".join(result["errors"]))

    out = result.get("output", {})
    if not out.get("draft_id"):
        raise HTTPException(status_code=500, detail="Merge agent produced no draft")

    # Mark issue as accepted after successful merge.
    svc.resolve_issue(db, uid, "accepted")

    return MergeResponse(
        draft_id=uuid.UUID(out["draft_id"]),
        brief_id=uuid.UUID(out["brief_id"]),
        message="Merged draft created and queued for review.",
    )
