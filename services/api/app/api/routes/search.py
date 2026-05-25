"""Search API endpoints — Step 44 + Step 58 (Semantic Search Phase 2).

POST /search/log          — record a search query + optional result click
GET  /search/suggestions  — CMS-powered autocomplete across all page types
GET  /search/trending     — most-searched queries in the last 7 days
POST /search/semantic     — Step 58: pgvector semantic search + text hybrid
"""
from __future__ import annotations

import logging
import re
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.search import service as search_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["search"])


class SearchLogRequest(BaseModel):
    query: str
    results_count: int = 0
    session_id: str | None = None
    clicked_slug: str | None = None
    clicked_page_type: str | None = None


class SearchSuggestion(BaseModel):
    slug: str
    title: str
    page_type: str
    hero_image_url: str | None
    seo_description: str | None


@router.post("/log", status_code=204)
def log_search(
    payload: SearchLogRequest,
    db: Session = Depends(get_db),
) -> None:
    """Record a search query for analytics. Returns 204 — fire-and-forget from frontend."""
    if not payload.query.strip():
        return
    search_service.log_search_event(
        db,
        query=payload.query,
        results_count=payload.results_count,
        session_id=payload.session_id,
        clicked_slug=payload.clicked_slug,
        clicked_page_type=payload.clicked_page_type,
    )


@router.get("/suggestions", response_model=list[SearchSuggestion])
def search_suggestions(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(default=8, ge=1, le=20),
    db: Session = Depends(get_db),
) -> list[SearchSuggestion]:
    """Return CMS page suggestions matching the query (all page types, not just treks)."""
    items = search_service.get_cms_suggestions(db, q, limit=limit)
    return [SearchSuggestion(**item) for item in items]


@router.get("/trending", response_model=list[str])
def trending_queries(
    limit: int = Query(default=10, ge=1, le=30),
    db: Session = Depends(get_db),
) -> list[str]:
    """Return the most frequently searched queries in the last 7 days."""
    return search_service.get_trending_queries(db, limit=limit)


# ── Step 58: Semantic Search ──────────────────────────────────────────────────

class SemanticSearchRequest(BaseModel):
    q: str
    page_type: str | None = None   # "trek_guide" | "packing_list" | etc. — None = all
    limit: int = 8


class SemanticSearchResult(BaseModel):
    slug: str
    title: str
    page_type: str
    hero_image_url: str | None = None
    seo_description: str | None = None
    trek_state: str | None = None
    trek_difficulty: str | None = None
    trek_duration: str | None = None
    trek_season: str | None = None
    trek_suitability: str | None = None
    score: float = 0.0
    matched_by: str = "text"  # "semantic" | "text" | "hybrid"


# ── Intent detection ──────────────────────────────────────────────────────────
_CITY_TO_REGION = {
    "delhi": "Uttarakhand", "mumbai": "Maharashtra", "pune": "Maharashtra",
    "bangalore": "Karnataka", "bengaluru": "Karnataka",
    "chennai": "Tamil Nadu", "kolkata": "West Bengal",
}
_SEASON_MONTHS = {
    "winter": ["Nov", "Dec", "Jan", "Feb", "Mar"],
    "summer": ["Apr", "May", "Jun"],
    "monsoon": ["Jun", "Jul", "Aug", "Sep"],
    "autumn": ["Sep", "Oct", "Nov"],
    "spring": ["Mar", "Apr", "May"],
}
_DIFF_KEYWORDS = {
    "beginner": "Easy", "easy": "Easy", "first-time": "Easy",
    "moderate": "Moderate", "intermediate": "Moderate",
    "difficult": "Difficult", "challenging": "Challenging", "expert": "Challenging",
}


def _detect_intent(q: str) -> dict[str, Any]:
    """Extract structured filters from natural-language query."""
    ql = q.lower()
    intent: dict[str, Any] = {}
    # Season/month detection
    for season, months in _SEASON_MONTHS.items():
        if season in ql:
            intent["season_months"] = months
            break
    for abbr in ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]:
        if abbr in ql:
            intent.setdefault("season_months", []).append(abbr.capitalize())
    # Difficulty
    for kw, diff in _DIFF_KEYWORDS.items():
        if kw in ql:
            intent["difficulty"] = diff
            break
    # Region from city
    for city, region in _CITY_TO_REGION.items():
        if city in ql:
            intent["region"] = region
            break
    # Duration
    dm = re.search(r"(\d+)\s*day", ql)
    if dm:
        intent["duration_days"] = int(dm.group(1))
    # Weekend detection
    if "weekend" in ql:
        intent["duration_days_max"] = 2
    return intent


