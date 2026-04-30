from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class ComplianceRuleResponse(BaseModel):
    id: uuid.UUID
    name: str
    rule_type: str
    description: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ComplianceResultItem(BaseModel):
    rule: str
    rule_type: str
    status: str  # "pass" | "fail" | "warn"
    note: str
    suggestion: str | None = None


class ComplianceCheckResponse(BaseModel):
    draft_id: uuid.UUID
    compliance_status: str  # "passed" | "flagged"
    results: list[ComplianceResultItem]
    checked_rules: int
    failed_rules: int


class ComplianceOverrideRequest(BaseModel):
    override_note: str


class ComplianceOverrideResponse(BaseModel):
    draft_id: uuid.UUID
    compliance_status: str
    overridden_by: str
    override_note: str
    overridden_at: datetime
