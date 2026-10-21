"""Guard: the Google client libraries that `cdp.import_gsc_data` needs must actually be installed.

The task wraps its Google imports in `try/except ImportError` and returns
{"skipped": True, "reason": "package_not_installed"} on failure. google-api-python-client and
google-auth were never declared in pyproject.toml, so that branch ALWAYS fired: the nightly import
silently did nothing and /admin/cdp/gsc stayed empty while its empty state blamed the credentials.
An optional-import guard around an undeclared dependency fails silently forever — these tests make
it fail loudly instead.
"""
from __future__ import annotations

import importlib

import pytest


@pytest.mark.parametrize("module", ["googleapiclient.discovery", "google.oauth2.service_account"])
def test_gsc_client_libraries_are_installed(module: str):
    assert importlib.import_module(module) is not None


def test_import_gsc_data_does_not_skip_for_missing_packages(monkeypatch):
    """With credentials absent the task must skip for CREDENTIALS, never for packages.

    `package_not_installed` here means the dependency regressed out of pyproject.toml.
    """
    from app.core.config import settings
    from app.worker.tasks import cdp as cdp_tasks

    monkeypatch.setattr(settings, "gsc_service_account_json", None, raising=False)
    result = cdp_tasks.import_gsc_data(days_back=1)
    assert result.get("reason") != "package_not_installed", (
        "google-api-python-client / google-auth missing — cdp.import_gsc_data would silently no-op"
    )
    assert result.get("reason") == "credentials_not_configured"


def test_gsc_deps_declared_in_pyproject():
    """Installed-but-undeclared would still break a clean deploy, so assert the declaration too."""
    import pathlib
    import re

    root = pathlib.Path(__file__).resolve().parents[1]
    text = (root / "pyproject.toml").read_text()
    deps = re.search(r"^dependencies\s*=\s*\[(.*?)^\]", text, re.S | re.M).group(1)
    for pkg in ("google-api-python-client", "google-auth"):
        assert pkg in deps, f"{pkg} missing from pyproject.toml dependencies"


# ── Property identifier (verified 2026-10-21 against the live Search Console API) ──
def test_gsc_site_url_is_the_url_prefix_form():
    """trekyatra.co.in is a URL-PREFIX property, not a Domain property.

    `cdp.import_gsc_data` hardcoded "sc-domain:trekyatra.co.in", which the API rejects with
    "User does not have sufficient permission" — so the nightly import would have failed on every
    row even once GSC_SERVICE_ACCOUNT_JSON was configured. Confirmed live: the sc-domain form errors,
    the https form returns data.
    """
    from app.core.config import settings

    assert settings.gsc_site_url == "https://www.trekyatra.co.in/"
    assert not settings.gsc_site_url.startswith("sc-domain:"), (
        "Domain-property form is rejected for this property"
    )
    assert settings.gsc_site_url.endswith("/"), "URL-prefix properties require the trailing slash"


def test_import_gsc_data_reads_site_url_from_settings_not_a_literal():
    """Guard against re-hardcoding the property in the task body."""
    import inspect

    from app.worker.tasks import cdp as cdp_tasks

    src = inspect.getsource(cdp_tasks.import_gsc_data)
    # Strip comments — the fix is DOCUMENTED with the bad literal, so only real code may be checked.
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    assert "settings.gsc_site_url" in code, "site_url must come from settings"
    assert '"sc-domain:' not in code, "sc-domain literal reintroduced in code — the API rejects it"
