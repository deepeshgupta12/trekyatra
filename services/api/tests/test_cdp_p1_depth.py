"""P1 CDP depth — capture enrichment (os/ip_hash/geo), is_internal batch-parity fix,
and derived lifecycle/engagement/lead scoring on user_traits."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.modules.cdp.models import UserTrait
from app.modules.cdp.service import (
    batch_log_events,
    compute_lifecycle_and_scores,
    hash_ip,
    log_event,
    recompute_all_traits,
)
from app.schemas.cdp import EventIn

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def _event_in(**kwargs) -> EventIn:
    defaults = dict(
        anonymous_id="p1-anon",
        event_category="engagement",
        event_name="trek_viewed",
        properties={"trek_slug": "kedarkantha"},
    )
    defaults.update(kwargs)
    return EventIn(**defaults)


def _trait(**kwargs) -> UserTrait:
    t = UserTrait(anonymous_id="scoretest")
    for k, v in kwargs.items():
        setattr(t, k, v)
    return t


# ── TC-B01: ip is hashed, never stored raw; deterministic; None-safe ──────────
def test_hash_ip_is_deterministic_and_none_safe():
    h1 = hash_ip("203.0.113.9")
    h2 = hash_ip("203.0.113.9")
    assert h1 == h2 and h1 is not None
    assert h1 != "203.0.113.9"          # never the raw IP
    assert len(h1) == 64                 # sha256 hex
    assert hash_ip(None) is None
    assert hash_ip("") is None
    assert hash_ip("1.1.1.1") != hash_ip("2.2.2.2")


# ── TC-B02: log_event persists ip_hash + os + proxy-country fallback ──────────
def test_log_event_stores_ip_hash_os_and_country(db: Session):
    event = log_event(db, _event_in(os="macOS"), ip="198.51.100.7", country="IN")
    assert event.os == "macOS"
    assert event.ip_hash == hash_ip("198.51.100.7")
    assert event.country == "IN"


def test_log_event_client_country_wins_over_proxy(db: Session):
    event = log_event(db, _event_in(country="NP"), ip="198.51.100.7", country="IN")
    assert event.country == "NP"  # explicit client value takes precedence over proxy header


# ── TC-B03: the batch path now flags is_internal (was the bug) ────────────────
def test_batch_log_events_sets_is_internal(db: Session):
    n = batch_log_events(
        db,
        [_event_in(anonymous_id="p1-batch-internal", is_internal=True)],
        ip="203.0.113.50",
    )
    assert n == 1
    from app.modules.cdp.models import AnalyticsEvent
    row = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.anonymous_id == "p1-batch-internal")
        .order_by(AnalyticsEvent.created_at.desc())
        .first()
    )
    assert row is not None
    assert row.is_internal is True                 # previously always False on the batch path
    assert row.ip_hash == hash_ip("203.0.113.50")


# ── TC-B04: ingest API stores a hashed IP from X-Forwarded-For ────────────────
def test_ingest_api_hashes_forwarded_for():
    import uuid as _uuid
    anon = f"p1-xff-{_uuid.uuid4().hex[:8]}"   # unique per run (shared persistent test DB)
    resp = client.post(
        "/api/v1/analytics/events/batch",
        json={"events": [{"anonymous_id": anon, "event_category": "engagement", "event_name": "trek_viewed"}]},
        headers={"x-forwarded-for": "192.0.2.44, 10.0.0.1", "cf-ipcountry": "IN"},
    )
    assert resp.status_code == 201
    with SessionLocal() as s:
        from app.modules.cdp.models import AnalyticsEvent
        row = s.query(AnalyticsEvent).filter(AnalyticsEvent.anonymous_id == anon).first()
        assert row is not None
        assert row.ip_hash == hash_ip("192.0.2.44")   # first hop of X-Forwarded-For only
        assert row.country == "IN"


# ── TC-B05: lifecycle stage rules ─────────────────────────────────────────────
def test_lifecycle_new_when_no_activity():
    t = _trait(total_sessions=0, last_seen_at=None, first_seen_at=None)
    compute_lifecycle_and_scores(t)
    assert t.lifecycle_stage == "new"


def test_lifecycle_active_dormant_churned():
    now = datetime(2026, 8, 6, tzinfo=timezone.utc)
    active = _trait(total_sessions=4, first_seen_at=now - timedelta(days=20), last_seen_at=now - timedelta(days=2))
    dormant = _trait(total_sessions=4, first_seen_at=now - timedelta(days=90), last_seen_at=now - timedelta(days=30))
    churned = _trait(total_sessions=4, first_seen_at=now - timedelta(days=200), last_seen_at=now - timedelta(days=120))
    for t, expected in [(active, "active"), (dormant, "dormant"), (churned, "churned")]:
        compute_lifecycle_and_scores(t, now=now)
        assert t.lifecycle_stage == expected


def test_lifecycle_new_single_session_recent():
    now = datetime(2026, 8, 6, tzinfo=timezone.utc)
    t = _trait(total_sessions=1, first_seen_at=now - timedelta(days=1), last_seen_at=now - timedelta(days=1))
    compute_lifecycle_and_scores(t, now=now)
    assert t.lifecycle_stage == "new"


# ── TC-B06: scores are bounded 0–100 and reflect intent ───────────────────────
def test_scores_bounded_and_intent_weighted():
    now = datetime(2026, 8, 6, tzinfo=timezone.utc)
    hot = _trait(
        total_events=80, total_sessions=12, total_page_views=40,
        viewed_treks=["a", "b", "c", "d", "e", "f"], searched_queries=["x", "y", "z"],
        plan_wizard_started=True, plan_wizard_completed=True, signed_up_at=now, signed_in_count=9,
        first_seen_at=now - timedelta(days=5), last_seen_at=now,
    )
    cold = _trait(total_events=1, total_sessions=1, total_page_views=1,
                  first_seen_at=now - timedelta(days=1), last_seen_at=now - timedelta(days=1))
    compute_lifecycle_and_scores(hot, now=now)
    compute_lifecycle_and_scores(cold, now=now)
    assert 0 <= hot.engagement_score <= 100 and 0 <= hot.lead_score <= 100
    assert 0 <= cold.engagement_score <= 100 and 0 <= cold.lead_score <= 100
    assert hot.engagement_score > cold.engagement_score
    assert hot.lead_score > cold.lead_score
    assert hot.lead_score >= 75          # wizard-complete + signup + repeat sign-in
    assert hot.traits_computed_at is not None


# ── TC-B07: recompute_all_traits + admin endpoint ─────────────────────────────
def test_recompute_all_traits_updates_rows(db: Session):
    t = UserTrait(anonymous_id="p1-recompute", total_sessions=3, total_events=10,
                  first_seen_at=datetime.now(timezone.utc) - timedelta(days=3),
                  last_seen_at=datetime.now(timezone.utc))
    db.add(t)
    db.commit()
    updated = recompute_all_traits(db, limit=None)
    assert updated >= 1
    db.refresh(t)
    assert t.lifecycle_stage in {"new", "active", "dormant", "churned"}
    assert t.engagement_score is not None


def test_admin_recompute_endpoint_returns_count():
    # admin_router is gated by get_current_admin in prod; the test harness bypasses admin auth
    # (same as the other /admin/cdp tests), so here we assert the happy-path contract.
    resp = client.post("/api/v1/admin/cdp/traits/recompute?limit=5")
    assert resp.status_code == 200
    assert "recomputed" in resp.json()
