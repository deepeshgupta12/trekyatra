"""CDP: gsc_performance table — Google Search Console daily metrics

Revision ID: 20260527_0040
Revises: 20260527_0039
Create Date: 2026-05-27
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260527_0040"
down_revision = "20260527_0039"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gsc_performance",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("date", sa.Date(), nullable=False, index=True),
        sa.Column("page_url", sa.Text(), nullable=False),
        sa.Column("query", sa.Text(), nullable=False),
        sa.Column("country", sa.String(8), nullable=True),
        sa.Column("device", sa.String(16), nullable=True),
        sa.Column("clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("impressions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ctr", sa.Float(), nullable=True),
        sa.Column("position", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("date", "page_url", "query", "country", "device", name="uq_gsc_perf"),
    )
    op.create_index("ix_gsc_performance_page_url", "gsc_performance", ["page_url"])
    op.create_index("ix_gsc_performance_query", "gsc_performance", ["query"])


def downgrade() -> None:
    op.drop_table("gsc_performance")
