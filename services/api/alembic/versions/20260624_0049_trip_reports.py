"""trip_reports and trek_media tables

Revision ID: 20260624_0049
Revises: 20260623_0048
Create Date: 2026-06-24
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260624_0049"
down_revision = "20260623_0048"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "trip_reports",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("trek_slug", sa.String(200), nullable=False),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("condition", sa.String(32), nullable=False, server_default="unknown"),
        sa.Column("trek_date", sa.Date, nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("moderated_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_reports_trek_slug", "trip_reports", ["trek_slug"])
    op.create_index("idx_reports_status", "trip_reports", ["status"])
    op.create_index("idx_reports_created_at", "trip_reports", ["created_at"])

    op.create_table(
        "trek_media",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("report_id", UUID(as_uuid=True), sa.ForeignKey("trip_reports.id", ondelete="CASCADE"), nullable=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("trek_slug", sa.String(200), nullable=False),
        sa.Column("url", sa.Text, nullable=False),
        sa.Column("s3_key", sa.Text, nullable=False),
        sa.Column("width", sa.Integer, nullable=True),
        sa.Column("height", sa.Integer, nullable=True),
        sa.Column("file_size", sa.Integer, nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_media_report_id", "trek_media", ["report_id"])
    op.create_index("idx_media_trek_slug", "trek_media", ["trek_slug"])


def downgrade() -> None:
    op.drop_index("idx_media_trek_slug", table_name="trek_media")
    op.drop_index("idx_media_report_id", table_name="trek_media")
    op.drop_table("trek_media")

    op.drop_index("idx_reports_created_at", table_name="trip_reports")
    op.drop_index("idx_reports_status", table_name="trip_reports")
    op.drop_index("idx_reports_trek_slug", table_name="trip_reports")
    op.drop_table("trip_reports")
