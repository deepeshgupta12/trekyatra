from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.products import service as products_service
from app.schemas.products import (
    CheckoutCreateRequest,
    CheckoutCreateResponse,
    CheckoutVerifyRequest,
    CheckoutVerifyResponse,
)

router = APIRouter(tags=["checkout"])


@router.post("/checkout/create-order", response_model=CheckoutCreateResponse)
def create_order(
    body: CheckoutCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = products_service.create_checkout_order(db, current_user.id, body.product_slug)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return result


@router.post("/checkout/verify", response_model=CheckoutVerifyResponse)
def verify_payment(
    body: CheckoutVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = products_service.verify_checkout_payment(
            db,
            user_id=current_user.id,
            order_id=body.order_id,
            razorpay_payment_id=body.razorpay_payment_id,
            razorpay_order_id=body.razorpay_order_id,
            razorpay_signature=body.razorpay_signature,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result


@router.get("/account/downloads/file")
def download_file(token: str = Query(...), db: Session = Depends(get_db)):
    """Serve a purchased product file via HMAC-signed download token (24h TTL)."""
    try:
        file_path, filename = products_service.serve_download_file(db, token)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )
