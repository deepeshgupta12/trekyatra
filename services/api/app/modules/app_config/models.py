from __future__ import annotations

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AppVersionConfig(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Server-controlled version gate for the mobile app, one row per platform.

    Lets us force/soft-prompt updates and flip a maintenance kill-switch WITHOUT
    shipping a new binary. The mobile client fetches this on launch and compares
    its own version (semver) against `min_supported_version` / `latest_version`.
    """

    __tablename__ = "app_version_config"

    platform: Mapped[str] = mapped_column(String(16), nullable=False, unique=True, index=True)  # 'ios' | 'android'

    # Below this → hard block (force update). At/above min but below latest → soft prompt.
    min_supported_version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    latest_version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")

    force_update_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    update_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    store_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Kill-switch: when true the client shows a blocking maintenance screen.
    maintenance_mode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    maintenance_message: Mapped[str | None] = mapped_column(Text, nullable=True)
