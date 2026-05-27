"""CDP: attribution_touchpoints table — multi-touch UTM attribution

Revision ID: 20260527_0039
Revises: 20260527_0038
Create Date: 2026-05-27
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "20260527_0039"
down_revision = "20260527_0038"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "attribution_touchpoints",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("anonymous_id", sa.String(64), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("session_id", sa.String(64), nullable=True),
        sa.Column("touchpoint_type", sa.String(32), nullable=False),  # first_touch / last_touch / assist
        sa.Column("channel", sa.String(64), nullable=True),
        sa.Column("utm_source", sa.String(128), nullable=True),
        sa.Column("utm_medium", sa.String(128), nullable=True),
        sa.Column("utm_campaign", sa.String(128), nullable=True),
        sa.Column("utm_term", sa.String(128), nullable=True),
        sa.Column("utm_content", sa.String(128), nullable=True),
        sa.Column("referrer", sa.Text(), nullable=True),
        sa.Column("landing_page", sa.Text(), nullable=True),
        sa.Column("conversion_event", sa.String(128), nullable=True),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("extra", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_attribution_touchpoints_created_at", "attribution_touchpoints", ["created_at"])


def downgrade() -> None:
    op.drop_table("attribution_touchpoints")
