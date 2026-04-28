from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.db.session import SessionLocal
from app.modules.linking.models import Page
from app.modules.refresh.service import create_refresh_log, get_stale_pages, update_refresh_log
from app.worker.celery_app import celery_app


@celery_app.task(name="refresh.run_refresh", bind=True, max_retries=2, default_retry_delay=60)
def refresh_task(self, page_id: str, log_id: str, triggered_by: str = "manual") -> dict:
    """Re-run SEO/AEO optimization on a page's draft, then re-publish if clean."""
    from app.modules.agents.seo_aeo.agent import SEOAEOAgent
    from app.modules.cms.service import upsert_page_from_draft
    from app.modules.content.models import ContentDraft, DraftClaim

    page_uuid = uuid.UUID(page_id)
    log_uuid = uuid.UUID(log_id)

    with SessionLocal() as db:
        page = db.scalar(select(Page).where(Page.id == page_uuid))
        if page is None:
            update_refresh_log(db, log_id=log_uuid, result="failed", notes=f"Page {page_id} not found")
            db.commit()
            return {"result": "failed", "reason": "page_not_found"}

        if page.cms_page_id is None:
            update_refresh_log(db, log_id=log_uuid, result="failed", notes="Page has no linked CMS page")
            db.commit()
            return {"result": "failed", "reason": "no_cms_page"}

        # Find the latest draft for this CMS page
        draft = db.scalar(
            select(ContentDraft)
            .where(ContentDraft.cms_page_id == page.cms_page_id)
            .order_by(ContentDraft.updated_at.desc())
        )
        if draft is None:
            update_refresh_log(db, log_id=log_uuid, result="failed", notes="No draft found for CMS page")
            db.commit()
            return {"result": "failed", "reason": "no_draft"}

        # Re-run SEO/AEO optimization
        agent = SEOAEOAgent(db=db)
        result = agent.run(input_data={"draft_id": str(draft.id)})

        if result.get("errors"):
            notes = "; ".join(result["errors"])
            update_refresh_log(db, log_id=log_uuid, result="failed", notes=f"SEO agent error: {notes}")
            db.commit()
            return {"result": "failed", "reason": notes}

        # Check for any flagged claims — if present, gate on human review
        flagged = db.scalar(
            select(DraftClaim)
            .where(DraftClaim.draft_id == draft.id)
            .where(DraftClaim.flagged_for_review == True)  # noqa: E712
        )
        if flagged is not None:
            draft.status = "requires_review"
            db.flush()
            page.last_refreshed_at = datetime.now(timezone.utc)
            db.flush()
            update_refresh_log(
                db, log_id=log_uuid, result="flagged",
                notes="Draft has flagged claims — routed to requires_review for human approval"
            )
            db.commit()
            return {"result": "flagged", "draft_id": str(draft.id)}

        # No flags — re-publish to CMS
        try:
            upsert_page_from_draft(db, draft=draft)
        except Exception as exc:
            update_refresh_log(db, log_id=log_uuid, result="failed", notes=f"CMS upsert failed: {exc}")
            db.commit()
            return {"result": "failed", "reason": str(exc)}

        page.last_refreshed_at = datetime.now(timezone.utc)
        db.flush()
        update_refresh_log(
            db, log_id=log_uuid, result="refreshed",
            notes="Content re-optimized via SEO/AEO agent and CMS page updated"
        )
        db.commit()
        return {"result": "refreshed", "draft_id": str(draft.id)}


@celery_app.task(name="refresh.auto_refresh", bind=True, max_retries=1)
def auto_refresh_task(self) -> dict:
    """Daily beat: detect up to 5 stale pages and enqueue refresh tasks."""
    dispatched: list[dict] = []

    with SessionLocal() as db:
        stale = get_stale_pages(db, limit=5)
        if not stale:
            return {"queued": 0}

        page_log_pairs: list[tuple[str, str]] = []
        for page in stale:
            log = create_refresh_log(db, page_id=page.id, triggered_by="auto")
            page_log_pairs.append((str(page.id), str(log.id)))
        db.commit()

    # Dispatch after commit so log rows exist in DB
    for page_id, log_id in page_log_pairs:
        refresh_task.delay(page_id, log_id, "auto")
        dispatched.append({"page_id": page_id, "log_id": log_id})

    return {"queued": len(dispatched), "dispatched": dispatched}
