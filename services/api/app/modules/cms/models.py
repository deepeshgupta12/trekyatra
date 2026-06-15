from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.db.base_class import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CMSPage(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "cms_pages"

    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    page_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)
    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    seo_meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    hero_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Premium content gating (Step 40)
    is_premium: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Multilingual fields (Step 37)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en", index=True)
    translations: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    source_page_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("cms_pages.id", ondelete="SET NULL"),
        nullable=True,
    )

    embedding: Mapped[list[float] | None] = mapped_column(Vector(1536), nullable=True)

    # Editorial feature flag — admin marks a trek as "featured" for the explore sort
    # nullable=True so SQLAlchemy SELECT doesn't fail if migration 0035 not yet applied
    is_featured: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=False)

    # Trek guide metadata — first-class columns (only populated for page_type = "trek_guide")
    trek_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trek_state: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    trek_difficulty: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    trek_duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    trek_season: Mapped[str | None] = mapped_column(String(200), nullable=True)
    trek_suitability: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Tombstone for mobile sync — set when a page is soft-deleted
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    brief_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("content_briefs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    cluster_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("keyword_clusters.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Step 72: trek intelligence structured data (only populated for page_type = "trek_guide")
    trek_region: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    trek_max_altitude_ft: Mapped[int | None] = mapped_column(Integer, nullable=True)
    trek_duration_days_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    trek_duration_days_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    trek_best_months: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    trek_open_months: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    trek_avoid_months: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    trek_permit_required: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    trek_permit_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    trek_budget_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    trek_budget_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    trek_themes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    trek_crowd_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    trek_beginner_friendly: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    trek_solo_friendly: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    trek_family_friendly: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    trek_operator_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    trek_is_unsafe_closed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    trek_data_confidence: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    trek_last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
