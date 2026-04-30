from __future__ import annotations

import logging

from celery import shared_task

from app.db.session import SessionLocal
from app.modules.agents.seasonal_content.agent import SEASON_META, SeasonalContentAgent

logger = logging.getLogger(__name__)


@shared_task(name="hubs.regenerate_seasonal_hubs")
def regenerate_seasonal_hubs_task() -> dict:
    """Quarterly beat task: regenerate all four seasonal hub pages."""
    db = SessionLocal()
    results: dict[str, str] = {}
    try:
        for season_slug in SEASON_META:
            try:
                agent = SeasonalContentAgent(db=db, season_slug=season_slug)
                out = agent.run(input_data={"season_slug": season_slug})
                if out.get("errors"):
                    results[season_slug] = f"error: {out['errors'][0]}"
                else:
                    results[season_slug] = f"ok: {out.get('output', {}).get('page_id', 'unknown')}"
            except Exception as exc:  # noqa: BLE001
                logger.exception("Seasonal hub generation failed for %s", season_slug)
                results[season_slug] = f"exception: {exc}"
    finally:
        db.close()
    logger.info("Quarterly seasonal hub regeneration complete: %s", results)
    return results
