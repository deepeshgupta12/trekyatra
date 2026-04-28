import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CountSummary(BaseModel):
    total: int
    by_status: dict[str, int]
    recent_count: int
    latest_created_at: datetime | None = None


class TopicSummary(CountSummary):
    by_source: dict[str, int]


class CMSConfigSummary(BaseModel):
    engine: str = "master_cms"
    pages_table: str = "cms_pages"
    cache_db: int = 2
    cache_ttl_seconds: int = 300


class SystemSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    api_status: str
    database_status: str
    environment: str
    cms: CMSConfigSummary
    generated_at: datetime


class ClaimPatch(BaseModel):
    flagged_for_review: bool


class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    draft_id: uuid.UUID
    draft_title: str
    claim_text: str
    claim_type: str
    confidence_score: float
    flagged_for_review: bool
    ymyl_flag: bool = False
    evidence_url: str | None = None
    created_at: datetime


class DashboardSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    topics: TopicSummary
    clusters: CountSummary
    briefs: CountSummary
    drafts: CountSummary
    cms: CMSConfigSummary
    generated_at: datetime