"""mobile_push_log table for M14 push notifications

Revision ID: 20260623_0046
Revises: 20260623_0045
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa

revision = "20260623_0046"
down_revision = "20260623_0045"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mobile_push_log",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("device_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("data", sa.JSON(), nullable=True),
        sa.Column("category", sa.String(64), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("status", sa.String(32), server_default="sent", nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["device_id"], ["mobile_devices.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_push_log_device_id", "mobile_push_log", ["device_id"])
    op.create_index("idx_push_log_sent_at", "mobile_push_log", ["sent_at"], postgresql_ops={"sent_at": "DESC"})
    op.create_index("idx_push_log_category", "mobile_push_log", ["category"])


def downgrade() -> None:
    op.drop_index("idx_push_log_category", "mobile_push_log")
    op.drop_index("idx_push_log_sent_at", "mobile_push_log")
    op.drop_index("idx_push_log_device_id", "mobile_push_log")
    op.drop_table("mobile_push_log")
