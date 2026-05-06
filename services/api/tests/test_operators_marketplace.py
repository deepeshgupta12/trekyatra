"""Tests for Step 38 — operator marketplace (public listing, reviews, agreements, inquiry)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin, get_current_user
from app.modules.auth.models import User
from app.modules.operators.models import Operator, OperatorAgreement, OperatorReview
from app.modules.operators.review_service import create_review, delete_review, _update_rating_avg
from app.modules.operators.agreement_service import get_agreement, upsert_agreement, patch_agreement
from app.schemas.operators import (
    OperatorAgreementCreate,
    OperatorAgreementPatch,
    OperatorReviewCreate,
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
def operator(db: Session) -> Operator:
    op = Operator(
        id=uuid.uuid4(),
        name=f"Summit Treks {uuid.uuid4().hex[:4]}",
        slug=f"summit-treks-{uuid.uuid4().hex[:6]}",
        contact_email="ops@summit.com",
        region=["Uttarakhand"],
        trek_types=["high altitude", "winter"],
        active=True,
        rating_avg=0.0,
        review_count=0,
        created_at=datetime.now(timezone.utc),
    )
    db.add(op)
    db.commit()
    db.refresh(op)
    return op


@pytest.fixture()
def test_user(db: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"reviewer-{uuid.uuid4().hex[:6]}@test.com",
        full_name="Test Reviewer",
        password_hash="x",
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def override_user(test_user):
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield test_user
    app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# TC-B01: GET /operators — lists active operators
# ---------------------------------------------------------------------------
def test_list_public_operators(operator):
    res = client.get("/api/v1/operators")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    slugs = [o["slug"] for o in data]
    assert operator.slug in slugs


# ---------------------------------------------------------------------------
# TC-B02: GET /operators — region filter
# ---------------------------------------------------------------------------
def test_list_public_operators_region_filter(operator):
    res = client.get("/api/v1/operators?region=Uttarakhand")
    assert res.status_code == 200
    assert any(o["slug"] == operator.slug for o in res.json())

    res2 = client.get("/api/v1/operators?region=Nowhere")
    assert res2.status_code == 200
    assert not any(o["slug"] == operator.slug for o in res2.json())


# ---------------------------------------------------------------------------
# TC-B03: GET /operators/{slug} — operator detail (no contact_email)
# ---------------------------------------------------------------------------
def test_get_public_operator(operator):
    res = client.get(f"/api/v1/operators/{operator.slug}")
    assert res.status_code == 200
    data = res.json()
    assert data["slug"] == operator.slug
    assert "contact_email" not in data
    assert "rating_avg" in data
    assert "review_count" in data


# ---------------------------------------------------------------------------
# TC-B04: GET /operators/{slug} — 404 for unknown slug
# ---------------------------------------------------------------------------
def test_get_public_operator_not_found():
    res = client.get("/api/v1/operators/nonexistent-operator-xyz")
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B05: review_service.create_review — happy path + rating avg updated
# ---------------------------------------------------------------------------
def test_create_review_updates_rating(db: Session, operator, test_user):
    payload = OperatorReviewCreate(rating=4, body="Great operator!")
    review = create_review(db, operator.id, test_user.id, payload)
    assert review.rating == 4
    db.expire_all()
    updated_op = db.get(Operator, operator.id)
    assert updated_op.review_count == 1
    assert updated_op.rating_avg == 4.0


# ---------------------------------------------------------------------------
# TC-B06: review_service.delete_review — rating avg recalculated
# ---------------------------------------------------------------------------
def test_delete_review_updates_rating(db: Session, operator, test_user):
    payload = OperatorReviewCreate(rating=5, body="Excellent!")
    review = create_review(db, operator.id, test_user.id, payload)
    delete_review(db, review.id)
    db.expire_all()
    updated_op = db.get(Operator, operator.id)
    assert updated_op.review_count == 0
    assert updated_op.rating_avg == 0.0


# ---------------------------------------------------------------------------
# TC-B07: GET /operators/{slug}/reviews — returns review list
# ---------------------------------------------------------------------------
def test_get_operator_reviews(db: Session, operator, test_user):
    create_review(db, operator.id, test_user.id, OperatorReviewCreate(rating=3, body="OK"))
    res = client.get(f"/api/v1/operators/{operator.slug}/reviews")
    assert res.status_code == 200
    assert len(res.json()) >= 1
    assert res.json()[0]["rating"] == 3


# ---------------------------------------------------------------------------
# TC-B08: POST /operators/{slug}/reviews — requires auth
# ---------------------------------------------------------------------------
def test_submit_review_requires_auth(operator):
    res = client.post(f"/api/v1/operators/{operator.slug}/reviews", json={"rating": 5})
    assert res.status_code in (401, 403)


# ---------------------------------------------------------------------------
# TC-B09: POST /operators/{slug}/reviews — happy path (mocked user)
# ---------------------------------------------------------------------------
def test_submit_review_authenticated(operator, override_user):
    res = client.post(
        f"/api/v1/operators/{operator.slug}/reviews",
        json={"rating": 5, "body": "Loved it!"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["rating"] == 5
    assert data["operator_id"] == str(operator.id)


# ---------------------------------------------------------------------------
# TC-B10: POST /operators/{slug}/reviews — duplicate returns 409
# ---------------------------------------------------------------------------
def test_submit_review_duplicate(db: Session, operator, test_user, override_user):
    create_review(db, operator.id, test_user.id, OperatorReviewCreate(rating=4))
    res = client.post(
        f"/api/v1/operators/{operator.slug}/reviews",
        json={"rating": 3, "body": "Second try"},
    )
    assert res.status_code == 409


# ---------------------------------------------------------------------------
# TC-B11: agreement_service.upsert_agreement — create + idempotent update
# ---------------------------------------------------------------------------
def test_upsert_agreement(db: Session, operator):
    payload = OperatorAgreementCreate(lead_fee_inr=500.0, revenue_share_pct=10.0, active=True)
    agreement = upsert_agreement(db, operator.id, payload)
    assert agreement.lead_fee_inr == 500.0
    assert agreement.revenue_share_pct == 10.0

    # Idempotent — update existing
    payload2 = OperatorAgreementCreate(lead_fee_inr=750.0, active=False)
    agreement2 = upsert_agreement(db, operator.id, payload2)
    assert agreement2.id == agreement.id
    assert agreement2.lead_fee_inr == 750.0
    assert agreement2.active is False


# ---------------------------------------------------------------------------
# TC-B12: admin GET /admin/operators/{id}/agreement — 404 without agreement
# ---------------------------------------------------------------------------
def test_admin_get_agreement_not_found(operator):
    res = client.get(f"/api/v1/admin/operators/{operator.id}/agreement")
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# TC-B13: admin POST /admin/operators/{id}/agreement — creates agreement
# ---------------------------------------------------------------------------
def test_admin_create_agreement(operator):
    res = client.post(
        f"/api/v1/admin/operators/{operator.id}/agreement",
        json={"lead_fee_inr": 300.0, "revenue_share_pct": 5.0, "active": True},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["lead_fee_inr"] == 300.0
    assert data["operator_id"] == str(operator.id)


# ---------------------------------------------------------------------------
# TC-B14: POST /inquiries — creates lead (no operator slug)
# ---------------------------------------------------------------------------
def test_create_inquiry_no_operator():
    with patch("app.api.routes.operators_public._send_inquiry_confirmation"), \
         patch("app.api.routes.operators_public._send_operator_notification"):
        res = client.post("/api/v1/inquiries", json={
            "name": "Test Hiker",
            "email": "hiker@test.com",
            "trek_interest": "Kedarkantha",
            "message": "Is this good for beginners?",
        })
    assert res.status_code == 201
    data = res.json()
    assert data["trek_interest"] == "Kedarkantha"
    assert data["status"] == "new"


# ---------------------------------------------------------------------------
# TC-B15: POST /inquiries — links to operator when slug provided
# ---------------------------------------------------------------------------
def test_create_inquiry_with_operator_slug(operator):
    with patch("app.api.routes.operators_public._send_inquiry_confirmation"), \
         patch("app.api.routes.operators_public._send_operator_notification"):
        res = client.post("/api/v1/inquiries", json={
            "name": "Trek Fan",
            "email": "fan@test.com",
            "trek_interest": "Roopkund",
            "operator_slug": operator.slug,
        })
    assert res.status_code == 201
    assert res.json()["status"] == "new"


# ---------------------------------------------------------------------------
# TC-B16: admin DELETE /admin/operators/reviews/{id} — moderation
# ---------------------------------------------------------------------------
def test_admin_delete_review(db: Session, operator, test_user):
    review = create_review(db, operator.id, test_user.id, OperatorReviewCreate(rating=2, body="Meh"))
    review_id = review.id
    res = client.delete(f"/api/v1/admin/operators/reviews/{review_id}")
    assert res.status_code == 204
    db.expire_all()
    assert db.get(OperatorReview, review_id) is None


# ---------------------------------------------------------------------------
# TC-B17: Operator model has new fields
# ---------------------------------------------------------------------------
def test_operator_model_new_fields(operator):
    res = client.get(f"/api/v1/operators/{operator.slug}")
    data = res.json()
    assert "logo_url" in data
    assert "description_long" in data
    assert "rating_avg" in data
    assert "review_count" in data
