"""add trek_slug and make cms_page_id nullable in user_bookmarks

Revision ID: 20260501_0023
Revises: 20260430_0022
Create Date: 2026-05-01

"""
from alembic import op
import sqlalchemy as sa

revision = "20260501_0023"
down_revision = "20260430_0022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the existing unique constraint (will be replaced by partial indexes)
    op.drop_constraint("uq_user_bookmark", "user_bookmarks", type_="unique")

    # Make cms_page_id nullable (bookmarks can now be stored by trek slug alone)
    op.alter_column("user_bookmarks", "cms_page_id", nullable=True)

    # Add new columns for slug-based bookmarks
    op.add_column("user_bookmarks", sa.Column("trek_slug", sa.String(300), nullable=True))
    op.add_column("user_bookmarks", sa.Column("bookmark_title", sa.String(500), nullable=True))
    op.add_column("user_bookmarks", sa.Column("bookmark_image_url", sa.Text(), nullable=True))

    # Partial unique index: one CMS-page bookmark per user
    op.create_index(
        "uix_user_bookmark_page",
        "user_bookmarks",
        ["user_id", "cms_page_id"],
        unique=True,
        postgresql_where=sa.text("cms_page_id IS NOT NULL"),
    )

    # Partial unique index: one slug-based bookmark per user
    op.create_index(
        "uix_user_bookmark_slug",
        "user_bookmarks",
        ["user_id", "trek_slug"],
        unique=True,
        postgresql_where=sa.text("trek_slug IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uix_user_bookmark_slug", table_name="user_bookmarks")
    op.drop_index("uix_user_bookmark_page", table_name="user_bookmarks")
    op.drop_column("user_bookmarks", "bookmark_image_url")
    op.drop_column("user_bookmarks", "bookmark_title")
    op.drop_column("user_bookmarks", "trek_slug")
    op.alter_column("user_bookmarks", "cms_page_id", nullable=False)
    op.create_unique_constraint("uq_user_bookmark", "user_bookmarks", ["user_id", "cms_page_id"])
