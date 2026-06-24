from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user_bearer
from app.modules.auth.models import User
from app.modules.mobile.service import (
    get_sync_pages,
    register_device,
    unregister_device,
    create_checkin,
    get_user_history,
    has_user_done_trek,
    get_history_stats,
)
from app.schemas.mobile import (
    DeviceIn,
    DeviceOut,
    SyncOut,
    CheckinIn,
    CheckinOut,
    TrekHistoryStatsOut,
)

router = APIRouter(prefix="/mobile", tags=["mobile"])


@router.get("/sync", response_model=SyncOut)
def sync_content(
    last_sync: Optional[datetime] = Query(None, description="ISO datetime; omit for full sync"),
    page_types: Optional[List[str]] = Query(None, description="Filter by page type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user_bearer),
    db: Session = Depends(get_db),
) -> SyncOut:
    """Incremental CMS sync — returns pages changed since last_sync."""
    return get_sync_pages(
        db=db,
        last_sync=last_sync,
        page_types=page_types,
        limit=limit,
        offset=offset,
    )


@router.post("/device", response_model=DeviceOut)
def register_device_endpoint(
    body: DeviceIn,
    current_user: User = Depends(get_current_user_bearer),
    db: Session = Depends(get_db),
) -> DeviceOut:
    """Register or update a device push token."""
    device, created = register_device(db=db, user_id=current_user.id, device_in=body)
    return DeviceOut(id=str(device.id), device_id=device.device_id, created=created)


@router.delete("/device/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device_endpoint(
    device_id: str,
    current_user: User = Depends(get_current_user_bearer),
    db: Session = Depends(get_db),
) -> None:
    """Unregister a device on sign-out."""
    deleted = unregister_device(db=db, user_id=current_user.id, device_id=device_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found.")


# ── Trek Check-in / History (M16) ─────────────────────────────────────────────

@router.post("/checkin", response_model=CheckinOut, status_code=status.HTTP_201_CREATED)
def create_checkin_endpoint(
    body: CheckinIn,
    current_user: User = Depends(get_current_user_bearer),
    db: Session = Depends(get_db),
) -> CheckinOut:
    """Record that the authenticated user has completed a trek."""
    entry = create_checkin(db=db, user_id=current_user.id, checkin_in=body)
    return CheckinOut.model_validate(entry)


@router.get("/checkin", response_model=List[CheckinOut])
def get_history_endpoint(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user_bearer),
    db: Session = Depends(get_db),
) -> List[CheckinOut]:
    """Return the user's trek history in reverse chronological order."""
    entries = get_user_history(db=db, user_id=current_user.id, limit=limit, offset=offset)
    return [CheckinOut.model_validate(e) for e in entries]


@router.get("/checkin/stats", response_model=TrekHistoryStatsOut)
def get_stats_endpoint(
    current_user: User = Depends(get_current_user_bearer),
    db: Session = Depends(get_db),
) -> TrekHistoryStatsOut:
    """Return aggregate stats and earned badges for the authenticated user."""
    return get_history_stats(db=db, user_id=current_user.id)


@router.get("/checkin/done/{trek_slug}")
def check_done_endpoint(
    trek_slug: str,
    current_user: User = Depends(get_current_user_bearer),
    db: Session = Depends(get_db),
) -> dict:
    """Check if the authenticated user has checked in on a specific trek."""
    return {"done": has_user_done_trek(db=db, user_id=current_user.id, trek_slug=trek_slug)}
