from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    rule_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rule_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
