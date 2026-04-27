"""Tests for the internal linking engine — sync, related pages, orphans, anchors, leads admin."""
from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uid() -> str:
    return str(uuid.uuid4())[:8]


# ---------------------------------------------------------------------------
# POST /admin/links/sync
# ---------------------------------------------------------------------------

def test_sync_pages_returns_200():
    resp = client.post("/api/v1/admin/links/sync")
    assert resp.status_code == 200
    data = resp.json()
    assert "synced" in data
    assert isinstance(data["synced"], int)
    assert "message" in data


# ---------------------------------------------------------------------------
# GET /links/suggestions/{slug}
# ---------------------------------------------------------------------------

def test_related_pages_unknown_slug_returns_empty():
    resp = client.get("/api/v1/links/suggestions/nonexistent-slug-xyz")
    assert resp.status_code == 200
    assert resp.json() == []


def test_related_pages_limit_param_accepted():
    resp = client.get("/api/v1/links/suggestions/nonexistent-slug-xyz?limit=3")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# GET /admin/links/orphans
# ---------------------------------------------------------------------------

def test_orphans_returns_200():
    resp = client.get("/api/v1/admin/links/orphans")
    assert resp.status_code == 200
    data = resp.json()
    assert "pages" in data
    assert "count" in data
    assert isinstance(data["pages"], list)
    assert data["count"] == len(data["pages"])


# ---------------------------------------------------------------------------
# GET /admin/links/anchors/{slug}
# ---------------------------------------------------------------------------

def test_anchors_unknown_slug_returns_empty():
    resp = client.get("/api/v1/admin/links/anchors/nonexistent-slug-xyz")
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# GET /admin/leads
# ---------------------------------------------------------------------------

def test_list_leads_returns_200():
    resp = client.get("/api/v1/admin/leads")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_list_leads_after_submit():
    payload = {
        "name": "Linking Test User",
        "email": f"linking_{_uid()}@example.com",
        "trek_interest": "Hampta Pass",
        "source_page": "/trek/hampta-pass",
    }
    client.post("/api/v1/leads", json=payload)
    resp = client.get("/api/v1/admin/leads")
    assert resp.status_code == 200
    emails = [l["email"] for l in resp.json()]
    assert payload["email"] in emails


def test_list_leads_status_filter():
    resp = client.get("/api/v1/admin/leads?status=new")
    assert resp.status_code == 200
    for lead in resp.json():
        assert lead["status"] == "new"


# ---------------------------------------------------------------------------
# PATCH /admin/leads/{id}
# ---------------------------------------------------------------------------

def test_patch_lead_status_to_contacted():
    payload = {
        "name": "Patch Test",
        "email": f"patch_{_uid()}@example.com",
        "trek_interest": "Valley of Flowers",
        "source_page": "/trek/valley-of-flowers",
    }
    create_resp = client.post("/api/v1/leads", json=payload)
    assert create_resp.status_code == 201
    lead_id = create_resp.json()["id"]

    patch_resp = client.patch(f"/api/v1/admin/leads/{lead_id}", json={"status": "contacted"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "contacted"


def test_patch_lead_status_invalid():
    payload = {
        "name": "Invalid Status",
        "email": f"invalid_{_uid()}@example.com",
        "trek_interest": "Roopkund",
        "source_page": "/trek/roopkund",
    }
    create_resp = client.post("/api/v1/leads", json=payload)
    lead_id = create_resp.json()["id"]
    resp = client.patch(f"/api/v1/admin/leads/{lead_id}", json={"status": "nonexistent"})
    assert resp.status_code == 422


def test_patch_lead_status_nonexistent_id():
    fake_id = str(uuid.uuid4())
    resp = client.patch(f"/api/v1/admin/leads/{fake_id}", json={"status": "contacted"})
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Lead response includes status field
# ---------------------------------------------------------------------------

def test_lead_response_includes_status():
    payload = {
        "name": "Status Field Test",
        "email": f"status_{_uid()}@example.com",
        "trek_interest": "Bali Pass",
        "source_page": "/trek/bali-pass",
    }
    resp = client.post("/api/v1/leads", json=payload)
    assert resp.status_code == 201
    assert resp.json()["status"] == "new"
