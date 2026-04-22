from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    pass


class TopicOpportunity(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "topic_opportunities"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    primary_keyword: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    intent: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    page_type: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    trend_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    urgency_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="new", nullable=False, index=True)
    notes: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    briefs: Mapped[list["ContentBrief"]] = relationship(
        back_populates="topic_opportunity",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class KeywordCluster(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "keyword_clusters"

    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    primary_keyword: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    supporting_keywords: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    intent: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    pillar_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)
    notes: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    briefs: Mapped[list["ContentBrief"]] = relationship(
        back_populates="keyword_cluster",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ContentBrief(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "content_briefs"

    topic_opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("topic_opportunities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    keyword_cluster_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("keyword_clusters.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    target_keyword: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    secondary_keywords: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    intent: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    page_type: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    heading_outline: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    faqs: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    internal_link_targets: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    schema_recommendations: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    monetization_notes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)

    topic_opportunity: Mapped[TopicOpportunity | None] = relationship(back_populates="briefs")
    keyword_cluster: Mapped[KeywordCluster | None] = relationship(back_populates="briefs")
    drafts: Mapped[list["ContentDraft"]] = relationship(
        back_populates="brief",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ContentDraft(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "content_drafts"

    brief_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("content_briefs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(default=1, nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    wordpress_post_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    brief: Mapped[ContentBrief] = relationship(back_populates="drafts")
    publish_logs: Mapped[list["PublishLog"]] = relationship(
        back_populates="draft",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class PublishLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "publish_logs"

    draft_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("content_drafts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    wordpress_post_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wordpress_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    draft: Mapped["ContentDraft"] = relationship(back_populates="publish_logs")