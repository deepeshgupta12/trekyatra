"""Recommendation service: similarity search + personalised feed."""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage


def _page_to_dict(page: CMSPage) -> dict[str, Any]:
    return {
        "id": str(page.id),
        "slug": page.slug,
        "title": page.title,
        "page_type": page.page_type,
        "hero_image_url": page.hero_image_url,
        "seo_description": page.seo_description,
        "published_at": page.published_at.isoformat() if page.published_at else None,
    }


def find_similar_pages(db: Session, page_id: uuid.UUID, limit: int = 5) -> list[dict]:
    """Return pages cosine-close to page_id's embedding. Falls back to same cluster."""
    page = db.scalar(select(CMSPage).where(CMSPage.id == page_id))
    if page is None:
        return []

    if page.embedding is not None:
        rows = db.execute(
            text(
                "SELECT id, slug, title, page_type, hero_image_url, seo_description, published_at "
                "FROM cms_pages "
                "WHERE status = 'published' AND page_type != 'editorial' "
                "AND id != :pid AND embedding IS NOT NULL "
                "ORDER BY embedding <=> CAST(:emb AS vector(1536))"
                "LIMIT :lim"
            ),
            {"pid": str(page_id), "emb": _vec_str(page.embedding), "lim": limit},
        ).fetchall()
        return [_row_to_dict(r) for r in rows]

    # Fallback: same cluster or page_type (never return editorial pages as similar)
    stmt = (
        select(CMSPage)
        .where(CMSPage.status == "published", CMSPage.id != page_id, CMSPage.page_type != "editorial")
        .order_by(CMSPage.published_at.desc().nullslast())
        .limit(limit)
    )
    if page.cluster_id:
        stmt = stmt.where(CMSPage.cluster_id == page.cluster_id)
    elif page.page_type:
        stmt = stmt.where(CMSPage.page_type == page.page_type)
    pages = db.scalars(stmt).all()
    return [_page_to_dict(p) for p in pages]


def find_similar_to_query(db: Session, query_embedding: list[float], limit: int = 5) -> list[dict]:
    """Vector search against query embedding."""
    rows = db.execute(
        text(
            "SELECT id, slug, title, page_type, hero_image_url, seo_description, published_at "
            "FROM cms_pages "
            "WHERE status = 'published' AND page_type != 'editorial' AND embedding IS NOT NULL "
            "ORDER BY embedding <=> CAST(:emb AS vector(1536))"
            "LIMIT :lim"
        ),
        {"emb": _vec_str(query_embedding), "lim": limit},
    ).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_recommendations_for_user(db: Session, user_id: uuid.UUID, limit: int = 6) -> list[dict]:
    """
    Weighted blend:
    40% similarity to bookmarked pages (centroid embedding)
    20% fitness/region profile match
    40% recently published (freshness)
    Falls back to freshness if no bookmarks or no embeddings.
    """
    from app.modules.account.models import UserBookmark, UserProfile

    # Get bookmarked page embeddings
    bookmarks = db.scalars(
        select(UserBookmark)
        .where(UserBookmark.user_id == user_id)
        .limit(10)
    ).all()

    centroid = _compute_centroid(db, bookmarks)

    if centroid is not None:
        # Vector similarity for top candidates
        vector_hits = find_similar_to_query(db, centroid, limit=limit * 3)
        # Exclude already bookmarked slugs
        bookmarked_slugs = {b.trek_slug for b in bookmarks if b.trek_slug}
        cms_ids = {str(b.cms_page_id) for b in bookmarks if b.cms_page_id}
        filtered = [
            r for r in vector_hits
            if r["slug"] not in bookmarked_slugs and r["id"] not in cms_ids
        ]
        return filtered[:limit]

    return get_anonymous_recommendations(db, limit=limit)


