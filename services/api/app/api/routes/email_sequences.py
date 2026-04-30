from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.email_sequences.service import (
    enroll_subscriber,
    generate_preferences_token,
    get_sequence_with_steps,
    list_sequences,
    seed_default_sequences,
    update_subscriber_preferences,
    verify_preferences_token,
)
from app.schemas.email_sequences import (
    EmailSequenceResponse,
    EmailSequenceStepResponse,
    SeedSequencesResponse,
    SubscriberPreferencesUpdate,
    SubscriberSequenceEnrollmentResponse,
)

admin_router = APIRouter(
    prefix="/admin/email-sequences",
    tags=["email-sequences"],
    dependencies=[Depends(get_current_admin)],
)

public_router = APIRouter(
    prefix="/newsletter",
    tags=["newsletter"],
)


@admin_router.get("", response_model=list[EmailSequenceResponse])
def list_email_sequences(db: Session = Depends(get_db)) -> list[EmailSequenceResponse]:
    sequences = list_sequences(db)
    return [EmailSequenceResponse(**seq) for seq in sequences]


@admin_router.get("/{sequence_id}")
def get_email_sequence(sequence_id: uuid.UUID, db: Session = Depends(get_db)) -> dict:
    seq = get_sequence_with_steps(db, sequence_id)
    if seq is None:
        raise HTTPException(status_code=404, detail="Sequence not found")
    return {
        "id": seq.id,
        "name": seq.name,
        "slug": seq.slug,
        "description": seq.description,
        "created_at": seq.created_at,
        "step_count": len(seq.steps),
        "steps": [
            EmailSequenceStepResponse.model_validate(step).model_dump()
            for step in seq.steps
        ],
    }


@admin_router.post("/seed", response_model=SeedSequencesResponse)
def seed_sequences(db: Session = Depends(get_db)) -> SeedSequencesResponse:
    count = seed_default_sequences(db)
    return SeedSequencesResponse(
        seeded=count,
        message=f"Seeded {count} new sequence(s). Already-existing sequences were skipped.",
    )


@admin_router.post("/{sequence_id}/enroll/{subscriber_id}", response_model=SubscriberSequenceEnrollmentResponse)
def enroll_subscriber_in_sequence(
    sequence_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> SubscriberSequenceEnrollmentResponse:
    enrollment = enroll_subscriber(db, subscriber_id, sequence_id)
    if enrollment is None:
        raise HTTPException(status_code=404, detail="Sequence or subscriber not found")
    return SubscriberSequenceEnrollmentResponse.model_validate(enrollment)


@public_router.patch("/preferences")
def update_preferences(
    subscriber_id: uuid.UUID = Query(..., description="Subscriber UUID"),
    token: str = Query(..., description="HMAC token from email link"),
    body: SubscriberPreferencesUpdate = ...,
    db: Session = Depends(get_db),
) -> dict:
    if not verify_preferences_token(subscriber_id, token):
        raise HTTPException(status_code=403, detail="Invalid or expired token")
    prefs = {k: v for k, v in body.model_dump().items() if v is not None}
    sub = update_subscriber_preferences(db, subscriber_id, prefs)
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return {"updated": True, "preferences": sub.preferences}


@public_router.get("/unsubscribe")
def unsubscribe(
    subscriber_id: uuid.UUID = Query(...),
    token: str = Query(...),
    db: Session = Depends(get_db),
) -> dict:
    if not verify_preferences_token(subscriber_id, token):
        raise HTTPException(status_code=403, detail="Invalid or expired token")
    from app.modules.newsletter.models import NewsletterSubscriber as Sub
    sub = db.get(Sub, subscriber_id)
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    sub.active = False
    db.commit()
    return {"unsubscribed": True, "email": sub.email}
