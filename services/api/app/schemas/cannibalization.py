from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

VALID_RESOLVE_STATUSES = {"accepted", "dismissed", "resolved"}


class CannibalizationIssueResponse(BaseModel):
    id: uuid.UUID
    page_a_id: uuid.UUID
    page_b_id: uuid.UUID
    page_a_slug: str
    page_b_slug: str
    page_a_title: str
    page_b_title: str
    shared_keywords: list[str]
    severity: str
    recommendation: str
    status: str
    resolved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResolveRequest(BaseModel):
    status: str

    def validate_status(self) -> None:
        if self.status not in VALID_RESOLVE_STATUSES:
            raise ValueError(f"status must be one of {VALID_RESOLVE_STATUSES}")


class DetectResponse(BaseModel):
    issues_found: int
    new_issues: int


class MergeResponse(BaseModel):
    draft_id: uuid.UUID
    brief_id: uuid.UUID
    message: str
