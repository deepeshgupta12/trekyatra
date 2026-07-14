"""trek_comparisons pair table (clean comparison URLs, no CMS pages)

Revision ID: 20260714_0054
Revises: 20260702_0053
Create Date: 2026-07-14
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260714_0054"
down_revision = "20260702_0053"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "trek_comparisons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pair_slug", sa.String(511), nullable=False),
        sa.Column("slug_a", sa.String(255), nullable=False),
        sa.Column("slug_b", sa.String(255), nullable=False),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_unique_constraint("uq_trek_comparisons_pair_slug", "trek_comparisons", ["pair_slug"])
    op.create_index("ix_trek_comparisons_pair_slug", "trek_comparisons", ["pair_slug"])
    op.create_index("ix_trek_comparisons_slug_a", "trek_comparisons", ["slug_a"])
    op.create_index("ix_trek_comparisons_slug_b", "trek_comparisons", ["slug_b"])
    op.create_index("ix_trek_comparisons_state", "trek_comparisons", ["state"])


def downgrade() -> None:
    op.drop_index("ix_trek_comparisons_state", table_name="trek_comparisons")
    op.drop_index("ix_trek_comparisons_slug_b", table_name="trek_comparisons")
    op.drop_index("ix_trek_comparisons_slug_a", table_name="trek_comparisons")
    op.drop_index("ix_trek_comparisons_pair_slug", table_name="trek_comparisons")
    op.drop_constraint("uq_trek_comparisons_pair_slug", "trek_comparisons", type_="unique")
    op.drop_table("trek_comparisons")
