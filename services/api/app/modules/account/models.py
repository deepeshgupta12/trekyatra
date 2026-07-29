from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Text, DateTime, ForeignKey, UniqueConstraint, func, Index
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class UserPreferences(Base):
    """Explicit onboarding preferences (v1.1) — cross-synced with web + persistent across
    app uninstall.

    Keyed by EITHER user_id (logged-in, shared with web) OR anonymous_id (logged-out; the
    mobile anon id lives in SecureStore/Keychain and SURVIVES uninstall, so prefs are
    restored on reinstall). device_id is captured for reference. On login the anon row is
    merged into the user row. Postgres treats NULLs as distinct, so a plain UNIQUE on each
    nullable key gives "one row per non-null key" while allowing many null keys.
    """

    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    anonymous_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    device_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    experience: Mapped[str | None] = mapped_column(String(32), nullable=True)  # beginner|intermediate|experienced
    difficulties: Mapped[list | None] = mapped_column(JSONB, nullable=True)     # ["Easy","Moderate"]
    regions: Mapped[list | None] = mapped_column(JSONB, nullable=True)          # ["Himachal Pradesh", ...]
    vibes: Mapped[list | None] = mapped_column(JSONB, nullable=True)            # ["high-altitude","scenic"]
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_preferences_user_id"),
        UniqueConstraint("anonymous_id", name="uq_user_preferences_anonymous_id"),
    )


class UserBookmark(Base):
    __tablename__ = "user_bookmarks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    cms_page_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cms_pages.id", ondelete="CASCADE"), nullable=True)
    trek_slug: Mapped[str | None] = mapped_column(String(300), nullable=True)
    bookmark_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bookmark_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserDownload(Base):
    __tablename__ = "user_downloads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user_orders.id", ondelete="SET NULL"), nullable=True)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    download_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    downloaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TrekAlert(Base):
    __tablename__ = "trek_alerts"
    __table_args__ = (
        UniqueConstraint("user_id", "trek_slug", "alert_type", name="uq_trek_alert"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trek_slug: Mapped[str] = mapped_column(String(300), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False, default="any")
    active: Mapped[bool] = mapped_column(Boolean(), default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    fitness_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    trek_experience: Mapped[str | None] = mapped_column(String(50), nullable=True)
    preferred_regions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    budget_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AccountComparison(Base):
    __tablename__ = "account_comparisons"
    __table_args__ = (
        Index("ix_account_comparisons_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slugs: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
