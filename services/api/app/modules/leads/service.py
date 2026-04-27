from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.leads.models import LeadSubmission
from app.schemas.leads import LeadCreate, VALID_LEAD_STATUSES


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


def list_leads(
    db: Session, *, limit: int = 50, offset: int = 0, status: str | None = None
) -> list[LeadSubmission]:
    q = select(LeadSubmission).order_by(LeadSubmission.created_at.desc())
    if status:
        q = q.where(LeadSubmission.status == status)
    return list(db.scalars(q.offset(offset).limit(limit)).all())


def update_lead_status(db: Session, lead_id: uuid.UUID, status: str) -> LeadSubmission:
    if status not in VALID_LEAD_STATUSES:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=f"Invalid status: {status}")
    lead = db.scalar(select(LeadSubmission).where(LeadSubmission.id == lead_id))
    if lead is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = status
    db.commit()
    db.refresh(lead)
    return lead
