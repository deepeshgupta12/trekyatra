"""step73 treksage chat sessions and messages

Revision ID: 20260616_0044
Revises: 20260615_0043
Create Date: 2026-06-16
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260616_0044"
down_revision = "20260615_0043"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "treksage_chat_sessions",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("session_key", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_active_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_treksage_chat_sessions_session_key", "treksage_chat_sessions", ["session_key"])
    op.create_index("ix_treksage_chat_sessions_user_id", "treksage_chat_sessions", ["user_id"])

    op.create_table(
        "treksage_chat_messages",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("treksage_chat_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("tool_calls_json", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_treksage_chat_messages_session_id", "treksage_chat_messages", ["session_id"])


def downgrade() -> None:
    op.drop_table("treksage_chat_messages")
    op.drop_table("treksage_chat_sessions")
