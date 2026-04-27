from __future__ import annotations

import uuid

from app.modules.auth.dependencies import require_pipeline
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.pipeline import service as pipeline_service
from app.modules.pipeline.models import PipelineRun, PipelineStage
from app.schemas.pipeline import (
    PipelineRunCreate,
    PipelineRunResponse,
    PipelineTriggerResponse,
)

router = APIRouter(prefix="/admin/pipeline", tags=["pipeline"], dependencies=[Depends(require_pipeline)])


@router.post("/run", response_model=PipelineTriggerResponse)
def trigger_pipeline(payload: PipelineRunCreate, db: Session = Depends(get_db)):
    """Trigger a full or partial pipeline run."""
    from app.modules.pipeline.tasks import run_pipeline_task

    valid_stages = pipeline_service.PIPELINE_STAGES
    if payload.start_stage not in valid_stages:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid start_stage '{payload.start_stage}'. Valid: {valid_stages}",
        )
    if payload.end_stage not in valid_stages:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid end_stage '{payload.end_stage}'. Valid: {valid_stages}",
        )

    input_data: dict = {}
    if payload.seed_topics:
        input_data["seed_topics"] = payload.seed_topics
    if payload.brief_id:
        input_data["brief_id"] = str(payload.brief_id)
    if payload.draft_id:
        input_data["draft_id"] = str(payload.draft_id)

    run = pipeline_service.create_pipeline_run(
        db,
        start_stage=payload.start_stage,
        end_stage=payload.end_stage,
        input_data=input_data,
    )

    run_pipeline_task.apply_async(args=[str(run.id)])

    return PipelineTriggerResponse(
        pipeline_run_id=run.id,
        status=run.status,
        message=f"Pipeline started from '{payload.start_stage}' to '{payload.end_stage}'.",
    )


@router.get("/runs", response_model=list[PipelineRunResponse])
def list_runs(limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    runs = pipeline_service.list_pipeline_runs(db, limit=limit, offset=offset)
    return [PipelineRunResponse.model_validate(r) for r in runs]


@router.get("/runs/{run_id}", response_model=PipelineRunResponse)
def get_run(run_id: uuid.UUID, db: Session = Depends(get_db)):
    run = pipeline_service.get_pipeline_run(db, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Pipeline run not found.")
    return PipelineRunResponse.model_validate(run)


@router.post("/runs/{run_id}/resume", response_model=PipelineTriggerResponse)
def resume_run(run_id: uuid.UUID, db: Session = Depends(get_db)):
    """Resume a pipeline paused at an approval gate."""
    from app.modules.pipeline.tasks import resume_pipeline_task

    run = pipeline_service.get_pipeline_run(db, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Pipeline run not found.")
    if run.status not in ("paused_at_brief_approval", "paused_at_draft_approval"):
        raise HTTPException(
            status_code=409,
            detail=f"Pipeline run is not paused (status: '{run.status}'). Cannot resume.",
        )

    resume_pipeline_task.apply_async(args=[str(run_id)])

    return PipelineTriggerResponse(
        pipeline_run_id=run.id,
        status="running",
        message="Pipeline resume dispatched.",
    )


@router.post("/runs/{run_id}/cancel", response_model=PipelineRunResponse)
def cancel_run(run_id: uuid.UUID, db: Session = Depends(get_db)):
    run = pipeline_service.cancel_pipeline_run(db, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Pipeline run not found.")
    return PipelineRunResponse.model_validate(run)


@router.delete("/runs/clear", response_model=dict)
def clear_non_completed_runs(db: Session = Depends(get_db)):
    """Delete all pipeline runs that are not in 'completed' status.

    Removes failed, cancelled, and stale running runs, keeping only
    successfully completed runs. Intended for admin housekeeping.
    """
    from sqlalchemy import select as sa_select

    non_terminal = ("failed", "cancelled", "running")
    # Collect IDs first to delete stages before runs (FK constraint)
    run_ids = list(db.scalars(
        sa_select(PipelineRun.id).where(PipelineRun.status.in_(non_terminal))
    ).all())
    stage_rows = 0
    if run_ids:
        stage_rows = db.execute(
            delete(PipelineStage).where(PipelineStage.pipeline_run_id.in_(run_ids))
        ).rowcount
    run_rows = db.execute(
        delete(PipelineRun).where(PipelineRun.status.in_(non_terminal))
    ).rowcount
    db.commit()
    return {"deleted_runs": run_rows, "deleted_stages": stage_rows}
