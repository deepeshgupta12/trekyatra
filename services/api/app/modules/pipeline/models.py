from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UUID, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

PIPELINE_STATUSES = (
    "running",
    "paused_at_brief_approval",
    "paused_at_draft_approval",
    "completed",
    "failed",
    "cancelled",
)

STAGE_STATUSES = ("pending", "running", "completed", "failed", "skipped")


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    pipeline_type: Mapped[str] = mapped_column(String(32), nullable=False, default="full")
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="running", index=True)
    current_stage: Mapped[str | None] = mapped_column(String(64), nullable=True)
    start_stage: Mapped[str] = mapped_column(
        String(64), nullable=False, default="trend_discovery"
    )
    end_stage: Mapped[str] = mapped_column(String(64), nullable=False, default="publish")
    input_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    stages: Mapped[list["PipelineStage"]] = relationship(
        "PipelineStage",
        back_populates="pipeline_run",
        order_by="PipelineStage.created_at",
        cascade="all, delete-orphan",
    )


class PipelineStage(Base):
    __tablename__ = "pipeline_stages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    pipeline_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pipeline_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage_name: Mapped[str] = mapped_column(String(64), nullable=False)
    agent_run_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("agent_runs.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    pipeline_run: Mapped["PipelineRun"] = relationship("PipelineRun", back_populates="stages")
