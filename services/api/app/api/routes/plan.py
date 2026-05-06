from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_optional_user
from app.modules.auth.models import User
from app.modules.plan import service as plan_service
from app.schemas.plan import PlanEmailRequest, PlanGenerateRequest, TripPlanResponse

router = APIRouter(prefix="/plan", tags=["plan"])


@router.post("/generate", response_model=TripPlanResponse, status_code=201)
def generate_plan(
    payload: PlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> TripPlanResponse:
    user_id = current_user.id if current_user else None
    plan = plan_service.generate_plan(db, payload, user_id=user_id)
    return TripPlanResponse.model_validate(plan)


@router.get("/{plan_id}", response_model=TripPlanResponse)
def get_plan(
    plan_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> TripPlanResponse:
    plan = plan_service.get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    return TripPlanResponse.model_validate(plan)


@router.post("/{plan_id}/email", status_code=200)
def email_plan(
    plan_id: uuid.UUID,
    payload: PlanEmailRequest,
    db: Session = Depends(get_db),
) -> dict:
    ok = plan_service.email_plan(db, plan_id, payload.email)
    if not ok:
        raise HTTPException(status_code=404, detail="Plan not found or has no output.")
    return {"message": "Plan sent to your email (if SMTP is configured)."}
