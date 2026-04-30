from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.leads.service import assign_operator_to_lead
from app.modules.operators import service as operator_service
from app.schemas.leads import LeadResponse
from app.schemas.operators import (
    AssignOperatorRequest,
    OperatorCreate,
    OperatorPatch,
    OperatorResponse,
)

router = APIRouter(
    prefix="/admin/operators",
    tags=["operators"],
    dependencies=[Depends(get_current_admin)],
)

leads_router = APIRouter(
    prefix="/admin/leads",
    tags=["operators"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[OperatorResponse])
def list_operators(
    active_only: bool = False,
    db: Session = Depends(get_db),
) -> list[OperatorResponse]:
    rows = operator_service.list_operators(db, active_only=active_only)
    return [OperatorResponse.model_validate(r) for r in rows]


@router.post("", response_model=OperatorResponse, status_code=201)
def create_operator(
    payload: OperatorCreate,
    db: Session = Depends(get_db),
) -> OperatorResponse:
    try:
        row = operator_service.create_operator(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return OperatorResponse.model_validate(row)


@router.get("/{operator_id}", response_model=OperatorResponse)
def get_operator(
    operator_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> OperatorResponse:
    row = operator_service.get_operator(db, operator_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Operator not found")
    return OperatorResponse.model_validate(row)


@router.patch("/{operator_id}", response_model=OperatorResponse)
def patch_operator(
    operator_id: uuid.UUID,
    payload: OperatorPatch,
    db: Session = Depends(get_db),
) -> OperatorResponse:
    row = operator_service.update_operator(db, operator_id, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Operator not found")
    return OperatorResponse.model_validate(row)


@router.delete("/{operator_id}", status_code=204)
def delete_operator(
    operator_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> None:
    deleted = operator_service.delete_operator(db, operator_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Operator not found")


@leads_router.patch("/{lead_id}/assign-operator", response_model=LeadResponse)
def assign_lead_operator(
    lead_id: uuid.UUID,
    payload: AssignOperatorRequest,
    db: Session = Depends(get_db),
) -> LeadResponse:
    lead = assign_operator_to_lead(db, lead_id, payload.operator_id)
    return LeadResponse.model_validate(lead)
