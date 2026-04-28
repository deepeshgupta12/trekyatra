"""Add evidence_url and ymyl_flag to draft_claims

Revision ID: 20260428_0015
Revises: 20260428_0014
Create Date: 2026-04-28
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260428_0015"
down_revision = "20260428_0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "draft_claims",
        sa.Column("evidence_url", sa.Text(), nullable=True),
    )
    op.add_column(
        "draft_claims",
        sa.Column("ymyl_flag", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("draft_claims", "ymyl_flag")
    op.drop_column("draft_claims", "evidence_url")
