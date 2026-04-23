"""master_cms — add cms_pages, replace wordpress columns

Revision ID: 20260423_0008
Revises: 20260422_0007_draft_claims
Create Date: 2026-04-23
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260423_0008"
down_revision = "20260422_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- cms_pages table ---
    op.create_table(
        "cms_pages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("page_type", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content_html", sa.Text(), nullable=False, server_default=""),
        sa.Column("content_json", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("seo_title", sa.String(255), nullable=True),
        sa.Column("seo_description", sa.Text(), nullable=True),
        sa.Column("seo_meta", sa.JSON(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("brief_id", sa.Uuid(), nullable=True),
        sa.Column("cluster_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(["brief_id"], ["content_briefs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cluster_id"], ["keyword_clusters.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_cms_pages_slug", "cms_pages", ["slug"])
    op.create_index("ix_cms_pages_page_type", "cms_pages", ["page_type"])
    op.create_index("ix_cms_pages_status", "cms_pages", ["status"])

    # --- content_drafts: drop wordpress_post_id, add cms_page_id ---
    op.drop_column("content_drafts", "wordpress_post_id")
    op.add_column(
        "content_drafts",
        sa.Column("cms_page_id", sa.Uuid(), nullable=True),
    )

    # --- publish_logs: drop wordpress_post_id + wordpress_url, add cms_page_id + published_url ---
    op.drop_column("publish_logs", "wordpress_post_id")
    op.drop_column("publish_logs", "wordpress_url")
    op.add_column(
        "publish_logs",
        sa.Column("cms_page_id", sa.Uuid(), nullable=True),
    )
    op.add_column(
        "publish_logs",
        sa.Column("published_url", sa.String(512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("publish_logs", "published_url")
    op.drop_column("publish_logs", "cms_page_id")
    op.add_column("publish_logs", sa.Column("wordpress_url", sa.String(512), nullable=True))
    op.add_column("publish_logs", sa.Column("wordpress_post_id", sa.Integer(), nullable=True))

    op.drop_column("content_drafts", "cms_page_id")
    op.add_column("content_drafts", sa.Column("wordpress_post_id", sa.Integer(), nullable=True))

    op.drop_index("ix_cms_pages_status", table_name="cms_pages")
    op.drop_index("ix_cms_pages_page_type", table_name="cms_pages")
    op.drop_index("ix_cms_pages_slug", table_name="cms_pages")
    op.drop_table("cms_pages")
