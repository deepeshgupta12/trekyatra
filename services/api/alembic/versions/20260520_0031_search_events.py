"""search_events table for search analytics

Revision ID: 20260520_0031
Revises: 20260506_0030
Create Date: 2026-05-20
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260520_0031"
down_revision = "20260506_0030"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "search_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("query", sa.String(512), nullable=False),
        sa.Column("results_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("clicked_slug", sa.String(255), nullable=True),
        sa.Column("clicked_page_type", sa.String(64), nullable=True),
        sa.Column("session_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_search_events_query", "search_events", ["query"])
    op.create_index("ix_search_events_created_at", "search_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_search_events_created_at", "search_events")
    op.drop_index("ix_search_events_query", "search_events")
    op.drop_table("search_events")
