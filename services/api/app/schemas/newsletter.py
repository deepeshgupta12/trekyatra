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


# ── Campaign schemas ──────────────────────────────────────────────────────────

class NewsletterCampaignResponse(BaseModel):
    id: uuid.UUID
    week_label: str
    subject: str
    preview_text: str | None
    body_html: str
    status: str
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerateCampaignResponse(BaseModel):
    campaign_id: uuid.UUID
    week_label: str
    subject: str
    message: str


class SendCampaignResponse(BaseModel):
    campaign_id: uuid.UUID
    status: str
    message: str


# ── Social snippet schemas ────────────────────────────────────────────────────

class SocialSnippetResponse(BaseModel):
    id: uuid.UUID
    page_id: uuid.UUID | None
    platform: str
    copy: str
    copy_title: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RepurposeResponse(BaseModel):
    page_slug: str
    snippets_created: int
    snippet_ids: list[uuid.UUID]
