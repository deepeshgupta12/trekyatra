"""buddy matching: buddy_signals, buddy_requests, buddy_chat_messages + user_profiles bio/avatar

Revision ID: 0050
Revises: 0049
Create Date: 2026-06-25
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260625_0050"
down_revision = "20260624_0049"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Extend user_profiles with public bio + avatar ───────────────────────
    op.add_column("user_profiles", sa.Column("bio", sa.String(500), nullable=True))
    op.add_column("user_profiles", sa.Column("avatar_url", sa.Text(), nullable=True))

    # ── buddy_signals ────────────────────────────────────────────────────────
    op.create_table(
        "buddy_signals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trek_slug", sa.String(200), nullable=False),
        sa.Column("month_year", sa.String(7), nullable=False),
        sa.Column("group_size", sa.SmallInteger(), server_default="1"),
        sa.Column("experience", sa.String(32), nullable=True),
        sa.Column("notes", sa.String(500), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("expires_at", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "trek_slug", "month_year", name="uq_buddy_signal_user_trek_month"),
    )
    op.create_index("ix_buddy_signals_trek_slug", "buddy_signals", ["trek_slug"])
    op.create_index("ix_buddy_signals_active", "buddy_signals", ["active", "expires_at"])
    op.create_index("ix_buddy_signals_month_year", "buddy_signals", ["month_year"])

    # ── buddy_requests ───────────────────────────────────────────────────────
    op.create_table(
        "buddy_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("receiver_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("signal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("buddy_signals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.String(500), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("sender_id", "signal_id", name="uq_buddy_request_sender_signal"),
    )
    op.create_index("ix_buddy_requests_receiver", "buddy_requests", ["receiver_id", "status"])
    op.create_index("ix_buddy_requests_sender", "buddy_requests", ["sender_id"])

    # ── buddy_chat_messages ──────────────────────────────────────────────────
    op.create_table(
        "buddy_chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("buddy_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_buddy_chat_request_id", "buddy_chat_messages", ["request_id", "created_at"])
    op.create_index("ix_buddy_chat_sender", "buddy_chat_messages", ["sender_id"])


def downgrade() -> None:
    op.drop_table("buddy_chat_messages")
    op.drop_table("buddy_requests")
    op.drop_table("buddy_signals")
    op.drop_column("user_profiles", "avatar_url")
    op.drop_column("user_profiles", "bio")
