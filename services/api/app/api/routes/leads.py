from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.leads.service import create_lead
from app.modules.leads.tasks import notify_admin_new_lead_task, notify_operator_new_lead_task
from app.modules.trek_intelligence import service as trek_intel_service
from app.schemas.leads import LeadCreate, LeadResponse
from app.schemas.trek_intelligence import OperatorHelpLeadRequest

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadResponse, status_code=201)
def submit_lead(payload: LeadCreate, db: Session = Depends(get_db)) -> LeadResponse:
    lead = create_lead(db, payload)
    notify_admin_new_lead_task.delay(str(lead.id))
    if lead.assigned_operator_id:
        notify_operator_new_lead_task.delay(str(lead.id))
    return LeadResponse.model_validate(lead)


@router.post("/operator-help", response_model=LeadResponse, status_code=201)
def submit_operator_help_lead(payload: OperatorHelpLeadRequest, db: Session = Depends(get_db)) -> LeadResponse:
    """Step 72: operator-enquiry fallback lead (Plan My Trek / Trek Q&A "talk to an expert")."""
    if not payload.consent:
        raise HTTPException(status_code=422, detail="consent is required")
    lead = trek_intel_service.create_trek_plan_lead(db, payload)
    notify_admin_new_lead_task.delay(str(lead.id))
    return LeadResponse.model_validate(lead)
