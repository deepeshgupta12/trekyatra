"""Trek conditions routes — public GET + admin list/refresh/seed/dispatch."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.conditions.schemas import (
    ConditionOut,
    ConditionsListOut,
    SeedCoordinatesOut,
)
from app.modules.conditions.service import (
    get_trek_conditions,
    list_all_trek_conditions,
    refresh_trek_conditions,
    seed_trek_coordinates,
)

public_router = APIRouter(prefix="/public/treks", tags=["conditions-public"])
admin_router = APIRouter(prefix="/admin/conditions", tags=["conditions-admin"])


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------

@public_router.get("/{slug}/conditions", response_model=ConditionOut)
def get_conditions(slug: str, db: Session = Depends(get_db)) -> ConditionOut:
    """Return cached live conditions for a trek. 404 if no data yet."""
    out = get_trek_conditions(db, slug)
    if out is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No conditions data available for this trek.",
        )
    return out


# ---------------------------------------------------------------------------
# Admin — STATIC routes first, dynamic last (§16 route ordering rule)
# ---------------------------------------------------------------------------

@admin_router.get("", response_model=ConditionsListOut)
def admin_list_conditions(db: Session = Depends(get_db)) -> ConditionsListOut:
    """Admin: list all trek guides with their current conditions and coords status."""
    return list_all_trek_conditions(db)


@admin_router.post("/seed-coordinates", response_model=SeedCoordinatesOut)
def admin_seed_coordinates(db: Session = Depends(get_db)) -> SeedCoordinatesOut:
    """Admin: seed trek_base_lat/lng from hardcoded TREK_COORDS dict."""
    return seed_trek_coordinates(db)


@admin_router.post("/refresh-all", response_model=dict)
def admin_refresh_all_dispatch() -> dict:
    """Admin: dispatch the Celery conditions.refresh_all task immediately."""
    from app.worker.tasks.conditions import refresh_all_task  # local import avoids circular
    task = refresh_all_task.apply_async()
    return {"task_id": str(task.id), "status": "dispatched"}


# Dynamic route LAST — must not shadow static routes above
@admin_router.post("/{slug}/refresh", response_model=ConditionOut)
async def admin_refresh(slug: str, db: Session = Depends(get_db)) -> ConditionOut:
    """Admin: immediately refresh weather + statuses for a single trek."""
    row = await refresh_trek_conditions(db, slug)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trek not found or no coordinates available.",
        )
    out = get_trek_conditions(db, slug)
    if out is None:
        raise HTTPException(status_code=500, detail="Refresh succeeded but read failed.")
    return out
