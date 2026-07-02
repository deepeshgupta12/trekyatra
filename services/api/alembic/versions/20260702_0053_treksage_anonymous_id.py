"""Add anonymous_id to treksage_chat_sessions for CDP identity stitching

Revision ID: 20260702_0053
Revises: 20260630_0052
Create Date: 2026-07-02
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260702_0053"
down_revision = "20260630_0052"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "treksage_chat_sessions",
        sa.Column("anonymous_id", sa.String(64), nullable=True),
    )
    op.create_index(
        "ix_treksage_chat_sessions_anonymous_id",
        "treksage_chat_sessions",
        ["anonymous_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_treksage_chat_sessions_anonymous_id", table_name="treksage_chat_sessions")
    op.drop_column("treksage_chat_sessions", "anonymous_id")
