from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.products import service as products_service
from app.schemas.products import (
    OrderResponse,
    ProductCreate,
    ProductPatch,
    ProductResponse,
)

public_router = APIRouter(tags=["products"])
admin_router = APIRouter(prefix="/admin", tags=["admin-products"])


# --- Public ---

@public_router.get("/products", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return products_service.list_active_products(db)


@public_router.get("/products/{slug}", response_model=ProductResponse)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = products_service.get_product_by_slug(db, slug)
    if not product or not product.active:
        raise HTTPException(status_code=404, detail="Product not found")
    return products_service._enrich(db, product)


# --- Admin ---

@admin_router.get("/products", response_model=list[ProductResponse])
def admin_list_products(
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return products_service.admin_list_products(db)


@admin_router.post("/products", response_model=ProductResponse)
def admin_create_product(
    body: ProductCreate,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        product = products_service.create_product(db, body.model_dump())
        return products_service._enrich(db, product)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@admin_router.patch("/products/{product_id}", response_model=ProductResponse)
def admin_update_product(
    product_id: UUID,
    body: ProductPatch,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = products_service.update_product(db, product_id, body.model_dump(exclude_none=True))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return products_service._enrich(db, product)


@admin_router.delete("/products/{product_id}", status_code=204)
def admin_delete_product(
    product_id: UUID,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    deleted = products_service.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")


@admin_router.get("/orders", response_model=list[OrderResponse])
def admin_list_orders(
    status: str | None = None,
    limit: int = 50,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return products_service.list_orders(db, status=status, limit=limit)
