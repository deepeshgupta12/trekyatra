from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class DraftStatusPatch(BaseModel):
    status: Literal["draft", "review", "approved", "published"] = Field(...)


class PublishLogResponse(BaseModel):
    id: uuid.UUID
    draft_id: uuid.UUID
    status: str
    cms_page_id: uuid.UUID | None = None
    published_url: str | None = None
    error_message: str | None = None
    completed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DraftPublishResponse(BaseModel):
    draft_id: uuid.UUID
    status: str
    cms_page_id: uuid.UUID | None = None
    published_url: str | None = None
    message: str
