"""Image Gathering Agent — Step 45.

Finds a suitable hero image for a published CMS trek guide page and
updates hero_image_url via the CMS service.

This agent does NOT use LangGraph (no LLM call needed — image search is
deterministic). It's a simple service call wrapped in the agent pattern
for pipeline integration.

Never fails the pipeline — all errors are logged and gracefully ignored.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.modules.agents.image_search.service import find_trek_image
from app.modules.cms import service as cms_service
from app.schemas.cms import CMSPagePatch

logger = get_logger(__name__)


def run_image_search(db: Session, *, page_slug: str, trek_name: str, region: str = "") -> bool:
    """Find and assign a hero image to a CMS page.

    Returns True when an image was found and saved, False otherwise.
    Never raises — pipeline continues regardless.
    """
    try:
        page = cms_service.get_page_by_slug(db, page_slug)
        if page is None:
            logger.warning("Image search: CMS page '%s' not found", page_slug)
            return False

        if page.hero_image_url:
            # Image already set (manual upload takes priority)
            logger.debug("Image search: '%s' already has a hero image — skipping", page_slug)
            return False

        image_url, source = find_trek_image(trek_name, region)
        if not image_url:
            return False

        cms_service.update_page(
            db,
            page=page,
            patch=CMSPagePatch(hero_image_url=image_url),
        )
        logger.info(
            "Image search: set hero_image_url for '%s' from %s",
            page_slug, source,
        )
        return True

    except Exception as exc:
        logger.warning("Image search agent failed for '%s': %s", page_slug, exc)
        return False
