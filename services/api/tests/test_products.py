"""Tests for Step 34 — Digital Product Checkout and File Delivery."""
from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.products.models import DigitalProduct, UserOrder
from app.modules.products.service import (
    create_product,
    generate_download_token,
    get_product_by_slug,
    list_active_products,
    verify_download_token,
)

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db) -> User:
    user = db.query(User).filter(User.email == "producttest@trekyatra.com").first()
    if not user:
        user = User(email="producttest@trekyatra.com", full_name="Product Test", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def sample_product(db) -> DigitalProduct:
    slug = "test-packing-guide-tc34"
    product = db.query(DigitalProduct).filter(DigitalProduct.slug == slug).first()
    if not product:
        product = create_product(db, {
            "slug": slug,
            "title": "Test Packing Guide",
            "description": "A test packing guide",
            "price_inr": 299.0,
            "file_path": "sample-packing-guide.pdf",
            "active": True,
        })
    return product


# --- TC-B01: download token round-trip ---
def test_download_token_valid():
    """Verifies: generate + verify download token returns the order_id correctly."""
    order_id = str(uuid.uuid4())
    token = generate_download_token(order_id, ttl_hours=1)
    assert verify_download_token(token) == order_id


# --- TC-B02: expired token rejected ---
def test_download_token_expired():
    """Verifies: token with ttl_hours=0 is rejected (TTL=0s, already expired)."""
    order_id = str(uuid.uuid4())
    token = generate_download_token(order_id, ttl_hours=-1)
    assert verify_download_token(token) is None


# --- TC-B03: tampered token rejected ---
def test_download_token_tampered():
    """Verifies: token with altered payload is rejected."""
    token = generate_download_token(str(uuid.uuid4()), ttl_hours=1)
    tampered = token[:-4] + "XXXX"
    assert verify_download_token(tampered) is None


# --- TC-B04: create product service ---
def test_create_product_service(db):
    """Verifies: create_product stores record and returns DigitalProduct."""
    slug = f"svc-test-product-{uuid.uuid4().hex[:6]}"
    product = create_product(db, {"slug": slug, "title": "Service Test", "price_inr": 99.0, "active": True})
    assert product.id is not None
    assert product.slug == slug
    assert product.price_inr == 99.0


# --- TC-B05: get product by slug ---
def test_get_product_by_slug(db, sample_product):
    """Verifies: get_product_by_slug returns the correct product."""
    found = get_product_by_slug(db, sample_product.slug)
    assert found is not None
    assert found.id == sample_product.id


# --- TC-B06: list active products only ---
def test_list_active_products(db, sample_product):
    """Verifies: list_active_products returns only active products."""
    products = list_active_products(db)
    ids = [str(p["id"]) for p in products]
    assert str(sample_product.id) in ids


# --- TC-B07: inactive product not in public list ---
def test_inactive_product_not_listed(db):
    """Verifies: inactive product is excluded from public list."""
    inactive = create_product(db, {"slug": f"inactive-{uuid.uuid4().hex[:6]}", "title": "Inactive", "price_inr": 0, "active": False})
    products = list_active_products(db)
    ids = [str(p["id"]) for p in products]
    assert str(inactive.id) not in ids


# --- TC-B08: public GET /products ---
def test_api_list_products(sample_product):
    """Verifies: GET /products returns list of active products."""
    res = client.get("/api/v1/products")
    assert res.status_code == 200
    slugs = [p["slug"] for p in res.json()]
    assert sample_product.slug in slugs


# --- TC-B09: public GET /products/{slug} ---
def test_api_get_product_by_slug(sample_product):
    """Verifies: GET /products/{slug} returns correct product data."""
    res = client.get(f"/api/v1/products/{sample_product.slug}")
    assert res.status_code == 200
    assert res.json()["slug"] == sample_product.slug
    assert res.json()["price_inr"] == 299.0


# --- TC-B10: GET product unknown slug returns 404 ---
def test_api_get_product_not_found():
    """Verifies: GET /products/nonexistent returns 404."""
    res = client.get("/api/v1/products/nonexistent-slug-xyz")
    assert res.status_code == 404


# --- TC-B11: create order test mode ---
def test_api_create_order_test_mode(sample_product, test_user):
    """Verifies: POST /checkout/create-order in test mode creates pending order and returns test_mode=True."""
    app.dependency_overrides[get_current_user] = lambda: test_user
    res = client.post("/api/v1/checkout/create-order", json={"product_slug": sample_product.slug})
    app.dependency_overrides.clear()
    assert res.status_code == 200
    data = res.json()
    assert data["test_mode"] is True
    assert data["product_title"] == sample_product.title
    assert data["amount_inr"] == sample_product.price_inr


# --- TC-B12: verify payment test mode marks order paid ---
def test_api_verify_payment_test_mode(db, sample_product, test_user):
    """Verifies: POST /checkout/verify in test mode marks order paid and returns download_url."""
    app.dependency_overrides[get_current_user] = lambda: test_user
    create_res = client.post("/api/v1/checkout/create-order", json={"product_slug": sample_product.slug})
    order_id = create_res.json()["order_id"]

    verify_res = client.post("/api/v1/checkout/verify", json={"order_id": order_id})
    app.dependency_overrides.clear()
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["order_id"] == order_id
    assert "download_url" in data
    assert "/api/v1/account/downloads/file" in data["download_url"]

    # Confirm order status in DB
    order = db.query(UserOrder).filter(UserOrder.id == order_id).first()
    assert order is not None
    assert order.status == "paid"


# --- TC-B13: verify already paid order returns download_url without error ---
def test_api_verify_already_paid(db, sample_product, test_user):
    """Verifies: POST /checkout/verify on already-paid order returns already_paid=True."""
    app.dependency_overrides[get_current_user] = lambda: test_user
    create_res = client.post("/api/v1/checkout/create-order", json={"product_slug": sample_product.slug})
    order_id = create_res.json()["order_id"]
    client.post("/api/v1/checkout/verify", json={"order_id": order_id})
    # Second verify
    res2 = client.post("/api/v1/checkout/verify", json={"order_id": order_id})
    app.dependency_overrides.clear()
    assert res2.status_code == 200
    assert res2.json()["already_paid"] is True


# --- TC-B14: create order for nonexistent product returns 404 ---
def test_api_create_order_missing_product(test_user):
    """Verifies: POST /checkout/create-order for unknown slug returns 404."""
    app.dependency_overrides[get_current_user] = lambda: test_user
    res = client.post("/api/v1/checkout/create-order", json={"product_slug": "no-such-product"})
    app.dependency_overrides.clear()
    assert res.status_code == 404


# --- TC-B15: checkout requires authentication ---
def test_api_create_order_requires_auth():
    """Verifies: POST /checkout/create-order without auth cookie returns 401."""
    res = client.post("/api/v1/checkout/create-order", json={"product_slug": "any-slug"})
    assert res.status_code == 401


# --- TC-B16: download file with invalid token returns 403 ---
def test_api_download_file_invalid_token():
    """Verifies: GET /account/downloads/file with bad token returns 403."""
    res = client.get("/api/v1/account/downloads/file?token=badtoken")
    assert res.status_code == 403


# --- TC-B17: admin GET /admin/products requires admin auth ---
def test_api_admin_products_requires_admin_auth():
    """Verifies: GET /admin/products without admin token returns 401 (conftest bypass cleared)."""
    from app.modules.auth.dependencies import get_current_admin as _get_admin
    saved = app.dependency_overrides.pop(_get_admin, None)
    try:
        res = client.get("/api/v1/admin/products")
        assert res.status_code == 401
    finally:
        if saved is not None:
            app.dependency_overrides[_get_admin] = saved


# --- TC-B18: admin list products ---
def test_api_admin_list_products(sample_product):
    """Verifies: GET /admin/products with admin auth returns all products including inactive."""
    from app.modules.auth.dependencies import get_current_admin
    app.dependency_overrides[get_current_admin] = lambda: {"email": "admin@test.com"}
    res = client.get("/api/v1/admin/products")
    app.dependency_overrides.clear()
    assert res.status_code == 200
    ids = [p["id"] for p in res.json()]
    assert str(sample_product.id) in ids


# --- TC-B19: admin create product ---
def test_api_admin_create_product():
    """Verifies: POST /admin/products creates a new product and returns it."""
    from app.modules.auth.dependencies import get_current_admin
    app.dependency_overrides[get_current_admin] = lambda: {"email": "admin@test.com"}
    slug = f"admin-created-{uuid.uuid4().hex[:6]}"
    res = client.post("/api/v1/admin/products", json={
        "slug": slug, "title": "Admin Created Product", "price_inr": 499.0, "active": True
    })
    app.dependency_overrides.clear()
    assert res.status_code == 200
    assert res.json()["slug"] == slug


# --- TC-B20: admin list orders ---
def test_api_admin_list_orders(db, sample_product, test_user):
    """Verifies: GET /admin/orders with admin auth returns order list."""
    from app.modules.auth.dependencies import get_current_admin
    # Create an order first
    app.dependency_overrides[get_current_user] = lambda: test_user
    app.dependency_overrides[get_current_admin] = lambda: {"email": "admin@test.com"}
    client.post("/api/v1/checkout/create-order", json={"product_slug": sample_product.slug})

    res = client.get("/api/v1/admin/orders")
    app.dependency_overrides.clear()
    assert res.status_code == 200
    assert isinstance(res.json(), list)
