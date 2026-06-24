"""user_trek_history — trek check-in and history table

Revision ID: 20260623_0048
Revises: 20260623_0047
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "20260623_0048"
down_revision = "20260623_0047"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_trek_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trek_slug", sa.String(256), nullable=False),
        sa.Column("trek_title", sa.String(512), nullable=True),
        sa.Column("completion_date", sa.Date(), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=True),  # 1–5
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("trek_state", sa.String(128), nullable=True),
        sa.Column("max_altitude_ft", sa.Integer(), nullable=True),
        sa.Column("extra", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_user_trek_history_user_id", "user_trek_history", ["user_id"])
    op.create_index("idx_user_trek_history_trek_slug", "user_trek_history", ["trek_slug"])
    op.create_index("idx_user_trek_history_date", "user_trek_history", ["completion_date"])


def downgrade() -> None:
    op.drop_index("idx_user_trek_history_date", table_name="user_trek_history")
    op.drop_index("idx_user_trek_history_trek_slug", table_name="user_trek_history")
    op.drop_index("idx_user_trek_history_user_id", table_name="user_trek_history")
    op.drop_table("user_trek_history")
