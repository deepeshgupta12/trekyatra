"""Monetization service — intent sessions, affiliate catalog, and stats."""
from __future__ import annotations

import os
import random
import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.account.models import UserBookmark, UserDownload
from app.modules.agents.intent.agent import classify_intent
from app.modules.monetization.models import AffiliateProduct, PageIntentSession
from app.schemas.monetization import (
    AffiliateProductCreate,
    AffiliateProductPatch,
    AffiliateProductResponse,
    IntentClassification,
    MonetizationStatsResponse,
)

_AB_ENABLED = os.getenv("MONETIZATION_AB_TEST", "").lower() in ("1", "true", "yes")


def _ab_variant() -> str:
    if _AB_ENABLED:
        return random.choice(["intent_based", "static"])
    return "intent_based"


def get_user_signals(db: Session, user_id: uuid.UUID | None) -> tuple[bool, bool]:
    """Returns (has_bookmarks, has_purchases) for intent signals."""
    if user_id is None:
        return False, False
    has_bookmarks = db.scalar(
        select(func.count()).select_from(UserBookmark).where(UserBookmark.user_id == user_id)
    ) or 0
    has_purchases = db.scalar(
        select(func.count()).select_from(UserDownload).where(UserDownload.user_id == user_id)
    ) or 0
    return has_bookmarks > 0, has_purchases > 0


def classify_and_record(
    db: Session,
    page_slug: str,
    page_type: str,
    session_id: str,
    user_id: uuid.UUID | None = None,
) -> PageIntentSession:
    has_bookmarks, has_purchases = get_user_signals(db, user_id)
    variant = _ab_variant()

    if variant == "static":
        classification = _static_classification(page_type)
    else:
        classification = classify_intent(
            page_type=page_type,
            page_slug=page_slug,
            has_bookmarks=has_bookmarks,
            has_purchases=has_purchases,
        )

    record = PageIntentSession(
        session_id=session_id,
        user_id=user_id,
        page_slug=page_slug,
        intent=classification.intent,
        confidence=classification.confidence,
        module_shown=classification.recommended_module,
        converted=False,
        ab_variant=variant,
    )
    db.add(record)
    db.flush()
    return record


def _static_classification(page_type: str) -> IntentClassification:
    from app.schemas.monetization import IntentClassification
    mapping = {
        "trek_guide": ("booking_ready", "lead"),
        "gear_guide": ("research", "affiliate"),
        "packing_guide": ("research", "affiliate"),
        "comparison": ("research", "affiliate"),
        "region_guide": ("inspiration", "newsletter"),
        "seasonal_guide": ("inspiration", "newsletter"),
    }
    intent, module = mapping.get(page_type, ("inspiration", "newsletter"))
    return IntentClassification(intent=intent, confidence=0.6, recommended_module=module)


def mark_converted(db: Session, session_id: str) -> bool:
    record = db.scalar(
        select(PageIntentSession).where(PageIntentSession.session_id == session_id)
    )
    if record is None:
        return False
    record.converted = True
    db.flush()
    return True


# ---------------------------------------------------------------------------
# Affiliate product catalog
# ---------------------------------------------------------------------------

def list_affiliate_products(db: Session, active_only: bool = True, limit: int = 20) -> list[AffiliateProduct]:
    q = select(AffiliateProduct)
    if active_only:
        q = q.where(AffiliateProduct.active == True)  # noqa: E712
    q = q.order_by(AffiliateProduct.created_at.desc()).limit(limit)
    return list(db.scalars(q))


def create_affiliate_product(db: Session, data: AffiliateProductCreate) -> AffiliateProduct:
    product = AffiliateProduct(**data.model_dump())
    db.add(product)
    db.flush()
    return product


def update_affiliate_product(db: Session, product_id: uuid.UUID, patch: AffiliateProductPatch) -> AffiliateProduct | None:
    product = db.get(AffiliateProduct, product_id)
    if product is None:
        return None
    for field, value in patch.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    product.updated_at = datetime.utcnow()
    db.flush()
    return product


def delete_affiliate_product(db: Session, product_id: uuid.UUID) -> bool:
    product = db.get(AffiliateProduct, product_id)
    if product is None:
        return False
    db.delete(product)
    db.flush()
    return True


# ---------------------------------------------------------------------------
# Admin stats
# ---------------------------------------------------------------------------

def get_monetization_stats(db: Session) -> MonetizationStatsResponse:
    rows = db.execute(
        select(
            PageIntentSession.intent,
            PageIntentSession.module_shown,
            PageIntentSession.converted,
        )
    ).fetchall()

    intent_distribution: dict[str, int] = {}
    module_impressions: dict[str, int] = {}
    module_conversions: dict[str, int] = {}

    for intent, module, converted in rows:
        intent_distribution[intent] = intent_distribution.get(intent, 0) + 1
        if module:
            module_impressions[module] = module_impressions.get(module, 0) + 1
            if converted:
                module_conversions[module] = module_conversions.get(module, 0) + 1

    conversion_by_module = {
        m: round(module_conversions.get(m, 0) / cnt, 4) if cnt > 0 else 0.0
        for m, cnt in module_impressions.items()
    }

    top_slug_rows = db.execute(
        select(
            PageIntentSession.page_slug,
            func.count().label("sessions"),
        )
        .group_by(PageIntentSession.page_slug)
        .order_by(func.count().desc())
        .limit(10)
    ).fetchall()

    top_converting_pages = [
        {"page_slug": r.page_slug, "sessions": r.sessions}
        for r in top_slug_rows
    ]

    total_sessions = sum(intent_distribution.values())
    total_conversions = sum(module_conversions.values())

    return MonetizationStatsResponse(
        intent_distribution=intent_distribution,
        conversion_by_module=conversion_by_module,
        top_converting_pages=top_converting_pages,
        total_sessions=total_sessions,
        total_conversions=total_conversions,
    )
