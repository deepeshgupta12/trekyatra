"""Onboarding preferences (v1.1 personalization) — user_id + anonymous_id keys.

TC-B01 service upsert (user) creates then partial-updates
TC-B02 authed GET empty default when none
TC-B03 authed PUT then GET reflects; onboarding_completed
TC-B04 partial PUT keeps prior
TC-B05 public anon PUT then GET (persists by anonymous_id — survives uninstall)
TC-B06 merge-on-login: anon row adopted by the user
"""
from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.account import service as account_service
from app.modules.account.models import UserPreferences
from app.schemas.account import UserPreferencesUpdate

client = TestClient(app)
PREFS = "/api/v1/account/preferences"
ANON = "/api/v1/app/preferences"


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db) -> User:
    user = db.query(User).filter(User.email == "prefstest@trekyatra.test").first()
    if not user:
        user = User(email="prefstest@trekyatra.test", full_name="Prefs Test", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    db.query(UserPreferences).filter(UserPreferences.user_id == user.id).delete()
    db.commit()
    return user


@pytest.fixture
def authed_client(test_user):
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)


def test_service_upsert_user_creates_then_partial(db, test_user):
    account_service.upsert_preferences(
        db,
        UserPreferencesUpdate(experience="intermediate", difficulties=["Easy", "Moderate"], regions=["Himachal Pradesh"]),
        user_id=test_user.id,
    )
    prefs = account_service.upsert_preferences(db, UserPreferencesUpdate(vibes=["high-altitude"]), user_id=test_user.id)
    assert prefs.experience == "intermediate"
    assert prefs.difficulties == ["Easy", "Moderate"]
    assert prefs.vibes == ["high-altitude"]


def test_authed_get_empty_default(authed_client):
    body = authed_client.get(PREFS).json()
    assert body["onboarding_completed"] is False
    assert body["experience"] is None


def test_authed_put_then_get(authed_client):
    r = authed_client.put(PREFS, json={"experience": "experienced", "regions": ["Ladakh"], "onboarding_completed": True})
    assert r.status_code == 200, r.text
    got = authed_client.get(PREFS).json()
    assert got["experience"] == "experienced"
    assert got["regions"] == ["Ladakh"]
    assert got["onboarding_completed"] is True


def test_authed_partial_put_keeps_prior(authed_client):
    authed_client.put(PREFS, json={"experience": "beginner", "regions": ["Maharashtra"]})
    authed_client.put(PREFS, json={"onboarding_completed": True})
    got = authed_client.get(PREFS).json()
    assert got["experience"] == "beginner"
    assert got["regions"] == ["Maharashtra"]
    assert got["onboarding_completed"] is True


def test_anon_put_then_get_persists(db):
    anon = f"anon-{uuid.uuid4().hex[:12]}"
    db.query(UserPreferences).filter(UserPreferences.anonymous_id == anon).delete()
    db.commit()
    r = client.put(ANON, json={"anonymous_id": anon, "device_id": "iPhone17", "vibes": ["scenic"], "onboarding_completed": True})
    assert r.status_code == 200, r.text
    got = client.get(ANON, params={"anonymous_id": anon}).json()
    assert got["vibes"] == ["scenic"]
    assert got["onboarding_completed"] is True


def test_merge_anon_into_user(db):
    anon = f"anon-{uuid.uuid4().hex[:12]}"
    user = User(email=f"merge-{uuid.uuid4().hex[:8]}@trekyatra.test", full_name="Merge", is_active=True)
    db.add(user); db.commit(); db.refresh(user)
    # anon writes prefs before login
    account_service.upsert_preferences(db, UserPreferencesUpdate(experience="experienced", regions=["Sikkim"]), anonymous_id=anon, device_id="d1")
    # login → merge
    merged = account_service.merge_anon_into_user(db, user.id, anon)
    assert merged is not None
    assert merged.user_id == user.id
    assert merged.experience == "experienced"
    assert merged.regions == ["Sikkim"]
