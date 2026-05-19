"""page_views table for popularity-weighted recommendations

Revision ID: 20260519_0032
Revises: 20260520_0031
Create Date: 2026-05-19
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260519_0032"
down_revision = "20260520_0031"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "page_views",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("page_slug", sa.String(255), nullable=False),
        sa.Column("page_type", sa.String(64), nullable=True),
        sa.Column("session_id", sa.String(255), nullable=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_page_views_slug", "page_views", ["page_slug"])
    op.create_index("ix_page_views_viewed_at", "page_views", ["viewed_at"])
    op.create_index("ix_page_views_user_id", "page_views", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_page_views_user_id", "page_views")
    op.drop_index("ix_page_views_viewed_at", "page_views")
    op.drop_index("ix_page_views_slug", "page_views")
    op.drop_table("page_views")