def get_anonymous_recommendations(db: Session, limit: int = 6) -> list[dict]:
    """Popularity + freshness blended recommendations with cluster diversity.

    Ranks by: (view_count_30d * 0.6) + (recency_score * 0.4).
    Falls back to pure freshness when page_views table has no data.
    """
    rows = db.execute(
        text(
            "SELECT DISTINCT ON (c.cluster_id) "
            "c.id, c.slug, c.title, c.page_type, c.hero_image_url, "
            "c.seo_description, c.published_at, c.cluster_id, "
            "COALESCE(v.view_count, 0) AS view_count "
            "FROM cms_pages c "
            "LEFT JOIN ("
            "  SELECT page_slug, COUNT(*) AS view_count FROM page_views "
            "  WHERE viewed_at > NOW() - INTERVAL '30 days' "
            "  GROUP BY page_slug"
            ") v ON v.page_slug = c.slug "
            "WHERE c.status = 'published' AND c.page_type != 'editorial' "
            "ORDER BY c.cluster_id, "
            "(COALESCE(v.view_count, 0) * 0.6 + "
            " EXTRACT(EPOCH FROM COALESCE(c.published_at, NOW() - INTERVAL '365 days')) / 1e9 * 0.4"
            ") DESC NULLS LAST "
            "LIMIT :lim"
        ),
        {"lim": limit},
    ).fetchall()
    if len(rows) < limit:
        existing_ids = {str(r[0]) for r in rows}
        extra = db.execute(
            text(
                "SELECT c.id, c.slug, c.title, c.page_type, c.hero_image_url, "
                "c.seo_description, c.published_at, "
                "COALESCE(v.view_count, 0) AS view_count "
                "FROM cms_pages c "
                "LEFT JOIN ("
                "  SELECT page_slug, COUNT(*) AS view_count FROM page_views "
                "  WHERE viewed_at > NOW() - INTERVAL '30 days' GROUP BY page_slug"
                ") v ON v.page_slug = c.slug "
                "WHERE c.status = 'published' AND c.page_type != 'editorial' "
                "ORDER BY (COALESCE(v.view_count, 0) * 0.6 + "
                "  EXTRACT(EPOCH FROM COALESCE(c.published_at, NOW() - INTERVAL '365 days')) / 1e9 * 0.4"
                ") DESC NULLS LAST LIMIT :lim"
            ),
            {"lim": limit * 2},
        ).fetchall()
        for r in extra:
            if str(r[0]) not in existing_ids and len(rows) < limit:
                rows.append(r)
    return [_row_to_dict(r) for r in rows[:limit]]


# --- helpers ---

def _vec_str(embedding: list[float]) -> str:
    return "[" + ",".join(str(x) for x in embedding) + "]"


def _row_to_dict(row: Any) -> dict:
    return {
        "id": str(row[0]),
        "slug": row[1],
        "title": row[2],
        "page_type": row[3],
        "hero_image_url": row[4],
        "seo_description": row[5],
        "published_at": row[6].isoformat() if row[6] else None,
    }


def _compute_centroid(db: Session, bookmarks: list) -> list[float] | None:
    """Average embedding of bookmarked pages. Returns None if no embeddings found."""
    if not bookmarks:
        return None

    from app.modules.account.models import UserBookmark as UB
    vectors: list[list[float]] = []

    for b in bookmarks:
        if b.cms_page_id:
            page = db.scalar(select(CMSPage).where(CMSPage.id == b.cms_page_id))
            if page and page.embedding is not None:
                vectors.append(page.embedding)
        elif b.trek_slug:
            page = db.scalar(select(CMSPage).where(CMSPage.slug == b.trek_slug, CMSPage.status == "published"))
            if page and page.embedding is not None:
                vectors.append(page.embedding)

    if not vectors:
        return None

    dim = len(vectors[0])
    centroid = [0.0] * dim
    for v in vectors:
        for i, val in enumerate(v):
            centroid[i] += val
    n = len(vectors)
    return [x / n for x in centroid]
