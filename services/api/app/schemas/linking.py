from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class PageResponse(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    page_type: str
    published_at: datetime | None
    cms_page_id: uuid.UUID | None
    cluster_id: uuid.UUID | None

    model_config = {"from_attributes": True}


class RelatedPageResponse(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    page_type: str

    model_config = {"from_attributes": True}


class AnchorSuggestion(BaseModel):
    text: str
    reason: str


class SyncResponse(BaseModel):
    synced: int
    message: str


class OrphanResponse(BaseModel):
    pages: list[PageResponse]
    count: int
