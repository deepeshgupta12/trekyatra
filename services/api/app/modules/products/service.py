from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.products.models import DigitalProduct, UserOrder

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Download token helpers
# --------------------------------------------------------------------------- #

def generate_download_token(order_id: str, ttl_hours: int = 24) -> str:
    expires_at = int(time.time()) + ttl_hours * 3600
    message = f"{order_id}:{expires_at}"
    sig = hmac.new(settings.auth_jwt_secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    payload = f"{message}:{sig}"
    return base64.urlsafe_b64encode(payload.encode()).decode()


def verify_download_token(token: str) -> str | None:
    """Returns order_id if token is valid and unexpired, None otherwise."""
    try:
        payload = base64.urlsafe_b64decode(token.encode()).decode()
        # format: order_id:expires_at:sig
        parts = payload.rsplit(":", 2)
        if len(parts) != 3:
            return None
        order_id, expires_str, sig = parts
        if time.time() > int(expires_str):
            return None
        message = f"{order_id}:{expires_str}"
        expected_sig = hmac.new(
            settings.auth_jwt_secret.encode(), message.encode(), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        return order_id
    except Exception:
        return None


def build_download_url(order_id: str) -> str:
    token = generate_download_token(order_id)
    return f"/api/v1/account/downloads/file?token={token}"


# --------------------------------------------------------------------------- #
# Product catalog
# --------------------------------------------------------------------------- #

def list_active_products(db: Session) -> list[dict]:
    products = list(db.scalars(
        select(DigitalProduct).where(DigitalProduct.active == True).order_by(DigitalProduct.created_at.desc())
    ).all())
    return [_enrich(db, p) for p in products]


def admin_list_products(db: Session) -> list[dict]:
    products = list(db.scalars(
        select(DigitalProduct).order_by(DigitalProduct.created_at.desc())
    ).all())
    return [_enrich(db, p) for p in products]


def get_product_by_slug(db: Session, slug: str) -> DigitalProduct | None:
    return db.scalar(select(DigitalProduct).where(DigitalProduct.slug == slug))


def get_product_by_id(db: Session, product_id: UUID) -> DigitalProduct | None:
    return db.scalar(select(DigitalProduct).where(DigitalProduct.id == product_id))


def create_product(db: Session, data: dict) -> DigitalProduct:
    product = DigitalProduct(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: UUID, data: dict) -> DigitalProduct | None:
    product = get_product_by_id(db, product_id)
    if not product:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: UUID) -> bool:
    product = get_product_by_id(db, product_id)
    if not product:
        return False
    db.delete(product)
    db.commit()
    return True


def _enrich(db: Session, product: DigitalProduct) -> dict:
    sales_count = db.scalar(
        select(func.count(UserOrder.id)).where(
            UserOrder.product_id == product.id,
            UserOrder.status == "paid",
        )
    ) or 0
    return {
        "id": product.id,
        "slug": product.slug,
        "title": product.title,
        "description": product.description,
        "price_inr": product.price_inr,
        "file_path": product.file_path,
        "preview_image_url": product.preview_image_url,
        "active": product.active,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "sales_count": sales_count,
    }


# --------------------------------------------------------------------------- #
# Checkout
# --------------------------------------------------------------------------- #

def create_checkout_order(db: Session, user_id: UUID, product_slug: str) -> dict:
    from app.core.config import settings

    product = get_product_by_slug(db, product_slug)
    if not product or not product.active:
        raise ValueError("Product not found or inactive")

    test_mode = not bool(settings.razorpay_key_id and settings.razorpay_key_secret)

    if test_mode:
        provider_order_id = f"test_{uuid.uuid4().hex[:12]}"
        key_id = None
    else:
        import razorpay  # type: ignore[import]
        rz_client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        rz_order = rz_client.order.create({
            "amount": int(product.price_inr * 100),
            "currency": "INR",
            "receipt": str(product.id)[:40],
        })
        provider_order_id = rz_order["id"]
        key_id = settings.razorpay_key_id

    order = UserOrder(
        user_id=user_id,
        product_id=product.id,
        provider_order_id=provider_order_id,
        amount_inr=product.price_inr,
        status="pending",
        test_mode=test_mode,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "order_id": order.id,
        "provider_order_id": provider_order_id,
        "amount_inr": product.price_inr,
        "product_title": product.title,
        "key_id": key_id,
        "test_mode": test_mode,
    }


def verify_checkout_payment(
    db: Session,
    user_id: UUID,
    order_id: UUID,
    razorpay_payment_id: str | None,
    razorpay_order_id: str | None,
    razorpay_signature: str | None,
) -> dict:
    from app.modules.account.service import record_download

    order = db.scalar(
        select(UserOrder).where(UserOrder.id == order_id, UserOrder.user_id == user_id)
    )
    if not order:
        raise ValueError("Order not found")

    product = get_product_by_id(db, order.product_id)
    if not product:
        raise ValueError("Product not found")

    # Already paid → return existing download URL
    if order.status == "paid":
        download_url = build_download_url(str(order.id))
        return {
            "order_id": order.id,
            "product_title": product.title,
            "download_url": download_url,
            "already_paid": True,
        }

    # Verify signature for real-mode payments
    if not order.test_mode:
        if not (razorpay_payment_id and razorpay_order_id and razorpay_signature):
            raise ValueError("Missing payment verification fields")
        key_secret = settings.razorpay_key_secret or ""
        expected = hmac.new(
            key_secret.encode(),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, razorpay_signature):
            raise ValueError("Invalid payment signature")
        order.razorpay_signature = razorpay_signature

    order.status = "paid"
    order.paid_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)

    download_url = build_download_url(str(order.id))

    # Record the download
    dl = record_download(
        db,
        user_id=user_id,
        filename=product.title,
        product_id=str(product.id),
        download_url=download_url,
        order_id=order.id,
    )

    # Send confirmation email (graceful skip if SMTP unconfigured)
    try:
        _send_purchase_email(user_id, db, product.title, download_url)
    except Exception:
        pass

    return {
        "order_id": order.id,
        "product_title": product.title,
        "download_url": download_url,
        "already_paid": False,
    }


