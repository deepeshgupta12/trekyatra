"""app_version_config — server-controlled mobile version gate / kill-switch

Revision ID: 20260728_0056
Revises: 20260728_0055
Create Date: 2026-07-28
"""
from alembic import op
import sqlalchemy as sa

revision = "20260728_0056"
down_revision = "20260728_0055"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "app_version_config",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("platform", sa.String(length=16), nullable=False),
        sa.Column("min_supported_version", sa.String(length=32), nullable=False, server_default="1.0.0"),
        sa.Column("latest_version", sa.String(length=32), nullable=False, server_default="1.0.0"),
        sa.Column("force_update_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("update_message", sa.Text(), nullable=True),
        sa.Column("store_url", sa.String(length=512), nullable=True),
        sa.Column("maintenance_mode", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("maintenance_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_unique_constraint("uq_app_version_config_platform", "app_version_config", ["platform"])
    op.create_index("ix_app_version_config_platform", "app_version_config", ["platform"])

    # Seed the iOS row (bundle in.co.trekyatra.app, ASC id 6795408094) with a permissive
    # default: min == latest == 1.0.0 so nothing is gated until an admin raises the bar.
    op.execute(
        """
        INSERT INTO app_version_config
            (id, platform, min_supported_version, latest_version, force_update_enabled,
             store_url, maintenance_mode, created_at, updated_at)
        VALUES
            (gen_random_uuid(), 'ios', '1.0.0', '1.0.0', true,
             'https://apps.apple.com/app/id6795408094', false, now(), now())
        """
    )


def downgrade() -> None:
    op.drop_index("ix_app_version_config_platform", table_name="app_version_config")
    op.drop_constraint("uq_app_version_config_platform", "app_version_config", type_="unique")
    op.drop_table("app_version_config")
