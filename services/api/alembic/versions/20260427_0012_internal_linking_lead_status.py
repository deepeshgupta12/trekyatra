"""internal_linking_lead_status

Revision ID: 20260427_0012
Revises: 20260427_0011
Create Date: 2026-04-27

Step 22:
- pages table (content graph index synced from cms_pages)
- page_links table (editorial + suggested links between pages)
- lead_submissions.status column (new → contacted → converted | archived)
"""

from __future__ import annotations

import uuid

import sqlalchemy as sa
from alembic import op

revision = "20260427_0012"
down_revision = "20260427_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pages",
        sa.Column("id", sa.UUID(), primary_key=True, default=uuid.uuid4),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column(
            "cms_page_id",
            sa.UUID(),
            sa.ForeignKey("cms_pages.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "cluster_id",
            sa.UUID(),
            sa.ForeignKey("keyword_clusters.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("page_type", sa.String(64), nullable=False, server_default="trek_guide"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("indexed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_pages_slug", "pages", ["slug"], unique=True)
    op.create_index("ix_pages_cms_page_id", "pages", ["cms_page_id"])
    op.create_index("ix_pages_cluster_id", "pages", ["cluster_id"])
    op.create_index("ix_pages_page_type", "pages", ["page_type"])

    op.create_table(
        "page_links",
        sa.Column("id", sa.UUID(), primary_key=True, default=uuid.uuid4),
        sa.Column(
            "from_page_id",
            sa.UUID(),
            sa.ForeignKey("pages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "to_page_id",
            sa.UUID(),
            sa.ForeignKey("pages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("anchor_text", sa.String(255), nullable=True),
        sa.Column("link_type", sa.String(32), nullable=False, server_default="suggested"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_page_links_from_page_id", "page_links", ["from_page_id"])
    op.create_index("ix_page_links_to_page_id", "page_links", ["to_page_id"])

    op.add_column(
        "lead_submissions",
        sa.Column(
            "status",
            sa.String(32),
            nullable=False,
            server_default="new",
        ),
    )
    op.create_index("ix_lead_submissions_status", "lead_submissions", ["status"])


def downgrade() -> None:
    op.drop_index("ix_lead_submissions_status", table_name="lead_submissions")
    op.drop_column("lead_submissions", "status")
    op.drop_table("page_links")
    op.drop_table("pages")
