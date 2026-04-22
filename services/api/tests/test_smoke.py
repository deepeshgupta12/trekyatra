"""Smoke tests — verify all key API surfaces return expected status codes."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_root() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_health_v1() -> None:
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["version"] == "v1"


def test_auth_me_unauthenticated() -> None:
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401


def test_wordpress_health() -> None:
    r = client.get("/api/v1/wordpress/health")
    assert r.status_code == 200


def test_topics_list() -> None:
    r = client.get("/api/v1/topics")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_clusters_list() -> None:
    r = client.get("/api/v1/clusters")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_briefs_list() -> None:
    r = client.get("/api/v1/briefs")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_drafts_list() -> None:
    r = client.get("/api/v1/drafts")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_dashboard_summary() -> None:
    r = client.get("/api/v1/admin/dashboard/summary")
    assert r.status_code == 200


def test_treks_list() -> None:
    r = client.get("/api/v1/treks")
    assert r.status_code == 200
    assert "treks" in r.json()


def test_publish_log_unknown_draft() -> None:
    r = client.get("/api/v1/admin/drafts/00000000-0000-0000-0000-000000000000/publish-log")
    assert r.status_code == 200
    assert r.json() == []


def test_publish_nonexistent_draft() -> None:
    r = client.post("/api/v1/admin/drafts/00000000-0000-0000-0000-000000000000/publish")
    assert r.status_code == 400


def test_patch_status_nonexistent_draft() -> None:
    r = client.patch(
        "/api/v1/admin/drafts/00000000-0000-0000-0000-000000000000/status",
        json={"status": "review"},
    )
    assert r.status_code == 400
