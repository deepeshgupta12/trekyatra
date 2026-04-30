"""Tests for Step 31 — Email Automation and Audience Workflows."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.modules.email_sequences.models import (
    EmailSequence,
    EmailSequenceStep,
    SubscriberSequenceEnrollment,
    SubscriberTag,
)
from app.modules.email_sequences.service import (
    add_subscriber_tag,
    enroll_by_tag,
    enroll_subscriber,
    generate_preferences_token,
    list_sequences,
    seed_default_sequences,
    update_subscriber_preferences,
    verify_preferences_token,
)
from app.modules.newsletter.models import NewsletterSubscriber

client = TestClient(app)

# ─── Helpers ────────────────────────────────────────────────────────────────

def _make_subscriber(db, email: str = None) -> NewsletterSubscriber:
    sub = NewsletterSubscriber(
        id=uuid.uuid4(),
        email=email or f"test-{uuid.uuid4().hex[:8]}@example.com",
        name="Test User",
        source_page="/test",
        created_at=datetime.now(timezone.utc),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


# ─── TC-B01: ORM — SubscriberTag insert ────────────────────────────────────

def test_subscriber_tag_orm_insert():
    with SessionLocal() as db:
        sub = _make_subscriber(db)
        tag = SubscriberTag(
            id=uuid.uuid4(),
            subscriber_id=sub.id,
            tag="winter",
            created_at=datetime.now(timezone.utc),
        )
        db.add(tag)
        db.commit()
        db.refresh(tag)
        assert tag.tag == "winter"
        assert tag.subscriber_id == sub.id
        # cleanup
        db.delete(tag)
        db.delete(sub)
        db.commit()


# ─── TC-B02: seed_default_sequences — creates 3 sequences ─────────────────

def test_seed_default_sequences_creates_three():
    with SessionLocal() as db:
        before_ids = {row.id for row in db.scalars(db.query(EmailSequence)).all()}
        seeded = seed_default_sequences(db)
        # Must create exactly 3 if none exist, or 0 if all exist (idempotent)
        assert seeded >= 0
        after = db.scalars(db.query(EmailSequence)).all()
        slugs = {s.slug for s in after}
        assert "winter_trek_nurture" in slugs
        assert "monsoon_prep" in slugs
        assert "general_trek_discovery" in slugs


# ─── TC-B03: seed_default_sequences — idempotent ──────────────────────────

def test_seed_default_sequences_idempotent():
    with SessionLocal() as db:
        seed_default_sequences(db)
        count_first = db.query(EmailSequence).count()
        seed_default_sequences(db)
        count_second = db.query(EmailSequence).count()
        assert count_first == count_second


# ─── TC-B04: add_subscriber_tag — creates a tag ───────────────────────────

def test_add_subscriber_tag():
    with SessionLocal() as db:
        sub = _make_subscriber(db)
        tag = add_subscriber_tag(db, sub.id, "monsoon_trek")
        assert tag is not None
        assert tag.tag == "monsoon_trek"
        # Duplicate is idempotent
        tag2 = add_subscriber_tag(db, sub.id, "monsoon_trek")
        assert tag2.id == tag.id
        db.delete(sub)
        db.commit()


# ─── TC-B05: enroll_by_tag — winter routes to winter sequence ──────────────

def test_enroll_by_tag_winter():
    with SessionLocal() as db:
        seed_default_sequences(db)
        sub = _make_subscriber(db)
        slug = enroll_by_tag(db, sub.id, "Kedarkantha Winter Trek")
        assert slug == "winter_trek_nurture"
        # Enrollment created
        enrollment = db.scalar(
            db.query(SubscriberSequenceEnrollment)
            .filter(SubscriberSequenceEnrollment.subscriber_id == sub.id)
        )
        assert enrollment is not None
        assert enrollment.status == "active"
        db.delete(sub)
        db.commit()


# ─── TC-B06: enroll_by_tag — unknown tag falls back to general ────────────

def test_enroll_by_tag_general_fallback():
    with SessionLocal() as db:
        seed_default_sequences(db)
        sub = _make_subscriber(db)
        slug = enroll_by_tag(db, sub.id, "Himalayan Trek")
        assert slug == "general_trek_discovery"
        db.delete(sub)
        db.commit()


# ─── TC-B07: enroll_subscriber — duplicate is idempotent ──────────────────

def test_enroll_subscriber_idempotent():
    with SessionLocal() as db:
        seed_default_sequences(db)
        seq = db.scalars(db.query(EmailSequence).filter(EmailSequence.slug == "general_trek_discovery")).first()
        sub = _make_subscriber(db)
        e1 = enroll_subscriber(db, sub.id, seq.id)
        e2 = enroll_subscriber(db, sub.id, seq.id)
        assert e1.id == e2.id
        db.delete(sub)
        db.commit()


# ─── TC-B08: update_subscriber_preferences ─────────────────────────────────

def test_update_subscriber_preferences():
    with SessionLocal() as db:
        sub = _make_subscriber(db)
        result = update_subscriber_preferences(db, sub.id, {"digest": False, "nurture": True})
        assert result is not None
        assert result.preferences["digest"] is False
        assert result.preferences["nurture"] is True
        db.delete(sub)
        db.commit()


# ─── TC-B09: HMAC token — generate and verify ─────────────────────────────

def test_preferences_token_generate_and_verify():
    sub_id = uuid.uuid4()
    token = generate_preferences_token(sub_id)
    assert verify_preferences_token(sub_id, token) is True
    assert verify_preferences_token(uuid.uuid4(), token) is False


# ─── TC-B10: API GET /admin/email-sequences ────────────────────────────────

def test_api_list_email_sequences():
    with SessionLocal() as db:
        seed_default_sequences(db)
    resp = client.get("/api/v1/admin/email-sequences")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    slugs = [s["slug"] for s in data]
    assert "winter_trek_nurture" in slugs
    assert "monsoon_prep" in slugs
    assert "general_trek_discovery" in slugs


# ─── TC-B11: API GET /admin/email-sequences/{id} ──────────────────────────

def test_api_get_email_sequence_detail():
    with SessionLocal() as db:
        seed_default_sequences(db)
        seq = db.scalars(db.query(EmailSequence).filter(EmailSequence.slug == "winter_trek_nurture")).first()
        seq_id = str(seq.id)
    resp = client.get(f"/api/v1/admin/email-sequences/{seq_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == "winter_trek_nurture"
    assert "steps" in data
    assert len(data["steps"]) >= 2


# ─── TC-B12: API POST /admin/email-sequences/seed ─────────────────────────

def test_api_seed_sequences():
    resp = client.post("/api/v1/admin/email-sequences/seed")
    assert resp.status_code == 200
    data = resp.json()
    assert "seeded" in data
    assert data["seeded"] >= 0


# ─── TC-B13: API GET /admin/email-sequences/{id} — 404 ───────────────────

def test_api_get_sequence_not_found():
    resp = client.get(f"/api/v1/admin/email-sequences/{uuid.uuid4()}")
    assert resp.status_code == 404


# ─── TC-B14: PATCH /newsletter/preferences — invalid token ────────────────

def test_api_preferences_invalid_token():
    sub_id = uuid.uuid4()
    resp = client.patch(
        f"/api/v1/newsletter/preferences?subscriber_id={sub_id}&token=badtoken",
        json={"digest": False},
    )
    assert resp.status_code == 403


# ─── TC-B15: GET /newsletter/unsubscribe — valid token sets active=False ──

def test_api_unsubscribe_valid_token():
    with SessionLocal() as db:
        sub = _make_subscriber(db)
        token = generate_preferences_token(sub.id)
        sub_id = sub.id
    resp = client.get(f"/api/v1/newsletter/unsubscribe?subscriber_id={sub_id}&token={token}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["unsubscribed"] is True
    with SessionLocal() as db:
        updated = db.get(NewsletterSubscriber, sub_id)
        assert updated.active is False
        db.delete(updated)
        db.commit()


# ─── TC-B16: send_welcome_email_task — SMTP not configured skips gracefully ─

def test_send_welcome_email_no_smtp():
    from app.modules.email_sequences.tasks import send_welcome_email_task
    with patch("app.modules.email_sequences.tasks.settings") as mock_settings:
        mock_settings.smtp_host = None
        mock_settings.smtp_user = None
        result = send_welcome_email_task("test@example.com", "Test User")
    assert result["sent"] is False
    assert result["reason"] == "smtp_not_configured"


# ─── TC-B17: lead create triggers subscriber tagging when subscriber exists ─

def test_lead_create_tags_subscriber():
    with SessionLocal() as db:
        seed_default_sequences(db)
        sub_email = f"tagged-{uuid.uuid4().hex[:8]}@example.com"
        sub = _make_subscriber(db, email=sub_email)
        sub_id = sub.id

    resp = client.post("/api/v1/leads", json={
        "name": "Test Trekker",
        "email": sub_email,
        "trek_interest": "winter trek",
        "source_page": "/trek/test",
        "cta_type": "consultation",
    })
    assert resp.status_code == 201

    with SessionLocal() as db:
        tags = list(db.scalars(
            db.query(SubscriberTag).filter(SubscriberTag.subscriber_id == sub_id)
        ).all())
        assert len(tags) >= 1
        tag_values = [t.tag for t in tags]
        assert any("winter" in t for t in tag_values)
        # cleanup
        for t in tags:
            db.delete(t)
        enrollments = list(db.scalars(
            db.query(SubscriberSequenceEnrollment).filter(
                SubscriberSequenceEnrollment.subscriber_id == sub_id
            )
        ).all())
        for e in enrollments:
            db.delete(e)
        sub_obj = db.get(NewsletterSubscriber, sub_id)
        if sub_obj:
            db.delete(sub_obj)
        db.commit()
