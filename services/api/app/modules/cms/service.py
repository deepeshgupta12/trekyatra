from __future__ import annotations

import uuid
from datetime import datetime, timezone

import redis
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.cms.models import CMSPage
from app.modules.content.models import ContentDraft
from app.schemas.cms import CMSPageCreate, CMSPagePatch

# ---------------------------------------------------------------------------
# Redis cache helpers — DB 2, 5-min TTL (same pool as before)
# ---------------------------------------------------------------------------

_CMS_CACHE_DB = 2
_TTL_SECONDS = 300


def _redis() -> redis.Redis:
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        db=_CMS_CACHE_DB,
        decode_responses=True,
    )


def _cms_key(slug: str) -> str:
    return f"cms:page:{slug}"


def cache_invalidate(slugs: list[str]) -> None:
    try:
        r = _redis()
        if slugs:
            r.delete(*[_cms_key(s) for s in slugs])
    except Exception:
        pass


def cache_invalidate_all() -> None:
    try:
        r = _redis()
        keys = r.keys("cms:page:*")
        if keys:
            r.delete(*keys)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

def create_page(db: Session, *, data: CMSPageCreate) -> CMSPage:
    page = CMSPage(**data.model_dump())
    db.add(page)
    db.flush()
    return page


def get_page_by_slug(db: Session, slug: str) -> CMSPage | None:
    return db.scalar(select(CMSPage).where(CMSPage.slug == slug))


def get_page_by_id(db: Session, page_id: uuid.UUID) -> CMSPage | None:
    return db.scalar(select(CMSPage).where(CMSPage.id == page_id))


def list_pages(
    db: Session,
    *,
    status: str | None = None,
    page_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[CMSPage]:
    q = select(CMSPage).order_by(CMSPage.updated_at.desc())
    if status:
        q = q.where(CMSPage.status == status)
    if page_type:
        q = q.where(CMSPage.page_type == page_type)
    q = q.limit(limit).offset(offset)
    return list(db.scalars(q).all())


def update_page(db: Session, *, page: CMSPage, patch: CMSPagePatch) -> CMSPage:
    updates = patch.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(page, field, value)
    if updates.get("status") == "published" and page.published_at is None:
        page.published_at = datetime.now(timezone.utc)
    db.flush()
    cache_invalidate([page.slug])
    return page


def delete_page(db: Session, *, page: CMSPage) -> None:
    cache_invalidate([page.slug])
    db.delete(page)
    db.flush()


def upsert_page_from_draft(db: Session, *, draft: ContentDraft) -> CMSPage:
    """Create or update a CMSPage from a ContentDraft at publish time."""
    existing = get_page_by_slug(db, draft.slug)
    content_html = draft.optimized_content or draft.content_markdown

    if existing:
        existing.title = draft.title
        existing.content_html = content_html
        existing.seo_title = draft.meta_title
        existing.seo_description = draft.meta_description
        existing.status = "published"
        existing.published_at = datetime.now(timezone.utc)
        existing.brief_id = draft.brief_id
        db.flush()
        cache_invalidate([existing.slug])
        return existing

    page = CMSPage(
        slug=draft.slug,
        page_type="trek_guide",
        title=draft.title,
        content_html=content_html,
        seo_title=draft.meta_title,
        seo_description=draft.meta_description,
        status="published",
        published_at=datetime.now(timezone.utc),
        brief_id=draft.brief_id,
    )
    db.add(page)
    db.flush()
    return page
