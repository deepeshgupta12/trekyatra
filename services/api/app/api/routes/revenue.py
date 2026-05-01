from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_current_admin
from app.db.session import get_db
from app.modules.revenue import service as rev_service
from app.schemas.revenue import (
    AggregateRevenueResponse,
    ClusterRevenueRow,
    DecayingPageRow,
    ExecutiveSummaryResponse,
    PageTypeRevenueRow,
    RevenueConfigResponse,
    RevenueConfigUpdate,
)

router = APIRouter(prefix="/admin/revenue", tags=["revenue"], dependencies=[Depends(get_current_admin)])


@router.get("/by-cluster", response_model=list[ClusterRevenueRow])
def get_revenue_by_cluster(db: Session = Depends(get_db)):
    return rev_service.revenue_by_cluster(db)


@router.get("/by-page-type", response_model=list[PageTypeRevenueRow])
def get_revenue_by_page_type(db: Session = Depends(get_db)):
    return rev_service.revenue_by_page_type(db)


@router.get("/decaying-pages", response_model=list[DecayingPageRow])
def get_decaying_pages(db: Session = Depends(get_db)):
    return rev_service.decaying_pages(db)


@router.post("/aggregate", response_model=AggregateRevenueResponse)
def trigger_aggregate(
    days: int = 7,
    db: Session = Depends(get_db),
):
    today = date.today()
    period_start = today - timedelta(days=days)
    count = rev_service.aggregate_revenue(db, period_start, today)
    return AggregateRevenueResponse(aggregated=count, period_start=period_start, period_end=today)


@router.get("/config", response_model=list[RevenueConfigResponse])
def list_config(db: Session = Depends(get_db)):
    return rev_service.get_config(db)


@router.get("/config/{key}", response_model=RevenueConfigResponse)
def get_config_key(key: str, db: Session = Depends(get_db)):
    row = rev_service.get_config_by_key(db, key)
    if row is None:
        raise HTTPException(status_code=404, detail="Config key not found")
    return row


@router.patch("/config/{key}", response_model=RevenueConfigResponse)
def patch_config_key(key: str, body: RevenueConfigUpdate, db: Session = Depends(get_db)):
    return rev_service.update_config(db, key, body.value_float)


@router.get("/summaries", response_model=list[ExecutiveSummaryResponse])
def list_summaries(db: Session = Depends(get_db)):
    return rev_service.list_executive_summaries(db)


@router.post("/summaries/generate")
def trigger_summary(week_label: str | None = None):
    from app.modules.revenue.tasks import generate_executive_summary_task
    task = generate_executive_summary_task.delay()
    return {"task_id": task.id, "status": "queued"}
