from __future__ import annotations

import io
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, UploadFile
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.reports.models import TrekMedia, TripReport
from app.modules.reports.schemas import (
    ConditionSummary,
    MediaUploadOut,
    ModerationIn,
    ReportIn,
    ReportOut,
    ReportPageOut,
)

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MB
_MAX_IMAGE_WIDTH = 1920


def _get_s3_client():
    import boto3

    return boto3.client(
        "s3",
        region_name=settings.do_spaces_region,
        endpoint_url=settings.do_spaces_endpoint,
        aws_access_key_id=settings.do_spaces_key,
        aws_secret_access_key=settings.do_spaces_secret,
    )


def _resize_image(data: bytes) -> tuple[bytes, int, int]:
    """Resize image to max 1920px wide, return (jpeg_bytes, width, height)."""
    from PIL import Image

    img = Image.open(io.BytesIO(data))
    img = img.convert("RGB")
    w, h = img.size
    if w > _MAX_IMAGE_WIDTH:
        ratio = _MAX_IMAGE_WIDTH / w
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
        w, h = img.size
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    return buf.getvalue(), w, h


def upload_media(db: Session, user_id: uuid.UUID, file: UploadFile) -> MediaUploadOut:
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are accepted")

    data = file.file.read()
    if len(data) > _MAX_FILE_BYTES:
        raise HTTPException(400, "Max file size is 5 MB")

    resized, width, height = _resize_image(data)

    key = f"reports/{user_id}/{uuid.uuid4()}.jpg"

    if settings.do_spaces_key and settings.do_spaces_bucket:
        s3 = _get_s3_client()
        s3.put_object(
            Bucket=settings.do_spaces_bucket,
            Key=key,
            Body=resized,
            ContentType="image/jpeg",
            ACL="public-read",
            CacheControl="public, max-age=31536000, immutable",
        )
        cdn_base = settings.do_spaces_cdn_endpoint or settings.do_spaces_endpoint or ""
        cdn_url = f"{cdn_base.rstrip('/')}/{key}"
    else:
        # Dev/test mode: return a placeholder URL without actual upload
        cdn_url = f"https://cdn.trekyatra.co.in/{key}"

    media = TrekMedia(
        user_id=user_id,
        trek_slug="",
        url=cdn_url,
        s3_key=key,
        width=width,
        height=height,
        file_size=len(resized),
    )
    db.add(media)
    db.commit()

    return MediaUploadOut(url=cdn_url, key=key)


def create_report(db: Session, user_id: uuid.UUID, report_in: ReportIn) -> ReportOut:
    report = TripReport(
        user_id=user_id,
        trek_slug=report_in.trek_slug,
        title=report_in.title,
        body=report_in.body,
        condition=report_in.condition,
        trek_date=report_in.trek_date,
        status="pending",
    )
    db.add(report)
    db.flush()  # get report.id before linking media

    for url in report_in.photo_urls:
        media = (
            db.query(TrekMedia)
            .filter(TrekMedia.url == url, TrekMedia.user_id == user_id, TrekMedia.report_id.is_(None))
            .first()
        )
        if media:
            media.report_id = report.id
            media.trek_slug = report_in.trek_slug
        else:
            # Photo uploaded externally or URL provided directly
            key = url.split("/reports/", 1)[-1] if "/reports/" in url else str(uuid.uuid4())
            db.add(TrekMedia(
                report_id=report.id,
                user_id=user_id,
                trek_slug=report_in.trek_slug,
                url=url,
                s3_key=f"reports/{key}",
            ))

    db.commit()
    db.refresh(report)
    return ReportOut.model_validate(report)


def _compute_condition_summary(reports: list[TripReport]) -> ConditionSummary:
    total = len(reports)
    if total == 0:
        return ConditionSummary(total_reports=0, open_pct=0, caution_pct=0, closed_pct=0, unknown_pct=0)

    counts = {"open": 0, "caution": 0, "closed": 0, "unknown": 0}
    for r in reports:
        counts[r.condition] = counts.get(r.condition, 0) + 1

    last_date = max(r.trek_date for r in reports) if reports else None
    return ConditionSummary(
        total_reports=total,
        open_pct=round(counts["open"] / total * 100),
        caution_pct=round(counts["caution"] / total * 100),
        closed_pct=round(counts["closed"] / total * 100),
        unknown_pct=round(counts["unknown"] / total * 100),
        last_report_date=last_date,
    )


def get_reports_for_trek(
    db: Session,
    trek_slug: str,
    page: int = 1,
    page_size: int = 10,
) -> ReportPageOut:
    base_q = (
        db.query(TripReport)
        .filter(TripReport.trek_slug == trek_slug, TripReport.status == "approved")
        .order_by(desc(TripReport.created_at))
    )
    total = base_q.count()

    items = base_q.offset((page - 1) * page_size).limit(page_size).all()

    # Condition summary from last 10 approved reports
    last_10 = (
        db.query(TripReport)
        .filter(TripReport.trek_slug == trek_slug, TripReport.status == "approved")
        .order_by(desc(TripReport.created_at))
        .limit(10)
        .all()
    )
    summary = _compute_condition_summary(last_10)

    return ReportPageOut(
        items=[ReportOut.model_validate(r) for r in items],
        condition_summary=summary,
        total=total,
        page=page,
        has_more=(page * page_size) < total,
    )


def moderate_report(
    db: Session,
    report_id: uuid.UUID,
    admin_user_id: uuid.UUID,
    moderation: ModerationIn,
) -> ReportOut:
    report = db.query(TripReport).filter(TripReport.id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")

    report.status = "approved" if moderation.action == "approve" else "rejected"
    report.moderated_by = admin_user_id
    report.moderated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    return ReportOut.model_validate(report)


def delete_report(db: Session, report_id: uuid.UUID, user_id: uuid.UUID) -> None:
    report = db.query(TripReport).filter(TripReport.id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")
    if report.user_id != user_id:
        raise HTTPException(403, "Cannot delete another user's report")
    if report.status == "approved":
        raise HTTPException(403, "Cannot delete an approved report")
    db.delete(report)
    db.commit()


def get_moderation_queue(
    db: Session,
    status: str = "pending",
    page: int = 1,
    page_size: int = 20,
) -> dict:
    base_q = (
        db.query(TripReport)
        .filter(TripReport.status == status)
        .order_by(desc(TripReport.created_at))
    )
    total = base_q.count()
    items = base_q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [ReportOut.model_validate(r) for r in items],
        "total": total,
        "page": page,
        "has_more": (page * page_size) < total,
    }


def get_condition_summary(db: Session, trek_slug: str) -> ConditionSummary:
    last_10 = (
        db.query(TripReport)
        .filter(TripReport.trek_slug == trek_slug, TripReport.status == "approved")
        .order_by(desc(TripReport.created_at))
        .limit(10)
        .all()
    )
    return _compute_condition_summary(last_10)
