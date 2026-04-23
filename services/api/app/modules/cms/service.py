from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

import markdown as md_lib
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
    payload = data.model_dump()
    payload["content_json"] = _process_content_json(payload.get("content_json"))
    page = CMSPage(**payload)
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
    if "content_json" in updates:
        updates["content_json"] = _process_content_json(updates["content_json"])
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


def _md_to_html(text: str | None) -> str:
    if not text:
        return ""
    return md_lib.markdown(
        text,
        extensions=["extra", "tables", "nl2br", "sane_lists"],
    )


# Maps regex patterns (matched against lowercase H2/H3 headings) to section keys.
_SECTION_HEADING_MAP: list[tuple[str, str]] = [
    (r"why.*trek|why.*special|introduction|hidden gem", "why_this_trek"),
    (r"altitude.*distance|route.*glance|trail overview|route overview", "route_overview"),
    (r"itinerary|day.wise|day by day|what each day", "itinerary"),
    (r"best time|when to go|season|visit.*time", "best_time"),
    (r"difficulty|fitness|experience required", "difficulty"),
    (r"permit", "permits"),
    (r"cost|budget|price|fee|expense", "cost_estimate"),
    (r"pack|gear|equipment|what to bring|what to carry", "packing"),
    (r"safety|emergency|risk|precaution", "safety"),
    (r"faq|frequently asked|questions answered|common question", "faqs"),
]


def _parse_sections_from_markdown(text: str) -> dict[str, str]:
    """Split a markdown document into named sections keyed by content type."""
    sections: dict[str, list[str]] = {}
    current_key: str | None = None
    current_lines: list[str] = []

    for line in text.splitlines():
        m = re.match(r"^#{1,3}\s+(.+)$", line)
        if m:
            if current_key and current_lines:
                sections.setdefault(current_key, []).extend(current_lines)
            heading = m.group(1).lower()
            current_key = None
            for pattern, key in _SECTION_HEADING_MAP:
                if re.search(pattern, heading):
                    current_key = key
                    break
            current_lines = []
        elif current_key is not None:
            current_lines.append(line)

    if current_key and current_lines:
        sections.setdefault(current_key, []).extend(current_lines)

    return {k: _md_to_html("\n".join(v).strip()) for k, v in sections.items() if v}


def _process_content_json(content_json: dict | None) -> dict | None:
    """Convert any markdown strings inside content_json.sections to HTML."""
    if not content_json:
        return content_json
    sections = content_json.get("sections")
    if isinstance(sections, dict):
        content_json = {
            **content_json,
            "sections": {
                k: _md_to_html(v) if isinstance(v, str) else v
                for k, v in sections.items()
            },
        }
    return content_json


def upsert_page_from_draft(db: Session, *, draft: ContentDraft) -> CMSPage:
    """Create or update a CMSPage from a ContentDraft at publish time."""
    existing = get_page_by_slug(db, draft.slug)
    raw_markdown = draft.optimized_content or draft.content_markdown or ""
    content_html = _md_to_html(raw_markdown)
    sections = _parse_sections_from_markdown(raw_markdown)
    content_json = {"sections": sections} if sections else None

    if existing:
        existing.title = draft.title
        existing.content_html = content_html
        existing.content_json = content_json
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
        content_json=content_json,
        seo_title=draft.meta_title,
        seo_description=draft.meta_description,
        status="published",
        published_at=datetime.now(timezone.utc),
        brief_id=draft.brief_id,
    )
    db.add(page)
    db.flush()
    return page
