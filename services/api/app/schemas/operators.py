from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
    active: bool = True
    specializations: list[OperatorSpecializationCreate] | None = None


class OperatorPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    contact_email: str | None = None
    region: list[str] | None = None
    trek_types: list[str] | None = None
    phone: str | None = None
    website_url: str | None = None
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
    active: bool
    created_at: datetime
    specializations: list[OperatorSpecializationResponse]


class AssignOperatorRequest(BaseModel):
    operator_id: uuid.UUID
