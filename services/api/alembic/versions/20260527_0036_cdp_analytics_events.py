"""CDP: analytics_events table — core event store

Revision ID: 20260527_0036
Revises: 20260521_0035
Create Date: 2026-05-27
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "20260527_0036"
down_revision = "20260521_0035"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("anonymous_id", sa.String(64), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("session_id", sa.String(64), nullable=True, index=True),
        sa.Column("event_category", sa.String(64), nullable=False),
        sa.Column("event_name", sa.String(128), nullable=False),
        sa.Column("event_value", sa.Float(), nullable=True),
        sa.Column("properties", JSONB, nullable=False, server_default="{}"),
        sa.Column("page_url", sa.Text(), nullable=True),
        sa.Column("page_title", sa.Text(), nullable=True),
        sa.Column("referrer", sa.Text(), nullable=True),
        sa.Column("utm_source", sa.String(128), nullable=True),
        sa.Column("utm_medium", sa.String(128), nullable=True),
        sa.Column("utm_campaign", sa.String(128), nullable=True),
        sa.Column("utm_term", sa.String(128), nullable=True),
        sa.Column("utm_content", sa.String(128), nullable=True),
        sa.Column("device_type", sa.String(32), nullable=True),
        sa.Column("browser", sa.String(64), nullable=True),
        sa.Column("os", sa.String(64), nullable=True),
        sa.Column("country", sa.String(64), nullable=True),
        sa.Column("city", sa.String(128), nullable=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("consent_given", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_analytics_events_event_name", "analytics_events", ["event_name"])
    op.create_index("ix_analytics_events_created_at", "analytics_events", ["created_at"])
    op.create_index("ix_analytics_events_category_name", "analytics_events", ["event_category", "event_name"])


def downgrade() -> None:
    op.drop_table("analytics_events")
