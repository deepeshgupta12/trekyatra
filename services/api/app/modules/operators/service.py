from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.modules.operators.models import Operator, OperatorSpecialization
from app.schemas.operators import OperatorCreate, OperatorPatch


def _load_operator(db: Session, operator_id: uuid.UUID) -> Operator | None:
    return db.scalar(
        select(Operator)
        .options(selectinload(Operator.specializations))
        .where(Operator.id == operator_id)
    )


def list_operators(db: Session, *, active_only: bool = False) -> list[Operator]:
    q = select(Operator).options(selectinload(Operator.specializations)).order_by(Operator.name)
    if active_only:
        q = q.where(Operator.active == True)  # noqa: E712
    return list(db.scalars(q).all())


def get_operator(db: Session, operator_id: uuid.UUID) -> Operator | None:
    return _load_operator(db, operator_id)


def create_operator(db: Session, payload: OperatorCreate) -> Operator:
    existing = db.scalar(select(Operator).where(Operator.slug == payload.slug))
    if existing is not None:
        raise ValueError(f"Operator with slug '{payload.slug}' already exists.")

    operator = Operator(
        id=uuid.uuid4(),
        name=payload.name,
        slug=payload.slug,
        contact_email=payload.contact_email,
        region=payload.region,
        trek_types=payload.trek_types,
        phone=payload.phone,
        website_url=payload.website_url,
        active=payload.active,
        created_at=datetime.now(timezone.utc),
    )
    db.add(operator)
    db.flush()

    for spec in payload.specializations or []:
        db.add(OperatorSpecialization(
            id=uuid.uuid4(),
            operator_id=operator.id,
            trek_slug=spec.trek_slug,
            priority=spec.priority,
        ))

    db.commit()
    db.refresh(operator)
    return _load_operator(db, operator.id)  # type: ignore[return-value]


def update_operator(db: Session, operator_id: uuid.UUID, payload: OperatorPatch) -> Operator | None:
    operator = _load_operator(db, operator_id)
    if operator is None:
        return None

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(operator, field, value)

    db.commit()
    db.refresh(operator)
    return _load_operator(db, operator.id)  # type: ignore[return-value]


def delete_operator(db: Session, operator_id: uuid.UUID) -> bool:
    operator = db.scalar(select(Operator).where(Operator.id == operator_id))
    if operator is None:
        return False
    db.delete(operator)
    db.commit()
    return True


def find_matching_operator(db: Session, trek_interest: str) -> Operator | None:
    """Return the highest-priority active operator that covers trek_interest."""
    interest_lower = trek_interest.lower()
    operators = list_operators(db, active_only=True)

    best: Operator | None = None
    best_priority = 999

    for op in operators:
        trek_types: list[str] = op.trek_types or []
        for tt in trek_types:
            if tt.lower() in interest_lower or interest_lower in tt.lower():
                # Use the highest-priority specialization for this operator
                spec_priority = min(
                    (s.priority for s in op.specializations), default=3
                )
                if spec_priority < best_priority:
                    best = op
                    best_priority = spec_priority
                break

    return best
