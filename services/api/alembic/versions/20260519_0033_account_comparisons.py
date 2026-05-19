"""account_comparisons table for saved trek comparisons

Revision ID: 20260519_0033
Revises: 20260519_0032
Create Date: 2026-05-19
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "20260519_0033"
down_revision = "20260519_0032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "account_comparisons",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slugs", JSONB, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_account_comparisons_user_id", "account_comparisons", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_account_comparisons_user_id", "account_comparisons")
    op.drop_table("account_comparisons")
