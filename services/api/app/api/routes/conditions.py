"""Trek conditions routes — public GET + admin refresh + coordinate seed."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.conditions.schemas import ConditionOut, SeedCoordinatesOut
from app.modules.conditions.service import (
    get_trek_conditions,
    refresh_trek_conditions,
    seed_trek_coordinates,
)

public_router = APIRouter(prefix="/api/v1/public/treks", tags=["conditions-public"])
admin_router = APIRouter(prefix="/api/v1/admin/conditions", tags=["conditions-admin"])


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


@admin_router.post("/seed-coordinates", response_model=SeedCoordinatesOut)
def admin_seed_coordinates(db: Session = Depends(get_db)) -> SeedCoordinatesOut:
    """Admin: seed trek_base_lat/lng from hardcoded TREK_COORDS dict."""
    return seed_trek_coordinates(db)
