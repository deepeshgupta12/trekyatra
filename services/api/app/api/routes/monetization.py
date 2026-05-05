"""Monetization endpoints — intent classification, affiliate catalog, admin stats."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, get_optional_user
from app.modules.auth.models import User
from app.modules.cms.models import CMSPage
from app.modules.monetization.service import (
    classify_and_record,
    create_affiliate_product,
    delete_affiliate_product,
    get_monetization_stats,
    list_affiliate_products,
    mark_converted,
    update_affiliate_product,
)
from app.schemas.monetization import (
    AffiliateProductCreate,
    AffiliateProductPatch,
    AffiliateProductResponse,
    IntentResponse,
    MonetizationStatsResponse,
)

router = APIRouter(tags=["monetization"])


def _resolve_page_type(db: Session, slug: str) -> str:
    page = db.scalar(select(CMSPage).where(CMSPage.slug == slug, CMSPage.status == "published"))
    if page:
        return page.page_type or "trek_guide"
    return "trek_guide"


@router.get("/intent/{slug}", response_model=IntentResponse)
def get_intent(
    slug: str,
    session_id: str = "",
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Classify visitor intent for a page. session_id is caller-generated."""
    sid = session_id or str(uuid.uuid4())
    user_id = current_user.id if current_user else None
    page_type = _resolve_page_type(db, slug)
    record = classify_and_record(db, slug, page_type, sid, user_id=user_id)
    db.commit()
    return IntentResponse(
        session_id=sid,
        intent=record.intent,
        confidence=record.confidence,
        recommended_module=record.module_shown or "newsletter",
        ab_variant=record.ab_variant,
    )


@router.post("/intent/{slug}/convert", status_code=200)
def convert_session(slug: str, session_id: str, db: Session = Depends(get_db)):
    """Mark an intent session as converted."""
    ok = mark_converted(db, session_id)
    db.commit()
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"converted": True}


# ---------------------------------------------------------------------------
# Public affiliate products
# ---------------------------------------------------------------------------

@router.get("/affiliate-products", response_model=list[AffiliateProductResponse])
def public_affiliate_products(limit: int = 10, db: Session = Depends(get_db)):
    products = list_affiliate_products(db, active_only=True, limit=min(limit, 20))
    return [_product_to_response(p) for p in products]


# ---------------------------------------------------------------------------
# Admin routes
# ---------------------------------------------------------------------------

@router.get("/admin/monetization/stats", response_model=MonetizationStatsResponse)
def monetization_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_monetization_stats(db)


@router.get("/admin/affiliate-products", response_model=list[AffiliateProductResponse])
def admin_list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    products = list_affiliate_products(db, active_only=False, limit=100)
    return [_product_to_response(p) for p in products]


@router.post("/admin/affiliate-products", response_model=AffiliateProductResponse, status_code=201)
def admin_create_product(
    data: AffiliateProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = create_affiliate_product(db, data)
    db.commit()
    db.refresh(product)
    return _product_to_response(product)


@router.patch("/admin/affiliate-products/{product_id}", response_model=AffiliateProductResponse)
def admin_update_product(
    product_id: uuid.UUID,
    patch: AffiliateProductPatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = update_affiliate_product(db, product_id, patch)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    db.commit()
    db.refresh(product)
    return _product_to_response(product)


@router.delete("/admin/affiliate-products/{product_id}", status_code=204)
def admin_delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not delete_affiliate_product(db, product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    db.commit()


def _product_to_response(p) -> AffiliateProductResponse:
    return AffiliateProductResponse(
        id=str(p.id),
        title=p.title,
        description=p.description,
        affiliate_url=p.affiliate_url,
        affiliate_program=p.affiliate_program,
        category=p.category or [],
        price_range=p.price_range,
        active=p.active,
        created_at=p.created_at.isoformat() if p.created_at else None,
    )
