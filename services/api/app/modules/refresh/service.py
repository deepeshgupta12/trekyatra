from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session

from app.modules.linking.models import Page
from app.modules.refresh.models import RefreshLog

VALID_RESULTS = {"pending", "refreshed", "flagged", "failed"}


def get_stale_pages(db: Session, *, limit: int = 50) -> list[Page]:
    """Return pages past their freshness interval, sorted oldest-first.

    Pages with last_refreshed_at=NULL are treated as most stale (never refreshed).
    Pages flagged do_not_refresh are excluded.
    """
    stale_cond = or_(
        Page.last_refreshed_at.is_(None),
        text(
            "pages.last_refreshed_at + (pages.freshness_interval_days * INTERVAL '1 day') < NOW()"
        ),
    )
    stmt = (
        select(Page)
        .where(Page.do_not_refresh == False)  # noqa: E712
        .where(stale_cond)
        .order_by(Page.last_refreshed_at.asc().nullsfirst())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def create_refresh_log(
    db: Session,
    *,
    page_id: uuid.UUID,
    triggered_by: str,
) -> RefreshLog:
    now = datetime.now(timezone.utc)
    log = RefreshLog(
        id=uuid.uuid4(),
        page_id=page_id,
        triggered_by=triggered_by,
        trigger_at=now,
        result="pending",
        created_at=now,
    )
    db.add(log)
    db.flush()
    return log


def update_refresh_log(
    db: Session,
    *,
    log_id: uuid.UUID,
    result: str,
    notes: str | None = None,
) -> RefreshLog:
    log = db.scalar(select(RefreshLog).where(RefreshLog.id == log_id))
    if log is None:
        raise ValueError(f"RefreshLog {log_id} not found")
    log.result = result
    log.notes = notes
    log.completed_at = datetime.now(timezone.utc)
    db.flush()
    return log


def get_refresh_logs(db: Session, *, limit: int = 50, offset: int = 0) -> list[RefreshLog]:
    stmt = (
        select(RefreshLog)
        .order_by(RefreshLog.trigger_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(stmt).all())
