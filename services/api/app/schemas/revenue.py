from __future__ import annotations
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel


class RevenueConfigResponse(BaseModel):
    id: UUID
    key: str
    value_float: float
    updated_at: datetime

    model_config = {"from_attributes": True}


class RevenueConfigUpdate(BaseModel):
    value_float: float


class RevenueAttributionResponse(BaseModel):
    id: UUID
    page_id: UUID | None
    date: date
    affiliate_clicks: int
    lead_conversions: int
    estimated_revenue_inr: float
    page_type: str | None
    cluster_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ClusterRevenueRow(BaseModel):
    cluster_id: UUID | None
    cluster_name: str | None
    total_revenue_inr: float
    total_clicks: int
    total_leads: int


class PageTypeRevenueRow(BaseModel):
    page_type: str | None
    total_revenue_inr: float
    total_clicks: int
    total_leads: int


class DecayingPageRow(BaseModel):
    page_id: UUID | None
    page_type: str | None
    affiliate_clicks_last_7: int
    affiliate_clicks_prev_7: int
    decay_pct: float


class AggregateRevenueResponse(BaseModel):
    aggregated: int
    period_start: date
    period_end: date


class ExecutiveSummaryResponse(BaseModel):
    id: UUID
    week_label: str
    content_md: str
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
