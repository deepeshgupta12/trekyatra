from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.content.models import ContentDraft, PublishLog
from app.modules.wordpress.client import WordPressClient, WordPressClientError
from app.schemas.publish import DraftPublishResponse, PublishLogResponse

VALID_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["review"],
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


def push_draft_to_wordpress(db: Session, *, draft_id: uuid.UUID) -> DraftPublishResponse:
    draft = db.scalar(select(ContentDraft).where(ContentDraft.id == draft_id))
    if draft is None:
        raise ValueError(f"Draft {draft_id} not found.")
    if draft.status != "approved":
        raise ValueError(f"Draft must be in 'approved' state to publish. Current: '{draft.status}'.")

    log = PublishLog(draft_id=draft.id, status="pending")
    db.add(log)
    db.flush()

    if not settings.wordpress_credentials_configured:
        log.status = "skipped"
        log.error_message = "WordPress credentials are not configured."
        log.completed_at = datetime.now(timezone.utc)
        draft.status = "published"
        draft.published_at = datetime.now(timezone.utc)
        db.flush()
        return DraftPublishResponse(
            draft_id=draft.id,
            status="skipped",
            message="WordPress not configured — draft marked published locally.",
        )

    client = WordPressClient(
        base_url=settings.wordpress_base_url,
        username=settings.wordpress_username,
        app_password=settings.wordpress_app_password,
        timeout_seconds=settings.wordpress_timeout_seconds,
        verify_ssl=settings.wordpress_verify_ssl,
    )

    try:
        result = client.create_post(
            title=draft.title,
            content=draft.content_markdown,
            slug=draft.slug,
            status="publish",
            excerpt=draft.excerpt,
        )
    except WordPressClientError as exc:
        log.status = "failed"
        log.error_message = str(exc)
        log.completed_at = datetime.now(timezone.utc)
        db.flush()
        raise ValueError(f"WordPress push failed: {exc}") from exc

    if not result.ok:
        error_msg = f"WordPress returned HTTP {result.status_code}: {result.message}"
        log.status = "failed"
        log.error_message = error_msg
        log.completed_at = datetime.now(timezone.utc)
        db.flush()
        raise ValueError(error_msg)

    payload = result.payload if isinstance(result.payload, dict) else {}
    wp_post_id: int | None = payload.get("id")
    wp_link: str | None = payload.get("link")

    log.status = "succeeded"
    log.wordpress_post_id = wp_post_id
    log.wordpress_url = wp_link
    log.completed_at = datetime.now(timezone.utc)

    draft.status = "published"
    draft.published_at = datetime.now(timezone.utc)
    draft.wordpress_post_id = wp_post_id
    db.flush()

    return DraftPublishResponse(
        draft_id=draft.id,
        status="succeeded",
        wordpress_post_id=wp_post_id,
        wordpress_url=wp_link,
        message="Draft published to WordPress successfully.",
    )


def get_publish_logs(db: Session, *, draft_id: uuid.UUID) -> list[PublishLogResponse]:
    logs = db.scalars(
        select(PublishLog)
        .where(PublishLog.draft_id == draft_id)
        .order_by(PublishLog.created_at.desc())
    ).all()
    return [PublishLogResponse.model_validate(log) for log in logs]
