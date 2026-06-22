from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

import stripe as _stripe
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auth.models import User
from app.modules.subscriptions.models import Subscription
from app.schemas.subscriptions import SubscriptionStatusResponse

logger = logging.getLogger(__name__)

_TEST_CHECKOUT_SUCCESS = "/account/premium?checkout=success&session_id=test_SESSION"


def _stripe_client() -> _stripe.StripeClient | None:
    if not settings.stripe_secret_key:
        return None
    return _stripe.StripeClient(settings.stripe_secret_key)


def get_subscription(db: Session, user_id: uuid.UUID) -> Subscription | None:
    return db.scalar(select(Subscription).where(Subscription.user_id == user_id))


def get_subscription_status(db: Session, user_id: uuid.UUID) -> SubscriptionStatusResponse:
    sub = get_subscription(db, user_id)
    if sub is None:
        user = db.get(User, user_id)
        plan = user.subscription_plan if user else "free"
        return SubscriptionStatusResponse(has_subscription=False, plan=plan)
    return SubscriptionStatusResponse(
        has_subscription=True,
        plan=sub.plan,
        status=sub.status,
        current_period_end=sub.current_period_end,
        stripe_customer_id=sub.stripe_customer_id,
    )


def create_checkout_session(
    db: Session,
    user_id: uuid.UUID,
    user_email: str | None,
    interval: str,
    success_url: str,
    cancel_url: str,
) -> dict:
    """Returns {checkout_url, test_mode}. Falls back to test redirect when no Stripe key."""
    client = _stripe_client()
    if client is None:
        # Test mode: create subscription immediately (no real billing) then redirect
        upsert_subscription_for_user(db, user_id)
        return {
            "checkout_url": success_url + ("&" if "?" in success_url else "?") + "test_mode=1",
            "test_mode": True,
        }

    price_id = (
        settings.stripe_premium_price_id_annual
        if interval == "annual"
        else settings.stripe_premium_price_id_monthly
    )
    if not price_id:
        return {
            "checkout_url": success_url + ("&" if "?" in success_url else "?") + "test_mode=1",
            "test_mode": True,
        }

    # Look up or create Stripe customer
    sub = get_subscription(db, user_id)
    customer_id = sub.stripe_customer_id if sub else None

    params: dict = {
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": success_url + "?session_id={CHECKOUT_SESSION_ID}",
        "cancel_url": cancel_url,
    }
    if customer_id:
        params["customer"] = customer_id
    elif user_email:
        params["customer_email"] = user_email

    try:
        session = client.checkout.sessions.create(params=params)
        return {"checkout_url": session.url, "test_mode": False}
    except Exception as exc:
        logger.warning("Stripe checkout creation failed: %s", exc)
        return {
            "checkout_url": success_url + ("&" if "?" in success_url else "?") + "test_mode=1",
            "test_mode": True,
        }


def cancel_subscription(db: Session, user_id: uuid.UUID) -> dict:
    sub = get_subscription(db, user_id)
    if sub is None or sub.plan == "free":
        return {"message": "No active subscription to cancel.", "cancelled_at_period_end": False}

    client = _stripe_client()
    if client and sub.stripe_subscription_id:
        try:
            client.subscriptions.update(
                sub.stripe_subscription_id,
                params={"cancel_at_period_end": True},
            )
        except Exception as exc:
            logger.warning("Stripe cancel failed: %s", exc)

    sub.status = "cancelled"
    db.commit()
    return {"message": "Subscription will cancel at period end.", "cancelled_at_period_end": True}


def handle_webhook(db: Session, payload: bytes, sig_header: str | None) -> bool:
    """Process a Stripe webhook event. Returns True on success."""
    if settings.stripe_webhook_secret and sig_header:
        try:
            event = _stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except (_stripe.error.SignatureVerificationError, ValueError) as exc:
            logger.warning("Stripe webhook signature invalid: %s", exc)
            return False
    else:
        # No secret configured — accept raw JSON (test/dev mode)
        import json
        try:
            event = json.loads(payload)
        except Exception:
            return False

    event_type = event.get("type") if isinstance(event, dict) else getattr(event, "type", None)
    data_obj = (
        event.get("data", {}).get("object", {})
        if isinstance(event, dict)
        else event.data.object
    )

    if event_type in ("customer.subscription.created", "customer.subscription.updated"):
        _sync_subscription(db, data_obj)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(db, data_obj)
    elif event_type == "invoice.payment_failed":
        _handle_payment_failed(db, data_obj)

    return True


