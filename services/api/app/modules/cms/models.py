from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

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
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

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
