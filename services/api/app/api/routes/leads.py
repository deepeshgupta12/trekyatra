from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.leads.service import create_lead
from app.schemas.leads import LeadCreate, LeadResponse

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadResponse, status_code=201)
def submit_lead(payload: LeadCreate, db: Session = Depends(get_db)) -> LeadResponse:
    lead = create_lead(db, payload)
    return LeadResponse(
        id=lead.id,
        name=lead.name,
        email=lead.email,
        trek_interest=lead.trek_interest,
        source_page=lead.source_page,
        created_at=lead.created_at,
    )
