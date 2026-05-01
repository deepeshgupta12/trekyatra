"""revenue attributions, config, and executive summaries

Revision ID: 20260430_0021
Revises: 20260430_0020
Create Date: 2026-04-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260430_0021"
down_revision = "20260430_0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "revenue_config",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("value_float", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    op.create_table(
        "revenue_attributions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("page_id", UUID(as_uuid=True), sa.ForeignKey("pages.id", ondelete="CASCADE"), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("affiliate_clicks", sa.Integer(), server_default="0", nullable=False),
        sa.Column("lead_conversions", sa.Integer(), server_default="0", nullable=False),
        sa.Column("estimated_revenue_inr", sa.Float(), server_default="0", nullable=False),
        sa.Column("page_type", sa.String(50), nullable=True),
        sa.Column("cluster_id", UUID(as_uuid=True), sa.ForeignKey("keyword_clusters.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_revenue_attributions_date", "revenue_attributions", ["date"])
    op.create_index("ix_revenue_attributions_page_type", "revenue_attributions", ["page_type"])
    op.create_unique_constraint("uq_revenue_attribution_page_date", "revenue_attributions", ["page_id", "date"])

    op.create_table(
        "executive_summaries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("week_label", sa.String(20), nullable=False, unique=True),
        sa.Column("content_md", sa.Text(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("executive_summaries")
    op.drop_constraint("uq_revenue_attribution_page_date", "revenue_attributions", type_="unique")
    op.drop_index("ix_revenue_attributions_page_type", "revenue_attributions")
    op.drop_index("ix_revenue_attributions_date", "revenue_attributions")
    op.drop_table("revenue_attributions")
    op.drop_table("revenue_config")
