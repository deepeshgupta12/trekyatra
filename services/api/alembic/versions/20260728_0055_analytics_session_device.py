"""add device_model + os_version to analytics_sessions (mobile session lifecycle)

Revision ID: 20260728_0055
Revises: 20260714_0054
Create Date: 2026-07-28
"""
from alembic import op
import sqlalchemy as sa

revision = "20260728_0055"
down_revision = "20260714_0054"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("analytics_sessions", sa.Column("device_model", sa.String(length=64), nullable=True))
    op.add_column("analytics_sessions", sa.Column("os_version", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("analytics_sessions", "os_version")
    op.drop_column("analytics_sessions", "device_model")
