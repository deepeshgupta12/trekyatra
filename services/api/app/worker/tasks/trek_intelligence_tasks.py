from __future__ import annotations

import logging

from app.db.session import SessionLocal
from app.modules.trek_intelligence import service as ti_service
from app.worker.celery_app import celery_app
from app.worker.tasks.base import BaseTask

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, base=BaseTask, name="trek_intelligence.backfill_trek_meta")
def backfill_trek_meta_task(self, slug: str) -> dict:
    db = SessionLocal()
    try:
        ti_service.backfill_trek_meta(db, slug)
        return {"slug": slug, "status": "done"}
    except Exception as exc:
        logger.error("backfill_trek_meta_task failed for %s: %s", slug, exc)
        return {"slug": slug, "status": "error", "error": str(exc)}
    finally:
        db.close()


@celery_app.task(bind=True, base=BaseTask, name="trek_intelligence.backfill_all_trek_meta")
def backfill_all_trek_meta_task(self) -> dict:
    db = SessionLocal()
    try:
        return ti_service.backfill_all_trek_meta(db)
    except Exception as exc:
        logger.error("backfill_all_trek_meta_task failed: %s", exc)
        return {"processed": [], "skipped": [], "failed": [{"slug": "*", "error": str(exc)}]}
    finally:
        db.close()
