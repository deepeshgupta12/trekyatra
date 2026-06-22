from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SubscriptionCheckoutRequest(BaseModel):
    interval: str = "monthly"  # "monthly" | "annual"
    success_url: str = "http://localhost:3000/account/premium?checkout=success"
    cancel_url: str = "http://localhost:3000/premium?checkout=cancelled"


class SubscriptionCheckoutResponse(BaseModel):
    checkout_url: str
    test_mode: bool = False


class SubscriptionStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    has_subscription: bool
    plan: str  # "free" | "premium"
    status: str | None = None
    current_period_end: datetime | None = None
    stripe_customer_id: str | None = None


class SubscriptionCancelResponse(BaseModel):
    message: str
    cancelled_at_period_end: bool


class StripeWebhookResponse(BaseModel):
    received: bool


class IAPVerifyRequest(BaseModel):
    platform: str  # "ios" | "android"
    receipt_data: str  # base64 receipt (iOS) or purchase token (Android)
    product_id: str
    transaction_id: str | None = None


class IAPVerifyResponse(BaseModel):
    success: bool
    plan: str  # "premium" | "free"
    message: str
    test_mode: bool = False


class IAPRestoreRequest(BaseModel):
    platform: str  # "ios" | "android"
    receipt_data: str


class IAPRestoreResponse(BaseModel):
    restored: bool
    plan: str
    message: str
    test_mode: bool = False
