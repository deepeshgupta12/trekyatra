from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.app_config.models import AppVersionConfig
from app.schemas.app_config import (
    AppVersionConfigUpdate,
    VersionGateDecision,
    VersionGateStatus,
)

_NUM = re.compile(r"\d+")


def parse_version(v: str | None) -> tuple[int, int, int]:
    """Lenient semver parse → (major, minor, patch). Missing/garbage parts → 0.

    Ignores any pre-release/build suffix ('1.2.3-beta+5' → (1,2,3)) so comparisons
    are stable across the marketing-version strings we actually ship.
    """
    parts = _NUM.findall((v or "").split("+")[0].split("-")[0])
    nums = [int(p) for p in parts[:3]]
    while len(nums) < 3:
        nums.append(0)
    return (nums[0], nums[1], nums[2])


def compare_versions(a: str | None, b: str | None) -> int:
    """-1 if a<b, 0 if equal, 1 if a>b."""
    pa, pb = parse_version(a), parse_version(b)
    return (pa > pb) - (pa < pb)


def get_config(db: Session, platform: str) -> AppVersionConfig | None:
    return db.scalar(select(AppVersionConfig).where(AppVersionConfig.platform == platform))


def decide(config: AppVersionConfig, current_version: str) -> VersionGateDecision:
    """Compute the gate status for a caller's version. Order: maintenance → force → soft."""
    status: VersionGateStatus
    if config.maintenance_mode:
        status = "maintenance"
    elif config.force_update_enabled and compare_versions(current_version, config.min_supported_version) < 0:
        status = "force_update"
    elif compare_versions(current_version, config.latest_version) < 0:
        status = "soft_update"
    else:
        status = "ok"

    return VersionGateDecision(
        status=status,
        current_version=current_version,
        min_supported_version=config.min_supported_version,
        latest_version=config.latest_version,
        update_message=config.update_message,
        store_url=config.store_url,
        maintenance_message=config.maintenance_message,
    )


def upsert_config(db: Session, platform: str, patch: AppVersionConfigUpdate) -> AppVersionConfig:
    """Update the platform's config, creating the row if it doesn't exist yet."""
    config = get_config(db, platform)
    if config is None:
        config = AppVersionConfig(platform=platform)
        db.add(config)
    for field, value in patch.model_dump(exclude_unset=True).items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config
