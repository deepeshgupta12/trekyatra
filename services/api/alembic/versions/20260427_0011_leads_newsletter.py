"""leads and newsletter subscriber tables

Revision ID: 20260427_0011
Revises: 20260423_0010
Create Date: 2026-04-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260427_0011"
down_revision = "20260423_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lead_submissions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("trek_interest", sa.String(200), nullable=False),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("source_page", sa.String(500), nullable=False),
        sa.Column("source_cluster", sa.String(200), nullable=True),
        sa.Column("cta_type", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_lead_submissions_email", "lead_submissions", ["email"])

    op.create_table(
        "newsletter_subscribers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True),
        sa.Column("name", sa.String(200), nullable=True),
        sa.Column("source_page", sa.String(500), nullable=False),
        sa.Column("lead_magnet", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_newsletter_subscribers_email", "newsletter_subscribers", ["email"])


def downgrade() -> None:
    op.drop_index("ix_newsletter_subscribers_email", "newsletter_subscribers")
    op.drop_table("newsletter_subscribers")
    op.drop_index("ix_lead_submissions_email", "lead_submissions")
    op.drop_table("lead_submissions")
