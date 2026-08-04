"""Newsletter subscriber visibility (admin) + welcome-email dispatch on subscribe."""
from __future__ import annotations

import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.main import app
from app.db.session import SessionLocal
from app.modules.newsletter.models import NewsletterSubscriber

client = TestClient(app)


def _unique_email() -> str:
    return f"wl-{uuid.uuid4().hex[:10]}@example.com"


# ── TC-B01: subscribing sends a source-aware welcome email via BackgroundTask (new only) ──
def test_subscribe_dispatches_welcome_email():
    email = _unique_email()
    with patch("app.api.routes.newsletter.send_subscribe_welcome_email") as mock_welcome, \
         patch("app.modules.newsletter.tasks.sync_subscriber_task.delay"):
        resp = client.post("/api/v1/newsletter/subscribe", json={"email": email, "source_page": "ios_waitlist"})
        assert resp.status_code == 200
        assert resp.json()["already_subscribed"] is False
        # TestClient runs BackgroundTasks synchronously after the response.
        mock_welcome.assert_called_once()
        args = mock_welcome.call_args.args
        assert args[0] == email and args[1] == "ios_waitlist"


# ── TC-B02: duplicate subscribe does NOT re-send the welcome ────────────────
def test_duplicate_subscribe_no_welcome():
    email = _unique_email()
    with patch("app.api.routes.newsletter.send_subscribe_welcome_email"), \
         patch("app.modules.newsletter.tasks.sync_subscriber_task.delay"):
        client.post("/api/v1/newsletter/subscribe", json={"email": email, "source_page": "ios_waitlist"})
    with patch("app.api.routes.newsletter.send_subscribe_welcome_email") as mock_welcome, \
         patch("app.modules.newsletter.tasks.sync_subscriber_task.delay"):
        resp = client.post("/api/v1/newsletter/subscribe", json={"email": email, "source_page": "ios_waitlist"})
        assert resp.json()["already_subscribed"] is True
        mock_welcome.assert_not_called()


# ── TC-B03: admin subscribers list + source_page filter ─────────────────────
def test_admin_list_subscribers_filtered():
    wl_email = _unique_email()
    other_email = _unique_email()
    with patch("app.modules.newsletter.tasks.send_subscribe_welcome_email_task.delay"), \
         patch("app.modules.newsletter.tasks.sync_subscriber_task.delay"):
        client.post("/api/v1/newsletter/subscribe", json={"email": wl_email, "source_page": "ios_waitlist"})
        client.post("/api/v1/newsletter/subscribe", json={"email": other_email, "source_page": "/newsletter"})

    resp = client.get("/api/v1/admin/newsletter/subscribers?source_page=ios_waitlist&limit=500")
    assert resp.status_code == 200
    data = resp.json()
    emails = {s["email"] for s in data["subscribers"]}
    assert wl_email in emails
    assert other_email not in emails
    assert all(s["source_page"] == "ios_waitlist" for s in data["subscribers"])


# ── TC-B04: CSV export returns text/csv with the waitlist rows ───────────────
def test_admin_export_subscribers_csv():
    email = _unique_email()
    with patch("app.modules.newsletter.tasks.send_subscribe_welcome_email_task.delay"), \
         patch("app.modules.newsletter.tasks.sync_subscriber_task.delay"):
        client.post("/api/v1/newsletter/subscribe", json={"email": email, "source_page": "ios_waitlist"})

    resp = client.get("/api/v1/admin/newsletter/subscribers/export.csv?source_page=ios_waitlist")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "email,name,source_page" in resp.text
    assert email in resp.text


def _cleanup():
    with SessionLocal() as db:
        db.execute(delete(NewsletterSubscriber).where(NewsletterSubscriber.email.like("wl-%@example.com")))
        db.commit()
