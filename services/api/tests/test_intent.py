"""Tests for Step 36 — intent classification, affiliate catalog, monetization stats."""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.modules.monetization.models import AffiliateProduct, PageIntentSession
from app.modules.agents.intent import agent as intent_mod
from app.modules.monetization.service import (
    classify_and_record,
    create_affiliate_product,
    get_monetization_stats,
    list_affiliate_products,
    mark_converted,
)
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.schemas.monetization import AffiliateProductCreate

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


def _make_user(db: Session) -> User:
    from app.modules.auth.models import User
    u = User(
        id=uuid.uuid4(),
        email=f"test_{uuid.uuid4().hex[:8]}@ex.com",
        display_name="Test",
        hashed_password="x",
        is_active=True,
        is_superuser=False,
    )
    db.add(u)
    db.flush()
    return u


# --- TC-B01: rule-based fallback when no anthropic_api_key ---
def test_rule_based_no_key():
    """Verifies: classify_intent returns rule-based result when api key is None."""
    with patch.object(intent_mod.settings, "anthropic_api_key", None):
        result = intent_mod.classify_intent("trek_guide", "hampta-pass")
    assert result.intent in ("research", "booking_ready", "inspiration", "buyer")
    assert 0.0 <= result.confidence <= 1.0
    assert result.recommended_module in ("affiliate", "lead", "newsletter", "product")


# --- TC-B02: buyer intent when has_purchases=True ---
def test_rule_based_buyer_intent():
    """Verifies: rule-based classifier returns buyer when user has purchases."""
    with patch.object(intent_mod.settings, "anthropic_api_key", None):
        result = intent_mod.classify_intent("trek_guide", "slug", has_purchases=True)
    assert result.intent == "buyer"
    assert result.recommended_module == "product"


# --- TC-B03: booking_ready intent when has_bookmarks=True ---
def test_rule_based_booking_ready():
    """Verifies: rule-based classifier returns booking_ready when user has bookmarks."""
    with patch.object(intent_mod.settings, "anthropic_api_key", None):
        result = intent_mod.classify_intent("trek_guide", "slug", has_bookmarks=True)
    assert result.intent == "booking_ready"
    assert result.recommended_module == "lead"


