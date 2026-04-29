"""Create cannibalization_issues table

Revision ID: 20260429_0016
Revises: 20260428_0015
Create Date: 2026-04-29
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260429_0016"
down_revision = "20260428_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cannibalization_issues",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("page_a_id", sa.Uuid(), nullable=False),
        sa.Column("page_b_id", sa.Uuid(), nullable=False),
        sa.Column("shared_keywords", sa.JSON(), nullable=False),
        sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("recommendation", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="open"),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["page_a_id"], ["pages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["page_b_id"], ["pages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cannibalization_issues_page_a_id", "cannibalization_issues", ["page_a_id"])
    op.create_index("ix_cannibalization_issues_page_b_id", "cannibalization_issues", ["page_b_id"])
    op.create_index("ix_cannibalization_issues_severity", "cannibalization_issues", ["severity"])
    op.create_index("ix_cannibalization_issues_status", "cannibalization_issues", ["status"])


def downgrade() -> None:
    op.drop_table("cannibalization_issues")
