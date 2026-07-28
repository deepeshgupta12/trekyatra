"""Mobile version gate — app_version_config.

TC-B01 parse/compare semver
TC-B02 decide: ok / soft_update / force_update / maintenance
TC-B03 public endpoint reflects admin-set config
TC-B04 public endpoint fail-open when no config row
TC-B05 admin PUT upserts
"""
from fastapi.testclient import TestClient

from app.main import app
from app.modules.app_config.models import AppVersionConfig
from app.modules.app_config.service import compare_versions, decide, parse_version

client = TestClient(app)

PUBLIC = "/api/v1/app/version-config"
ADMIN = "/api/v1/admin/app/version-config"


# ── unit ───────────────────────────────────────────────────────────────────
def test_parse_and_compare_versions():
    assert parse_version("1.2.3") == (1, 2, 3)
    assert parse_version("1.0") == (1, 0, 0)
    assert parse_version("2.0.0-beta+7") == (2, 0, 0)
    assert parse_version(None) == (0, 0, 0)
    assert compare_versions("1.0.0", "1.0.1") == -1
    assert compare_versions("1.2.0", "1.1.9") == 1
    assert compare_versions("1.0.0", "1.0.0") == 0


def test_decide_states():
    cfg = AppVersionConfig(
        platform="ios",
        min_supported_version="1.5.0",
        latest_version="2.0.0",
        force_update_enabled=True,
        maintenance_mode=False,
    )
    assert decide(cfg, "1.0.0").status == "force_update"   # below min
    assert decide(cfg, "1.6.0").status == "soft_update"    # between min and latest
    assert decide(cfg, "2.0.0").status == "ok"             # at latest
    assert decide(cfg, "2.1.0").status == "ok"             # ahead of latest

    cfg.maintenance_mode = True
    assert decide(cfg, "2.0.0").status == "maintenance"    # maintenance wins over everything

    cfg.maintenance_mode = False
    cfg.force_update_enabled = False
    assert decide(cfg, "1.0.0").status == "soft_update"    # force disabled → only soft-prompt


# ── API ────────────────────────────────────────────────────────────────────
def test_admin_put_then_public_get_reflects_config():
    r = client.put(
        ADMIN,
        params={"platform": "ios"},
        json={"min_supported_version": "1.5.0", "latest_version": "2.0.0", "force_update_enabled": True, "maintenance_mode": False},
    )
    assert r.status_code == 200, r.text
    assert r.json()["min_supported_version"] == "1.5.0"

    assert client.get(PUBLIC, params={"platform": "ios", "current_version": "1.0.0"}).json()["status"] == "force_update"
    assert client.get(PUBLIC, params={"platform": "ios", "current_version": "1.7.0"}).json()["status"] == "soft_update"
    assert client.get(PUBLIC, params={"platform": "ios", "current_version": "2.0.0"}).json()["status"] == "ok"


def test_public_get_fail_open_when_no_config():
    # 'web' platform is never seeded → no row → never block.
    r = client.get(PUBLIC, params={"platform": "web", "current_version": "0.0.1"})
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_admin_maintenance_toggle_blocks():
    client.put(ADMIN, params={"platform": "ios"}, json={"maintenance_mode": True, "maintenance_message": "Back soon"})
    body = client.get(PUBLIC, params={"platform": "ios", "current_version": "9.9.9"}).json()
    assert body["status"] == "maintenance"
    assert body["maintenance_message"] == "Back soon"
    # reset so we don't leave the shared row in maintenance for other tests
    client.put(ADMIN, params={"platform": "ios"}, json={"maintenance_mode": False, "min_supported_version": "1.0.0", "latest_version": "1.0.0"})
