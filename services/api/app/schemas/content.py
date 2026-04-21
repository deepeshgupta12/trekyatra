from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TopicOpportunityCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    slug: str = Field(min_length=3, max_length=255)
    primary_keyword: str = Field(min_length=2, max_length=255)
    source: str | None = Field(default=None, max_length=64)
    intent: str | None = Field(default=None, max_length=64)
    page_type: str | None = Field(default=None, max_length=64)
    trend_score: float | None = None
    urgency_score: float | None = None
    status: str = Field(default="new", max_length=32)
    notes: dict | None = None


class TopicOpportunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    primary_keyword: str
    source: str | None
    intent: str | None
    page_type: str | None
    trend_score: float | None
    urgency_score: float | None
    status: str
    notes: dict | None
    created_at: datetime


class KeywordClusterCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    primary_keyword: str = Field(min_length=2, max_length=255)
    supporting_keywords: list[str] | None = None
    intent: str | None = Field(default=None, max_length=64)
    pillar_title: str | None = Field(default=None, max_length=255)
    status: str = Field(default="draft", max_length=32)
    notes: dict | None = None


class KeywordClusterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    primary_keyword: str
    supporting_keywords: list[str] | None
    intent: str | None
    pillar_title: str | None
    status: str
    notes: dict | None
    created_at: datetime


class ContentBriefCreate(BaseModel):
    topic_opportunity_id: str | None = None
    keyword_cluster_id: str | None = None
    title: str = Field(min_length=3, max_length=255)
    slug: str = Field(min_length=3, max_length=255)
    target_keyword: str = Field(min_length=2, max_length=255)
    secondary_keywords: list[str] | None = None
    intent: str | None = Field(default=None, max_length=64)
    page_type: str | None = Field(default=None, max_length=64)
    heading_outline: list[dict] | None = None
    faqs: list[dict] | None = None
    internal_link_targets: list[str] | None = None
    schema_recommendations: list[str] | None = None
    monetization_notes: dict | None = None
    status: str = Field(default="draft", max_length=32)


class ContentBriefResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    topic_opportunity_id: str | None
    keyword_cluster_id: str | None
    title: str
    slug: str
    target_keyword: str
    secondary_keywords: list[str] | None
    intent: str | None
    page_type: str | None
    heading_outline: list[dict] | None
    faqs: list[dict] | None
    internal_link_targets: list[str] | None
    schema_recommendations: list[str] | None
    monetization_notes: dict | None
    status: str
    created_at: datetime


class ContentDraftCreate(BaseModel):
    brief_id: str
    title: str = Field(min_length=3, max_length=255)
    slug: str = Field(min_length=3, max_length=255)
    content_markdown: str = Field(min_length=10)
    excerpt: str | None = None
    meta_title: str | None = Field(default=None, max_length=255)
    meta_description: str | None = None
    version: int = 1
    confidence_score: float | None = None
    status: str = Field(default="draft", max_length=32)


class ContentDraftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    brief_id: str
    title: str
    slug: str
    content_markdown: str
    excerpt: str | None
    meta_title: str | None
    meta_description: str | None
    version: int
    confidence_score: float | None
    status: str
    created_at: datetime