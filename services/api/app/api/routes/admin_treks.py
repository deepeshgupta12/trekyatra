from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.trek_intelligence import service as ti_service
from app.schemas.trek_intelligence import (
    AIInteractionLogResponse,
    BackfillAllTriggerResponse,
    BackfillTriggerResponse,
    TrekDataQualityRow,
    TrekMetaPatch,
    TrekProfile,
)

router = APIRouter(prefix="/admin/treks", tags=["admin-treks"])
_admin = Depends(get_current_admin)


@router.get("/data-quality", response_model=list[TrekDataQualityRow], dependencies=[_admin])
def get_trek_data_quality(db: Session = Depends(get_db)) -> list[TrekDataQualityRow]:
    """Step 72: missing-fields report for every trek_guide page."""
    return ti_service.list_trek_data_quality(db)


@router.get("/ai-logs", response_model=list[AIInteractionLogResponse], dependencies=[_admin])
def get_ai_interaction_logs(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[AIInteractionLogResponse]:
    """Step 72: recent TrekSage / MCP tool usage across web, mobile, ChatGPT, Claude."""
    logs = ti_service.list_ai_interaction_logs(db, limit=limit)
    return [
        AIInteractionLogResponse(
            id=str(log.id),
            source=log.source,
            tool_name=log.tool_name,
            query_summary=log.query_summary,
            result_summary=log.result_summary,
            page_url=log.page_url,
            trek_slugs=log.trek_slugs,
            created_at=log.created_at,
        )
        for log in logs
    ]


@router.patch("/{slug}/meta", response_model=TrekProfile, dependencies=[_admin])
def patch_trek_meta(slug: str, body: TrekMetaPatch, db: Session = Depends(get_db)) -> TrekProfile:
    """Step 72: admin edits structured trek fields — edited fields are marked 'verified'."""
    try:
        return ti_service.update_trek_meta(db, slug, body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/backfill-all", response_model=BackfillAllTriggerResponse, dependencies=[_admin])
def trigger_trek_backfill_all(db: Session = Depends(get_db)) -> BackfillAllTriggerResponse:
    """Step 73: queue an AI draft of missing structured fields across every published trek_guide."""
    from app.modules.cms.models import CMSPage
    from app.worker.tasks.trek_intelligence_tasks import backfill_all_trek_meta_task
    from sqlalchemy import func, select

    trek_count = db.scalar(
        select(func.count())
        .select_from(CMSPage)
        .where(CMSPage.page_type == "trek_guide", CMSPage.status == "published")
    ) or 0

    backfill_all_trek_meta_task.apply_async()
    return BackfillAllTriggerResponse(status="queued", trek_count=trek_count)


@router.post("/{slug}/backfill", response_model=BackfillTriggerResponse, dependencies=[_admin])
def trigger_trek_backfill(slug: str, db: Session = Depends(get_db)) -> BackfillTriggerResponse:
    """Step 72: queue an AI draft of missing structured fields for one trek."""
    from app.modules.cms.service import get_page_by_slug
    from app.worker.tasks.trek_intelligence_tasks import backfill_trek_meta_task

    page = get_page_by_slug(db, slug)
    if page is None or page.page_type != "trek_guide":
        raise HTTPException(status_code=404, detail=f"Trek not found: {slug}")

    backfill_trek_meta_task.apply_async(args=[slug])
    return BackfillTriggerResponse(slug=slug, status="queued")
