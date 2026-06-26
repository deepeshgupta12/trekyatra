from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class TrekCondition(Base):
    __tablename__ = "trek_conditions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    weather_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    trail_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="open"
    )
    permit_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="not_required"
    )
    permit_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    condition_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    weather_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    trail_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
