"""pipeline_runs and pipeline_stages tables

Revision ID: 20260423_0009
Revises: 20260423_0008
Create Date: 2026-04-23
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260423_0009"
down_revision = "20260423_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pipeline_runs",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("pipeline_type", sa.String(32), nullable=False, server_default="full"),
        sa.Column("status", sa.String(64), nullable=False, server_default="running"),
        sa.Column("current_stage", sa.String(64), nullable=True),
        sa.Column("start_stage", sa.String(64), nullable=False, server_default="trend_discovery"),
        sa.Column("end_stage", sa.String(64), nullable=False, server_default="publish"),
        sa.Column("input_json", sa.Text, nullable=True),
        sa.Column("output_json", sa.Text, nullable=True),
        sa.Column("error_detail", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_pipeline_runs_status", "pipeline_runs", ["status"])

    op.create_table(
        "pipeline_stages",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "pipeline_run_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("pipeline_runs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("stage_name", sa.String(64), nullable=False),
        sa.Column(
            "agent_run_id",
            sa.Integer,
            sa.ForeignKey("agent_runs.id"),
            nullable=True,
        ),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("error_detail", sa.Text, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_pipeline_stages_pipeline_run_id", "pipeline_stages", ["pipeline_run_id"])


def downgrade() -> None:
    op.drop_index("ix_pipeline_stages_pipeline_run_id", table_name="pipeline_stages")
    op.drop_table("pipeline_stages")
    op.drop_index("ix_pipeline_runs_status", table_name="pipeline_runs")
    op.drop_table("pipeline_runs")
