from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user_bearer
from app.modules.auth.models import User
from app.modules.cms.models import CMSPage as CMSPageModel
from app.modules.mobile.service import (
    get_sync_pages,
    register_device,
    unregister_device,
    create_checkin,
    get_user_history,
    has_user_done_trek,
    get_history_stats,
)
from app.modules.treks.service import get_nearby_treks
from app.schemas.mobile import (
    DeviceIn,
    DeviceOut,
    SyncOut,
    CheckinIn,
    CheckinOut,
    TrekHistoryStatsOut,
    NearbyTrekOut,
    NearbyTreksOut,
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


# ── Nearby Treks — M20 ────────────────────────────────────────────────────────

@router.get("/nearby", response_model=NearbyTreksOut)
def get_nearby_endpoint(
    lat: float = Query(..., ge=-90, le=90, description="User latitude"),
    lon: float = Query(..., ge=-180, le=180, description="User longitude"),
    radius_km: float = Query(200, ge=10, le=500),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db),
) -> NearbyTreksOut:
    """Return published treks sorted by distance from the given coordinates.

    No authentication required — location is sent once per session by the client.
    Uses haversine distance against the TREK_COORDS lookup table (no PostGIS needed).
    """
    raw = get_nearby_treks(lat=lat, lon=lon, radius_km=radius_km, limit=limit)
    if not raw:
        return NearbyTreksOut(treks=[], user_lat=lat, user_lon=lon)

    slugs = [r["slug"] for r in raw]
    pages: dict[str, CMSPageModel] = {
        p.slug: p
        for p in db.query(CMSPageModel)
        .filter(CMSPageModel.slug.in_(slugs), CMSPageModel.status == "live")
        .all()
    }

    treks: list[NearbyTrekOut] = []
    for r in raw:
        slug = r["slug"]
        page = pages.get(slug)
        treks.append(
            NearbyTrekOut(
                slug=slug,
                distance_km=r["distance_km"],
                name=page.title if page else slug.replace("-", " ").title(),
                difficulty=page.trek_difficulty if page else None,
                state=page.trek_state if page else None,
                hero_image_url=page.hero_image_url if page else None,
                trek_duration=page.trek_duration if page else None,
                trek_altitude=None,  # stored in content_json.trek_facts — not needed for cards
            )
        )

    return NearbyTreksOut(treks=treks, user_lat=lat, user_lon=lon)
