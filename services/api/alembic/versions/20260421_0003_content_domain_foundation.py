"""content domain foundation

Revision ID: 20260421_0003
Revises: 20260421_0002
Create Date: 2026-04-21 15:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260421_0003"
down_revision = "20260421_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "topic_opportunities",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("primary_keyword", sa.String(length=255), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=True),
        sa.Column("intent", sa.String(length=64), nullable=True),
        sa.Column("page_type", sa.String(length=64), nullable=True),
        sa.Column("trend_score", sa.Float(), nullable=True),
        sa.Column("urgency_score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("notes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_topic_opportunities_title"), "topic_opportunities", ["title"], unique=False)
    op.create_index(op.f("ix_topic_opportunities_slug"), "topic_opportunities", ["slug"], unique=True)
    op.create_index(op.f("ix_topic_opportunities_primary_keyword"), "topic_opportunities", ["primary_keyword"], unique=False)
    op.create_index(op.f("ix_topic_opportunities_intent"), "topic_opportunities", ["intent"], unique=False)
    op.create_index(op.f("ix_topic_opportunities_page_type"), "topic_opportunities", ["page_type"], unique=False)
    op.create_index(op.f("ix_topic_opportunities_status"), "topic_opportunities", ["status"], unique=False)

    op.create_table(
        "keyword_clusters",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("primary_keyword", sa.String(length=255), nullable=False),
        sa.Column("supporting_keywords", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("intent", sa.String(length=64), nullable=True),
        sa.Column("pillar_title", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("notes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_keyword_clusters_name"), "keyword_clusters", ["name"], unique=True)
    op.create_index(op.f("ix_keyword_clusters_primary_keyword"), "keyword_clusters", ["primary_keyword"], unique=False)
    op.create_index(op.f("ix_keyword_clusters_intent"), "keyword_clusters", ["intent"], unique=False)
    op.create_index(op.f("ix_keyword_clusters_status"), "keyword_clusters", ["status"], unique=False)

    op.create_table(
        "content_briefs",
        sa.Column("topic_opportunity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("keyword_cluster_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("target_keyword", sa.String(length=255), nullable=False),
        sa.Column("secondary_keywords", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("intent", sa.String(length=64), nullable=True),
        sa.Column("page_type", sa.String(length=64), nullable=True),
        sa.Column("heading_outline", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("faqs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("internal_link_targets", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("schema_recommendations", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("monetization_notes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["keyword_cluster_id"], ["keyword_clusters.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["topic_opportunity_id"], ["topic_opportunities.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_content_briefs_topic_opportunity_id"), "content_briefs", ["topic_opportunity_id"], unique=False)
    op.create_index(op.f("ix_content_briefs_keyword_cluster_id"), "content_briefs", ["keyword_cluster_id"], unique=False)
    op.create_index(op.f("ix_content_briefs_title"), "content_briefs", ["title"], unique=False)
    op.create_index(op.f("ix_content_briefs_slug"), "content_briefs", ["slug"], unique=True)
    op.create_index(op.f("ix_content_briefs_target_keyword"), "content_briefs", ["target_keyword"], unique=False)
    op.create_index(op.f("ix_content_briefs_intent"), "content_briefs", ["intent"], unique=False)
    op.create_index(op.f("ix_content_briefs_page_type"), "content_briefs", ["page_type"], unique=False)
    op.create_index(op.f("ix_content_briefs_status"), "content_briefs", ["status"], unique=False)

    op.create_table(
        "content_drafts",
        sa.Column("brief_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("content_markdown", sa.Text(), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("meta_title", sa.String(length=255), nullable=True),
        sa.Column("meta_description", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["brief_id"], ["content_briefs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_content_drafts_brief_id"), "content_drafts", ["brief_id"], unique=False)
    op.create_index(op.f("ix_content_drafts_title"), "content_drafts", ["title"], unique=False)
    op.create_index(op.f("ix_content_drafts_slug"), "content_drafts", ["slug"], unique=False)
    op.create_index(op.f("ix_content_drafts_status"), "content_drafts", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_content_drafts_status"), table_name="content_drafts")
    op.drop_index(op.f("ix_content_drafts_slug"), table_name="content_drafts")
    op.drop_index(op.f("ix_content_drafts_title"), table_name="content_drafts")
    op.drop_index(op.f("ix_content_drafts_brief_id"), table_name="content_drafts")
    op.drop_table("content_drafts")

    op.drop_index(op.f("ix_content_briefs_status"), table_name="content_briefs")
    op.drop_index(op.f("ix_content_briefs_page_type"), table_name="content_briefs")
    op.drop_index(op.f("ix_content_briefs_intent"), table_name="content_briefs")
    op.drop_index(op.f("ix_content_briefs_target_keyword"), table_name="content_briefs")
    op.drop_index(op.f("ix_content_briefs_slug"), table_name="content_briefs")
    op.drop_index(op.f("ix_content_briefs_title"), table_name="content_briefs")
    op.drop_index(op.f("ix_content_briefs_keyword_cluster_id"), table_name="content_briefs")
    op.drop_index(op.f("ix_content_briefs_topic_opportunity_id"), table_name="content_briefs")
    op.drop_table("content_briefs")

    op.drop_index(op.f("ix_keyword_clusters_status"), table_name="keyword_clusters")
    op.drop_index(op.f("ix_keyword_clusters_intent"), table_name="keyword_clusters")
    op.drop_index(op.f("ix_keyword_clusters_primary_keyword"), table_name="keyword_clusters")
    op.drop_index(op.f("ix_keyword_clusters_name"), table_name="keyword_clusters")
    op.drop_table("keyword_clusters")

    op.drop_index(op.f("ix_topic_opportunities_status"), table_name="topic_opportunities")
    op.drop_index(op.f("ix_topic_opportunities_page_type"), table_name="topic_opportunities")
    op.drop_index(op.f("ix_topic_opportunities_intent"), table_name="topic_opportunities")
    op.drop_index(op.f("ix_topic_opportunities_primary_keyword"), table_name="topic_opportunities")
    op.drop_index(op.f("ix_topic_opportunities_slug"), table_name="topic_opportunities")
    op.drop_index(op.f("ix_topic_opportunities_title"), table_name="topic_opportunities")
    op.drop_table("topic_opportunities")