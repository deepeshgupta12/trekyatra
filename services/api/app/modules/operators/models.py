from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.modules.leads.models import LeadSubmission
    from app.modules.auth.models import User


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
    # Marketplace fields (Step 38)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description_long: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating_avg: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, server_default="0.0")
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
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
    reviews: Mapped[list[OperatorReview]] = relationship(
        "OperatorReview", back_populates="operator", cascade="all, delete-orphan"
    )
    agreement: Mapped[OperatorAgreement | None] = relationship(
        "OperatorAgreement", back_populates="operator", uselist=False, cascade="all, delete-orphan"
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


class OperatorReview(Base):
    __tablename__ = "operator_reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    operator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("operators.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    operator: Mapped[Operator] = relationship("Operator", back_populates="reviews")


class OperatorAgreement(Base):
    __tablename__ = "operator_agreements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    operator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("operators.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    lead_fee_inr: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    revenue_share_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    operator: Mapped[Operator] = relationship("Operator", back_populates="agreement")
