"""Step 29 — Operator CRUD, lead routing, and assign-operator tests."""
from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.modules.operators.models import Operator, OperatorSpecialization
from app.modules.leads.models import LeadSubmission
from app.modules.operators.service import (
    create_operator,
    list_operators,
    get_operator,
    update_operator,
    delete_operator,
    find_matching_operator,
)
from app.schemas.operators import OperatorCreate, OperatorPatch

client = TestClient(app)


# ── Helpers ─────────────────────────────────────────────────────────────────

def _make_operator(db: Session, *, name: str = "Alpine Trails", slug: str | None = None) -> Operator:
    slug = slug or name.lower().replace(" ", "-") + f"-{uuid.uuid4().hex[:6]}"
    payload = OperatorCreate(
        name=name,
        slug=slug,
        contact_email="ops@example.com",
        region=["Uttarakhand"],
        trek_types=["kedarnath", "madhyamaheshwar", "tungnath"],
        active=True,
    )
    return create_operator(db, payload)


# ── TC-B01: ORM insert ───────────────────────────────────────────────────────

def test_operator_orm_insert():
    with SessionLocal() as db:
        op = _make_operator(db)
        assert op.id is not None
        assert op.name == "Alpine Trails"
        assert op.active is True
        db.delete(op)
        db.commit()


# ── TC-B02: Create duplicate slug returns ValueError ─────────────────────────

def test_create_operator_duplicate_slug():
    with SessionLocal() as db:
        slug = f"test-slug-{uuid.uuid4().hex[:8]}"
        op = create_operator(db, OperatorCreate(name="Operator A", slug=slug, contact_email="a@x.com"))
        with pytest.raises(ValueError, match="already exists"):
            create_operator(db, OperatorCreate(name="Operator B", slug=slug, contact_email="b@x.com"))
        db.delete(op)
        db.commit()


# ── TC-B03: List operators ────────────────────────────────────────────────────

def test_list_operators():
    with SessionLocal() as db:
        before = len(list_operators(db))
        op = _make_operator(db)
        after = len(list_operators(db))
        assert after == before + 1
        db.delete(op)
        db.commit()


# ── TC-B04: Get by ID ─────────────────────────────────────────────────────────

def test_get_operator_found_and_not_found():
    with SessionLocal() as db:
        op = _make_operator(db)
        fetched = get_operator(db, op.id)
        assert fetched is not None
        assert fetched.name == "Alpine Trails"
        missing = get_operator(db, uuid.uuid4())
        assert missing is None
        db.delete(op)
        db.commit()


# ── TC-B05: Update operator ───────────────────────────────────────────────────

def test_update_operator():
    with SessionLocal() as db:
        op = _make_operator(db)
        updated = update_operator(db, op.id, OperatorPatch(active=False, phone="9999999999"))
        assert updated is not None
        assert updated.active is False
        assert updated.phone == "9999999999"
        db.delete(op)
        db.commit()


# ── TC-B06: Delete operator ───────────────────────────────────────────────────

def test_delete_operator():
    with SessionLocal() as db:
        op = _make_operator(db)
        op_id = op.id
        result = delete_operator(db, op_id)
        assert result is True
        assert get_operator(db, op_id) is None
        assert delete_operator(db, op_id) is False


# ── TC-B07: find_matching_operator — match ─────────────────────────────────────

def test_find_matching_operator_hit():
    with SessionLocal() as db:
        op = create_operator(db, OperatorCreate(
            name="Kedarnath Ops",
            slug=f"kedarnath-ops-{uuid.uuid4().hex[:6]}",
            contact_email="k@k.com",
            trek_types=["kedarnath", "chandrashila"],
        ))
        matched = find_matching_operator(db, "Kedarnath Trek")
        assert matched is not None
        assert matched.id == op.id
        db.delete(op)
        db.commit()


# ── TC-B08: find_matching_operator — no match ─────────────────────────────────

def test_find_matching_operator_miss():
    with SessionLocal() as db:
        result = find_matching_operator(db, "very-obscure-trek-xyzzy-9999")
        assert result is None


# ── TC-B09: API — list operators ──────────────────────────────────────────────

def test_api_list_operators():
    r = client.get("/api/v1/admin/operators")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ── TC-B10: API — create + get + delete ───────────────────────────────────────

