"""Admin push notification endpoints (M14)."""
from __future__ import annotations

import asyncio
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.notifications.service import get_devices_for_users, get_push_logs, send_batch_push

router = APIRouter(prefix="/admin/push", tags=["admin-push"])


class PushSendRequest(BaseModel):
    user_ids: Optional[list[uuid.UUID]] = None
    title: str
    body: str
    data: dict = {}
    category: str = "admin_broadcast"


class PushSendResponse(BaseModel):
    sent: int
    failed: int
    skipped: int


class PushLogItem(BaseModel):
    id: uuid.UUID
    device_id: Optional[uuid.UUID]
    title: Optional[str]
    body: Optional[str]
    category: Optional[str]
    status: str
    sent_at: str
    error: Optional[str]

    model_config = {"from_attributes": True}


@router.post("/send", response_model=PushSendResponse)
def admin_send_push(
    body: PushSendRequest,
    db: Session = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
) -> PushSendResponse:
    if body.user_ids:
        devices = get_devices_for_users(db, body.user_ids)
    else:
        from app.modules.mobile.models import MobileDevice
        devices = db.query(MobileDevice).all()

    if not devices:
        raise HTTPException(status_code=404, detail="No devices found for target")

    result = asyncio.run(
        send_batch_push(db, devices, body.title, body.body, body.data, body.category)
    )
    return PushSendResponse(**result)


@router.get("/logs", response_model=list[PushLogItem])
def admin_push_logs(
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
) -> list[PushLogItem]:
    logs = get_push_logs(db, limit=limit, category=category)
    return [
        PushLogItem(
            id=log.id,
            device_id=log.device_id,
            title=log.title,
            body=log.body,
            category=log.category,
            status=log.status,
            sent_at=log.sent_at.isoformat(),
            error=log.error,
        )
        for log in logs
    ]
