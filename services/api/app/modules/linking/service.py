from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, not_, select
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage
from app.modules.linking.models import Page, PageLink

logger = logging.getLogger(__name__)

# Relevance ordering: pages in the same cluster ranked by this type order
_PAGE_TYPE_PRIORITY = [
    "trek_guide",
    "permit_guide",
    "packing_list",
    "comparison",
    "seasonal",
    "beginner_guide",
]


def _page_type_from_cms(cms_page: CMSPage) -> str:
    """Derive a page_type from the CMS page_type field."""
    mapping = {
        "trek_guide": "trek_guide",
        "packing_list": "packing_list",
        "permit_guide": "permit_guide",
        "beginner_guide": "beginner_guide",
        "seasonal": "seasonal",
        "comparison": "comparison",
    }
    return mapping.get(cms_page.page_type, "trek_guide")


def sync_pages_from_cms(db: Session) -> int:
    """Upsert rows in `pages` from all published cms_pages. Returns count synced."""
    published = db.scalars(
        select(CMSPage).where(CMSPage.status == "published")
    ).all()

    now = datetime.now(timezone.utc)
    synced = 0
    for cms in published:
        existing = db.scalar(select(Page).where(Page.slug == cms.slug))
        if existing:
            existing.title = cms.title
            existing.page_type = _page_type_from_cms(cms)
            existing.published_at = cms.published_at
            existing.cluster_id = cms.cluster_id
            existing.cms_page_id = cms.id
            existing.indexed_at = now
        else:
            page = Page(
                id=uuid.uuid4(),
                slug=cms.slug,
                title=cms.title,
                page_type=_page_type_from_cms(cms),
                published_at=cms.published_at,
                cluster_id=cms.cluster_id,
                cms_page_id=cms.id,
                indexed_at=now,
                created_at=now,
            )
            db.add(page)
        synced += 1

    db.flush()
    logger.info("sync_pages_from_cms: synced %d pages", synced)
    return synced


def get_related_pages(db: Session, *, slug: str, limit: int = 5) -> list[Page]:
    """Return pages related to the given slug.

    Primary: pages sharing the same cluster_id, ordered by page_type priority.
    Fallback: most-recent pages of the same page_type when no cluster match.
    """
    source = db.scalar(select(Page).where(Page.slug == slug))
    if source is None:
        return []

    # Primary: same cluster
    if source.cluster_id:
        siblings = db.scalars(
            select(Page)
            .where(Page.cluster_id == source.cluster_id, Page.id != source.id)
            .order_by(Page.published_at.desc())
            .limit(limit)
        ).all()
        if siblings:
            return list(siblings)

    # Fallback: same page_type, most recent
    return list(db.scalars(
        select(Page)
        .where(Page.page_type == source.page_type, Page.id != source.id)
        .order_by(Page.published_at.desc())
        .limit(limit)
    ).all())


def get_orphan_pages(db: Session) -> list[Page]:
    """Published pages with zero inbound page_links (no other page links TO them)."""
    inbound_ids = select(PageLink.to_page_id).distinct()
    return list(db.scalars(
        select(Page)
        .where(
            Page.published_at.is_not(None),
            not_(Page.id.in_(inbound_ids)),
        )
        .order_by(Page.created_at.desc())
    ).all())


def get_anchor_suggestions(db: Session, *, slug: str) -> list[dict]:
    """Return candidate anchor text variants for the given page slug."""
    page = db.scalar(select(Page).where(Page.slug == slug))
    if page is None:
        return []

    suggestions: list[dict] = []
    title = page.title

    # Full title
    suggestions.append({"text": title, "reason": "page title"})

    # First three words of the title
    words = title.split()
    if len(words) >= 3:
        suggestions.append({"text": " ".join(words[:3]), "reason": "title prefix"})

    # Page-type suffix variant
    type_labels = {
        "trek_guide": "trek guide",
        "packing_list": "packing list",
        "permit_guide": "trekking permit",
        "beginner_guide": "beginner guide",
        "comparison": "comparison",
        "seasonal": "seasonal guide",
    }
    label = type_labels.get(page.page_type)
    if label and label.lower() not in title.lower():
        suggestions.append({"text": f"{title} — {label}", "reason": "page type suffix"})

    # Slug-based variant (human-readable)
    slug_readable = slug.replace("-", " ")
    if slug_readable.lower() != title.lower():
        suggestions.append({"text": slug_readable, "reason": "slug readable form"})

    return suggestions[:4]
