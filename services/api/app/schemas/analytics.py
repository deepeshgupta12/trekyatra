from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AffiliateClickCreate(BaseModel):
    page_slug: str
    affiliate_program: str
    affiliate_link_url: str | None = None
    session_id: str | None = None


class AffiliateClickResponse(BaseModel):
    id: uuid.UUID
    page_slug: str
    affiliate_program: str
    affiliate_link_url: str | None
    clicked_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalyticsSummaryResponse(BaseModel):
    leads_last_30d: int
    affiliate_clicks_last_30d: int
    newsletter_subscribers_total: int
    pages_published_total: int
    pipeline_runs_last_30d: int
    agent_runs_last_30d: int
