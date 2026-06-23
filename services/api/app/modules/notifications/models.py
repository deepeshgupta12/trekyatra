from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, UUIDPrimaryKeyMixin


class MobilePushLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "mobile_push_log"

    device_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("mobile_devices.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), server_default="sent", nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
