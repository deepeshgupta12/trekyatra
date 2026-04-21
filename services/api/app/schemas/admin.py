from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CountSummary(BaseModel):
    total: int
    by_status: dict[str, int]
    recent_count: int
    latest_created_at: datetime | None = None


class TopicSummary(CountSummary):
    by_source: dict[str, int]


class WordPressConfigSummary(BaseModel):
    base_url: str
    rest_api_base_url: str
    credentials_configured: bool
    timeout_seconds: float
    verify_ssl: bool


class SystemSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    api_status: str
    database_status: str
    environment: str
    wordpress: WordPressConfigSummary
    generated_at: datetime


class DashboardSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    topics: TopicSummary
    clusters: CountSummary
    briefs: CountSummary
    drafts: CountSummary
    wordpress: WordPressConfigSummary
    generated_at: datetime