"""CDP Phase 0: event_definitions, is_internal flag, custom_segments, webhook_rules, performance indexes

Revision ID: 20260529_0041
Revises: 20260527_0040
Create Date: 2026-05-29
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "20260529_0041"
down_revision = "20260527_0040"
branch_labels = None
depends_on = None


EVENT_DEFINITIONS_SEED = [
    # navigation
    ("page_view", "navigation", "Every page render"),
    # engagement
    ("trek_view", "engagement", "Trek detail page viewed"),
    ("trek_search", "engagement", "Search query executed"),
    ("trek_saved", "engagement", "Trek bookmarked"),
    ("trek_compared", "engagement", "Trek added to compare"),
    ("trek_shared", "engagement", "Trek share button clicked"),
    ("content_scroll_25", "engagement", "25% scroll depth on article"),
    ("content_scroll_50", "engagement", "50% scroll depth on article"),
    ("content_scroll_75", "engagement", "75% scroll depth on article"),
    ("content_scroll_100", "engagement", "100% scroll depth on article"),
    ("faq_expanded", "engagement", "FAQ accordion item opened"),
    ("season_tab_changed", "engagement", "Seasonal section tab clicked"),
    ("difficulty_tab_changed", "engagement", "Difficulty section tab clicked"),
    ("compare_view", "engagement", "Compare page viewed with treks"),
    ("packing_checklist_viewed", "engagement", "Trek packing page viewed"),
    ("permit_guide_viewed", "engagement", "Trek permit page viewed"),
    ("cost_guide_viewed", "engagement", "Trek cost page viewed"),
    ("search_result_clicked", "engagement", "Search result link clicked"),
    ("recommendation_clicked", "engagement", "Personalised feed card clicked"),
    # conversion
    ("trek_plan_cta_clicked", "conversion", "Plan My Trek button clicked"),
    ("plan_wizard_started", "conversion", "Plan wizard step 0 reached"),
    ("plan_wizard_step_1", "conversion", "Wizard step 1 (intent) completed"),
    ("plan_wizard_step_2", "conversion", "Wizard step 2 (month) completed"),
    ("plan_wizard_step_3", "conversion", "Wizard step 3 (duration) completed"),
    ("plan_wizard_step_4", "conversion", "Wizard step 4 (experience/fitness) completed"),
    ("plan_wizard_step_5", "conversion", "Wizard step 5 (region) completed"),
    ("plan_wizard_completed", "conversion", "Wizard submitted, plan generated"),
    ("lead_submitted", "conversion", "Lead / enquiry form submitted"),
    ("newsletter_subscribed", "conversion", "Newsletter form submitted"),
    ("operator_inquiry_sent", "conversion", "Operator inquiry form submitted"),
    ("affiliate_click", "conversion", "Affiliate gear link clicked"),
    # system
    ("user_signed_up", "system", "New user registration"),
    ("user_logged_in", "system", "Existing user login"),
    ("user_logged_out", "system", "Logout"),
]


def upgrade() -> None:
    # 1. event_definitions table
    op.create_table(
        "event_definitions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("event_name", sa.String(120), nullable=False, unique=True),
        sa.Column("event_category", sa.String(60), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("properties", JSONB, nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_test_only", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_event_definitions_event_name", "event_definitions", ["event_name"])
    op.create_index("ix_event_definitions_event_category", "event_definitions", ["event_category"])

    # 2. custom_segments table
    op.create_table(
        "custom_segments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("conditions", JSONB, nullable=False),
        sa.Column("user_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("last_computed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 3. cdp_webhook_rules table
    op.create_table(
        "cdp_webhook_rules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(120), nullable=True),
        sa.Column("trigger_event", sa.String(120), nullable=False),
        sa.Column("condition", JSONB, nullable=True),
        sa.Column("webhook_url", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_cdp_webhook_rules_trigger_event", "cdp_webhook_rules", ["trigger_event"])
    op.create_index("ix_cdp_webhook_rules_is_active", "cdp_webhook_rules", ["is_active"])

    # 4. Add is_internal to analytics_events
    op.add_column("analytics_events", sa.Column("is_internal", sa.Boolean(), nullable=False, server_default="false"))
    op.create_index("ix_analytics_events_is_internal", "analytics_events", ["is_internal"])

    # 5. Composite performance indexes on analytics_events
    op.create_index("ix_analytics_events_name_created", "analytics_events", ["event_name", "created_at"])
    op.create_index("ix_analytics_events_anon_created", "analytics_events", ["anonymous_id", "created_at"])
    op.create_index("ix_analytics_events_url_created", "analytics_events", ["page_url", "created_at"])

    # 6. Seed event_definitions
    event_def_table = sa.table(
        "event_definitions",
        sa.column("event_name", sa.String),
        sa.column("event_category", sa.String),
        sa.column("description", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("is_test_only", sa.Boolean),
    )
    op.bulk_insert(
        event_def_table,
        [
            {"event_name": name, "event_category": cat, "description": desc, "is_active": True, "is_test_only": False}
            for name, cat, desc in EVENT_DEFINITIONS_SEED
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_analytics_events_url_created", "analytics_events")
    op.drop_index("ix_analytics_events_anon_created", "analytics_events")
    op.drop_index("ix_analytics_events_name_created", "analytics_events")
    op.drop_index("ix_analytics_events_is_internal", "analytics_events")
    op.drop_column("analytics_events", "is_internal")
    op.drop_index("ix_cdp_webhook_rules_is_active", "cdp_webhook_rules")
    op.drop_index("ix_cdp_webhook_rules_trigger_event", "cdp_webhook_rules")
    op.drop_table("cdp_webhook_rules")
    op.drop_table("custom_segments")
    op.drop_index("ix_event_definitions_event_category", "event_definitions")
    op.drop_index("ix_event_definitions_event_name", "event_definitions")
    op.drop_table("event_definitions")
