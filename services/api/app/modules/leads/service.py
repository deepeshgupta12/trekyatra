from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.modules.leads.models import LeadSubmission
from app.schemas.leads import LeadCreate


def create_lead(db: Session, payload: LeadCreate) -> LeadSubmission:
    lead = LeadSubmission(
        id=uuid.uuid4(),
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        trek_interest=payload.trek_interest,
        message=payload.message,
        source_page=payload.source_page,
        source_cluster=payload.source_cluster,
        cta_type=payload.cta_type,
        created_at=datetime.now(timezone.utc),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead
