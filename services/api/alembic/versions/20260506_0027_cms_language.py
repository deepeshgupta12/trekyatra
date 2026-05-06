"""cms_language: add language, translations, source_page_id to cms_pages

Revision ID: 20260506_0027
Revises: 20260505_0026
Create Date: 2026-05-06
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260506_0027"
down_revision = "20260505_0026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cms_pages",
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
    )
    op.add_column(
        "cms_pages",
        sa.Column("translations", sa.JSON(), nullable=True),
    )
    op.add_column(
        "cms_pages",
        sa.Column(
            "source_page_id",
            sa.Uuid(),
            sa.ForeignKey("cms_pages.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_cms_pages_language", "cms_pages", ["language"])


def downgrade() -> None:
    op.drop_index("ix_cms_pages_language", table_name="cms_pages")
    op.drop_column("cms_pages", "source_page_id")
    op.drop_column("cms_pages", "translations")
    op.drop_column("cms_pages", "language")
