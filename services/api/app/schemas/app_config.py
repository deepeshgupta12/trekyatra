from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

VersionGateStatus = Literal["ok", "soft_update", "force_update", "maintenance"]


class VersionGateDecision(BaseModel):
    """Public response the mobile client acts on. `status` is computed server-side
    from the caller's `current_version`, so a thin client can just render it."""

    status: VersionGateStatus
    current_version: str
    min_supported_version: str
    latest_version: str
    update_message: str | None = None
    store_url: str | None = None
    maintenance_message: str | None = None


class AppVersionConfigResponse(BaseModel):
    """Full config row (admin view)."""

    model_config = ConfigDict(from_attributes=True)

    platform: str
    min_supported_version: str
    latest_version: str
    force_update_enabled: bool
    update_message: str | None = None
    store_url: str | None = None
    maintenance_mode: bool
    maintenance_message: str | None = None
    updated_at: datetime | None = None


class AppVersionConfigUpdate(BaseModel):
    """Admin PATCH — all fields optional; only provided keys are updated."""

    min_supported_version: str | None = None
    latest_version: str | None = None
    force_update_enabled: bool | None = None
    update_message: str | None = None
    store_url: str | None = None
    maintenance_mode: bool | None = None
    maintenance_message: str | None = None