def _sync_subscription(db: Session, obj: dict) -> None:
    stripe_sub_id = obj.get("id") if isinstance(obj, dict) else getattr(obj, "id", None)
    customer_id = obj.get("customer") if isinstance(obj, dict) else getattr(obj, "customer", None)
    status = obj.get("status") if isinstance(obj, dict) else getattr(obj, "status", "active")
    period_end_ts = (
        obj.get("current_period_end") if isinstance(obj, dict)
        else getattr(obj, "current_period_end", None)
    )
    current_period_end = (
        datetime.fromtimestamp(period_end_ts, tz=timezone.utc) if period_end_ts else None
    )

    # Find subscription by stripe_subscription_id or stripe_customer_id
    sub = db.scalar(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    if sub is None and customer_id:
        sub = db.scalar(
            select(Subscription).where(Subscription.stripe_customer_id == customer_id)
        )
    if sub is None:
        return

    sub.stripe_subscription_id = stripe_sub_id
    sub.stripe_customer_id = customer_id
    sub.status = status
    sub.plan = "premium" if status in ("active", "trialing") else "free"
    sub.current_period_end = current_period_end
    sub.updated_at = datetime.now(timezone.utc)

    # Sync denormalised plan on users table
    user = db.get(User, sub.user_id)
    if user:
        user.subscription_plan = sub.plan

    db.commit()


def _handle_subscription_deleted(db: Session, obj: dict) -> None:
    stripe_sub_id = obj.get("id") if isinstance(obj, dict) else getattr(obj, "id", None)
    sub = db.scalar(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    if sub:
        sub.status = "cancelled"
        sub.plan = "free"
        sub.updated_at = datetime.now(timezone.utc)
        user = db.get(User, sub.user_id)
        if user:
            user.subscription_plan = "free"
        db.commit()


def _handle_payment_failed(db: Session, obj: dict) -> None:
    customer_id = obj.get("customer") if isinstance(obj, dict) else getattr(obj, "customer", None)
    if not customer_id:
        return
    sub = db.scalar(
        select(Subscription).where(Subscription.stripe_customer_id == customer_id)
    )
    if sub:
        sub.status = "past_due"
        sub.updated_at = datetime.now(timezone.utc)
        db.commit()


def iap_verify_purchase(
    db: Session,
    user_id: uuid.UUID,
    platform: str,
    receipt_data: str,
    product_id: str,
    transaction_id: str | None = None,
) -> dict:
    """Verify an IAP receipt and activate premium. Falls back to test mode when no Apple/Google credentials configured."""
    from app.core.config import settings

    has_apple_secret = bool(getattr(settings, "apple_iap_shared_secret", None))
    has_google_key = bool(getattr(settings, "google_play_service_account_json", None))
    test_mode = not (has_apple_secret if platform == "ios" else has_google_key)

    if test_mode:
        upsert_subscription_for_user(db, user_id)
        return {
            "success": True,
            "plan": "premium",
            "message": "Premium activated (test mode — IAP credentials not yet configured).",
            "test_mode": True,
        }

    # Production path — wired up when Apple/Google credentials are provisioned (M22)
    logger.warning("Production IAP verify called but credentials not configured for platform=%s", platform)
    return {
        "success": False,
        "plan": "free",
        "message": "IAP verification not yet configured. Please contact support.",
        "test_mode": False,
    }


def iap_restore_purchases(
    db: Session,
    user_id: uuid.UUID,
    platform: str,
    receipt_data: str,
) -> dict:
    """Restore existing IAP purchases. Returns current subscription state."""
    sub = get_subscription(db, user_id)
    if sub and sub.plan == "premium" and sub.status == "active":
        return {
            "restored": True,
            "plan": "premium",
            "message": "Premium subscription restored.",
            "test_mode": False,
        }

    result = iap_verify_purchase(db, user_id, platform, receipt_data, "premium_monthly")
    return {
        "restored": result["success"],
        "plan": result["plan"],
        "message": result["message"],
        "test_mode": result["test_mode"],
    }


def upsert_subscription_for_user(
    db: Session,
    user_id: uuid.UUID,
    stripe_customer_id: str | None = None,
) -> Subscription:
    """Create or return existing subscription record for user."""
    sub = get_subscription(db, user_id)
    if sub is None:
        sub = Subscription(
            id=uuid.uuid4(),
            user_id=user_id,
            stripe_customer_id=stripe_customer_id,
            plan="premium",
            status="active",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(sub)
        user = db.get(User, user_id)
        if user:
            user.subscription_plan = "premium"
        db.commit()
        db.refresh(sub)
    return sub
