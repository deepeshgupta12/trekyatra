from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class LeadCreate(BaseModel):
    name: str
    email: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v.lower().strip()
    phone: str | None = None
    trek_interest: str
    message: str | None = None
    source_page: str
    source_cluster: str | None = None
    cta_type: str | None = None


class LeadResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    trek_interest: str
    source_page: str
    created_at: datetime

    model_config = {"from_attributes": True}
