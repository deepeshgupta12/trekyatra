"""Step 72: trek intelligence structured data, AI logs, Q&A cache, lead details

Revision ID: 20260615_0043
Revises: 20260608_0042
Create Date: 2026-06-15
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260615_0043"
down_revision = "20260608_0042"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. New structured trek fields on cms_pages (trek_guide pages)
    op.add_column("cms_pages", sa.Column("trek_region", sa.String(100), nullable=True))
    op.create_index("ix_cms_pages_trek_region", "cms_pages", ["trek_region"])
    op.add_column("cms_pages", sa.Column("trek_max_altitude_ft", sa.Integer(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_duration_days_min", sa.Integer(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_duration_days_max", sa.Integer(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_best_months", sa.JSON(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_open_months", sa.JSON(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_avoid_months", sa.JSON(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_permit_required", sa.Boolean(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_permit_notes", sa.Text(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_budget_min", sa.Integer(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_budget_max", sa.Integer(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_themes", sa.JSON(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_crowd_level", sa.String(50), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_beginner_friendly", sa.Boolean(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_solo_friendly", sa.Boolean(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_family_friendly", sa.Boolean(), nullable=True))
    op.add_column(
        "cms_pages",
        sa.Column("trek_operator_available", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "cms_pages",
        sa.Column("trek_is_unsafe_closed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("cms_pages", sa.Column("trek_data_confidence", sa.JSON(), nullable=True))
    op.add_column("cms_pages", sa.Column("trek_last_verified_at", sa.DateTime(timezone=True), nullable=True))

    # 2. ai_interaction_logs table
    op.create_table(
        "ai_interaction_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source", sa.String(20), nullable=False),
        sa.Column("tool_name", sa.String(100), nullable=False),
        sa.Column("query_summary", sa.Text(), nullable=True),
        sa.Column("result_summary", sa.Text(), nullable=True),
        sa.Column("page_url", sa.String(500), nullable=True),
        sa.Column("session_id", sa.String(128), nullable=True),
        sa.Column("trek_slugs", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ai_interaction_logs_source", "ai_interaction_logs", ["source"])
    op.create_index("ix_ai_interaction_logs_tool_name", "ai_interaction_logs", ["tool_name"])
    op.create_index("ix_ai_interaction_logs_created_at", "ai_interaction_logs", ["created_at"])

    # 3. trek_qa_cache table
    op.create_table(
        "trek_qa_cache",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("cache_key", sa.String(128), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column("model", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_trek_qa_cache_cache_key", "trek_qa_cache", ["cache_key"], unique=True)

    # 4. lead_submissions.details_json
    op.add_column("lead_submissions", sa.Column("details_json", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("lead_submissions", "details_json")

    op.drop_index("ix_trek_qa_cache_cache_key", "trek_qa_cache")
    op.drop_table("trek_qa_cache")

    op.drop_index("ix_ai_interaction_logs_created_at", "ai_interaction_logs")
    op.drop_index("ix_ai_interaction_logs_tool_name", "ai_interaction_logs")
    op.drop_index("ix_ai_interaction_logs_source", "ai_interaction_logs")
    op.drop_table("ai_interaction_logs")

    op.drop_column("cms_pages", "trek_last_verified_at")
    op.drop_column("cms_pages", "trek_data_confidence")
    op.drop_column("cms_pages", "trek_is_unsafe_closed")
    op.drop_column("cms_pages", "trek_operator_available")
    op.drop_column("cms_pages", "trek_family_friendly")
    op.drop_column("cms_pages", "trek_solo_friendly")
    op.drop_column("cms_pages", "trek_beginner_friendly")
    op.drop_column("cms_pages", "trek_crowd_level")
    op.drop_column("cms_pages", "trek_themes")
    op.drop_column("cms_pages", "trek_budget_max")
    op.drop_column("cms_pages", "trek_budget_min")
    op.drop_column("cms_pages", "trek_permit_notes")
    op.drop_column("cms_pages", "trek_permit_required")
    op.drop_column("cms_pages", "trek_avoid_months")
    op.drop_column("cms_pages", "trek_open_months")
    op.drop_column("cms_pages", "trek_best_months")
    op.drop_column("cms_pages", "trek_duration_days_max")
    op.drop_column("cms_pages", "trek_duration_days_min")
    op.drop_column("cms_pages", "trek_max_altitude_ft")
    op.drop_index("ix_cms_pages_trek_region", "cms_pages")
    op.drop_column("cms_pages", "trek_region")
