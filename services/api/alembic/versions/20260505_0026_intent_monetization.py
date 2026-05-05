"""add affiliate_products and page_intent_sessions tables

Revision ID: 20260505_0026
Revises: 20260504_0025
Create Date: 2026-05-05
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260505_0026"
down_revision = "20260504_0025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "affiliate_products",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("affiliate_url", sa.Text(), nullable=False),
        sa.Column("affiliate_program", sa.Text(), nullable=True),
        sa.Column("category", sa.JSON(), nullable=True),
        sa.Column("price_range", sa.Text(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "page_intent_sessions",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", sa.Text(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("page_slug", sa.Text(), nullable=False),
        sa.Column("intent", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("module_shown", sa.Text(), nullable=True),
        sa.Column("converted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("ab_variant", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_page_intent_sessions_page_slug", "page_intent_sessions", ["page_slug"])
    op.create_index("ix_page_intent_sessions_session_id", "page_intent_sessions", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_page_intent_sessions_session_id", table_name="page_intent_sessions")
    op.drop_index("ix_page_intent_sessions_page_slug", table_name="page_intent_sessions")
    op.drop_table("page_intent_sessions")
    op.drop_table("affiliate_products")
