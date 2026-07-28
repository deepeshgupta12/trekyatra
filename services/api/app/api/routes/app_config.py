"""Mobile app version gate / kill-switch.

- Public: GET /api/v1/app/version-config — the client sends its version, gets a
  decision (ok/soft_update/force_update/maintenance). Fail-open: if no config row
  exists the client is never blocked.
- Admin: GET/PUT /api/v1/admin/app/version-config — edit the gate live (no release).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.app_config import service as app_config_service
from app.modules.auth.dependencies import get_current_admin
from app.schemas.app_config import (
    AppVersionConfigResponse,
    AppVersionConfigUpdate,
    VersionGateDecision,
)

public_router = APIRouter(prefix="/app", tags=["app-config"])
admin_router = APIRouter(prefix="/admin/app", tags=["admin-app-config"])

_DEFAULT_PLATFORM = "ios"


@public_router.get("/version-config", response_model=VersionGateDecision)
def get_version_gate(
    platform: str = Query(default=_DEFAULT_PLATFORM),
    current_version: str = Query(..., description="The caller's app version, e.g. 1.0.0"),
    db: Session = Depends(get_db),
) -> VersionGateDecision:
    config = app_config_service.get_config(db, platform)
    if config is None:
        # Fail-open — no config means no gating (never lock users out on misconfig).
        return VersionGateDecision(
            status="ok",
            current_version=current_version,
            min_supported_version=current_version,
            latest_version=current_version,
        )
    return app_config_service.decide(config, current_version)


@admin_router.get("/version-config", response_model=AppVersionConfigResponse)
def admin_get_version_config(
    platform: str = Query(default=_DEFAULT_PLATFORM),
    db: Session = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
) -> AppVersionConfigResponse:
    config = app_config_service.get_config(db, platform)
    if config is None:
        # Return a permissive default so the admin UI can render + save the first time.
        return AppVersionConfigResponse(
            platform=platform,
            min_supported_version="1.0.0",
            latest_version="1.0.0",
            force_update_enabled=True,
            maintenance_mode=False,
        )
    return AppVersionConfigResponse.model_validate(config)


@admin_router.put("/version-config", response_model=AppVersionConfigResponse)
def admin_update_version_config(
    patch: AppVersionConfigUpdate,
    platform: str = Query(default=_DEFAULT_PLATFORM),
    db: Session = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
) -> AppVersionConfigResponse:
    config = app_config_service.upsert_config(db, platform, patch)
    return AppVersionConfigResponse.model_validate(config)
