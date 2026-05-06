"""trip_plans: trip plan storage for the trip planning assistant

Revision ID: 20260506_0029
Revises: 20260506_0028
Create Date: 2026-05-06
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260506_0029"
down_revision = "20260506_0028"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "trip_plans",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("session_id", sa.String(128), nullable=False, index=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("inputs", sa.JSON(), nullable=False),
        sa.Column("output", sa.JSON(), nullable=True),
        sa.Column("trek_slug", sa.String(255), nullable=True),
        sa.Column("fallback_used", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("trip_plans")
