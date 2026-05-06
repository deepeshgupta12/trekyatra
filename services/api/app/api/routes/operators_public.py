from __future__ import annotations

import logging
import smtplib
import uuid
from datetime import datetime, timezone
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, UniqueConstraint
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, get_optional_user
from app.modules.auth.models import User
from app.modules.leads.models import LeadSubmission
from app.modules.operators import service as operator_service
from app.modules.operators.models import Operator
from app.modules.operators.review_service import create_review, list_reviews
from app.schemas.operators import (
    InquiryCreate,
    InquiryResponse,
    OperatorPublicResponse,
    OperatorReviewCreate,
    OperatorReviewResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/operators", tags=["operators-public"])


def _get_by_slug(db: Session, slug: str) -> Operator:
    op = db.scalar(
        select(Operator)
        .options(selectinload(Operator.specializations))
        .where(Operator.slug == slug, Operator.active == True)  # noqa: E712
    )
    if op is None:
        raise HTTPException(status_code=404, detail=f"Operator '{slug}' not found.")
    return op


@router.get("", response_model=list[OperatorPublicResponse])
def list_public_operators(
    region: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[OperatorPublicResponse]:
    ops = operator_service.list_operators(db, active_only=True)
    if region:
        region_lower = region.lower()
        ops = [
            o for o in ops
            if any(region_lower in r.lower() for r in (o.region or []))
        ]
    return [OperatorPublicResponse.model_validate(o) for o in ops]


@router.get("/{slug}", response_model=OperatorPublicResponse)
def get_public_operator(slug: str, db: Session = Depends(get_db)) -> OperatorPublicResponse:
    op = _get_by_slug(db, slug)
    return OperatorPublicResponse.model_validate(op)


@router.get("/{slug}/reviews", response_model=list[OperatorReviewResponse])
def get_operator_reviews(
    slug: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[OperatorReviewResponse]:
    op = _get_by_slug(db, slug)
    reviews = list_reviews(db, op.id, limit=limit, offset=offset)
    return [OperatorReviewResponse.model_validate(r) for r in reviews]


@router.post("/{slug}/reviews", response_model=OperatorReviewResponse, status_code=201)
def submit_review(
    slug: str,
    payload: OperatorReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OperatorReviewResponse:
    op = _get_by_slug(db, slug)
    try:
        review = create_review(db, op.id, current_user.id, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already reviewed this operator.")
    return OperatorReviewResponse.model_validate(review)


# ---------------------------------------------------------------------------
# Inquiry / booking request
# ---------------------------------------------------------------------------

inquiry_router = APIRouter(tags=["operators-public"])


@inquiry_router.post("/inquiries", response_model=InquiryResponse, status_code=201)
def create_inquiry(
    payload: InquiryCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> InquiryResponse:
    # Resolve operator by slug if provided
    operator_id: uuid.UUID | None = None
    operator: Operator | None = None
    if payload.operator_slug:
        operator = db.scalar(
            select(Operator).where(Operator.slug == payload.operator_slug)
        )
        if operator:
            operator_id = operator.id

    lead = LeadSubmission(
        id=uuid.uuid4(),
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        trek_interest=payload.trek_interest,
        message=payload.message,
        source_page=f"/operators/{payload.operator_slug}" if payload.operator_slug else "/inquiries",
        source_cluster=None,
        cta_type="operator_inquiry",
        status="new",
        status_history=[],
        assigned_operator_id=operator_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # Confirmation email to submitter (graceful)
    _send_inquiry_confirmation(payload.email, payload.name, payload.trek_interest)

    # Notification to operator (graceful)
    if operator:
        _send_operator_notification(operator.contact_email, operator.name, payload)

    return InquiryResponse.model_validate(lead)


def _send_inquiry_confirmation(to_email: str, name: str, trek_interest: str) -> None:
    if not settings.smtp_host:
        return
    try:
        body = (
            f"Hi {name},\n\n"
            f"Thanks for reaching out! We've received your inquiry about {trek_interest}.\n"
            f"A vetted operator will get back to you within 48 hours.\n\n"
            f"Happy trekking,\nThe TrekYatra Team"
        )
        msg = MIMEText(body)
        msg["Subject"] = f"Your trek inquiry: {trek_interest}"
        msg["From"] = settings.smtp_from_email
        msg["To"] = to_email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_user and settings.smtp_password:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
    except Exception:
        logger.warning("Inquiry confirmation email failed to %s", to_email)


def _send_operator_notification(
    to_email: str, operator_name: str, payload: InquiryCreate
) -> None:
    if not settings.smtp_host:
        return
    try:
        body = (
            f"New inquiry via TrekYatra for {operator_name}:\n\n"
            f"Name: {payload.name}\n"
            f"Email: {payload.email}\n"
            f"Phone: {payload.phone or 'not provided'}\n"
            f"Trek interest: {payload.trek_interest}\n"
            f"Message: {payload.message or '—'}\n\n"
            f"Please respond within 48 hours."
        )
        msg = MIMEText(body)
        msg["Subject"] = f"New trek inquiry: {payload.trek_interest}"
        msg["From"] = settings.smtp_from_email
        msg["To"] = to_email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_user and settings.smtp_password:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
    except Exception:
        logger.warning("Operator notification email failed to %s", to_email)
