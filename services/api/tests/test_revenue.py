"""Tests for Step 32 — Revenue Attribution Dashboards."""
from __future__ import annotations

import uuid
from datetime import date, timedelta
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.modules.revenue.models import ExecutiveSummary, RevenueAttribution, RevenueConfig
from app.modules.revenue.service import (
    get_config,
    get_config_by_key,
    list_executive_summaries,
    revenue_by_cluster,
    revenue_by_page_type,
    update_config,
    upsert_executive_summary,
)

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


# TC-B01: RevenueConfig defaults are seeded correctly
def test_revenue_config_seed(db):
    from app.modules.revenue.service import _ensure_config
    cfg = _ensure_config(db)
    assert "avg_cpc_inr" in cfg
    assert "lead_value_inr" in cfg
    assert cfg["avg_cpc_inr"] > 0
    assert cfg["lead_value_inr"] > 0


# TC-B02: get_config returns list of config rows
def test_get_config_list(db):
    from app.modules.revenue.service import _ensure_config
    _ensure_config(db)
    rows = get_config(db)
    assert isinstance(rows, list)
    assert len(rows) >= 2


# TC-B03: get_config_by_key returns row for known key
def test_get_config_by_key(db):
    from app.modules.revenue.service import _ensure_config
    _ensure_config(db)
    row = get_config_by_key(db, "avg_cpc_inr")
    assert row is not None
    assert row.key == "avg_cpc_inr"


# TC-B04: get_config_by_key returns None for unknown key
def test_get_config_by_key_missing(db):
    row = get_config_by_key(db, "nonexistent_key_xyz")
    assert row is None


# TC-B05: update_config creates and updates
def test_update_config(db):
    row = update_config(db, "test_key_revenue", 42.0)
    assert row.key == "test_key_revenue"
    assert row.value_float == 42.0
    row2 = update_config(db, "test_key_revenue", 99.0)
    assert row2.value_float == 99.0
    # cleanup
    db.delete(row2)
    db.commit()


# TC-B06: upsert_executive_summary creates and updates
def test_upsert_executive_summary(db):
    week_label = f"test-{uuid.uuid4().hex[:8]}"
    s1 = upsert_executive_summary(db, week_label, "# Week summary\nContent here.")
    assert s1.week_label == week_label
    assert "Content" in s1.content_md
    s2 = upsert_executive_summary(db, week_label, "# Updated summary")
    assert s2.id == s1.id
    assert "Updated" in s2.content_md
    # cleanup
    db.delete(s2)
    db.commit()


# TC-B07: list_executive_summaries returns list
def test_list_executive_summaries(db):
    result = list_executive_summaries(db)
    assert isinstance(result, list)


# TC-B08: revenue_by_cluster returns list of dicts
def test_revenue_by_cluster(db):
    result = revenue_by_cluster(db)
    assert isinstance(result, list)
    for r in result:
        assert "total_revenue_inr" in r
        assert "total_clicks" in r


# TC-B09: revenue_by_page_type returns list
def test_revenue_by_page_type(db):
    result = revenue_by_page_type(db)
    assert isinstance(result, list)
    for r in result:
        assert "page_type" in r
        assert "total_revenue_inr" in r


# TC-B10: GET /admin/revenue/by-cluster returns 200
def test_api_revenue_by_cluster():
    resp = client.get("/api/v1/admin/revenue/by-cluster")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# TC-B11: GET /admin/revenue/by-page-type returns 200
def test_api_revenue_by_page_type():
    resp = client.get("/api/v1/admin/revenue/by-page-type")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# TC-B12: GET /admin/revenue/decaying-pages returns 200
def test_api_decaying_pages():
    resp = client.get("/api/v1/admin/revenue/decaying-pages")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# TC-B13: POST /admin/revenue/aggregate returns aggregation result
def test_api_aggregate_revenue():
    resp = client.post("/api/v1/admin/revenue/aggregate?days=1")
    assert resp.status_code == 200
    data = resp.json()
    assert "aggregated" in data
    assert "period_start" in data


# TC-B14: GET /admin/revenue/config returns list
def test_api_list_config():
    resp = client.get("/api/v1/admin/revenue/config")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# TC-B15: PATCH /admin/revenue/config/{key} updates value
def test_api_patch_config():
    # Ensure key exists first
    from app.modules.revenue.service import _ensure_config
    db = SessionLocal()
    try:
        _ensure_config(db)
    finally:
        db.close()
    resp = client.patch("/api/v1/admin/revenue/config/avg_cpc_inr", json={"value_float": 5.0})
    assert resp.status_code == 200
    assert resp.json()["value_float"] == 5.0


# TC-B16: GET /admin/revenue/config/{key} 404 for unknown
def test_api_config_404():
    resp = client.get("/api/v1/admin/revenue/config/totally_nonexistent_zzzz")
    assert resp.status_code == 404


# TC-B17: GET /admin/revenue/summaries returns list
def test_api_list_summaries():
    resp = client.get("/api/v1/admin/revenue/summaries")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# TC-B18: POST /admin/revenue/summaries/generate queues task
def test_api_generate_summary():
    with patch("app.modules.revenue.tasks.generate_executive_summary_task.delay") as mock_delay:
        mock_task = MagicMock()
        mock_task.id = "test-task-id"
        mock_delay.return_value = mock_task
        resp = client.post("/api/v1/admin/revenue/summaries/generate")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "queued"
