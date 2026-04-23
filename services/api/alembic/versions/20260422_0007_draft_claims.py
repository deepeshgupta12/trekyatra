"""draft_claims table and optimized_content on content_drafts

Revision ID: 20260422_0007
Revises: 20260422_0006
Create Date: 2026-04-23 10:00:00
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260422_0007"
down_revision = "20260422_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("content_drafts", sa.Column("optimized_content", sa.Text(), nullable=True))

    op.create_table(
        "draft_claims",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("draft_id", sa.Uuid(), nullable=False),
        sa.Column("claim_text", sa.Text(), nullable=False),
        sa.Column("claim_type", sa.String(64), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("flagged_for_review", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["draft_id"], ["content_drafts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_draft_claims"),
    )
    op.create_index("ix_draft_claims_draft_id", "draft_claims", ["draft_id"])
    op.create_index("ix_draft_claims_flagged", "draft_claims", ["flagged_for_review"])


def downgrade() -> None:
    op.drop_index("ix_draft_claims_flagged", table_name="draft_claims")
    op.drop_index("ix_draft_claims_draft_id", table_name="draft_claims")
    op.drop_table("draft_claims")
    op.drop_column("content_drafts", "optimized_content")
