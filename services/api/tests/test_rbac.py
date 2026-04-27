"""
RBAC enforcement tests.

These tests are deliberately NOT covered by the conftest.py bypass fixture —
they verify that role guards actually block or allow requests as expected.
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.main import app
from app.modules.auth.models import User
from app.modules.auth.service import create_session_for_user, register_email_user
from app.modules.rbac.service import assign_role_to_user, seed_roles


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _unique_email() -> str:
    return f"rbac-{uuid.uuid4().hex[:10]}@test.trekyatra.com"


def _make_user(db: Session, email: str) -> User:
    return register_email_user(
        db,
        email=email,
        password="Secure1234!",
        full_name="RBAC Tester",
        display_name="RBAC",
    )


def _login_client(db: Session, user: User) -> TestClient:
    """Return a TestClient with the auth cookie set for this user."""
    _session, token = create_session_for_user(
        db, user=user, ip_address="127.0.0.1", user_agent="pytest"
    )
    db.commit()
    client = TestClient(app, raise_server_exceptions=False)
    client.cookies.set("trekyatra_access_token", token)
    return client


# ──────────────────────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────────────────────

@pytest.fixture()
def db():
    session = SessionLocal()
    try:
        seed_roles(session)
        session.commit()
        yield session
    finally:
        session.close()


@pytest.fixture()
def anon_client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture()
def regular_user_client(db):
    user = _make_user(db, _unique_email())
    db.flush()
    return _login_client(db, user)


@pytest.fixture()
def admin_client(db):
    user = _make_user(db, _unique_email())
    db.flush()
    assign_role_to_user(db, user.id, "admin")
    db.flush()
    return _login_client(db, user)


@pytest.fixture()
def editor_client(db):
    user = _make_user(db, _unique_email())
    db.flush()
    assign_role_to_user(db, user.id, "editor")
    db.flush()
    return _login_client(db, user)


@pytest.fixture()
def super_admin_client(db):
    user = _make_user(db, _unique_email())
    db.flush()
    assign_role_to_user(db, user.id, "super_admin")
    db.flush()
    return _login_client(db, user)


# ──────────────────────────────────────────────────────────────────────────────
# Test cases
# ──────────────────────────────────────────────────────────────────────────────

class TestAdminEndpointGuards:
    def test_anonymous_gets_401(self, anon_client):
        r = anon_client.get("/api/v1/admin/dashboard/summary")
        assert r.status_code == 401

    def test_regular_user_gets_403(self, regular_user_client):
        r = regular_user_client.get("/api/v1/admin/dashboard/summary")
        assert r.status_code == 403

    def test_admin_gets_200(self, admin_client):
        r = admin_client.get("/api/v1/admin/dashboard/summary")
        assert r.status_code == 200

    def test_editor_gets_403_on_admin_route(self, editor_client):
        """Editor role is not sufficient for /admin routes (require_admin)."""
        r = editor_client.get("/api/v1/admin/dashboard/summary")
        assert r.status_code == 403


class TestPublishEndpointGuards:
    def test_anonymous_gets_401(self, anon_client):
        r = anon_client.get("/api/v1/admin/drafts/nonexistent/publish-log")
        assert r.status_code == 401

    def test_editor_can_access_publish_routes(self, editor_client):
        """Editors have require_editor which covers publish routes — must not get 401/403."""
        r = editor_client.get("/api/v1/admin/drafts/00000000-0000-0000-0000-000000000000/publish-log")
        assert r.status_code not in (401, 403)

    def test_admin_can_access_publish_routes(self, admin_client):
        r = admin_client.get("/api/v1/admin/drafts/00000000-0000-0000-0000-000000000000/publish-log")
        assert r.status_code not in (401, 403)


class TestRoleSeeding:
    def test_seed_roles_creates_five_roles(self, db):
        from app.modules.rbac.models import Role
        roles = db.scalars(select(Role)).all()
        slugs = {r.slug for r in roles}
        assert {"super_admin", "admin", "editor", "reviewer", "content_ops"} <= slugs

    def test_seed_roles_is_idempotent(self, db):
        from app.modules.rbac.service import seed_roles as do_seed
        from app.modules.rbac.models import Role
        do_seed(db)
        do_seed(db)
        db.flush()
        roles = db.scalars(select(Role)).all()
        slugs = [r.slug for r in roles]
        assert slugs.count("admin") == 1


class TestRoleAssignment:
    def test_assign_and_verify_role(self, db):
        user = _make_user(db, _unique_email())
        db.flush()
        role = assign_role_to_user(db, user.id, "editor")
        assert role.slug == "editor"
        slugs = [r.slug for r in user.roles]
        assert "editor" in slugs

    def test_assign_nonexistent_role_raises(self, db):
        user = _make_user(db, _unique_email())
        db.flush()
        with pytest.raises(ValueError, match="does not exist"):
            assign_role_to_user(db, user.id, "ghost_role")

    def test_assign_duplicate_role_is_idempotent(self, db):
        user = _make_user(db, _unique_email())
        db.flush()
        assign_role_to_user(db, user.id, "editor")
        assign_role_to_user(db, user.id, "editor")
        db.flush()
        assert [r.slug for r in user.roles].count("editor") == 1

    def test_revoke_role(self, db):
        from app.modules.rbac.service import revoke_role_from_user
        user = _make_user(db, _unique_email())
        db.flush()
        assign_role_to_user(db, user.id, "reviewer")
        db.flush()
        revoke_role_from_user(db, user.id, "reviewer")
        db.flush()
        assert "reviewer" not in [r.slug for r in user.roles]


class TestUserManagementAPI:
    def test_list_users_requires_super_admin(self, admin_client):
        """Even admin role is not sufficient — super_admin required."""
        r = admin_client.get("/api/v1/admin/users")
        assert r.status_code == 403

    def test_super_admin_can_list_users(self, super_admin_client):
        r = super_admin_client.get("/api/v1/admin/users")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_super_admin_can_assign_role(self, super_admin_client, db):
        user = _make_user(db, _unique_email())
        db.flush()
        db.commit()
        r = super_admin_client.post(
            f"/api/v1/admin/users/{user.id}/roles",
            json={"role_slug": "editor"},
        )
        assert r.status_code == 201
        assert r.json()["slug"] == "editor"

    def test_assign_invalid_role_returns_404(self, super_admin_client, db):
        user = _make_user(db, _unique_email())
        db.flush()
        db.commit()
        r = super_admin_client.post(
            f"/api/v1/admin/users/{user.id}/roles",
            json={"role_slug": "nonexistent"},
        )
        assert r.status_code == 404
