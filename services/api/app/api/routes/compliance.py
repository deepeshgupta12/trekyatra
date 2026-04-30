from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.compliance import service as compliance_service
from app.modules.content.models import ContentDraft
from app.schemas.compliance import (
    ComplianceCheckResponse,
    ComplianceOverrideRequest,
    ComplianceOverrideResponse,
    ComplianceResultItem,
    ComplianceRuleResponse,
)
from sqlalchemy import select

router = APIRouter(prefix="/admin/drafts", tags=["compliance"])
rules_router = APIRouter(prefix="/admin/compliance", tags=["compliance"])


@router.post("/{draft_id}/compliance-check", response_model=ComplianceCheckResponse)
def compliance_check(
    draft_id: uuid.UUID,
    _: Annotated[dict, Depends(get_current_admin)],
    db: Session = Depends(get_db),
) -> ComplianceCheckResponse:
    draft = db.scalar(select(ContentDraft).where(ContentDraft.id == draft_id))
    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    result = compliance_service.run_compliance_check(db, draft_id)

    if result.get("errors"):
        raise HTTPException(status_code=400, detail=result["errors"][0])

    out = result.get("output", {})
    results_raw = out.get("results", [])
    return ComplianceCheckResponse(
        draft_id=draft_id,
        compliance_status=out.get("compliance_status", "passed"),
        results=[ComplianceResultItem(**r) for r in results_raw],
        checked_rules=out.get("checked_rules", 0),
        failed_rules=out.get("failed_rules", 0),
    )


@router.patch("/{draft_id}/compliance-override", response_model=ComplianceOverrideResponse)
def compliance_override(
    draft_id: uuid.UUID,
    body: ComplianceOverrideRequest,
    admin: Annotated[dict, Depends(get_current_admin)],
    db: Session = Depends(get_db),
) -> ComplianceOverrideResponse:
    draft = db.scalar(select(ContentDraft).where(ContentDraft.id == draft_id))
    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    try:
        updated = compliance_service.override_compliance(
            db,
            draft_id=draft_id,
            override_note=body.override_note,
            admin_email=admin.get("sub", "unknown"),
        )
        db.commit()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ComplianceOverrideResponse(
        draft_id=draft_id,
        compliance_status=updated.compliance_status,
        overridden_by=updated.compliance_overridden_by or "",
        override_note=updated.compliance_override_note or "",
        overridden_at=updated.compliance_overridden_at,
    )


@rules_router.get("/rules", response_model=list[ComplianceRuleResponse])
def list_rules(
    _: Annotated[dict, Depends(get_current_admin)],
    db: Session = Depends(get_db),
) -> list[ComplianceRuleResponse]:
    rules = compliance_service.list_rules(db)
    return [ComplianceRuleResponse.model_validate(r) for r in rules]
