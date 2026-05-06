from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.operators.models import OperatorAgreement
from app.schemas.operators import OperatorAgreementCreate, OperatorAgreementPatch


def get_agreement(db: Session, operator_id: uuid.UUID) -> OperatorAgreement | None:
    return db.scalar(
        select(OperatorAgreement).where(OperatorAgreement.operator_id == operator_id)
    )


def upsert_agreement(
    db: Session, operator_id: uuid.UUID, payload: OperatorAgreementCreate
) -> OperatorAgreement:
    agreement = get_agreement(db, operator_id)
    if agreement is None:
        agreement = OperatorAgreement(
            id=uuid.uuid4(),
            operator_id=operator_id,
            created_at=datetime.now(timezone.utc),
        )
        db.add(agreement)
    agreement.lead_fee_inr = payload.lead_fee_inr
    agreement.revenue_share_pct = payload.revenue_share_pct
    agreement.active = payload.active
    agreement.notes = payload.notes
    db.commit()
    db.refresh(agreement)
    return agreement


def patch_agreement(
    db: Session, operator_id: uuid.UUID, payload: OperatorAgreementPatch
) -> OperatorAgreement | None:
    agreement = get_agreement(db, operator_id)
    if agreement is None:
        return None
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(agreement, field, value)
    db.commit()
    db.refresh(agreement)
    return agreement
