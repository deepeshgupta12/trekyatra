"""analytics — affiliate_clicks table

Revision ID: 20260428_0014
Revises: 20260427_0013
Create Date: 2026-04-28 15:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260428_0014"
down_revision = "20260427_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "affiliate_clicks",
        sa.Column("page_slug", sa.String(length=512), nullable=False),
        sa.Column("affiliate_program", sa.String(length=128), nullable=False),
        sa.Column("affiliate_link_url", sa.String(length=1024), nullable=True),
        sa.Column("clicked_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("session_id", sa.String(length=128), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_affiliate_clicks_affiliate_program", "affiliate_clicks", ["affiliate_program"], unique=False)
    op.create_index("ix_affiliate_clicks_clicked_at", "affiliate_clicks", ["clicked_at"], unique=False)
    op.create_index("ix_affiliate_clicks_page_slug", "affiliate_clicks", ["page_slug"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_affiliate_clicks_page_slug", table_name="affiliate_clicks")
    op.drop_index("ix_affiliate_clicks_clicked_at", table_name="affiliate_clicks")
    op.drop_index("ix_affiliate_clicks_affiliate_program", table_name="affiliate_clicks")
    op.drop_table("affiliate_clicks")
