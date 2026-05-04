"""Recommendation endpoints: similar pages + personalised feed."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.cms.models import CMSPage
from app.modules.recommendations.service import (
    find_similar_pages,
    get_anonymous_recommendations,
    get_recommendations_for_user,
)
from app.modules.agents.embedding.agent import generate_embedding
from app.schemas.recommendations import RecommendationItem, RecommendationsResponse, SimilarPagesResponse

router = APIRouter(tags=["recommendations"])


@router.get("/pages/{slug}/similar", response_model=SimilarPagesResponse)
def similar_pages(slug: str, limit: int = 5, db: Session = Depends(get_db)):
    page = db.scalar(select(CMSPage).where(CMSPage.slug == slug, CMSPage.status == "published"))
    if page is None:
        # No CMS page for this slug yet — return popular pages as graceful fallback
        items = get_anonymous_recommendations(db, limit=min(limit, 10))
        return SimilarPagesResponse(page_slug=slug, items=[RecommendationItem(**i) for i in items])
    items = find_similar_pages(db, page.id, limit=min(limit, 10))
    return SimilarPagesResponse(page_slug=slug, items=[RecommendationItem(**i) for i in items])


@router.get("/account/recommendations", response_model=RecommendationsResponse)
def personalised_recommendations(
    limit: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = get_recommendations_for_user(db, current_user.id, limit=min(limit, 12))
    return RecommendationsResponse(personalised=True, items=[RecommendationItem(**i) for i in items])


@router.get("/recommendations", response_model=RecommendationsResponse)
def anonymous_recommendations(limit: int = 6, db: Session = Depends(get_db)):
    items = get_anonymous_recommendations(db, limit=min(limit, 12))
    return RecommendationsResponse(personalised=False, items=[RecommendationItem(**i) for i in items])


@router.get("/search", response_model=RecommendationsResponse)
def semantic_search(q: str = "", limit: int = 6, db: Session = Depends(get_db)):
    """Semantic vector search for long queries. Falls back to title keyword search."""
    from sqlalchemy import text as sa_text
    from app.modules.recommendations.service import find_similar_to_query, _vec_str

    if not q.strip():
        return RecommendationsResponse(personalised=False, items=[])

    words = q.strip().split()
    if len(words) > 3:
        # Attempt semantic search
        embedding = generate_embedding(q)
        if embedding is not None:
            items = find_similar_to_query(db, embedding, limit=min(limit, 12))
            return RecommendationsResponse(personalised=False, items=[RecommendationItem(**i) for i in items])

    # Keyword fallback — title ILIKE search
    rows = db.execute(
        sa_text(
            "SELECT id, slug, title, page_type, hero_image_url, seo_description, published_at "
            "FROM cms_pages WHERE status = 'published' AND title ILIKE :q "
            "ORDER BY published_at DESC NULLS LAST LIMIT :lim"
        ),
        {"q": f"%{q}%", "lim": min(limit, 12)},
    ).fetchall()
    from app.modules.recommendations.service import _row_to_dict
    items = [_row_to_dict(r) for r in rows]
    return RecommendationsResponse(personalised=False, items=[RecommendationItem(**i) for i in items])
