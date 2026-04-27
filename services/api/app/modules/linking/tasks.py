from __future__ import annotations

import logging

from app.worker.celery_app import celery_app
from app.db.session import SessionLocal
from app.modules.linking.service import sync_pages_from_cms, get_orphan_pages

logger = logging.getLogger(__name__)


@celery_app.task(name="linking.sync_pages", bind=True, max_retries=3)
def sync_pages_task(self) -> dict:
    """Daily task: sync pages table from published cms_pages."""
    try:
        with SessionLocal() as db:
            count = sync_pages_from_cms(db)
            db.commit()
        logger.info("sync_pages_task: synced %d pages", count)
        return {"synced": count}
    except Exception as exc:
        logger.exception("sync_pages_task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="linking.detect_orphans", bind=True, max_retries=3)
def detect_orphans_task(self) -> dict:
    """Daily task: log orphan pages (published but with zero inbound links)."""
    try:
        with SessionLocal() as db:
            orphans = get_orphan_pages(db)
        slugs = [p.slug for p in orphans]
        logger.info("detect_orphans_task: %d orphan pages — %s", len(slugs), slugs)
        return {"orphan_count": len(slugs), "slugs": slugs}
    except Exception as exc:
        logger.exception("detect_orphans_task failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)