def serve_download_file(db: Session, token: str) -> tuple[str, str]:
    """
    Validates download token. Returns (file_path, filename) for FileResponse.
    Raises ValueError for invalid/expired token or missing file.
    """
    order_id = verify_download_token(token)
    if not order_id:
        raise ValueError("Invalid or expired download token")

    order = db.scalar(select(UserOrder).where(UserOrder.id == order_id, UserOrder.status == "paid"))
    if not order:
        raise ValueError("Order not paid or not found")

    product = get_product_by_id(db, order.product_id)
    if not product or not product.file_path:
        raise ValueError("Product file not configured")

    full_path = os.path.join(settings.product_files_dir, product.file_path)
    if not os.path.isfile(full_path):
        raise ValueError("Product file not found on server")

    return full_path, product.title


# --------------------------------------------------------------------------- #
# Order admin
# --------------------------------------------------------------------------- #

def list_orders(db: Session, status: str | None = None, limit: int = 50) -> list[UserOrder]:
    q = select(UserOrder)
    if status:
        q = q.where(UserOrder.status == status)
    q = q.order_by(UserOrder.created_at.desc()).limit(limit)
    return list(db.scalars(q).all())


# --------------------------------------------------------------------------- #
# Internal helpers
# --------------------------------------------------------------------------- #

def _send_purchase_email(user_id: UUID, db: Session, product_title: str, download_url: str) -> None:
    from app.core.config import settings
    from app.modules.auth.models import User

    if not settings.smtp_host:
        return

    import smtplib
    from email.mime.text import MIMEText

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        return

    body = (
        f"Hi {user.full_name or 'there'},\n\n"
        f"Thank you for purchasing {product_title}!\n\n"
        f"Download your file here (valid 24 hours):\n"
        f"{settings.product_download_base_url}{download_url}\n\n"
        f"You can also find it in your account downloads page.\n\n"
        f"Happy trekking,\nThe TrekYatra Team"
    )
    msg = MIMEText(body)
    msg["Subject"] = f"Your download: {product_title}"
    msg["From"] = settings.smtp_from_email
    msg["To"] = user.email

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_user and settings.smtp_password:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)
