"""mobile_devices table, cms_pages.deleted_at, cms performance index

Revision ID: 20260608_0042
Revises: 20260529_0041
Create Date: 2026-06-08
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260608_0042"
down_revision = "20260529_0041"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. mobile_devices table
    op.create_table(
        "mobile_devices",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("device_id", sa.String(128), unique=True, nullable=False),
        sa.Column("fcm_token", sa.Text(), nullable=True),
        sa.Column("apns_token", sa.Text(), nullable=True),
        sa.Column("platform", sa.String(16), nullable=False),
        sa.Column("app_version", sa.String(32), nullable=True),
        sa.Column("os_version", sa.String(32), nullable=True),
        sa.Column("refresh_token_hash", sa.String(255), unique=True, nullable=True),
        sa.Column("last_seen", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_mobile_devices_user_id", "mobile_devices", ["user_id"])
    op.create_index("ix_mobile_devices_device_id", "mobile_devices", ["device_id"])
    op.create_index(
        "ix_mobile_devices_fcm_token",
        "mobile_devices",
        ["fcm_token"],
        postgresql_where=sa.text("fcm_token IS NOT NULL"),
    )

    # 2. Add deleted_at to cms_pages for tombstone / sync delta tracking
    op.add_column("cms_pages", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_cms_pages_deleted_at", "cms_pages", ["deleted_at"])

    # 3. Partial index on cms_pages(updated_at) for fast incremental sync
    op.create_index(
        "ix_cms_pages_updated_at_published",
        "cms_pages",
        ["updated_at"],
        postgresql_where=sa.text("status = 'published'"),
    )


def downgrade() -> None:
    op.drop_index("ix_cms_pages_updated_at_published", "cms_pages")
    op.drop_index("ix_cms_pages_deleted_at", "cms_pages")
    op.drop_column("cms_pages", "deleted_at")
    op.drop_index("ix_mobile_devices_fcm_token", "mobile_devices")
    op.drop_index("ix_mobile_devices_device_id", "mobile_devices")
    op.drop_index("ix_mobile_devices_user_id", "mobile_devices")
    op.drop_table("mobile_devices")
