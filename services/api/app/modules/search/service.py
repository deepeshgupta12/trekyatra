"""Search service — log events + CMS-powered suggestions.

Step 44: Discovery Engine Improvements.
"""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage
from app.modules.search.models import PageView, SearchEvent


def log_search_event(
    db: Session,
    *,
    query: str,
    results_count: int = 0,
    session_id: str | None = None,
    clicked_slug: str | None = None,
    clicked_page_type: str | None = None,
) -> SearchEvent:
    """Record a search query (and optional result click) for analytics."""
    event = SearchEvent(
        id=uuid.uuid4(),
        query=query.strip()[:512],
        results_count=results_count,
        session_id=session_id,
        clicked_slug=clicked_slug,
        clicked_page_type=clicked_page_type,
    )
    db.add(event)
    db.commit()
    return event


def get_cms_suggestions(db: Session, q: str, limit: int = 8) -> list[dict[str, Any]]:
    """Return published CMS pages whose title contains the search query.

    Returns minimal data for autocomplete: slug, title, page_type, hero_image_url.
    Falls back gracefully if query is too short.
    """
    q = q.strip()
    if len(q) < 2:
        return []

    rows = db.execute(
        select(
            CMSPage.slug,
            CMSPage.title,
            CMSPage.page_type,
            CMSPage.hero_image_url,
            CMSPage.seo_description,
        )
        .where(
            CMSPage.status == "published",
            CMSPage.page_type != "editorial",
            func.lower(CMSPage.title).contains(q.lower()),
        )
        .order_by(CMSPage.published_at.desc().nullslast())
        .limit(limit)
    ).all()

    return [
        {
            "slug": r.slug,
            "title": r.title,
            "page_type": r.page_type,
            "hero_image_url": r.hero_image_url,
            "seo_description": r.seo_description,
        }
        for r in rows
    ]


def record_page_view(
    db: Session,
    *,
    page_slug: str,
    page_type: str | None = None,
    session_id: str | None = None,
    user_id: uuid.UUID | None = None,
) -> PageView:
    """Record an anonymous or authenticated page view for popularity signals."""
    view = PageView(
        id=uuid.uuid4(),
        page_slug=page_slug.strip()[:255],
        page_type=page_type,
        session_id=session_id,
        user_id=user_id,
    )
    db.add(view)
    db.commit()
    return view


# Curated popular queries shown when real search-event data is insufficient.
# These represent TrekYatra's core content pillars and real user intents.
_CURATED_TRENDING = [
    "Kedarkantha trek",
    "Hampta Pass",
    "Valley of Flowers",
    "Chandrashila summit",
    "Roopkund trek",
    "Brahmatal trek",
    "Rupin Pass",
    "Kuari Pass",
    "Winter treks India",
    "Beginner treks Uttarakhand",
]


def get_trending_queries(db: Session, limit: int = 10) -> list[str]:
    """Return the most frequently searched queries from the last 7 days.

    Filters applied:
    - Query must be at least 3 characters (excludes partial keystrokes like 'ut')
    - Any query searched at least once is included (threshold lowered from 2→1
      so real user data surfaces immediately after launch)
    - When real data is sparse (< 3 results), curated popular queries fill the gap.
    """
    from sqlalchemy import text

    rows = db.execute(
        text(
            "SELECT query, COUNT(*) as cnt FROM search_events "
            "WHERE created_at > NOW() - INTERVAL '7 days' "
            "AND LENGTH(TRIM(query)) >= 3 "
            "GROUP BY query HAVING COUNT(*) >= 1 "
            "ORDER BY cnt DESC LIMIT :lim"
        ),
        {"lim": limit},
    ).fetchall()
    real_queries = [r[0] for r in rows]

    if len(real_queries) >= limit:
        return real_queries

    # Supplement with curated list when real data is sparse
    seen = set(q.lower() for q in real_queries)
    for curated in _CURATED_TRENDING:
        if curated.lower() not in seen:
            real_queries.append(curated)
            seen.add(curated.lower())
        if len(real_queries) >= limit:
            break

    return real_queries
