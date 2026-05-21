"""Add is_featured boolean to cms_pages for Featured sort on explore page

Revision ID: 20260521_0035
Revises: 20260519_0034
Create Date: 2026-05-21
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260521_0035"
down_revision = "20260519_0034"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cms_pages",
        sa.Column("is_featured", sa.Boolean, nullable=False, server_default="false"),
    )
    op.create_index("ix_cms_pages_is_featured", "cms_pages", ["is_featured"])


def downgrade() -> None:
    op.drop_index("ix_cms_pages_is_featured", "cms_pages")
    op.drop_column("cms_pages", "is_featured")
