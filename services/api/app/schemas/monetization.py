from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class IntentClassification(BaseModel):
    intent: str  # research | booking_ready | inspiration | buyer
    confidence: float
    recommended_module: str  # affiliate | lead | newsletter | product


class IntentResponse(BaseModel):
    session_id: str
    intent: str
    confidence: float
    recommended_module: str
    ab_variant: str | None = None


class AffiliateProductCreate(BaseModel):
    title: str
    description: str | None = None
    affiliate_url: str
    affiliate_program: str | None = None
    category: list[str] = []
    price_range: str | None = None
    active: bool = True


class AffiliateProductPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    affiliate_url: str | None = None
    affiliate_program: str | None = None
    category: list[str] | None = None
    price_range: str | None = None
    active: bool | None = None


class AffiliateProductResponse(BaseModel):
    id: str
    title: str
    description: str | None
    affiliate_url: str
    affiliate_program: str | None
    category: list[str]
    price_range: str | None
    active: bool
    created_at: str | None

    model_config = ConfigDict(from_attributes=True)


class MonetizationStatsResponse(BaseModel):
    intent_distribution: dict[str, int]
    conversion_by_module: dict[str, float]
    top_converting_pages: list[dict]
    total_sessions: int
    total_conversions: int
