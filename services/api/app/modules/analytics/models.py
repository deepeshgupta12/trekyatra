from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, UUIDPrimaryKeyMixin


class AffiliateClick(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "affiliate_clicks"

    page_slug: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    affiliate_program: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    affiliate_link_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    clicked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
