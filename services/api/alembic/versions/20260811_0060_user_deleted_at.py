"""users.deleted_at — soft-delete marker for in-app account deletion (Apple 5.1.1)

Account deletion anonymises PII + sets is_active=False (which auth already blocks) and stamps
deleted_at so a user-deleted account is distinguishable from an admin-deactivated one. Additive,
nullable — no backfill.

Revision ID: 20260811_0060
Revises: 20260806_0059
Create Date: 2026-08-11
"""
from alembic import op
import sqlalchemy as sa

revision = "20260811_0060"
down_revision = "20260806_0059"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "deleted_at")
