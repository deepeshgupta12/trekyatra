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
    status: str = "new"
    assigned_operator_id: uuid.UUID | None = None
    status_history: list[dict] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


VALID_LEAD_STATUSES = {"new", "routed", "contacted", "converted", "lost", "archived"}


class StatusHistoryEntry(BaseModel):
    status: str
    changed_at: str
    changed_by: str = "system"


class LeadStatusPatch(BaseModel):
    status: str

    def validate_status(self) -> None:
        if self.status not in VALID_LEAD_STATUSES:
            raise ValueError(f"Invalid status. Must be one of: {sorted(VALID_LEAD_STATUSES)}")
