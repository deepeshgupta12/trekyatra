"""trek_conditions table + trek_base_lat/lng on cms_pages

Revision ID: 20260626_0051
Revises: 20260625_0050
Create Date: 2026-06-26
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260626_0051"
down_revision = "20260625_0050"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add trek base coordinates to cms_pages
    op.add_column("cms_pages", sa.Column("trek_base_lat", sa.Float(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_base_lng", sa.Float(), nullable=True))

    # Create trek_conditions cache table
    op.create_table(
        "trek_conditions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("weather_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("trail_status", sa.String(30), nullable=False, server_default="open"),
        sa.Column("permit_status", sa.String(30), nullable=False, server_default="not_required"),
        sa.Column("permit_notes", sa.Text(), nullable=True),
        sa.Column("condition_summary", sa.Text(), nullable=True),
        sa.Column(
            "weather_updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "trail_updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "last_updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_trek_conditions_slug",
        "trek_conditions",
        ["slug"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_trek_conditions_slug", table_name="trek_conditions")
    op.drop_table("trek_conditions")
    op.drop_column("cms_pages", "trek_base_lng")
    op.drop_column("cms_pages", "trek_base_lat")