def test_api_create_get_delete_operator():
    slug = f"api-test-op-{uuid.uuid4().hex[:8]}"
    payload = {
        "name": "Test Operator",
        "slug": slug,
        "contact_email": "test@ops.com",
        "trek_types": ["har ki dun"],
        "active": True,
    }
    r = client.post("/api/v1/admin/operators", json=payload)
    assert r.status_code == 201
    op_id = r.json()["id"]

    r2 = client.get(f"/api/v1/admin/operators/{op_id}")
    assert r2.status_code == 200
    assert r2.json()["slug"] == slug

    r3 = client.delete(f"/api/v1/admin/operators/{op_id}")
    assert r3.status_code == 204

    r4 = client.get(f"/api/v1/admin/operators/{op_id}")
    assert r4.status_code == 404


# ── TC-B11: API — patch operator ──────────────────────────────────────────────

def test_api_patch_operator():
    slug = f"patch-test-{uuid.uuid4().hex[:8]}"
    r = client.post("/api/v1/admin/operators", json={
        "name": "Patch Me", "slug": slug, "contact_email": "p@p.com"
    })
    assert r.status_code == 201
    op_id = r.json()["id"]

    r2 = client.patch(f"/api/v1/admin/operators/{op_id}", json={"active": False})
    assert r2.status_code == 200
    assert r2.json()["active"] is False

    client.delete(f"/api/v1/admin/operators/{op_id}")


# ── TC-B12: API — 404 on non-existent operator ───────────────────────────────

def test_api_operator_404():
    r = client.get(f"/api/v1/admin/operators/{uuid.uuid4()}")
    assert r.status_code == 404


# ── TC-B13: Lead routing — auto-assigns operator on create ────────────────────

def test_lead_auto_routes_to_operator():
    with SessionLocal() as db:
        op = create_operator(db, OperatorCreate(
            name="Auto Route Op",
            slug=f"auto-route-op-{uuid.uuid4().hex[:6]}",
            contact_email="auto@ops.com",
            trek_types=["Roopkund"],
        ))

    r = client.post("/api/v1/leads", json={
        "name": "Test Trekker",
        "email": "trekker@test.com",
        "trek_interest": "Roopkund Trek",
        "source_page": "/roopkund",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["assigned_operator_id"] == str(op.id)
    assert data["status"] == "routed"

    with SessionLocal() as db:
        db.delete(op)
        db.commit()


# ── TC-B14: API — assign-operator endpoint ────────────────────────────────────

def test_api_assign_operator():
    with SessionLocal() as db:
        op = create_operator(db, OperatorCreate(
            name="Assign Op",
            slug=f"assign-op-{uuid.uuid4().hex[:6]}",
            contact_email="assign@ops.com",
        ))

    # Create a lead first
    r_lead = client.post("/api/v1/leads", json={
        "name": "Assign Test",
        "email": f"assign-{uuid.uuid4().hex[:4]}@test.com",
        "trek_interest": "random-unknown-trek",
        "source_page": "/test",
    })
    assert r_lead.status_code == 201
    lead_id = r_lead.json()["id"]

    r = client.patch(f"/api/v1/admin/leads/{lead_id}/assign-operator", json={"operator_id": str(op.id)})
    assert r.status_code == 200
    assert r.json()["assigned_operator_id"] == str(op.id)

    with SessionLocal() as db:
        db.delete(op)
        db.commit()


# ── TC-B15: Assign-operator — 404 on bad IDs ─────────────────────────────────

def test_assign_operator_404():
    r = client.patch(f"/api/v1/admin/leads/{uuid.uuid4()}/assign-operator", json={"operator_id": str(uuid.uuid4())})
    assert r.status_code == 404

    with SessionLocal() as db:
        op = create_operator(db, OperatorCreate(
            name="404 Op",
            slug=f"four-op-{uuid.uuid4().hex[:6]}",
            contact_email="f@ops.com",
        ))
    r2 = client.patch(f"/api/v1/admin/leads/{uuid.uuid4()}/assign-operator", json={"operator_id": str(op.id)})
    assert r2.status_code == 404
    with SessionLocal() as db:
        db.delete(op)
        db.commit()
