"""Step 29 — operators table, operator_specializations, lead routing columns.

Revision ID: 20260430_0019
Revises: 20260430_0018
Create Date: 2026-04-30
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260430_0019"
down_revision = "20260430_0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "operators",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False, unique=True),
        sa.Column("region", sa.JSON, nullable=True),
        sa.Column("trek_types", sa.JSON, nullable=True),
        sa.Column("contact_email", sa.String(254), nullable=False),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("website_url", sa.String(512), nullable=True),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_operators_slug", "operators", ["slug"])
    op.create_index("ix_operators_active", "operators", ["active"])

    op.create_table(
        "operator_specializations",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "operator_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("operators.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("trek_slug", sa.String(200), nullable=False),
        sa.Column("priority", sa.Integer, nullable=False, server_default=sa.text("3")),
    )
    op.create_index("ix_op_spec_operator_id", "operator_specializations", ["operator_id"])
    op.create_index("ix_op_spec_trek_slug", "operator_specializations", ["trek_slug"])

    # Add lead routing columns to lead_submissions
    op.add_column(
        "lead_submissions",
        sa.Column(
            "assigned_operator_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("operators.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "lead_submissions",
        sa.Column("status_history", sa.JSON, nullable=True),
    )
    op.create_index(
        "ix_lead_submissions_assigned_operator_id",
        "lead_submissions",
        ["assigned_operator_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_lead_submissions_assigned_operator_id", "lead_submissions")
    op.drop_column("lead_submissions", "status_history")
    op.drop_column("lead_submissions", "assigned_operator_id")
    op.drop_table("operator_specializations")
    op.drop_table("operators")
