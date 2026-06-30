"""Add route_image_url to cms_pages

Revision ID: 20260630_0052
Revises: 20260626_0051
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa

revision = "20260630_0052"
down_revision = "20260626_0051"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cms_pages",
        sa.Column("route_image_url", sa.String(512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("cms_pages", "route_image_url")
