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


# Page types excluded from the linking graph entirely.
# Editorial/trust pages (privacy, terms, methodology, contact…) should not appear
# as "related content" alongside trek guides.
_EXCLUDED_FROM_LINKING = frozenset({
    "editorial",
    "regional_hub",
    "seasonal_hub",
    "cluster_hub",
    "region_listing",
    "premium_compendium",
})


def _page_type_from_cms(cms_page: CMSPage) -> str:
    """Derive a page_type for the linking graph from the CMS page_type field.

    Returns None for page types excluded from the linking graph.
    """
    mapping = {
        "trek_guide": "trek_guide",
        "packing_list": "packing_list",
        "permit_guide": "permit_guide",
        "beginner_guide": "beginner_guide",
        "beginner_roundup": "beginner_guide",
        "seasonal": "seasonal",
        "comparison": "comparison",
        "cost_guide": "comparison",
        "gear_guide": "comparison",
        "itinerary": "trek_guide",
        "safety_guide": "trek_guide",
        "expert_guide": "trek_guide",
    }
    return mapping.get(cms_page.page_type, "trek_guide")


def sync_pages_from_cms(db: Session) -> int:
    """Upsert rows in `pages` from all published cms_pages. Returns count synced.

    Editorial and hub pages are excluded — they must not appear in the internal
    linking graph or 'In this cluster' sidebars.
    """
    published = db.scalars(
        select(CMSPage).where(
            CMSPage.status == "published",
            ~CMSPage.page_type.in_(_EXCLUDED_FROM_LINKING),
        )
    ).all()

    now = datetime.now(timezone.utc)
    synced = 0
    for cms in published:
        if cms.page_type in _EXCLUDED_FROM_LINKING:
            continue  # safety guard
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

    Primary: pages sharing the same cluster_id (same trek/topic cluster).
    Fallback: most-recent pages of the same page_type.

    Editorial, hub, and policy pages are always excluded regardless of cluster.
    """
    source = db.scalar(select(Page).where(Page.slug == slug))
    if source is None:
        return []

    # Base filter: exclude page types that don't belong in a trek sidebar
    safe_types = list(
        {"trek_guide", "packing_list", "permit_guide", "beginner_guide", "comparison", "seasonal"}
        - _EXCLUDED_FROM_LINKING
    )

    # Primary: same cluster
    if source.cluster_id:
        siblings = db.scalars(
            select(Page)
            .where(
                Page.cluster_id == source.cluster_id,
                Page.id != source.id,
                Page.page_type.in_(safe_types),
            )
            .order_by(Page.published_at.desc())
            .limit(limit)
        ).all()
        if siblings:
            return list(siblings)

    # Fallback: same page_type, most recent, excluding self and editorial pages
    return list(db.scalars(
        select(Page)
        .where(
            Page.page_type == source.page_type,
            Page.id != source.id,
            Page.page_type.in_(safe_types),
        )
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
    """Return candidate anchor text variants with quality scores for the given page slug.

    Quality score (0.0–1.0): higher = better anchor text choice for SEO.
    """
    page = db.scalar(select(Page).where(Page.slug == slug))
    if page is None:
        return []

    suggestions: list[dict] = []
    title = page.title

    # Full title — highest quality: exact, natural language
    suggestions.append({"text": title, "reason": "page title", "quality": 0.9})

    # Slug-based variant — good alternative, maps directly to URL
    slug_readable = slug.replace("-", " ")
    if slug_readable.lower() != title.lower():
        suggestions.append({"text": slug_readable, "reason": "slug readable form", "quality": 0.7})

    # First three words of the title — concise, keyword-rich
    words = title.split()
    if len(words) >= 3:
        suggestions.append({"text": " ".join(words[:3]), "reason": "title prefix", "quality": 0.6})

    # Page-type suffix variant — descriptive but verbose
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
        suggestions.append({"text": f"{title} — {label}", "reason": "page type suffix", "quality": 0.5})

    # Sort by quality descending
    suggestions.sort(key=lambda s: s["quality"], reverse=True)
    return suggestions[:4]
