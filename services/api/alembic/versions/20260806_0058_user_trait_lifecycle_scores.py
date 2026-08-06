"""user_trait lifecycle + scoring — derived profile fields (P1 CDP depth)

Adds derived, computed columns to user_traits so segments/dashboards can act on
lifecycle stage and intent instead of only raw counters:
  - lifecycle_stage  : new | active | dormant | churned  (recency + session based)
  - engagement_score : 0–100 breadth/frequency/recency composite
  - lead_score       : 0–100 purchase/plan intent composite
  - traits_computed_at: when the three derived fields were last recomputed

All nullable/defaulted — additive, no backfill required (computed lazily by
refresh_user_traits + the admin recompute endpoint).

Revision ID: 20260806_0058
Revises: 20260729_0057
Create Date: 2026-08-06
"""
from alembic import op
import sqlalchemy as sa

revision = "20260806_0058"
down_revision = "20260729_0057"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_traits", sa.Column("lifecycle_stage", sa.String(length=16), nullable=True))
    op.add_column("user_traits", sa.Column("engagement_score", sa.Integer(), nullable=True))
    op.add_column("user_traits", sa.Column("lead_score", sa.Integer(), nullable=True))
    op.add_column("user_traits", sa.Column("traits_computed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_user_traits_lifecycle_stage", "user_traits", ["lifecycle_stage"])


def downgrade() -> None:
    op.drop_index("ix_user_traits_lifecycle_stage", table_name="user_traits")
    op.drop_column("user_traits", "traits_computed_at")
    op.drop_column("user_traits", "lead_score")
    op.drop_column("user_traits", "engagement_score")
    op.drop_column("user_traits", "lifecycle_stage")
