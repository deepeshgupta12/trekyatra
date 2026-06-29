"""Celery tasks — conditions refresh + coordinate re-seed."""
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


@celery_app.task(name="conditions.reseed_coordinates", bind=True, max_retries=2)
def reseed_coordinates_task(self) -> dict:  # type: ignore[override]
    """Daily defensive re-seed of trek_base_lat/lng from TREK_COORDS dict.

    Restores coordinates that may have been cleared by a DB maintenance
    operation, migration rollback, or PITR restore on DigitalOcean.
    Safe: seed_trek_coordinates() skips treks that already have non-null
    coordinates, so manual custom coordinates are never overwritten.
    """
    from app.modules.conditions.service import seed_trek_coordinates

    db = SessionLocal()
    try:
        result = seed_trek_coordinates(db)
        logger.info(
            "[conditions.reseed_coordinates] seeded=%d skipped=%d",
            result.seeded,
            result.skipped,
        )
        return {"seeded": result.seeded, "skipped": result.skipped}
    except Exception as exc:
        logger.error("[conditions.reseed_coordinates] error: %s", exc)
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()
