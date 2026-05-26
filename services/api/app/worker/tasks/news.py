"""Celery tasks for Step 56 — weekly news agent."""
from __future__ import annotations

import logging

from sqlalchemy import select

from app.db.session import SessionLocal
from app.modules.agents.news.agent import generate_news
from app.modules.cms.models import CMSPage
from app.worker.celery_app import celery_app

log = logging.getLogger(__name__)


@celery_app.task(name="news.generate_for_trek", bind=True, max_retries=2, default_retry_delay=60)
def generate_news_for_trek(self, trek_slug: str, trek_name: str, trek_state: str | None = None):
    """Generate (or refresh) a weekly news article for a single trek."""
    try:
        with SessionLocal() as db:
            result = generate_news(trek_slug, trek_name, trek_state, db)
            log.info("News generated: slug=%s items=%s", result.get("slug"), result.get("items_count"))
            return result
    except Exception as exc:
        log.error("generate_news_for_trek failed for %s: %s", trek_slug, exc)
        raise self.retry(exc=exc)


@celery_app.task(name="news.weekly_all_treks")
def weekly_news_all_treks():
    """Weekly beat task — dispatches generate_news_for_trek for every published trek_guide."""
    with SessionLocal() as db:
        trek_guides = db.scalars(
            select(CMSPage).where(
                CMSPage.page_type == "trek_guide",
                CMSPage.status == "published",
            )
        ).all()

        dispatched = 0
        for page in trek_guides:
            trek_name = page.trek_name or page.title.split(":")[0].strip()
            generate_news_for_trek.delay(
                trek_slug=page.slug,
                trek_name=trek_name,
                trek_state=page.trek_state,
            )
            dispatched += 1

        log.info("weekly_news_all_treks dispatched %d tasks", dispatched)
        return {"dispatched": dispatched}
