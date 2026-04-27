"""content_refresh

Revision ID: 20260427_0013
Revises: 20260427_0012
Create Date: 2026-04-27

Step 23:
- pages: freshness_interval_days, last_refreshed_at, do_not_refresh columns
- content_drafts: freshness_interval_days column
- refresh_logs table
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260427_0013"
down_revision = "20260427_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -- pages: freshness tracking columns
    op.add_column("pages", sa.Column("freshness_interval_days", sa.Integer(), nullable=False, server_default="90"))
    op.add_column("pages", sa.Column("last_refreshed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("pages", sa.Column("do_not_refresh", sa.Boolean(), nullable=False, server_default="false"))

    # -- content_drafts: per-draft freshness interval (future use)
    op.add_column("content_drafts", sa.Column("freshness_interval_days", sa.Integer(), nullable=False, server_default="90"))

    # -- refresh_logs
    op.create_table(
        "refresh_logs",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("page_id", sa.UUID(), nullable=False),
        sa.Column("triggered_by", sa.String(64), nullable=False),
        sa.Column("trigger_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("result", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_refresh_logs_page_id", "refresh_logs", ["page_id"])
    op.create_index("ix_refresh_logs_result", "refresh_logs", ["result"])


def downgrade() -> None:
    op.drop_index("ix_refresh_logs_result", "refresh_logs")
    op.drop_index("ix_refresh_logs_page_id", "refresh_logs")
    op.drop_table("refresh_logs")
    op.drop_column("content_drafts", "freshness_interval_days")
    op.drop_column("pages", "do_not_refresh")
    op.drop_column("pages", "last_refreshed_at")
    op.drop_column("pages", "freshness_interval_days")
