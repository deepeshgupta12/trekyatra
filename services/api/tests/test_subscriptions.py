"""Tests for Step 40 — premium subscription layer."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, get_optional_user
from app.modules.auth.models import User
from app.modules.cms.models import CMSPage
from app.modules.subscriptions.models import Subscription
from app.modules.subscriptions.service import (
    cancel_subscription,
    create_checkout_session,
    get_subscription_status,
    handle_webhook,
    upsert_subscription_for_user,
)

client = TestClient(app, raise_server_exceptions=True)


@pytest.fixture()
def db():
    gen = get_db()
    session = next(gen)
    try:
        yield session
    finally:
        session.rollback()
        try:
            next(gen)
        except StopIteration:
            pass


@pytest.fixture()
def free_user(db: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"free-{uuid.uuid4().hex[:6]}@test.com",
        full_name="Free User",
        password_hash="x",
        subscription_plan="free",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def premium_user(db: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"premium-{uuid.uuid4().hex[:6]}@test.com",
        full_name="Premium User",
        password_hash="x",
        subscription_plan="premium",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def premium_page(db: Session) -> CMSPage:
    page = CMSPage(
        slug=f"premium-guide-{uuid.uuid4().hex[:6]}",
        page_type="expert_guide",
        title="Premium Kedarkantha Compendium",
        content_html="<h1>Premium content here</h1>",
        status="published",
        language="en",
        is_premium=True,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@pytest.fixture()
def override_free_user(free_user):
    # Override both get_current_user (subscription routes) and
    # get_optional_user (CMS gating route)
    app.dependency_overrides[get_current_user] = lambda: free_user
    app.dependency_overrides[get_optional_user] = lambda: free_user
    yield free_user
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_optional_user, None)


@pytest.fixture()
def override_premium_user(premium_user):
    app.dependency_overrides[get_current_user] = lambda: premium_user
    app.dependency_overrides[get_optional_user] = lambda: premium_user
    yield premium_user
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_optional_user, None)


# ---------------------------------------------------------------------------
# TC-B01: get_subscription_status — free user with no subscription row
# ---------------------------------------------------------------------------
def test_subscription_status_free_no_row(db: Session, free_user):
    status = get_subscription_status(db, free_user.id)
    assert status.plan == "free"
    assert status.has_subscription is False


# ---------------------------------------------------------------------------
# TC-B02: upsert_subscription_for_user — creates row and sets user plan
# ---------------------------------------------------------------------------
def test_upsert_subscription_creates_row(db: Session, free_user):
    sub = upsert_subscription_for_user(db, free_user.id)
    assert sub.plan == "premium"
    db.expire_all()
    user = db.get(User, free_user.id)
    assert user.subscription_plan == "premium"


# ---------------------------------------------------------------------------
# TC-B03: create_checkout_session — test mode when no Stripe key
# ---------------------------------------------------------------------------
def test_checkout_test_mode(db: Session, free_user, monkeypatch):
    monkeypatch.setattr("app.modules.subscriptions.service.settings.stripe_secret_key", None)
    result = create_checkout_session(
        db, free_user.id, free_user.email, "monthly",
        "http://localhost:3000/account/premium?checkout=success",
        "http://localhost:3000/premium",
    )
    assert result["test_mode"] is True
    assert "test_mode=1" in result["checkout_url"]


# ---------------------------------------------------------------------------
# TC-B04: cancel_subscription — no subscription returns graceful message
# ---------------------------------------------------------------------------
def test_cancel_no_subscription(db: Session, free_user):
    result = cancel_subscription(db, free_user.id)
    assert result["cancelled_at_period_end"] is False
    assert "No active" in result["message"]


# ---------------------------------------------------------------------------
# TC-B05: cancel_subscription — marks status=cancelled
# ---------------------------------------------------------------------------
def test_cancel_existing_subscription(db: Session, free_user, monkeypatch):
    monkeypatch.setattr("app.modules.subscriptions.service.settings.stripe_secret_key", None)
    upsert_subscription_for_user(db, free_user.id)
    result = cancel_subscription(db, free_user.id)
    assert result["cancelled_at_period_end"] is True
    db.expire_all()
    sub = db.scalar(
        __import__("sqlalchemy", fromlist=["select"]).select(Subscription).where(
            Subscription.user_id == free_user.id
        )
    )
    assert sub.status == "cancelled"


# ---------------------------------------------------------------------------
# TC-B06: handle_webhook — customer.subscription.updated sets premium plan
# ---------------------------------------------------------------------------
def test_webhook_subscription_updated(db: Session, free_user):
    stripe_sub_id = f"sub_test_{uuid.uuid4().hex[:8]}"
    stripe_cus_id = f"cus_test_{uuid.uuid4().hex[:8]}"
    # Create subscription directly with stripe IDs in one step
    sub = Subscription(
        id=uuid.uuid4(),
        user_id=free_user.id,
        stripe_subscription_id=stripe_sub_id,
        stripe_customer_id=stripe_cus_id,
        plan="free",
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(sub)
    db.commit()

    payload = json.dumps({
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": stripe_sub_id,
                "customer": stripe_cus_id,
                "status": "active",
                "current_period_end": 1999999999,
            }
        }
    }).encode()

    db.expire_all()
    ok = handle_webhook(db, payload, sig_header=None)
    assert ok is True
    db.expire_all()
    updated_sub = db.get(Subscription, sub.id)
    assert updated_sub.plan == "premium"
    user = db.get(User, free_user.id)
    assert user.subscription_plan == "premium"


# ---------------------------------------------------------------------------
# TC-B07: handle_webhook — customer.subscription.deleted downgrades to free
# ---------------------------------------------------------------------------
def test_webhook_subscription_deleted(db: Session, free_user):
    stripe_sub_id = f"sub_del_{uuid.uuid4().hex[:8]}"
    sub = Subscription(
        id=uuid.uuid4(),
        user_id=free_user.id,
        stripe_subscription_id=stripe_sub_id,
        stripe_customer_id=f"cus_del_{uuid.uuid4().hex[:8]}",
        plan="premium",
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(sub)
    db.commit()

    payload = json.dumps({
        "type": "customer.subscription.deleted",
        "data": {"object": {"id": stripe_sub_id, "customer": "cus_del123", "status": "cancelled", "current_period_end": 0}},
    }).encode()

    db.expire_all()
    handle_webhook(db, payload, sig_header=None)
    db.expire_all()
    updated_sub = db.get(Subscription, sub.id)
    assert updated_sub.plan == "free"


# ---------------------------------------------------------------------------
# TC-B08: handle_webhook — invoice.payment_failed sets past_due
# ---------------------------------------------------------------------------
def test_webhook_payment_failed(db: Session, free_user):
    stripe_cus_id = f"cus_fail_{uuid.uuid4().hex[:8]}"
    sub = Subscription(
        id=uuid.uuid4(),
        user_id=free_user.id,
        stripe_customer_id=stripe_cus_id,
        plan="premium",
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(sub)
    db.commit()

    payload = json.dumps({
        "type": "invoice.payment_failed",
        "data": {"object": {"customer": stripe_cus_id}},
    }).encode()

    db.expire_all()
    handle_webhook(db, payload, sig_header=None)
    db.expire_all()
    updated_sub = db.get(Subscription, sub.id)
    assert updated_sub.status == "past_due"


# ---------------------------------------------------------------------------
# TC-B09: GET /cms/pages/{slug} — free user gets gated premium page
# ---------------------------------------------------------------------------
def test_premium_page_gated_for_free_user(premium_page, override_free_user):
    res = client.get(f"/api/v1/cms/pages/{premium_page.slug}")
    assert res.status_code == 200
    data = res.json()
    assert data["is_gated"] is True
    assert data["content_html"] == ""
    assert data["is_premium"] is True


# ---------------------------------------------------------------------------
# TC-B10: GET /cms/pages/{slug} — premium user gets full content
# ---------------------------------------------------------------------------
def test_premium_page_accessible_for_premium_user(premium_page, override_premium_user):
    res = client.get(f"/api/v1/cms/pages/{premium_page.slug}")
    assert res.status_code == 200
    data = res.json()
    assert data["is_gated"] is False
    assert data["content_html"] != ""


# ---------------------------------------------------------------------------
# TC-B11: GET /cms/pages/{slug} — anonymous user gets gated premium page
# ---------------------------------------------------------------------------
def test_premium_page_gated_for_anonymous(premium_page):
    res = client.get(f"/api/v1/cms/pages/{premium_page.slug}")
    assert res.status_code == 200
    data = res.json()
    assert data["is_gated"] is True


# ---------------------------------------------------------------------------
# TC-B12: GET /cms/pages/{slug} — non-premium page not gated
# ---------------------------------------------------------------------------
def test_free_page_not_gated(db: Session):
    page = CMSPage(
        slug=f"free-guide-{uuid.uuid4().hex[:6]}",
        page_type="trek_guide",
        title="Free Guide",
        content_html="<p>Free content</p>",
        status="published",
        language="en",
        is_premium=False,
    )
    db.add(page)
    db.commit()

    res = client.get(f"/api/v1/cms/pages/{page.slug}")
    assert res.status_code == 200
    data = res.json()
    assert data["is_gated"] is False
    assert data["content_html"] != ""


# ---------------------------------------------------------------------------
# TC-B13: POST /subscriptions/create-checkout — requires auth (401)
# ---------------------------------------------------------------------------
def test_checkout_requires_auth():
    res = client.post("/api/v1/subscriptions/create-checkout", json={"interval": "monthly"})
    assert res.status_code in (401, 403)


# ---------------------------------------------------------------------------
# TC-B14: GET /subscriptions/status — requires auth (401)
# ---------------------------------------------------------------------------
def test_status_requires_auth():
    res = client.get("/api/v1/subscriptions/status")
    assert res.status_code in (401, 403)


# ---------------------------------------------------------------------------
# TC-B15: subscription_plan exposed in /auth/me response
# ---------------------------------------------------------------------------
def test_auth_me_returns_subscription_plan(free_user, override_free_user):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert "subscription_plan" in data
    assert data["subscription_plan"] == "free"
