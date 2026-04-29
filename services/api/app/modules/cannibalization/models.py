from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class CannibalizationIssue(Base):
    __tablename__ = "cannibalization_issues"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    page_a_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    page_b_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    shared_keywords: Mapped[list] = mapped_column(JSON, nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    recommendation: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open", index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
