from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OperatorSpecializationCreate(BaseModel):
    trek_slug: str = Field(min_length=2, max_length=200)
    priority: int = Field(default=3, ge=1, le=5)


class OperatorSpecializationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    operator_id: uuid.UUID
    trek_slug: str
    priority: int


class OperatorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    slug: str = Field(min_length=2, max_length=200)
    contact_email: str
    region: list[str] | None = None
    trek_types: list[str] | None = None
    phone: str | None = Field(default=None, max_length=30)
    website_url: str | None = Field(default=None, max_length=512)
    logo_url: str | None = Field(default=None, max_length=512)
    description_long: str | None = None
    active: bool = True
    specializations: list[OperatorSpecializationCreate] | None = None


class OperatorPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    contact_email: str | None = None
    region: list[str] | None = None
    trek_types: list[str] | None = None
    phone: str | None = None
    website_url: str | None = None
    logo_url: str | None = None
    description_long: str | None = None
    active: bool | None = None


class OperatorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    region: list[str] | None
    trek_types: list[str] | None
    contact_email: str
    phone: str | None
    website_url: str | None
    logo_url: str | None = None
    description_long: str | None = None
    rating_avg: float = 0.0
    review_count: int = 0
    active: bool
    created_at: datetime
    specializations: list[OperatorSpecializationResponse]


class OperatorPublicResponse(BaseModel):
    """Public view — omits contact_email."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    region: list[str] | None
    trek_types: list[str] | None
    phone: str | None
    website_url: str | None
    logo_url: str | None = None
    description_long: str | None = None
    rating_avg: float = 0.0
    review_count: int = 0
    active: bool
    created_at: datetime
    specializations: list[OperatorSpecializationResponse]


class AssignOperatorRequest(BaseModel):
    operator_id: uuid.UUID


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

class OperatorReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    body: str | None = Field(default=None, max_length=2000)


class OperatorReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    operator_id: uuid.UUID
    user_id: uuid.UUID | None
    rating: int
    body: str | None
    created_at: datetime


# ---------------------------------------------------------------------------
# Agreements
# ---------------------------------------------------------------------------

class OperatorAgreementCreate(BaseModel):
    lead_fee_inr: float = Field(default=0.0, ge=0)
    revenue_share_pct: float | None = Field(default=None, ge=0, le=100)
    active: bool = True
    notes: str | None = None


class OperatorAgreementPatch(BaseModel):
    lead_fee_inr: float | None = Field(default=None, ge=0)
    revenue_share_pct: float | None = Field(default=None, ge=0, le=100)
    active: bool | None = None
    notes: str | None = None


class OperatorAgreementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    operator_id: uuid.UUID
    lead_fee_inr: float
    revenue_share_pct: float | None
    active: bool
    notes: str | None
    created_at: datetime


# ---------------------------------------------------------------------------
# Inquiry (booking request direct to an operator)
# ---------------------------------------------------------------------------

class InquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: str
    phone: str | None = Field(default=None, max_length=30)
    trek_interest: str = Field(min_length=2, max_length=200)
    message: str | None = Field(default=None, max_length=2000)
    operator_slug: str | None = None


class InquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    trek_interest: str
    status: str
    created_at: datetime
