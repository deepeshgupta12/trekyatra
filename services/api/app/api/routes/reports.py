from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin, get_current_user
from app.modules.auth.models import User
from app.modules.reports import service
from app.modules.reports.schemas import (
    MediaUploadOut,
    ModerationIn,
    ReportIn,
    ReportOut,
    ReportPageOut,
)

# ── Public routes ──────────────────────────────────────────────────────────────
public_router = APIRouter(tags=["reports-public"])


@public_router.get("/public/treks/{slug}/reports", response_model=ReportPageOut)
def list_trek_reports(
    slug: str,
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    return service.get_reports_for_trek(db, slug, page=page)


# ── Auth-required routes ───────────────────────────────────────────────────────
auth_router = APIRouter(tags=["reports"])


@auth_router.post("/reports", response_model=ReportOut, status_code=201)
def create_report(
    report_in: ReportIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.create_report(db, current_user.id, report_in)


@auth_router.post("/reports/media/upload", response_model=MediaUploadOut)
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.upload_media(db, current_user.id, file)


@auth_router.delete("/reports/{report_id}", status_code=204)
def delete_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.delete_report(db, report_id, current_user.id)


# ── Admin routes ───────────────────────────────────────────────────────────────
admin_router = APIRouter(prefix="/admin", tags=["reports-admin"])


@admin_router.get("/reports", dependencies=[Depends(get_current_admin)])
def get_moderation_queue(
    status: str = Query("pending"),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    return service.get_moderation_queue(db, status=status, page=page)


@admin_router.patch("/reports/{report_id}/moderate", response_model=ReportOut)
def moderate_report(
    report_id: uuid.UUID,
    moderation: ModerationIn,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    # get_current_admin returns a JWT dict payload, not a User — moderated_by is optional
    return service.moderate_report(db, report_id, None, moderation)
