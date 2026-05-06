from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.operators.models import Operator, OperatorReview
from app.schemas.operators import OperatorReviewCreate


def list_reviews(
    db: Session,
    operator_id: uuid.UUID,
    *,
    limit: int = 20,
    offset: int = 0,
) -> list[OperatorReview]:
    return list(
        db.scalars(
            select(OperatorReview)
            .where(OperatorReview.operator_id == operator_id)
            .order_by(OperatorReview.created_at.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    )


def get_review(db: Session, review_id: uuid.UUID) -> OperatorReview | None:
    return db.get(OperatorReview, review_id)


def create_review(
    db: Session,
    operator_id: uuid.UUID,
    user_id: uuid.UUID | None,
    payload: OperatorReviewCreate,
) -> OperatorReview:
    review = OperatorReview(
        id=uuid.uuid4(),
        operator_id=operator_id,
        user_id=user_id,
        rating=payload.rating,
        body=payload.body,
        created_at=datetime.now(timezone.utc),
    )
    db.add(review)
    db.flush()
    _update_rating_avg(db, operator_id)
    db.commit()
    db.refresh(review)
    return review


def delete_review(db: Session, review_id: uuid.UUID) -> bool:
    review = db.get(OperatorReview, review_id)
    if review is None:
        return False
    operator_id = review.operator_id
    db.delete(review)
    db.flush()
    _update_rating_avg(db, operator_id)
    db.commit()
    return True


def _update_rating_avg(db: Session, operator_id: uuid.UUID) -> None:
    """Recompute and store denormalised rating_avg + review_count on Operator."""
    row = db.execute(
        select(
            func.count(OperatorReview.id).label("cnt"),
            func.avg(OperatorReview.rating).label("avg"),
        ).where(OperatorReview.operator_id == operator_id)
    ).first()
    count = row.cnt if row else 0
    avg = float(row.avg) if row and row.avg else 0.0
    operator = db.get(Operator, operator_id)
    if operator:
        operator.review_count = count
        operator.rating_avg = round(avg, 2)
