"""subscriptions: add subscription_plan to users, create subscriptions, add is_premium to cms_pages

Revision ID: 20260506_0030
Revises: 20260506_0029
Create Date: 2026-05-06
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260506_0030"
down_revision = "20260506_0029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add subscription_plan to users for fast read (no join needed)
    op.add_column(
        "users",
        sa.Column("subscription_plan", sa.String(20), nullable=False, server_default="free"),
    )

    # Subscriptions table
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column("stripe_customer_id", sa.String(128), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(128), nullable=True, unique=True),
        sa.Column("plan", sa.String(20), nullable=False, server_default="free"),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_subscriptions_stripe_customer_id", "subscriptions", ["stripe_customer_id"])
    op.create_index("ix_subscriptions_stripe_subscription_id", "subscriptions", ["stripe_subscription_id"])

    # Add is_premium to cms_pages
    op.add_column(
        "cms_pages",
        sa.Column("is_premium", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("cms_pages", "is_premium")
    op.drop_index("ix_subscriptions_stripe_subscription_id", table_name="subscriptions")
    op.drop_index("ix_subscriptions_stripe_customer_id", table_name="subscriptions")
    op.drop_table("subscriptions")
    op.drop_column("users", "subscription_plan")
