"""CDP: user_traits table — computed user profile traits

Revision ID: 20260527_0038
Revises: 20260527_0037
Create Date: 2026-05-27
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "20260527_0038"
down_revision = "20260527_0037"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_traits",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("anonymous_id", sa.String(64), nullable=True, index=True),
        sa.Column("total_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_events", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_page_views", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("acquisition_source", sa.String(128), nullable=True),
        sa.Column("acquisition_medium", sa.String(128), nullable=True),
        sa.Column("acquisition_campaign", sa.String(128), nullable=True),
        sa.Column("preferred_trek_categories", JSONB, nullable=False, server_default="[]"),
        sa.Column("viewed_treks", JSONB, nullable=False, server_default="[]"),
        sa.Column("searched_queries", JSONB, nullable=False, server_default="[]"),
        sa.Column("plan_wizard_started", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("plan_wizard_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("signed_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("signed_in_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("device_types_used", JSONB, nullable=False, server_default="[]"),
        sa.Column("countries", JSONB, nullable=False, server_default="[]"),
        sa.Column("custom_traits", JSONB, nullable=False, server_default="{}"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("user_traits")
