from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.leads.models import LeadSubmission
from app.schemas.leads import LeadCreate, VALID_LEAD_STATUSES

logger = logging.getLogger(__name__)


def _push_status_history(lead: LeadSubmission, status: str, changed_by: str = "system") -> None:
    entry = {
        "status": status,
        "changed_at": datetime.now(timezone.utc).isoformat(),
        "changed_by": changed_by,
    }
    history = list(lead.status_history or [])
    history.append(entry)
    lead.status_history = history


def create_lead(db: Session, payload: LeadCreate) -> LeadSubmission:
    from app.modules.operators.service import find_matching_operator

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
        status="new",
        status_history=[],
        created_at=datetime.now(timezone.utc),
    )
    _push_status_history(lead, "new")

    # Auto-route to a matching operator
    try:
        operator = find_matching_operator(db, payload.trek_interest)
        if operator is not None:
            lead.assigned_operator_id = operator.id
            lead.status = "routed"
            _push_status_history(lead, "routed")
    except Exception:
        logger.warning("Lead routing failed for trek_interest=%s — lead saved as 'new'", payload.trek_interest)

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


def update_lead_status(
    db: Session, lead_id: uuid.UUID, status: str, changed_by: str = "admin"
) -> LeadSubmission:
    if status not in VALID_LEAD_STATUSES:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=f"Invalid status: {status}")
    lead = db.scalar(select(LeadSubmission).where(LeadSubmission.id == lead_id))
    if lead is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = status
    _push_status_history(lead, status, changed_by)
    db.commit()
    db.refresh(lead)
    return lead


def assign_operator_to_lead(
    db: Session, lead_id: uuid.UUID, operator_id: uuid.UUID
) -> LeadSubmission:
    from app.modules.operators.models import Operator
    lead = db.scalar(select(LeadSubmission).where(LeadSubmission.id == lead_id))
    if lead is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lead not found")
    operator = db.scalar(select(Operator).where(Operator.id == operator_id))
    if operator is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Operator not found")
    lead.assigned_operator_id = operator_id
    if lead.status == "new":
        lead.status = "routed"
        _push_status_history(lead, "routed", "admin")
    db.commit()
    db.refresh(lead)
    return lead
