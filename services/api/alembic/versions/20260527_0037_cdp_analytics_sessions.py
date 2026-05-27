"""CDP: analytics_sessions table — session lifecycle tracking

Revision ID: 20260527_0037
Revises: 20260527_0036
Create Date: 2026-05-27
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "20260527_0037"
down_revision = "20260527_0036"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytics_sessions",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("anonymous_id", sa.String(64), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("page_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("event_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("landing_page", sa.Text(), nullable=True),
        sa.Column("exit_page", sa.Text(), nullable=True),
        sa.Column("utm_source", sa.String(128), nullable=True),
        sa.Column("utm_medium", sa.String(128), nullable=True),
        sa.Column("utm_campaign", sa.String(128), nullable=True),
        sa.Column("device_type", sa.String(32), nullable=True),
        sa.Column("browser", sa.String(64), nullable=True),
        sa.Column("country", sa.String(64), nullable=True),
        sa.Column("converted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("conversion_event", sa.String(128), nullable=True),
        sa.Column("extra", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_analytics_sessions_started_at", "analytics_sessions", ["started_at"])


def downgrade() -> None:
    op.drop_table("analytics_sessions")
