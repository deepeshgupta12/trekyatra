from __future__ import annotations
import uuid
from datetime import date, datetime
from sqlalchemy import String, Float, Integer, Text, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class RevenueConfig(Base):
    __tablename__ = "revenue_config"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    value_float: Mapped[float] = mapped_column(Float(), nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RevenueAttribution(Base):
    __tablename__ = "revenue_attributions"
    __table_args__ = (
        UniqueConstraint("page_id", "date", name="uq_revenue_attribution_page_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=True)
    date: Mapped[date] = mapped_column(Date(), nullable=False)
    affiliate_clicks: Mapped[int] = mapped_column(Integer(), default=0, nullable=False)
    lead_conversions: Mapped[int] = mapped_column(Integer(), default=0, nullable=False)
    estimated_revenue_inr: Mapped[float] = mapped_column(Float(), default=0.0, nullable=False)
    page_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cluster_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("keyword_clusters.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ExecutiveSummary(Base):
    __tablename__ = "executive_summaries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    week_label: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    content_md: Mapped[str] = mapped_column(Text(), nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
