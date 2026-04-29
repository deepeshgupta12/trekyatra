"""Create newsletter_campaigns and social_snippets tables

Revision ID: 20260429_0017
Revises: 20260429_0016
Create Date: 2026-04-29
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260429_0017"
down_revision = "20260429_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "newsletter_campaigns",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("week_label", sa.String(50), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("preview_text", sa.String(300), nullable=True),
        sa.Column("body_html", sa.Text, nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_newsletter_campaigns_status", "newsletter_campaigns", ["status"])
    op.create_index("ix_newsletter_campaigns_week_label", "newsletter_campaigns", ["week_label"])

    op.create_table(
        "social_snippets",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "page_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("pages.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("copy", sa.Text, nullable=False),
        sa.Column("copy_title", sa.String(500), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_social_snippets_page_id", "social_snippets", ["page_id"])
    op.create_index("ix_social_snippets_platform", "social_snippets", ["platform"])


def downgrade() -> None:
    op.drop_table("social_snippets")
    op.drop_table("newsletter_campaigns")
