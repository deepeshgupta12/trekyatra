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


def get_trending_queries(db: Session, limit: int = 10) -> list[str]:
    """Return the most frequently searched queries from the last 7 days."""
    from sqlalchemy import text

    rows = db.execute(
        text(
            "SELECT query, COUNT(*) as cnt FROM search_events "
            "WHERE created_at > NOW() - INTERVAL '7 days' "
            "GROUP BY query ORDER BY cnt DESC LIMIT :lim"
        ),
        {"lim": limit},
    ).fetchall()
    return [r[0] for r in rows]
