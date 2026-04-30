"""email sequences and subscriber tags

Revision ID: 20260430_0020
Revises: 20260430_0019
Create Date: 2026-04-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260430_0020"
down_revision = "20260430_0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add preferences and active columns to newsletter_subscribers
    op.add_column(
        "newsletter_subscribers",
        sa.Column("preferences", sa.JSON(), nullable=True),
    )
    op.add_column(
        "newsletter_subscribers",
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )

    # subscriber_tags
    op.create_table(
        "subscriber_tags",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "subscriber_id",
            UUID(as_uuid=True),
            sa.ForeignKey("newsletter_subscribers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("tag", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("subscriber_id", "tag", name="uq_subscriber_tag"),
    )
    op.create_index("ix_subscriber_tags_subscriber_id", "subscriber_tags", ["subscriber_id"])

    # email_sequences
    op.create_table(
        "email_sequences",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_email_sequences_slug", "email_sequences", ["slug"])

    # email_sequence_steps
    op.create_table(
        "email_sequence_steps",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "sequence_id",
            UUID(as_uuid=True),
            sa.ForeignKey("email_sequences.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("step_number", sa.Integer(), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("body_template", sa.Text(), nullable=False),
        sa.Column("delay_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_email_sequence_steps_sequence_id", "email_sequence_steps", ["sequence_id"])

    # subscriber_sequence_enrollments
    op.create_table(
        "subscriber_sequence_enrollments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "subscriber_id",
            UUID(as_uuid=True),
            sa.ForeignKey("newsletter_subscribers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "sequence_id",
            UUID(as_uuid=True),
            sa.ForeignKey("email_sequences.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("current_step", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("next_send_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.UniqueConstraint("subscriber_id", "sequence_id", name="uq_subscriber_sequence_enrollment"),
    )
    op.create_index(
        "ix_subscriber_sequence_enrollments_next_send",
        "subscriber_sequence_enrollments",
        ["next_send_at", "status"],
    )


def downgrade() -> None:
    op.drop_table("subscriber_sequence_enrollments")
    op.drop_table("email_sequence_steps")
    op.drop_table("email_sequences")
    op.drop_table("subscriber_tags")
    op.drop_column("newsletter_subscribers", "active")
    op.drop_column("newsletter_subscribers", "preferences")
