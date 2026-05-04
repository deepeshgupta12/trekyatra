"""digital products, user orders, and download URL on user_downloads

Revision ID: 20260501_0024
Revises: 20260501_0023
Create Date: 2026-05-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260501_0024"
down_revision = "20260501_0023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -- digital_products -------------------------------------------------
    op.create_table(
        "digital_products",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(300), nullable=False, unique=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_inr", sa.Float(), nullable=False, default=0.0),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("preview_image_url", sa.String(512), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # -- user_orders -------------------------------------------------------
    op.create_table(
        "user_orders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", UUID(as_uuid=True), sa.ForeignKey("digital_products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider_order_id", sa.String(200), nullable=False),
        sa.Column("amount_inr", sa.Float(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("razorpay_signature", sa.String(200), nullable=True),
        sa.Column("test_mode", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # -- extend user_downloads with order FK + download_url ---------------
    op.add_column("user_downloads", sa.Column(
        "order_id", UUID(as_uuid=True),
        sa.ForeignKey("user_orders.id", ondelete="SET NULL"),
        nullable=True,
    ))
    op.add_column("user_downloads", sa.Column("download_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("user_downloads", "download_url")
    op.drop_column("user_downloads", "order_id")
    op.drop_table("user_orders")
    op.drop_table("digital_products")
