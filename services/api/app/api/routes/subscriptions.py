from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.subscriptions import service as sub_service
from app.schemas.subscriptions import (
    StripeWebhookResponse,
    SubscriptionCancelResponse,
    SubscriptionCheckoutRequest,
    SubscriptionCheckoutResponse,
    SubscriptionStatusResponse,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("/create-checkout", response_model=SubscriptionCheckoutResponse)
def create_checkout(
    body: SubscriptionCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionCheckoutResponse:
    result = sub_service.create_checkout_session(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        interval=body.interval,
        success_url=body.success_url,
        cancel_url=body.cancel_url,
    )
    return SubscriptionCheckoutResponse(
        checkout_url=result["checkout_url"],
        test_mode=result["test_mode"],
    )


@router.get("/status", response_model=SubscriptionStatusResponse)
def subscription_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionStatusResponse:
    return sub_service.get_subscription_status(db, current_user.id)


@router.post("/cancel", response_model=SubscriptionCancelResponse)
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionCancelResponse:
    result = sub_service.cancel_subscription(db, current_user.id)
    return SubscriptionCancelResponse(**result)


@router.post("/webhook", response_model=StripeWebhookResponse)
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> StripeWebhookResponse:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    ok = sub_service.handle_webhook(db, payload, sig_header)
    if not ok:
        raise HTTPException(status_code=400, detail="Webhook processing failed.")
    return StripeWebhookResponse(received=True)
