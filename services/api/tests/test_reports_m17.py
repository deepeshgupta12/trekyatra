"""STEP-78 / M17 — Trip Reports backend tests.

Tests: create report, moderation, public visibility, condition summary,
media upload validation, delete own report.
"""
from __future__ import annotations

import io
import uuid
from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User

client = TestClient(app, raise_server_exceptions=True)

_TREK_SLUG = "kedarkantha-m17-test"


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db):
    email = f"reportstest-{uuid.uuid4().hex[:6]}@trekyatra.com"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, full_name="Reports Test User", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture(autouse=True)
def _set_user(test_user):
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _report_payload(**overrides) -> dict:
    base = {
        "trek_slug": _TREK_SLUG,
        "body": "Great trail conditions. Snow started at 10,000ft. Recommend gaiters.",
        "condition": "open",
        "trek_date": str(date.today()),
        "photo_urls": [],
    }
    base.update(overrides)
    return base


def _create_report(**overrides) -> dict:
    res = client.post("/api/v1/reports", json=_report_payload(**overrides))
    assert res.status_code == 201, res.text
    return res.json()


def _approve(report_id: str) -> None:
    res = client.patch(
        f"/api/v1/admin/reports/{report_id}/moderate",
        json={"action": "approve"},
    )
    assert res.status_code == 200, res.text


# ── TC-B-M17-01: Create report → pending ──────────────────────────────────────

def test_create_report():
    """POST /reports creates report with status=pending."""
    data = _create_report()
    assert data["status"] == "pending"
    assert data["trek_slug"] == _TREK_SLUG
    assert data["condition"] == "open"
    assert "id" in data


# ── TC-B-M17-02: Pending report NOT in public list ────────────────────────────

def test_pending_report_not_in_public():
    """Public list only returns approved reports."""
    slug = f"slug-vis-{uuid.uuid4().hex[:6]}"
    data = _create_report(trek_slug=slug)
    assert data["status"] == "pending"

    res = client.get(f"/api/v1/public/treks/{slug}/reports")
    assert res.status_code == 200
    ids = [r["id"] for r in res.json()["items"]]
    assert data["id"] not in ids


# ── TC-B-M17-03: Approve report ───────────────────────────────────────────────

def test_approve_report():
    """PATCH /admin/reports/{id}/moderate with action=approve sets status=approved."""
    created = _create_report(trek_slug=f"slug-app-{uuid.uuid4().hex[:6]}")

    res = client.patch(
        f"/api/v1/admin/reports/{created['id']}/moderate",
        json={"action": "approve"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "approved"
    assert res.json()["moderated_at"] is not None


# ── TC-B-M17-04: Approved report appears in public list ───────────────────────

def test_approved_report_in_public():
    """Approved report is returned by public list endpoint."""
    slug = f"slug-pub-{uuid.uuid4().hex[:6]}"
    created = _create_report(trek_slug=slug)
    _approve(created["id"])

    res = client.get(f"/api/v1/public/treks/{slug}/reports")
    assert res.status_code == 200
    ids = [r["id"] for r in res.json()["items"]]
    assert created["id"] in ids


# ── TC-B-M17-05: Media upload accepts JPEG ───────────────────────────────────

def test_media_upload_accepts_jpeg():
    """POST /reports/media/upload with a JPEG returns 200 and CDN URL."""
    from PIL import Image as PILImage

    buf = io.BytesIO()
    img = PILImage.new("RGB", (100, 100), color=(255, 0, 0))
    img.save(buf, format="JPEG")
    buf.seek(0)

    with patch("app.modules.reports.service._get_s3_client") as mock_s3:
        mock_s3.return_value.put_object = MagicMock()
        res = client.post(
            "/api/v1/reports/media/upload",
            files={"file": ("test.jpg", buf, "image/jpeg")},
        )

    assert res.status_code == 200
    data = res.json()
    assert "url" in data
    assert "key" in data
    assert data["key"].startswith("reports/")


# ── TC-B-M17-06: Media upload rejects non-image ───────────────────────────────

def test_media_upload_rejects_pdf():
    """POST /reports/media/upload with PDF returns 400."""
    res = client.post(
        "/api/v1/reports/media/upload",
        files={"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert res.status_code == 400
    assert "image" in res.json()["detail"].lower()


# ── TC-B-M17-07: Condition summary ───────────────────────────────────────────

def test_condition_summary():
    """Public list returns condition_summary with correct pct breakdown."""
    slug = f"slug-cond-{uuid.uuid4().hex[:6]}"

    for condition in ["open", "open", "caution"]:
        created = _create_report(trek_slug=slug, condition=condition)
        _approve(created["id"])

    res = client.get(f"/api/v1/public/treks/{slug}/reports")
    assert res.status_code == 200
    summary = res.json()["condition_summary"]
    assert summary["total_reports"] == 3
    assert summary["open_pct"] > 0
    assert summary["caution_pct"] > 0
    assert "last_report_date" in summary


# ── TC-B-M17-08: Delete own pending report ───────────────────────────────────

def test_delete_own_report():
    """User can delete own pending report (204); cannot delete approved (403)."""
    slug = f"slug-del-{uuid.uuid4().hex[:6]}"

    # Delete pending — should succeed
    pending = _create_report(trek_slug=slug)
    res = client.delete(f"/api/v1/reports/{pending['id']}")
    assert res.status_code == 204

    # Delete approved — should fail with 403
    approved = _create_report(trek_slug=slug)
    _approve(approved["id"])
    res = client.delete(f"/api/v1/reports/{approved['id']}")
    assert res.status_code == 403
