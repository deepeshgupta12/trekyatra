"""Add trek metadata columns to cms_pages for trek_guide pages

Revision ID: 20260519_0034
Revises: 20260519_0033
Create Date: 2026-05-19
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260519_0034"
down_revision = "20260519_0033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("cms_pages", sa.Column("trek_state", sa.String(100), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_name", sa.String(255), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_difficulty", sa.String(50), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_duration", sa.String(100), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_season", sa.String(200), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_suitability", sa.String(100), nullable=True))
    op.create_index("ix_cms_pages_trek_state", "cms_pages", ["trek_state"])
    op.create_index("ix_cms_pages_trek_difficulty", "cms_pages", ["trek_difficulty"])


def downgrade() -> None:
    op.drop_index("ix_cms_pages_trek_difficulty", "cms_pages")
    op.drop_index("ix_cms_pages_trek_state", "cms_pages")
    op.drop_column("cms_pages", "trek_suitability")
    op.drop_column("cms_pages", "trek_season")
    op.drop_column("cms_pages", "trek_duration")
    op.drop_column("cms_pages", "trek_difficulty")
    op.drop_column("cms_pages", "trek_name")
    op.drop_column("cms_pages", "trek_state")
