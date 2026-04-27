from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.leads.service import list_leads, update_lead_status
from app.schemas.leads import LeadResponse, LeadStatusPatch

router = APIRouter(
    prefix="/admin/leads",
    tags=["leads-admin"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[LeadResponse])
def get_leads(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
) -> list[LeadResponse]:
    leads = list_leads(db, limit=limit, offset=offset, status=status)
    return [LeadResponse.model_validate(l) for l in leads]


@router.patch("/{lead_id}", response_model=LeadResponse)
def patch_lead_status(
    lead_id: uuid.UUID,
    payload: LeadStatusPatch,
    db: Session = Depends(get_db),
) -> LeadResponse:
    try:
        payload.validate_status()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    lead = update_lead_status(db, lead_id, payload.status)
    return LeadResponse.model_validate(lead)
