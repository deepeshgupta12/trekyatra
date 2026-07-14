"""Admin routes for trek comparison page generation (#8 / Step 81).

Public reads reuse the existing CMS endpoints (``GET /cms/pages/{slug}`` and
``GET /cms/pages?page_type=comparison``); these admin routes only trigger
generation/backfill. Comparison pages are auto-created on trek publish via the
``comparison.generate_for_trek`` Celery task — these endpoints are the manual
escape hatch + one-time backfill.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin

admin_router = APIRouter(
    prefix="/admin/comparisons",
    tags=["comparison-admin"],
    dependencies=[Depends(get_current_admin)],
)


@admin_router.post("/backfill")
def backfill_comparisons(db: Session = Depends(get_db)) -> dict:
    """Generate comparison pages for every published trek's same-state peers.
    Runs synchronously (idempotent, bounded) so the admin sees the count."""
    from app.modules.comparison.service import backfill_all_comparisons

    result = backfill_all_comparisons(db)
    db.commit()
    return result


@admin_router.post("/generate/{slug}")
def generate_for_trek(slug: str, db: Session = Depends(get_db)) -> dict:
    """Generate/refresh comparison pages pairing one trek with its same-state peers."""
    from app.modules.comparison.service import generate_comparisons_for_trek

    created = generate_comparisons_for_trek(db, slug)
    db.commit()
    return {"slug": slug, "comparison_pages": created}
