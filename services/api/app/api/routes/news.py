"""Step 56 — News API routes.

Public:
  GET  /public/news                       — list all news articles (newest first)
  GET  /public/news/by-trek/{trek_slug}   — news articles for a specific trek
  GET  /public/news/{slug}                — single news article (404 if not found)

Admin (requires trekyatra_admin_token):
  POST /admin/news/generate/{trek_slug}   — queue news generation for a trek

IMPORTANT: /by-trek/{trek_slug} must be registered BEFORE /{slug} to avoid
FastAPI routing /{slug} matching the literal string "by-trek".
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.cms.models import CMSPage

log = logging.getLogger(__name__)
router = APIRouter()


def _to_response(page: CMSPage) -> dict[str, Any]:
    return {
        "id": str(page.id),
        "slug": page.slug,
        "page_type": page.page_type,
        "title": page.title,
        "content_html": page.content_html,
        "content_json": page.content_json,
        "status": page.status,
        "seo_title": page.seo_title,
        "seo_description": page.seo_description,
        "hero_image_url": page.hero_image_url,
        "published_at": page.published_at.isoformat() if page.published_at else None,
        "created_at": page.created_at.isoformat(),
        "updated_at": page.updated_at.isoformat(),
    }


@router.get("/public/news", tags=["news"])
def list_news_articles(limit: int = 20, db: Session = Depends(get_db)):
    pages = db.scalars(
        select(CMSPage)
        .where(CMSPage.page_type == "news_article", CMSPage.status == "published")
        .order_by(CMSPage.created_at.desc())
        .limit(limit)
    ).all()
    return [_to_response(p) for p in pages]


# NOTE: /by-trek/{trek_slug} registered BEFORE /{slug} — order matters
@router.get("/public/news/by-trek/{trek_slug}", tags=["news"])
def get_news_by_trek(trek_slug: str, limit: int = 5, db: Session = Depends(get_db)):
    # Filter by content_json.trek_slug so both old (digest) and new (per-item) articles are returned
    pages = db.scalars(
        select(CMSPage)
        .where(
            CMSPage.page_type == "news_article",
            CMSPage.status == "published",
            CMSPage.content_json.op("->>")(  # type: ignore[union-attr]
                "trek_slug"
            ) == trek_slug,
        )
        .order_by(CMSPage.created_at.desc())
        .limit(limit)
    ).all()
    return [_to_response(p) for p in pages]


@router.get("/public/news/{slug}", tags=["news"])
def get_news_article(slug: str, db: Session = Depends(get_db)):
    page = db.scalar(
        select(CMSPage).where(
            CMSPage.slug == slug,
            CMSPage.page_type == "news_article",
            CMSPage.status == "published",
        )
    )
    if not page:
        raise HTTPException(status_code=404, detail="News article not found")
    return _to_response(page)


@router.post("/admin/news/generate/{trek_slug}", tags=["news"])
def generate_trek_news(
    trek_slug: str,
    db: Session = Depends(get_db),
    _admin: Any = Depends(get_current_admin),
):
    """Queue news generation for a trek. Returns task ID immediately (async)."""
    trek_page = db.scalar(
        select(CMSPage).where(
            CMSPage.slug == trek_slug,
            CMSPage.page_type == "trek_guide",
        )
    )
    if not trek_page:
        raise HTTPException(status_code=404, detail=f"No trek_guide found for slug: {trek_slug}")

    trek_name = trek_page.trek_name or trek_page.title.split(":")[0].strip()
    trek_state = trek_page.trek_state

    try:
        from app.worker.tasks.news import generate_news_for_trek
        task = generate_news_for_trek.delay(
            trek_slug=trek_slug,
            trek_name=trek_name,
            trek_state=trek_state,
        )
        return {
            "status": "queued",
            "task_id": task.id,
            "trek_slug": trek_slug,
            "trek_name": trek_name,
        }
    except Exception as exc:
        log.error("Failed to queue news generation for %s: %s", trek_slug, exc)
        raise HTTPException(status_code=500, detail=str(exc))
