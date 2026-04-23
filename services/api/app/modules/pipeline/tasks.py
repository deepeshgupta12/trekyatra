from __future__ import annotations

import uuid

from app.db.session import SessionLocal
from app.worker.celery_app import celery_app
from app.worker.tasks.base import BaseTask


@celery_app.task(bind=True, base=BaseTask, name="pipeline.run_pipeline")
def run_pipeline_task(self, run_id: str) -> dict:
    from app.modules.pipeline.service import PipelineOrchestrator

    db = SessionLocal()
    try:
        orchestrator = PipelineOrchestrator(db=db, run_id=uuid.UUID(run_id))
        orchestrator.run()
        return {"run_id": run_id, "status": "processed"}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60, max_retries=0)
    finally:
        db.close()


@celery_app.task(bind=True, base=BaseTask, name="pipeline.resume_pipeline")
def resume_pipeline_task(self, run_id: str) -> dict:
    from app.modules.pipeline.service import PipelineOrchestrator

    db = SessionLocal()
    try:
        orchestrator = PipelineOrchestrator(db=db, run_id=uuid.UUID(run_id))
        orchestrator.resume()
        return {"run_id": run_id, "status": "resumed"}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60, max_retries=0)
    finally:
        db.close()


@celery_app.task(bind=True, base=BaseTask, name="pipeline.daily_discovery")
def daily_discovery_task(self) -> dict:
    """Beat-scheduled task: run daily trend discovery + brief generation (pauses at brief approval)."""
    from app.modules.pipeline.service import create_pipeline_run, PipelineOrchestrator

    db = SessionLocal()
    try:
        run = create_pipeline_run(
            db,
            start_stage="trend_discovery",
            end_stage="content_brief",
            input_data={
                "seed_topics": [
                    "himalayan trek guide",
                    "weekend trek near delhi",
                    "beginner trek india",
                ],
            },
        )
        orchestrator = PipelineOrchestrator(db=db, run_id=run.id)
        orchestrator.run()
        return {"run_id": str(run.id), "status": "completed"}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=300, max_retries=1)
    finally:
        db.close()
