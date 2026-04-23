"""add hero_image_url to cms_pages

Revision ID: 20260423_0010
Revises: 20260423_0009
Create Date: 2026-04-23
"""
from alembic import op
import sqlalchemy as sa

revision = "20260423_0010"
down_revision = "20260423_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("cms_pages", sa.Column("hero_image_url", sa.String(512), nullable=True))


def downgrade() -> None:
    op.drop_column("cms_pages", "hero_image_url")
