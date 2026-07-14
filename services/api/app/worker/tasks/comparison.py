"""Celery tasks — deterministic trek comparison page generation (#8 / Step 81).

``comparison.generate_for_trek`` is dispatched when a trek_guide is published
(see routes/cms.py) and pairs the trek with its same-state peers.
``comparison.backfill_all`` regenerates every pair (admin-triggered).
"""
from __future__ import annotations

import logging

from app.db.session import SessionLocal
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="comparison.generate_for_trek", bind=True, max_retries=2)
def generate_for_trek_task(self, slug: str) -> dict:  # type: ignore[override]
    """Generate/refresh comparison pages pairing a newly-published trek with its
    same-state peers. Idempotent."""
    from app.modules.comparison.service import generate_comparisons_for_trek

    db = SessionLocal()
    try:
        created = generate_comparisons_for_trek(db, slug)
        db.commit()
        logger.info("[comparison.generate_for_trek] slug=%s pairs=%d", slug, len(created))
        return {"slug": slug, "comparison_pairs": created}
    except Exception as exc:
        db.rollback()
        logger.error("[comparison.generate_for_trek] slug=%s error: %s", slug, exc)
        raise self.retry(exc=exc, countdown=120)
    finally:
        db.close()


@celery_app.task(name="comparison.backfill_all", bind=True, max_retries=1)
def backfill_all_task(self) -> dict:  # type: ignore[override]
    """Regenerate comparison pages for every published trek's same-state peers."""
    from app.modules.comparison.service import backfill_all_comparisons

    db = SessionLocal()
    try:
        result = backfill_all_comparisons(db)
        db.commit()
        logger.info("[comparison.backfill_all] %s", result)
        return result
    except Exception as exc:
        db.rollback()
        logger.error("[comparison.backfill_all] error: %s", exc)
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()
