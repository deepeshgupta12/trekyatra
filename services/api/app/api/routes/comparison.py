"""Comparison routes (#8 / Step 81, rebuilt).

Public: list registered pairs + render a pair's comparison live from trek data
(no CMS pages). Admin: trigger pair curation / backfill. Comparison pairs are
auto-recorded on trek publish via the ``comparison.generate_for_trek`` Celery task.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin

public_router = APIRouter(prefix="/public/comparisons", tags=["comparison-public"])
admin_router = APIRouter(
    prefix="/admin/comparisons",
    tags=["comparison-admin"],
    dependencies=[Depends(get_current_admin)],
)


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------

@public_router.get("")
def list_comparisons(limit: int = Query(default=500, ge=1, le=1000), db: Session = Depends(get_db)) -> list[dict]:
    """Registered comparison pairs (both treks published) — powers the home
    section, sitemap, and generateStaticParams."""
    from app.modules.comparison.service import list_comparison_pairs

    return list_comparison_pairs(db, limit=limit)


@public_router.get("/{pair}")
def get_comparison(pair: str, db: Session = Depends(get_db)) -> dict:
    """Live comparison payload for a curated pair slug (computed from trek data).
    404 if the pair isn't registered or a trek is no longer published."""
    from app.modules.comparison.service import get_comparison_for_pair

    payload = get_comparison_for_pair(db, pair)
    if payload is None:
        raise HTTPException(status_code=404, detail="Comparison not found")
    return payload


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

@admin_router.post("/backfill")
def backfill_comparisons(db: Session = Depends(get_db)) -> dict:
    """Record comparison pairs for every published trek's same-state peers.
    Idempotent; runs synchronously so the admin sees the count."""
    from app.modules.comparison.service import backfill_all_comparisons

    result = backfill_all_comparisons(db)
    db.commit()
    return result


@admin_router.post("/generate/{slug}")
def generate_for_trek(slug: str, db: Session = Depends(get_db)) -> dict:
    """Record comparison pairs for one trek + its same-state peers."""
    from app.modules.comparison.service import generate_comparisons_for_trek

    created = generate_comparisons_for_trek(db, slug)
    db.commit()
    return {"slug": slug, "comparison_pairs": created}
