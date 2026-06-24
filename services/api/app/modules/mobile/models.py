from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MobileDevice(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "mobile_devices"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    device_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    fcm_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    apns_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    platform: Mapped[str] = mapped_column(String(16), nullable=False)
    app_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    os_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    refresh_token_hash: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class UserTrekHistory(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "user_trek_history"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    trek_slug: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    trek_title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    completion_date: Mapped[date] = mapped_column(Date(), nullable=False, index=True)
    duration_days: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    trek_state: Mapped[str | None] = mapped_column(String(128), nullable=True)
    max_altitude_ft: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    extra: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
