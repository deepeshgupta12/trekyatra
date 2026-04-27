from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.leads.service import create_lead
from app.modules.leads.tasks import notify_admin_new_lead_task
from app.schemas.leads import LeadCreate, LeadResponse

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadResponse, status_code=201)
def submit_lead(payload: LeadCreate, db: Session = Depends(get_db)) -> LeadResponse:
    lead = create_lead(db, payload)
    notify_admin_new_lead_task.delay(str(lead.id))
    return LeadResponse.model_validate(lead)
