"""Celery task — refresh all trek conditions every 6 hours."""
from __future__ import annotations

import asyncio
import logging

from app.db.session import SessionLocal
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="conditions.refresh_all", bind=True, max_retries=2)
def refresh_all_task(self) -> dict:  # type: ignore[override]
    """Refresh live conditions for all published treks that have coordinates."""
    from app.modules.conditions.service import refresh_all_trek_conditions

    db = SessionLocal()
    try:
        result = asyncio.run(refresh_all_trek_conditions(db))
        logger.info("[conditions.refresh_all] %s", result)
        return result
    except Exception as exc:
        logger.error("[conditions.refresh_all] error: %s", exc)
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()
