from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class NewsletterSubscribeCreate(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v.lower().strip()
    name: str | None = None
    source_page: str
    lead_magnet: str | None = None


class NewsletterSubscribeResponse(BaseModel):
    id: uuid.UUID
    email: str
    source_page: str
    already_subscribed: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
