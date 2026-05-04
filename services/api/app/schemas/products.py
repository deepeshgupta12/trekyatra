from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


# --------------------------------------------------------------------------- #
# Products
# --------------------------------------------------------------------------- #

class ProductResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str | None
    price_inr: float
    file_path: str | None
    preview_image_url: str | None
    active: bool
    created_at: datetime
    updated_at: datetime
    sales_count: int = 0

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    slug: str
    title: str
    description: str | None = None
    price_inr: float
    file_path: str | None = None
    preview_image_url: str | None = None
    active: bool = True


class ProductPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    price_inr: float | None = None
    file_path: str | None = None
    preview_image_url: str | None = None
    active: bool | None = None


# --------------------------------------------------------------------------- #
# Orders
# --------------------------------------------------------------------------- #

class OrderResponse(BaseModel):
    id: UUID
    user_id: UUID
    product_id: UUID
    provider_order_id: str
    amount_inr: float
    status: str
    test_mode: bool
    paid_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# --------------------------------------------------------------------------- #
# Checkout
# --------------------------------------------------------------------------- #

class CheckoutCreateRequest(BaseModel):
    product_slug: str


class CheckoutCreateResponse(BaseModel):
    order_id: UUID
    provider_order_id: str
    amount_inr: float
    product_title: str
    key_id: str | None
    test_mode: bool


class CheckoutVerifyRequest(BaseModel):
    order_id: UUID
    razorpay_payment_id: str | None = None
    razorpay_order_id: str | None = None
    razorpay_signature: str | None = None


class CheckoutVerifyResponse(BaseModel):
    order_id: UUID
    product_title: str
    download_url: str
    already_paid: bool = False
