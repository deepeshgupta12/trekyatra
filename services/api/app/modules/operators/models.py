from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.modules.leads.models import LeadSubmission


class Operator(Base):
    __tablename__ = "operators"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    region: Mapped[list | None] = mapped_column(JSON, nullable=True)
    trek_types: Mapped[list | None] = mapped_column(JSON, nullable=True)
    contact_email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    specializations: Mapped[list[OperatorSpecialization]] = relationship(
        "OperatorSpecialization", back_populates="operator", cascade="all, delete-orphan"
    )
    leads: Mapped[list[LeadSubmission]] = relationship(
        "LeadSubmission", back_populates="assigned_operator", foreign_keys="LeadSubmission.assigned_operator_id"
    )


class OperatorSpecialization(Base):
    __tablename__ = "operator_specializations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    operator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("operators.id", ondelete="CASCADE"), nullable=False
    )
    trek_slug: Mapped[str] = mapped_column(String(200), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("3"))

    operator: Mapped[Operator] = relationship("Operator", back_populates="specializations")
