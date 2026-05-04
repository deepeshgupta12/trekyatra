"""pgvector embeddings column on cms_pages

Revision ID: 20260504_0025
Revises: 20260501_0024
Create Date: 2026-05-04
"""
from __future__ import annotations

from alembic import op

revision = "20260504_0025"
down_revision = "20260501_0024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS embedding vector(1536)")


def downgrade() -> None:
    op.execute("ALTER TABLE cms_pages DROP COLUMN IF EXISTS embedding")
