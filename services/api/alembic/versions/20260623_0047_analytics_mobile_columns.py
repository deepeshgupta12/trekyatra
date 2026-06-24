"""analytics_mobile_columns — platform + app_version on events and sessions

Revision ID: 20260623_0047
Revises: 20260623_0046
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa

revision = "20260623_0047"
down_revision = "20260623_0046"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "analytics_events",
        sa.Column("platform", sa.String(16), nullable=True, server_default="web"),
    )
    op.add_column(
        "analytics_events",
        sa.Column("app_version", sa.String(16), nullable=True),
    )
    op.add_column(
        "analytics_sessions",
        sa.Column("platform", sa.String(16), nullable=True, server_default="web"),
    )
    op.add_column(
        "analytics_sessions",
        sa.Column("app_version", sa.String(16), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("analytics_sessions", "app_version")
    op.drop_column("analytics_sessions", "platform")
    op.drop_column("analytics_events", "app_version")
    op.drop_column("analytics_events", "platform")
