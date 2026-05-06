"""operator_marketplace: extend operators + add operator_reviews and operator_agreements

Revision ID: 20260506_0028
Revises: 20260506_0027
Create Date: 2026-05-06
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260506_0028"
down_revision = "20260506_0027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Extend operators table with marketplace fields
    op.add_column("operators", sa.Column("logo_url", sa.String(512), nullable=True))
    op.add_column("operators", sa.Column("description_long", sa.Text(), nullable=True))
    op.add_column("operators", sa.Column("rating_avg", sa.Float(), nullable=True, server_default="0.0"))
    op.add_column("operators", sa.Column("review_count", sa.Integer(), nullable=True, server_default="0"))

    # Operator reviews
    op.create_table(
        "operator_reviews",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("operator_id", sa.Uuid(), sa.ForeignKey("operators.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("operator_id", "user_id", name="uq_operator_reviews_operator_user"),
    )
    op.create_index("ix_operator_reviews_operator_id", "operator_reviews", ["operator_id"])

    # Operator agreements (lead fee / revenue share tracking)
    op.create_table(
        "operator_agreements",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("operator_id", sa.Uuid(), sa.ForeignKey("operators.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lead_fee_inr", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("revenue_share_pct", sa.Float(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("operator_id", name="uq_operator_agreements_operator"),
    )


def downgrade() -> None:
    op.drop_table("operator_agreements")
    op.drop_index("ix_operator_reviews_operator_id", table_name="operator_reviews")
    op.drop_table("operator_reviews")
    op.drop_column("operators", "review_count")
    op.drop_column("operators", "rating_avg")
    op.drop_column("operators", "description_long")
    op.drop_column("operators", "logo_url")
