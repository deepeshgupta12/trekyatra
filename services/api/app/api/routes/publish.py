from __future__ import annotations

import uuid

from app.modules.auth.dependencies import require_editor
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.publish.service import get_publish_logs, publish_to_cms, update_draft_status
from app.schemas.publish import DraftPublishResponse, DraftStatusPatch, PublishLogResponse

router = APIRouter(prefix="/admin/drafts", tags=["publish"], dependencies=[Depends(require_editor)])


@router.patch("/{draft_id}/status", response_model=dict)
def patch_draft_status(
    draft_id: uuid.UUID,
    body: DraftStatusPatch,
    db: Session = Depends(get_db),
) -> dict:
    try:
        draft = update_draft_status(db, draft_id=draft_id, new_status=body.status)
        db.commit()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"id": str(draft.id), "status": draft.status}


@router.post("/{draft_id}/publish", response_model=DraftPublishResponse)
def publish_draft(
    draft_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> DraftPublishResponse:
    try:
        result = publish_to_cms(db, draft_id=draft_id)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result


@router.get("/{draft_id}/publish-log", response_model=list[PublishLogResponse])
def get_draft_publish_log(
    draft_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> list[PublishLogResponse]:
    return get_publish_logs(db, draft_id=draft_id)
