"""Search analytics models — Step 44."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class PageView(Base):
    __tablename__ = "page_views"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_slug: Mapped[str] = mapped_column(String(255), nullable=False)
    page_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    viewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_page_views_slug", "page_slug"),
        Index("ix_page_views_viewed_at", "viewed_at"),
        Index("ix_page_views_user_id", "user_id"),
    )


class SearchEvent(Base):
    __tablename__ = "search_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query: Mapped[str] = mapped_column(String(512), nullable=False)
    results_count: Mapped[int] = mapped_column(Integer, default=0)
    clicked_slug: Mapped[str | None] = mapped_column(String(255), nullable=True)
    clicked_page_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_search_events_query", "query"),
        Index("ix_search_events_created_at", "created_at"),
    )
