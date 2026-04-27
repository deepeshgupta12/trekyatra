"""
Shared pytest configuration.

Admin auth bypass
─────────────────
All protected admin routes now require a trekyatra_admin_token cookie validated by
get_current_admin.  Existing integration tests use plain TestClient without that
cookie.  Rather than rewriting every test file, we override get_current_admin with
a no-op for every test except test_rbac.py (which tests auth enforcement directly).

The legacy RequireRole singletons are also kept in the bypass dict for backward
compatibility in case any test indirectly references them.
"""

import pytest

from app.main import app
from app.modules.auth.dependencies import (
    get_current_admin,
    require_admin,
    require_agent_admin,
    require_editor,
    require_pipeline,
    require_super_admin,
)

_AUTH_BYPASS: dict = {
    get_current_admin: lambda: {"sub": "test-admin@trekyatra.com", "typ": "admin_access"},
    require_super_admin: lambda: None,
    require_admin: lambda: None,
    require_editor: lambda: None,
    require_pipeline: lambda: None,
    require_agent_admin: lambda: None,
}


@pytest.fixture(autouse=True)
def bypass_admin_auth_for_existing_tests(request):
    """Override admin auth + role guards with no-ops for every test file except test_rbac.py."""
    is_rbac_test = "test_rbac" in str(request.fspath)
    if not is_rbac_test:
        app.dependency_overrides.update(_AUTH_BYPASS)
    yield
    for key in _AUTH_BYPASS:
        app.dependency_overrides.pop(key, None)
