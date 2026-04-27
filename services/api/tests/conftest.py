"""
Shared pytest configuration.

RBAC bypass
───────────
All protected admin routes now require role-bearing sessions.  The existing
integration tests use plain TestClient without auth cookies.  Rather than
rewriting every test file, we override the role-guard dependencies with
no-ops for every test *except* test_rbac.py (which tests enforcement directly).
"""

import pytest

from app.main import app
from app.modules.auth.dependencies import (
    require_admin,
    require_agent_admin,
    require_editor,
    require_pipeline,
    require_super_admin,
)

_RBAC_BYPASS: dict = {
    require_super_admin: lambda: None,
    require_admin: lambda: None,
    require_editor: lambda: None,
    require_pipeline: lambda: None,
    require_agent_admin: lambda: None,
}


@pytest.fixture(autouse=True)
def bypass_rbac_for_existing_tests(request):
    """Override role guards with no-ops for every test file except test_rbac.py."""
    is_rbac_test = "test_rbac" in str(request.fspath)
    if not is_rbac_test:
        app.dependency_overrides.update(_RBAC_BYPASS)
    yield
    # Always clean up overrides after each test
    for key in _RBAC_BYPASS:
        app.dependency_overrides.pop(key, None)
