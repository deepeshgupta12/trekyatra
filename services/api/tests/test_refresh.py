"""Tests for Step 23 — Content Refresh Engine.

Covers: stale page detection, refresh trigger, refresh log retrieval.
Celery task dispatch is mocked — we test the API contract, not the async job.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage
from app.modules.linking.models import Page

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uid() -> str:
    return str(uuid.uuid4())[:8]


def _create_cms_page(db, slug: str) -> CMSPage:
    page = CMSPage(
        id=uuid.uuid4(),
        slug=slug,
        title=f"Test trek {slug}",
        page_type="trek_guide",
        status="published",
        content_html="<p>test</p>",
        content_json={},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(page)
    db.flush()
    return page


def _create_page(db, slug: str, cms_page: CMSPage, *, last_refreshed_at=None, freshness_interval_days=90, do_not_refresh=False) -> Page:
    now = datetime.now(timezone.utc)
    page = Page(
        id=uuid.uuid4(),
        slug=slug,
        title=f"Test trek {slug}",
        page_type="trek_guide",
        cms_page_id=cms_page.id,
        created_at=now,
        last_refreshed_at=last_refreshed_at,
        freshness_interval_days=freshness_interval_days,
        do_not_refresh=do_not_refresh,
    )
    db.add(page)
    db.flush()
    return page


# ---------------------------------------------------------------------------
# GET /admin/refresh/stale
# ---------------------------------------------------------------------------

def test_stale_pages_empty_when_no_pages():
    resp = client.get("/api/v1/admin/refresh/stale")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_stale_pages_includes_null_last_refreshed():
    """A page with last_refreshed_at=NULL is always stale."""
    slug = f"stale-null-{_uid()}"
    with SessionLocal() as db:
        cms = _create_cms_page(db, slug)
        _create_page(db, slug, cms, last_refreshed_at=None)
        db.commit()

    resp = client.get("/api/v1/admin/refresh/stale")
    assert resp.status_code == 200
    slugs = [p["slug"] for p in resp.json()]
    assert slug in slugs


def test_stale_pages_includes_past_interval():
    """A page whose last_refreshed_at + interval < now is stale."""
    slug = f"stale-past-{_uid()}"
    old_date = datetime.now(timezone.utc) - timedelta(days=200)
    with SessionLocal() as db:
        cms = _create_cms_page(db, slug)
        _create_page(db, slug, cms, last_refreshed_at=old_date, freshness_interval_days=90)
        db.commit()

    resp = client.get("/api/v1/admin/refresh/stale?limit=200")
    assert resp.status_code == 200
    slugs = [p["slug"] for p in resp.json()]
    assert slug in slugs


def test_stale_pages_excludes_do_not_refresh():
    """Pages with do_not_refresh=True must never appear in stale list."""
    slug = f"pinned-{_uid()}"
    with SessionLocal() as db:
        cms = _create_cms_page(db, slug)
        _create_page(db, slug, cms, last_refreshed_at=None, do_not_refresh=True)
        db.commit()

    resp = client.get("/api/v1/admin/refresh/stale")
    assert resp.status_code == 200
    slugs = [p["slug"] for p in resp.json()]
    assert slug not in slugs


def test_stale_pages_excludes_recently_refreshed():
    """A page refreshed 1 day ago with 90-day interval must not be stale."""
    slug = f"fresh-{_uid()}"
    recent = datetime.now(timezone.utc) - timedelta(days=1)
    with SessionLocal() as db:
        cms = _create_cms_page(db, slug)
        _create_page(db, slug, cms, last_refreshed_at=recent, freshness_interval_days=90)
        db.commit()

    resp = client.get("/api/v1/admin/refresh/stale")
    assert resp.status_code == 200
    slugs = [p["slug"] for p in resp.json()]
    assert slug not in slugs


def test_stale_page_response_shape():
    """Verify required fields are present in stale page response."""
    slug = f"shape-{_uid()}"
    with SessionLocal() as db:
        cms = _create_cms_page(db, slug)
        _create_page(db, slug, cms, last_refreshed_at=None)
        db.commit()

    resp = client.get("/api/v1/admin/refresh/stale")
    assert resp.status_code == 200
    items = [p for p in resp.json() if p["slug"] == slug]
    assert len(items) == 1
    item = items[0]
    assert "id" in item
    assert "slug" in item
    assert "freshness_interval_days" in item
    assert "do_not_refresh" in item
    assert item["freshness_interval_days"] == 90


# ---------------------------------------------------------------------------
# POST /admin/refresh/trigger
# ---------------------------------------------------------------------------

def test_trigger_refresh_404_for_unknown_page():
    resp = client.post("/api/v1/admin/refresh/trigger", json={"page_ids": [str(uuid.uuid4())]})
    assert resp.status_code == 404


def test_trigger_refresh_422_for_invalid_uuid():
    resp = client.post("/api/v1/admin/refresh/trigger", json={"page_ids": ["not-a-uuid"]})
    assert resp.status_code == 422


def test_trigger_refresh_422_for_empty_list():
    resp = client.post("/api/v1/admin/refresh/trigger", json={"page_ids": []})
    assert resp.status_code == 422


def test_trigger_refresh_creates_log_and_dispatches():
    """Valid page_id → log created (result=pending) and task dispatched."""
    slug = f"trigger-{_uid()}"
    with SessionLocal() as db:
        cms = _create_cms_page(db, slug)
        page = _create_page(db, slug, cms)
        db.commit()
        page_id = str(page.id)

    with patch("app.modules.refresh.tasks.refresh_task.delay") as mock_delay:
        resp = client.post("/api/v1/admin/refresh/trigger", json={"page_ids": [page_id]})

    assert resp.status_code == 200
    data = resp.json()
    assert data["queued"] == 1
    assert len(data["logs"]) == 1
    log = data["logs"][0]
    assert log["result"] == "pending"
    assert log["page_id"] == page_id
    assert log["triggered_by"] == "manual"
    mock_delay.assert_called_once()


# ---------------------------------------------------------------------------
# GET /admin/refresh/logs
# ---------------------------------------------------------------------------

def test_refresh_logs_empty():
    resp = client.get("/api/v1/admin/refresh/logs")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_refresh_logs_after_trigger():
    """After triggering a refresh, the log appears in GET /logs."""
    slug = f"log-check-{_uid()}"
    with SessionLocal() as db:
        cms = _create_cms_page(db, slug)
        page = _create_page(db, slug, cms)
        db.commit()
        page_id = str(page.id)

    with patch("app.modules.refresh.tasks.refresh_task.delay"):
        client.post("/api/v1/admin/refresh/trigger", json={"page_ids": [page_id]})

    resp = client.get("/api/v1/admin/refresh/logs")
    assert resp.status_code == 200
    page_ids_in_logs = [lg["page_id"] for lg in resp.json()]
    assert page_id in page_ids_in_logs


def test_refresh_logs_response_shape():
    resp = client.get("/api/v1/admin/refresh/logs")
    assert resp.status_code == 200
    logs = resp.json()
    if logs:
        log = logs[0]
        required = {"id", "page_id", "triggered_by", "trigger_at", "result", "created_at"}
        assert required.issubset(log.keys())
