"""Tests for leads and newsletter subscription endpoints."""
from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _uid() -> str:
    return str(uuid.uuid4())[:8]


def lead_payload(suffix: str | None = None) -> dict:
    s = suffix or _uid()
    return {
        "name": "Priya Sharma",
        "email": f"priya_{s}@example.com",
        "phone": "+919876543210",
        "trek_interest": "Kedarkantha",
        "message": "Planning for December",
        "source_page": "/trek/kedarkantha",
        "source_cluster": "winter-treks",
        "cta_type": "lead_form",
    }


def newsletter_payload(suffix: str | None = None) -> dict:
    s = suffix or _uid()
    return {
        "email": f"newsletter_{s}@example.com",
        "name": "Test User",
        "source_page": "/packing/kedarkantha",
        "lead_magnet": "packing-list",
    }


# ---------------------------------------------------------------------------
# Lead submission tests
# ---------------------------------------------------------------------------

def test_submit_lead_201():
    p = lead_payload()
    resp = client.post("/api/v1/leads", json=p)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == p["email"]
    assert data["trek_interest"] == p["trek_interest"]
    assert data["source_page"] == p["source_page"]
    assert "id" in data
    assert "created_at" in data


def test_submit_lead_minimal():
    resp = client.post("/api/v1/leads", json={
        "name": "Minimal User",
        "email": f"minimal_{_uid()}@example.com",
        "trek_interest": "Other",
        "source_page": "/explore",
    })
    assert resp.status_code == 201
    assert resp.json()["name"] == "Minimal User"


def test_submit_lead_invalid_email():
    p = {**lead_payload(), "email": "not-an-email"}
    resp = client.post("/api/v1/leads", json=p)
    assert resp.status_code == 422


def test_submit_lead_missing_required_field():
    p = lead_payload()
    del p["name"]
    resp = client.post("/api/v1/leads", json=p)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Newsletter subscription tests
# ---------------------------------------------------------------------------

def test_newsletter_subscribe_200():
    p = newsletter_payload()
    resp = client.post("/api/v1/newsletter/subscribe", json=p)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == p["email"]
    assert data["already_subscribed"] is False
    assert "id" in data


def test_newsletter_subscribe_duplicate_returns_already_subscribed():
    s = _uid()
    p = newsletter_payload(s)
    client.post("/api/v1/newsletter/subscribe", json=p)
    resp = client.post("/api/v1/newsletter/subscribe", json=p)
    assert resp.status_code == 200
    assert resp.json()["already_subscribed"] is True


def test_newsletter_subscribe_invalid_email():
    resp = client.post("/api/v1/newsletter/subscribe", json={
        "email": "bad-email",
        "source_page": "/packing/test",
    })
    assert resp.status_code == 422


def test_newsletter_subscribe_minimal():
    p = newsletter_payload()
    resp = client.post("/api/v1/newsletter/subscribe", json=p)
    assert resp.status_code == 200
    assert resp.json()["email"] == p["email"]
