"""Step 28 — compliance fields on content_drafts + compliance_rules table.

Revision ID: 20260430_0018
Revises: 20260429_0017
Create Date: 2026-04-30
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260430_0018"
down_revision = "20260429_0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add compliance fields to content_drafts
    op.add_column(
        "content_drafts",
        sa.Column(
            "compliance_status",
            sa.String(32),
            nullable=False,
            server_default="unchecked",
        ),
    )
    op.add_column(
        "content_drafts",
        sa.Column("compliance_notes", sa.JSON, nullable=True),
    )
    op.add_column(
        "content_drafts",
        sa.Column("compliance_override_note", sa.Text, nullable=True),
    )
    op.add_column(
        "content_drafts",
        sa.Column("compliance_overridden_by", sa.String(255), nullable=True),
    )
    op.add_column(
        "content_drafts",
        sa.Column(
            "compliance_overridden_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_content_drafts_compliance_status",
        "content_drafts",
        ["compliance_status"],
    )

    # Create compliance_rules table
    op.create_table(
        "compliance_rules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("rule_type", sa.String(64), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("rule_config", sa.JSON, nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean,
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(
        "ix_compliance_rules_rule_type", "compliance_rules", ["rule_type"]
    )
    op.create_index(
        "ix_compliance_rules_is_active", "compliance_rules", ["is_active"]
    )


def downgrade() -> None:
    op.drop_index("ix_compliance_rules_is_active", table_name="compliance_rules")
    op.drop_index("ix_compliance_rules_rule_type", table_name="compliance_rules")
    op.drop_table("compliance_rules")

    op.drop_index(
        "ix_content_drafts_compliance_status", table_name="content_drafts"
    )
    op.drop_column("content_drafts", "compliance_overridden_at")
    op.drop_column("content_drafts", "compliance_overridden_by")
    op.drop_column("content_drafts", "compliance_override_note")
    op.drop_column("content_drafts", "compliance_notes")
    op.drop_column("content_drafts", "compliance_status")
