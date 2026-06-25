"""STEP-79 / M18 — Trek Buddy Matching backend tests (12 tests)."""
from __future__ import annotations

import uuid
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.buddies.models import BuddyRequest, BuddySignal

client = TestClient(app, raise_server_exceptions=True)

_TREK_SLUG = "kedarkantha-buddy-test"


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def user_a(db):
    email = f"buddy-a-{uuid.uuid4().hex[:6]}@trekyatra.com"
    user = User(email=email, full_name="Priya Sharma", is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user_b(db):
    email = f"buddy-b-{uuid.uuid4().hex[:6]}@trekyatra.com"
    user = User(email=email, full_name="Rahul Mehta", is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _as_user(user: User):
    app.dependency_overrides[get_current_user] = lambda: user


def _clear_user():
    app.dependency_overrides.pop(get_current_user, None)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _create_signal(trek_slug: str = _TREK_SLUG, month_year: str = "2026-08") -> dict:
    res = client.post("/api/v1/buddies/signals", json={
        "trek_slug": trek_slug,
        "month_year": month_year,
        "group_size": 1,
        "experience": "intermediate",
        "notes": "Looking for a trekking partner",
    })
    assert res.status_code == 201, res.text
    return res.json()


# ── Tests ──────────────────────────────────────────────────────────────────────

def test_create_signal(user_a):
    """TC-B-M18-01: POST /buddies/signals creates a signal and returns 201."""
    try:
        _as_user(user_a)
        signal = _create_signal()
        assert signal["trek_slug"] == _TREK_SLUG
        assert signal["month_year"] == "2026-08"
        assert signal["experience"] == "intermediate"
        assert signal["is_own"] is True
        assert "display_name" in signal
        assert "@" not in signal["display_name"]  # no email in display name
    finally:
        _clear_user()


def test_duplicate_signal_replaces_old(user_a, db):
    """TC-B-M18-02: Second signal for same trek+month upserts (updates in place)."""
    try:
        _as_user(user_a)
        first = _create_signal(month_year="2026-09")
        first_id = first["id"]

        # Post again for same trek+month (upsert — same ID returned)
        second = _create_signal(month_year="2026-09")
        assert second["id"] == first_id  # same row updated in place

        # Signal should still be active
        signal = db.query(BuddySignal).filter(BuddySignal.id == uuid.UUID(first_id)).first()
        assert signal is not None
        assert signal.active is True
    finally:
        _clear_user()


def test_list_signals_no_email(user_a, user_b, db):
    """TC-B-M18-03: Signal list returns no email or raw user_id."""
    try:
        _as_user(user_a)
        _create_signal(month_year="2026-10")

        _as_user(user_b)
        res = client.get(f"/api/v1/buddies/signals/{_TREK_SLUG}")
        assert res.status_code == 200, res.text
        signals = res.json()
        assert len(signals) >= 1

        for signal in signals:
            # Must have display_name; no email; no user_id field
            assert "display_name" in signal
            assert "@" not in signal["display_name"]
            assert "user_id" not in signal
            assert "email" not in signal
    finally:
        _clear_user()


def test_send_request(user_a, user_b):
    """TC-B-M18-04: POST /buddies/requests returns 201."""
    try:
        _as_user(user_a)
        signal = _create_signal(month_year="2026-11")

        _as_user(user_b)
        res = client.post("/api/v1/buddies/requests", json={
            "signal_id": signal["id"],
            "message": "Hey, want to trek together?",
        })
        assert res.status_code == 201, res.text
        req = res.json()
        assert req["status"] == "pending"
        assert req["message"] == "Hey, want to trek together?"
    finally:
        _clear_user()


def test_duplicate_request_rejected(user_a, user_b):
    """TC-B-M18-05: Same sender+signal → 409."""
    try:
        _as_user(user_a)
        signal = _create_signal(month_year="2026-12")

        _as_user(user_b)
        client.post("/api/v1/buddies/requests", json={"signal_id": signal["id"]})
        res = client.post("/api/v1/buddies/requests", json={"signal_id": signal["id"]})
        assert res.status_code == 409
    finally:
        _clear_user()


def test_accept_request(user_a, user_b, db):
    """TC-B-M18-06: PATCH accept → status=accepted, responded_at set."""
    try:
        _as_user(user_a)
        signal = _create_signal(month_year="2027-01")
        signal_id = signal["id"]

        _as_user(user_b)
        req_res = client.post("/api/v1/buddies/requests", json={"signal_id": signal_id})
        req_id = req_res.json()["id"]

        # user_a (signal owner = receiver) accepts
        _as_user(user_a)
        res = client.patch(f"/api/v1/buddies/requests/{req_id}", json={"action": "accept"})
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["status"] == "accepted"
        assert data["responded_at"] is not None
    finally:
        _clear_user()


def test_cannot_request_own_signal(user_a):
    """TC-B-M18-07: User cannot send a request to their own signal → 400."""
    try:
        _as_user(user_a)
        signal = _create_signal(month_year="2027-02")

        res = client.post("/api/v1/buddies/requests", json={"signal_id": signal["id"]})
        assert res.status_code == 400
    finally:
        _clear_user()


def test_expire_signals_task(db):
    """TC-B-M18-08: Signals with past expires_at are set to active=false."""
    from app.modules.buddies.service import expire_signals

    user = User(email=f"expire-{uuid.uuid4().hex[:6]}@trekyatra.com", full_name="Expiry Test", is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Signal that should expire (expires_at in the past)
    signal = BuddySignal(
        user_id=user.id,
        trek_slug="expiry-trek",
        month_year="2025-01",
        active=True,
        expires_at=date.today() - timedelta(days=1),
    )
    db.add(signal)
    db.commit()

    count = expire_signals(db)
    assert count >= 1

    db.refresh(signal)
    assert signal.active is False


def test_public_buddy_count():
    """TC-B-M18-09: Public count endpoint returns without auth."""
    res = client.get(f"/api/v1/public/treks/{_TREK_SLUG}/buddy-count")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "count" in data
    assert "upcoming_months" in data
    assert isinstance(data["count"], int)


def test_public_trekker_profile(user_a, db):
    """TC-B-M18-10: Public trekker profile via signal_id contains no email."""
    try:
        _as_user(user_a)
        signal = _create_signal(month_year="2027-03")
        signal_id = signal["id"]
    finally:
        _clear_user()

    # Public endpoint — no auth
    res = client.get(f"/api/v1/public/trekkers/{signal_id}")
    assert res.status_code == 200, res.text
    profile = res.json()
    assert "display_name" in profile
    assert "email" not in profile
    assert "user_id" not in profile
    assert "trek_count" in profile
    assert profile["signal_id"] == signal_id


def test_send_chat_message_requires_accepted(user_a, user_b):
    """TC-B-M18-11: Chat is 403 for pending requests, 201 for accepted."""
    try:
        _as_user(user_a)
        signal = _create_signal(month_year="2027-04")

        _as_user(user_b)
        req_res = client.post("/api/v1/buddies/requests", json={"signal_id": signal["id"]})
        req_id = req_res.json()["id"]

        # Still pending — chat should fail
        res = client.post(f"/api/v1/buddies/requests/{req_id}/messages", json={"content": "Hello!"})
        assert res.status_code == 403

        # Accept the request
        _as_user(user_a)
        client.patch(f"/api/v1/buddies/requests/{req_id}", json={"action": "accept"})

        # Now chat should work for sender (user_b)
        _as_user(user_b)
        res = client.post(f"/api/v1/buddies/requests/{req_id}/messages", json={"content": "Hello!"})
        assert res.status_code == 201, res.text
        msg = res.json()
        assert msg["content"] == "Hello!"
        assert msg["is_mine"] is True
    finally:
        _clear_user()


def test_get_chat_messages_access_control(user_a, user_b, db):
    """TC-B-M18-12: Both parties can read chat; third party gets 403."""
    try:
        _as_user(user_a)
        signal = _create_signal(month_year="2027-05")

        _as_user(user_b)
        req_res = client.post("/api/v1/buddies/requests", json={"signal_id": signal["id"]})
        req_id = req_res.json()["id"]

        _as_user(user_a)
        client.patch(f"/api/v1/buddies/requests/{req_id}", json={"action": "accept"})
        client.post(f"/api/v1/buddies/requests/{req_id}/messages", json={"content": "See you on the trail!"})

        # user_b can read
        _as_user(user_b)
        res = client.get(f"/api/v1/buddies/requests/{req_id}/messages")
        assert res.status_code == 200, res.text
        msgs = res.json()
        assert len(msgs) >= 1
        assert msgs[0]["is_mine"] is False  # sent by user_a, reading as user_b

        # Third party gets 403
        third = User(email=f"third-{uuid.uuid4().hex[:6]}@trekyatra.com", full_name="Third", is_active=True)
        db.add(third)
        db.commit()
        db.refresh(third)
        _as_user(third)
        res = client.get(f"/api/v1/buddies/requests/{req_id}/messages")
        assert res.status_code == 403
    finally:
        _clear_user()
