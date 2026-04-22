"""publish log and draft publish columns

Revision ID: 20260422_0004
Revises: 20260421_0003
Create Date: 2026-04-22 10:00:00
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260422_0004"
down_revision = "20260421_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "content_drafts",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "content_drafts",
        sa.Column("wordpress_post_id", sa.Integer(), nullable=True),
    )

    op.create_table(
        "publish_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("draft_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("wordpress_post_id", sa.Integer(), nullable=True),
        sa.Column("wordpress_url", sa.String(512), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["draft_id"], ["content_drafts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_publish_logs_draft_id", "publish_logs", ["draft_id"])
    op.create_index("ix_publish_logs_status", "publish_logs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_publish_logs_status", table_name="publish_logs")
    op.drop_index("ix_publish_logs_draft_id", table_name="publish_logs")
    op.drop_table("publish_logs")
    op.drop_column("content_drafts", "wordpress_post_id")
    op.drop_column("content_drafts", "published_at")
