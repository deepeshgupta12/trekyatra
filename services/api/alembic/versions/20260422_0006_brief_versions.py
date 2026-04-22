"""brief_versions table and content_briefs new columns

Revision ID: 20260422_0006
Revises: 20260422_0005
Create Date: 2026-04-22 13:00:00
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260422_0006"
down_revision = "20260422_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("content_briefs", sa.Column("structured_brief", sa.JSON(), nullable=True))
    op.add_column("content_briefs", sa.Column("word_count_target", sa.Integer(), nullable=True))

    op.create_table(
        "brief_versions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("brief_id", sa.Uuid(), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("structured_brief", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["brief_id"], ["content_briefs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_brief_versions"),
    )
    op.create_index("ix_brief_versions_brief_id", "brief_versions", ["brief_id"])


def downgrade() -> None:
    op.drop_index("ix_brief_versions_brief_id", table_name="brief_versions")
    op.drop_table("brief_versions")
    op.drop_column("content_briefs", "word_count_target")
    op.drop_column("content_briefs", "structured_brief")