# --- TC-B04: Anthropic SDK mocked call ---
def test_classify_intent_mocked_llm():
    """Verifies: classify_intent calls Anthropic and parses JSON response."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text='{"intent": "research", "confidence": 0.9}')]
    mock_client.messages.create.return_value = mock_response

    with patch.object(intent_mod.settings, "anthropic_api_key", "sk-test"), \
         patch.object(intent_mod._anthropic, "Anthropic", return_value=mock_client):
        result = intent_mod.classify_intent("gear_guide", "backpacks")

    assert result.intent == "research"
    assert result.confidence == 0.9
    assert result.recommended_module == "affiliate"


# --- TC-B05: LLM exception falls back to rule-based ---
def test_classify_intent_exception_fallback():
    """Verifies: when Anthropic raises, rule-based fallback is used (never raises)."""
    with patch.object(intent_mod.settings, "anthropic_api_key", "sk-test"), \
         patch.object(intent_mod._anthropic, "Anthropic", side_effect=Exception("timeout")):
        result = intent_mod.classify_intent("trek_guide", "slug")
    assert result.intent in ("research", "booking_ready", "inspiration", "buyer")


# --- TC-B06: classify_and_record saves session ---
def test_classify_and_record_saves_session(db: Session):
    """Verifies: classify_and_record creates a PageIntentSession row."""
    with patch.object(intent_mod.settings, "anthropic_api_key", None):
        record = classify_and_record(db, "hampta-pass", "trek_guide", "sess-001")
    assert record.id is not None
    assert record.page_slug == "hampta-pass"
    assert record.intent in ("research", "booking_ready", "inspiration", "buyer")
    assert record.session_id == "sess-001"


# --- TC-B07: mark_converted sets converted=True ---
def test_mark_converted(db: Session):
    """Verifies: mark_converted flips converted flag on matching session."""
    with patch.object(intent_mod.settings, "anthropic_api_key", None):
        record = classify_and_record(db, "kedarkantha", "trek_guide", "sess-conv-001")
    ok = mark_converted(db, "sess-conv-001")
    assert ok is True
    db.refresh(record)
    assert record.converted is True


# --- TC-B08: mark_converted returns False for unknown session ---
def test_mark_converted_unknown(db: Session):
    """Verifies: mark_converted returns False when session_id not found."""
    ok = mark_converted(db, "nonexistent-session-id")
    assert ok is False


# --- TC-B09: affiliate product create + list ---
def test_affiliate_product_crud(db: Session):
    """Verifies: create and list affiliate products."""
    data = AffiliateProductCreate(
        title="Wildcraft Bag",
        affiliate_url="https://affiliate.example.com/bag",
        affiliate_program="Amazon",
        category=["gear", "bags"],
        price_range="₹2,000–₹4,000",
    )
    product = create_affiliate_product(db, data)
    assert product.id is not None
    assert product.title == "Wildcraft Bag"
    assert product.active is True

    products = list_affiliate_products(db, active_only=True)
    assert any(p.id == product.id for p in products)


# --- TC-B10: GET /intent/{slug} returns 200 ---
def test_api_get_intent():
    """Verifies: GET /intent/{slug} returns 200 with intent fields."""
    with patch.object(intent_mod.settings, "anthropic_api_key", None):
        res = client.get("/api/v1/intent/hampta-pass?session_id=test-sess-xyz")
    assert res.status_code == 200
    body = res.json()
    assert "intent" in body
    assert "recommended_module" in body
    assert "session_id" in body
    assert body["session_id"] == "test-sess-xyz"


# --- TC-B11: GET /intent/{slug} without session_id generates one ---
def test_api_get_intent_generates_session_id():
    """Verifies: GET /intent/{slug} without session_id still returns a non-empty session_id."""
    with patch.object(intent_mod.settings, "anthropic_api_key", None):
        res = client.get("/api/v1/intent/kedarkantha")
    assert res.status_code == 200
    assert res.json()["session_id"]


# --- TC-B12: POST /intent/{slug}/convert marks converted ---
def test_api_convert_session():
    """Verifies: POST /intent/{slug}/convert returns 200 for a valid session."""
    sid = "api-conv-test-001"
    with patch.object(intent_mod.settings, "anthropic_api_key", None):
        client.get(f"/api/v1/intent/hampta-pass?session_id={sid}")
    res = client.post(f"/api/v1/intent/hampta-pass/convert?session_id={sid}")
    assert res.status_code == 200
    assert res.json()["converted"] is True


# --- TC-B13: POST /intent/{slug}/convert 404 for unknown session ---
def test_api_convert_unknown_session():
    """Verifies: POST /intent/convert returns 404 for unknown session_id."""
    res = client.post("/api/v1/intent/hampta-pass/convert?session_id=no-such-session")
    assert res.status_code == 404


# --- TC-B14: GET /admin/monetization/stats returns stats shape ---
def test_api_monetization_stats():
    """Verifies: GET /admin/monetization/stats returns correct schema."""
    # Override get_current_user for this test
    fake_user = MagicMock(spec=User)
    fake_user.id = uuid.uuid4()
    fake_user.is_active = True
    fake_user.is_superuser = True
    fake_user.roles = []
    app.dependency_overrides[get_current_user] = lambda: fake_user
    try:
        with patch.object(intent_mod.settings, "anthropic_api_key", None):
            res = client.get("/api/v1/admin/monetization/stats")
        assert res.status_code == 200
        body = res.json()
        assert "intent_distribution" in body
        assert "conversion_by_module" in body
        assert "total_sessions" in body
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# --- TC-B15: GET /affiliate-products public endpoint ---
def test_api_public_affiliate_products():
    """Verifies: GET /affiliate-products returns list (possibly empty)."""
    res = client.get("/api/v1/affiliate-products")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
