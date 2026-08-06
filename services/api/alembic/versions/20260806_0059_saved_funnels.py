"""saved_funnels — named reusable funnel definitions (P2 CDP)

A persisted funnel (ordered event steps + optional conversion window) so a team can track the same
conversion path over time, vs the existing ad-hoc dynamic funnel builder.

Revision ID: 20260806_0059
Revises: 20260806_0058
Create Date: 2026-08-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "20260806_0059"
down_revision = "20260806_0058"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saved_funnels",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("steps", JSONB, nullable=False, server_default="[]"),
        sa.Column("conversion_window_days", sa.Integer(), nullable=True),
        sa.Column("count_type", sa.String(length=24), nullable=False, server_default="unique_users"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("saved_funnels")
