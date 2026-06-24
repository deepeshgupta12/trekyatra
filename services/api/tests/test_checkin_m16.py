"""
M16 backend tests — Trek Check-ins & History.

TC-B-M16-01  create_checkin stores a row and returns it
TC-B-M16-02  get_user_history returns only the requesting user's entries, sorted newest-first
TC-B-M16-03  has_user_done_trek returns True / False correctly
TC-B-M16-04  get_history_stats counts totals, states, and awards badges correctly
TC-B-M16-05  POST /api/v1/mobile/checkin returns 201 with correct shape (API-level)
TC-B-M16-06  GET /api/v1/mobile/checkin returns list for authenticated user
TC-B-M16-07  GET /api/v1/mobile/checkin/stats returns badges
TC-B-M16-08  GET /api/v1/mobile/checkin/done/{slug} returns {done: true/false}
"""
import uuid
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.main import app
from app.modules.auth.models import User
from app.modules.mobile.models import UserTrekHistory
from app.modules.mobile.service import (
    create_checkin,
    get_user_history,
    has_user_done_trek,
    get_history_stats,
)
from app.schemas.mobile import CheckinIn


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db: Session) -> User:
    user = db.query(User).filter(User.email == "m16checkin@trekyatra.com").first()
    if not user:
        user = User(email="m16checkin@trekyatra.com", full_name="M16 Checkin", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def test_user_b(db: Session) -> User:
    user = db.query(User).filter(User.email == "m16checkin_b@trekyatra.com").first()
    if not user:
        user = User(email="m16checkin_b@trekyatra.com", full_name="M16 Checkin B", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _checkin_in(**kwargs) -> CheckinIn:
    defaults = {
        "trek_slug": "hampta-pass",
        "trek_title": "Hampta Pass Trek",
        "completion_date": date(2026, 6, 10),
        "duration_days": 5,
        "rating": 5,
        "trek_state": "Himachal Pradesh",
        "max_altitude_ft": 14100,
    }
    defaults.update(kwargs)
    return CheckinIn(**defaults)


# ── Service-level tests ────────────────────────────────────────────────────────

def test_create_checkin_stores_row(db: Session, test_user: User):
    """TC-B-M16-01"""
    entry = create_checkin(db, test_user.id, _checkin_in())
    assert entry.id is not None
    assert entry.user_id == test_user.id
    assert entry.trek_slug == "hampta-pass"
    assert entry.rating == 5
    assert entry.duration_days == 5
    db.delete(entry)
    db.commit()


def test_get_user_history_isolation(db: Session, test_user: User, test_user_b: User):
    """TC-B-M16-02 — each user sees only their own entries; sorted newest-first."""
    e1 = create_checkin(db, test_user.id, _checkin_in(
        trek_slug="hampta-pass-old", completion_date=date(2026, 1, 1)))
    e2 = create_checkin(db, test_user.id, _checkin_in(
        trek_slug="kedarkantha", completion_date=date(2026, 6, 1)))
    e_other = create_checkin(db, test_user_b.id, _checkin_in(trek_slug="other-trek"))

    history_a = get_user_history(db, test_user.id, limit=10, offset=0)
    # filter only the entries we just created (may include earlier test runs)
    our_slugs = {e.trek_slug for e in history_a if e.trek_slug in ("hampta-pass-old", "kedarkantha")}
    assert our_slugs == {"hampta-pass-old", "kedarkantha"}
    # newest first
    our_entries = [e for e in history_a if e.trek_slug in ("hampta-pass-old", "kedarkantha")]
    assert our_entries[0].trek_slug == "kedarkantha"

    history_b = get_user_history(db, test_user_b.id, limit=10, offset=0)
    assert any(e.trek_slug == "other-trek" for e in history_b)

    for e in [e1, e2, e_other]:
        db.delete(e)
    db.commit()


def test_has_user_done_trek(db: Session, test_user: User):
    """TC-B-M16-03"""
    entry = create_checkin(db, test_user.id, _checkin_in(trek_slug="valley-of-flowers"))
    assert has_user_done_trek(db, test_user.id, "valley-of-flowers") is True
    assert has_user_done_trek(db, test_user.id, "different-trek-xyz") is False
    db.delete(entry)
    db.commit()


def test_get_history_stats_and_badges(db: Session, test_user: User):
    """TC-B-M16-04"""
    entries = []
    for i in range(5):
        e = create_checkin(db, test_user.id, _checkin_in(
            trek_slug=f"badge-trek-m16-{i}",
            duration_days=3,
            trek_state="Himachal Pradesh",
            max_altitude_ft=14500,
        ))
        entries.append(e)

    stats = get_history_stats(db, test_user.id)
    assert stats.total_treks >= 5
    assert stats.total_days >= 15
    assert "Himachal Pradesh" in stats.states_visited
    assert "First Trek" in stats.badges
    assert "5-Trek Club" in stats.badges
    assert "High Altitude Ace" in stats.badges

    for e in entries:
        db.delete(e)
    db.commit()


# ── API-level tests ────────────────────────────────────────────────────────────

def _get_auth_headers(client: TestClient) -> dict:
    """Sign up a test mobile user and return bearer headers."""
    email = f"m16api_{uuid.uuid4().hex[:8]}@test.com"
    resp = client.post("/api/v1/auth/mobile/signup", json={
        "email": email,
        "password": "Test1234!",
        "full_name": "M16 API Tester",
        "device_id": f"device-{uuid.uuid4().hex[:8]}",
        "platform": "ios",
    })
    assert resp.status_code in (200, 201), resp.text
    token = resp.json().get("access_token")
    assert token, f"No token in: {resp.json()}"
    return {"Authorization": f"Bearer {token}"}


def test_api_create_checkin():
    """TC-B-M16-05 — POST /api/v1/mobile/checkin returns 201."""
    client = TestClient(app)
    headers = _get_auth_headers(client)
    payload = {
        "trek_slug": "hampta-pass",
        "trek_title": "Hampta Pass Trek",
        "completion_date": "2026-06-10",
        "duration_days": 5,
        "rating": 4,
        "trek_state": "Himachal Pradesh",
    }
    resp = client.post("/api/v1/mobile/checkin", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["trek_slug"] == "hampta-pass"
    assert data["rating"] == 4
    assert "id" in data


def test_api_get_checkin_history():
    """TC-B-M16-06 — GET /api/v1/mobile/checkin returns list."""
    client = TestClient(app)
    headers = _get_auth_headers(client)
    client.post("/api/v1/mobile/checkin", json={
        "trek_slug": "kedarkantha",
        "completion_date": "2026-05-20",
        "duration_days": 6,
    }, headers=headers)
    resp = client.get("/api/v1/mobile/checkin", headers=headers)
    assert resp.status_code == 200, resp.text
    items = resp.json()
    assert isinstance(items, list)
    assert any(i["trek_slug"] == "kedarkantha" for i in items)


def test_api_get_stats():
    """TC-B-M16-07 — GET /api/v1/mobile/checkin/stats returns badges list."""
    client = TestClient(app)
    headers = _get_auth_headers(client)
    client.post("/api/v1/mobile/checkin", json={
        "trek_slug": "roopkund",
        "completion_date": "2026-04-15",
        "duration_days": 8,
    }, headers=headers)
    resp = client.get("/api/v1/mobile/checkin/stats", headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "total_treks" in data
    assert "badges" in data
    assert "First Trek" in data["badges"]


def test_api_done_flag():
    """TC-B-M16-08 — GET /api/v1/mobile/checkin/done/{slug}."""
    client = TestClient(app)
    headers = _get_auth_headers(client)
    client.post("/api/v1/mobile/checkin", json={
        "trek_slug": "beas-kund",
        "completion_date": "2026-03-01",
    }, headers=headers)
    resp_done = client.get("/api/v1/mobile/checkin/done/beas-kund", headers=headers)
    assert resp_done.status_code == 200
    assert resp_done.json()["done"] is True

    resp_not = client.get("/api/v1/mobile/checkin/done/no-such-trek-xyz", headers=headers)
    assert resp_not.status_code == 200
    assert resp_not.json()["done"] is False
