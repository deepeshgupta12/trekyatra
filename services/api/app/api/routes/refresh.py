from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.linking.models import Page
from app.modules.refresh.service import create_refresh_log, get_refresh_logs, get_stale_pages
from app.schemas.refresh import (
    RefreshLogResponse,
    RefreshTriggerRequest,
    RefreshTriggerResponse,
    StalePageResponse,
)

router = APIRouter(prefix="/admin/refresh", tags=["refresh"], dependencies=[Depends(get_current_admin)])


def _to_stale_response(page: Page) -> StalePageResponse:
    days_stale: int | None = None
    if page.last_refreshed_at is not None:
        delta = datetime.now(timezone.utc) - page.last_refreshed_at
        days_stale = max(0, delta.days - page.freshness_interval_days)
    return StalePageResponse(
        id=page.id,
        slug=page.slug,
        title=page.title,
        page_type=page.page_type,
        freshness_interval_days=page.freshness_interval_days,
        last_refreshed_at=page.last_refreshed_at,
        do_not_refresh=page.do_not_refresh,
        days_stale=days_stale,
    )


@router.get("/stale", response_model=list[StalePageResponse])
def list_stale_pages(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[StalePageResponse]:
    pages = get_stale_pages(db, limit=limit)
    return [_to_stale_response(p) for p in pages]


@router.post("/trigger", response_model=RefreshTriggerResponse)
def trigger_refresh(
    body: RefreshTriggerRequest,
    db: Session = Depends(get_db),
) -> RefreshTriggerResponse:
    from app.modules.refresh.tasks import refresh_task

    if not body.page_ids:
        raise HTTPException(status_code=422, detail="page_ids must not be empty")

    logs = []
    for pid_str in body.page_ids:
        try:
            pid = uuid.UUID(pid_str)
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid UUID: {pid_str}")

        page = db.scalar(select(Page).where(Page.id == pid))
        if page is None:
            raise HTTPException(status_code=404, detail=f"Page {pid_str} not found")

        log = create_refresh_log(db, page_id=pid, triggered_by="manual")
        logs.append(log)

    db.commit()

    # Dispatch after commit so log rows exist in DB
    for log in logs:
        refresh_task.delay(str(log.page_id), str(log.id), "manual")

    return RefreshTriggerResponse(
        queued=len(logs),
        logs=[RefreshLogResponse.model_validate(lg) for lg in logs],
    )


@router.get("/logs", response_model=list[RefreshLogResponse])
def list_refresh_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[RefreshLogResponse]:
    logs = get_refresh_logs(db, limit=limit, offset=offset)
    return [RefreshLogResponse.model_validate(lg) for lg in logs]
