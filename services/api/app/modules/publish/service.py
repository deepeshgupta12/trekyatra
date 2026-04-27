from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.content.models import ContentDraft, PublishLog
from app.schemas.publish import DraftPublishResponse, PublishLogResponse

VALID_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["review"],
    "requires_review": ["review", "draft"],
    "review": ["approved", "draft"],
    "approved": ["published", "review"],
    "published": [],
}


def update_draft_status(db: Session, *, draft_id: uuid.UUID, new_status: str) -> ContentDraft:
    draft = db.scalar(select(ContentDraft).where(ContentDraft.id == draft_id))
    if draft is None:
        raise ValueError(f"Draft {draft_id} not found.")
    allowed = VALID_TRANSITIONS.get(draft.status, [])
    if new_status not in allowed:
        raise ValueError(
            f"Cannot transition from '{draft.status}' to '{new_status}'. "
            f"Allowed: {allowed or 'none'}."
        )
    draft.status = new_status
    db.flush()
    return draft


def publish_to_cms(db: Session, *, draft_id: uuid.UUID) -> DraftPublishResponse:
    """Publish an approved draft to the Master CMS (creates/updates a CMSPage record)."""
    from app.modules.cms.models import CMSPage
    from app.modules.cms.service import upsert_page_from_draft

    draft = db.scalar(select(ContentDraft).where(ContentDraft.id == draft_id))
    if draft is None:
        raise ValueError(f"Draft {draft_id} not found.")
    if draft.status != "approved":
        raise ValueError(f"Draft must be in 'approved' state to publish. Current: '{draft.status}'.")

    log = PublishLog(draft_id=draft.id, status="pending")
    db.add(log)
    db.flush()

    try:
        cms_page = upsert_page_from_draft(db, draft=draft)
    except Exception as exc:
        log.status = "failed"
        log.error_message = str(exc)
        log.completed_at = datetime.now(timezone.utc)
        db.flush()
        raise ValueError(f"CMS publish failed: {exc}") from exc

    published_url = f"/trek/{cms_page.slug}"

    log.status = "succeeded"
    log.cms_page_id = cms_page.id
    log.published_url = published_url
    log.completed_at = datetime.now(timezone.utc)

    draft.status = "published"
    draft.published_at = datetime.now(timezone.utc)
    draft.cms_page_id = cms_page.id
    db.flush()

    return DraftPublishResponse(
        draft_id=draft.id,
        status="succeeded",
        cms_page_id=cms_page.id,
        published_url=published_url,
        message="Draft published to Master CMS successfully.",
    )


def get_publish_logs(db: Session, *, draft_id: uuid.UUID) -> list[PublishLogResponse]:
    logs = db.scalars(
        select(PublishLog)
        .where(PublishLog.draft_id == draft_id)
        .order_by(PublishLog.created_at.desc())
    ).all()
    return [PublishLogResponse.model_validate(log) for log in logs]