@router.post("/semantic", response_model=list[SemanticSearchResult])
def semantic_search(
    payload: SemanticSearchRequest,
    db: Session = Depends(get_db),
) -> list[SemanticSearchResult]:
    """Step 58 — Hybrid semantic + text search.

    For queries ≥ 5 chars:
    1. Detect structured intent (season, difficulty, region, duration)
    2. Try pgvector cosine similarity if OpenAI key is available
    3. Fall back / supplement with CMS text search
    4. Merge results, apply intent filters, rank by hybrid score
    """
    from app.modules.agents.embedding.agent import generate_embedding
    from app.modules.cms.models import CMSPage
    from sqlalchemy import select, func

    q = payload.q.strip()
    if len(q) < 2:
        return []

    intent = _detect_intent(q)
    limit = min(payload.limit, 20)

    # ── Phase A: pgvector semantic search ───────────────────────────────────
    semantic_results: list[dict] = []
    try:
        embedding = generate_embedding(q)
        if embedding is not None:
            vec_str = "[" + ",".join(str(x) for x in embedding) + "]"
            pt_filter = f"AND page_type = '{payload.page_type}'" if payload.page_type else ""
            rows = db.execute(
                text(
                    "SELECT slug, title, page_type, hero_image_url, seo_description, "
                    "trek_state, trek_difficulty, trek_duration, trek_season, trek_suitability, "
                    "1 - (embedding <=> CAST(:emb AS vector(1536))) AS sim "
                    "FROM cms_pages "
                    f"WHERE status = 'published' AND page_type != 'editorial' {pt_filter}"
                    "AND embedding IS NOT NULL "
                    "ORDER BY sim DESC LIMIT :lim"
                ),
                {"emb": vec_str, "lim": limit * 2},
            ).fetchall()
            for r in rows:
                semantic_results.append({
                    "slug": r[0], "title": r[1], "page_type": r[2],
                    "hero_image_url": r[3], "seo_description": r[4],
                    "trek_state": r[5], "trek_difficulty": r[6],
                    "trek_duration": r[7], "trek_season": r[8], "trek_suitability": r[9],
                    "score": float(r[10]) * 0.6,  # 60% weight
                    "matched_by": "semantic",
                })
    except Exception as exc:
        logger.debug("Semantic search skipped: %s", exc)

    # ── Phase B: Text search (CMS title/description substring + trek_* fields) ─
    text_results: list[dict] = []
    try:
        pt_filter = CMSPage.page_type == payload.page_type if payload.page_type else CMSPage.page_type != "editorial"
        text_q = f"%{q.lower()}%"
        rows_text = db.scalars(
            select(CMSPage).where(
                CMSPage.status == "published",
                pt_filter,
                (
                    func.lower(CMSPage.title).contains(q.lower()) |
                    func.lower(CMSPage.seo_description).contains(q.lower()) |
                    func.lower(CMSPage.trek_state).contains(q.lower()) |
                    func.lower(CMSPage.trek_difficulty).contains(q.lower()) |
                    func.lower(CMSPage.trek_season).contains(q.lower()) |
                    func.lower(CMSPage.trek_suitability).contains(q.lower())
                ),
            ).order_by(CMSPage.published_at.desc()).limit(limit * 2)
        ).all()
        for page in rows_text:
            # Title match gets 0.4, other field match gets 0.2
            title_match = q.lower() in (page.title or "").lower()
            text_score = 0.2 * 0.4 if title_match else 0.2 * 0.2
            text_results.append({
                "slug": page.slug, "title": page.title, "page_type": page.page_type,
                "hero_image_url": page.hero_image_url, "seo_description": page.seo_description,
                "trek_state": page.trek_state, "trek_difficulty": page.trek_difficulty,
                "trek_duration": page.trek_duration, "trek_season": page.trek_season,
                "trek_suitability": page.trek_suitability,
                "score": text_score, "matched_by": "text",
            })
    except Exception as exc:
        logger.debug("Text search failed: %s", exc)

    # ── Merge: de-duplicate by slug, semantic score takes precedence ─────────
    merged: dict[str, dict] = {}
    for r in semantic_results:
        merged[r["slug"]] = r
    for r in text_results:
        if r["slug"] in merged:
            merged[r["slug"]]["score"] += r["score"]
            merged[r["slug"]]["matched_by"] = "hybrid"
        else:
            merged[r["slug"]] = r

    results = sorted(merged.values(), key=lambda x: x["score"], reverse=True)

    # ── Apply intent filters (graceful: if a filter removes all results, it is skipped) ──
    all_results = list(results)  # keep unfiltered copy for fallback

    if intent.get("season_months"):
        season_months = [m.lower() for m in intent["season_months"]]
        season_filtered = [
            r for r in results
            if r.get("trek_season") and any(
                m in (r["trek_season"] or "").lower() for m in season_months
            )
        ]
        if season_filtered:
            results = season_filtered
        # else: no CMS pages have trek_season set — skip filter gracefully

    if intent.get("region"):
        region_filtered = [
            r for r in results
            if r.get("trek_state") and intent["region"].lower() in r["trek_state"].lower()
        ]
        if region_filtered:
            results = region_filtered

    if intent.get("difficulty"):
        diff_filtered = [
            r for r in results
            if not r.get("trek_difficulty")
            or intent["difficulty"].lower() in r["trek_difficulty"].lower()
        ]
        if diff_filtered:
            results = diff_filtered

    if intent.get("duration_days"):
        target = int(intent["duration_days"])
        dur_filtered = [
            r for r in results
            if r.get("trek_duration") and str(target) in (r["trek_duration"] or "")
        ]
        if dur_filtered:
            results = dur_filtered

    return [SemanticSearchResult(**r) for r in results[:limit]]
