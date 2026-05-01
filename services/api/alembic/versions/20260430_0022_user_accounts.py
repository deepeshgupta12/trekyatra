"""user bookmarks, downloads, trek alerts, and profiles

Revision ID: 20260430_0022
Revises: 20260430_0021
Create Date: 2026-04-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

revision = "20260430_0022"
down_revision = "20260430_0021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_bookmarks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cms_page_id", UUID(as_uuid=True), sa.ForeignKey("cms_pages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "cms_page_id", name="uq_user_bookmark"),
    )
    op.create_index("ix_user_bookmarks_user_id", "user_bookmarks", ["user_id"])

    op.create_table(
        "user_downloads",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.String(200), nullable=True),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("downloaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_user_downloads_user_id", "user_downloads", ["user_id"])

    op.create_table(
        "trek_alerts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trek_slug", sa.String(300), nullable=False),
        sa.Column("alert_type", sa.String(50), nullable=False, server_default="any"),
        sa.Column("active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "trek_slug", "alert_type", name="uq_trek_alert"),
    )
    op.create_index("ix_trek_alerts_user_id", "trek_alerts", ["user_id"])

    op.create_table(
        "user_profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("fitness_level", sa.String(50), nullable=True),
        sa.Column("trek_experience", sa.String(50), nullable=True),
        sa.Column("preferred_regions", JSON, nullable=True),
        sa.Column("budget_range", sa.String(50), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("user_profiles")
    op.drop_index("ix_trek_alerts_user_id", "trek_alerts")
    op.drop_table("trek_alerts")
    op.drop_index("ix_user_downloads_user_id", "user_downloads")
    op.drop_table("user_downloads")
    op.drop_index("ix_user_bookmarks_user_id", "user_bookmarks")
    op.drop_table("user_bookmarks")
