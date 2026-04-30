from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class EmailSequenceStepResponse(BaseModel):
    id: uuid.UUID
    sequence_id: uuid.UUID
    step_number: int
    subject: str
    delay_days: int
    created_at: datetime

    model_config = {"from_attributes": True}


class EmailSequenceResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    created_at: datetime
    step_count: int = 0
    enrollment_count: int = 0

    model_config = {"from_attributes": True}


class SubscriberTagResponse(BaseModel):
    id: uuid.UUID
    subscriber_id: uuid.UUID
    tag: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SubscriberSequenceEnrollmentResponse(BaseModel):
    id: uuid.UUID
    subscriber_id: uuid.UUID
    sequence_id: uuid.UUID
    current_step: int
    next_send_at: datetime
    enrolled_at: datetime
    status: str

    model_config = {"from_attributes": True}


class SubscriberPreferencesUpdate(BaseModel):
    digest: bool | None = None
    nurture: bool | None = None
    seasonal: bool | None = None


class SeedSequencesResponse(BaseModel):
    seeded: int
    message: str
