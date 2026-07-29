"""user_preferences — explicit onboarding preferences (v1.1 personalization)

Keyed by user_id (logged-in, cross-synced with web) OR anonymous_id (logged-out;
persists across uninstall via SecureStore/Keychain). device_id captured for reference.

Revision ID: 20260729_0057
Revises: 20260728_0056
Create Date: 2026-07-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "20260729_0057"
down_revision = "20260728_0056"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_preferences",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("anonymous_id", sa.String(length=64), nullable=True),
        sa.Column("device_id", sa.String(length=64), nullable=True),
        sa.Column("experience", sa.String(length=32), nullable=True),
        sa.Column("difficulties", JSONB, nullable=True),
        sa.Column("regions", JSONB, nullable=True),
        sa.Column("vibes", JSONB, nullable=True),
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    # Postgres treats NULLs as distinct → one row per non-null key, many null keys allowed.
    op.create_unique_constraint("uq_user_preferences_user_id", "user_preferences", ["user_id"])
    op.create_unique_constraint("uq_user_preferences_anonymous_id", "user_preferences", ["anonymous_id"])
    op.create_index("ix_user_preferences_anonymous_id", "user_preferences", ["anonymous_id"])


def downgrade() -> None:
    op.drop_index("ix_user_preferences_anonymous_id", table_name="user_preferences")
    op.drop_constraint("uq_user_preferences_anonymous_id", "user_preferences", type_="unique")
    op.drop_constraint("uq_user_preferences_user_id", "user_preferences", type_="unique")
    op.drop_table("user_preferences")
