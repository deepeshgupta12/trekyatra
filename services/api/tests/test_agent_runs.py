from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db
from app.modules.agents import service as agent_service

client = TestClient(app)


def test_list_agent_runs_empty():
    response = client.get("/api/v1/admin/agent-runs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_agent_runs_filter_by_type():
    response = client.get("/api/v1/admin/agent-runs?agent_type=trend_discovery")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_agent_runs_filter_by_status():
    response = client.get("/api/v1/admin/agent-runs?status=pending")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_agent_run_crud_lifecycle():
    db = next(get_db())
    try:
        run = agent_service.start_run(db, "trend_discovery", {"topic": "himalaya treks"})
        assert run.id is not None
        assert run.status == "running"
        assert run.agent_type == "trend_discovery"

        updated = agent_service.complete_run(db, run.id, {"result": "done"})
        assert updated.status == "completed"
        assert updated.output_json is not None
        assert updated.completed_at is not None

        listed = agent_service.list_runs(db, agent_type="trend_discovery", status="completed")
        ids = [r.id for r in listed]
        assert run.id in ids
    finally:
        db.close()


def test_agent_run_fail_lifecycle():
    db = next(get_db())
    try:
        run = agent_service.start_run(db, "keyword_cluster", {"cluster_id": 1})
        failed = agent_service.fail_run(db, run.id, "LLM timeout")
        assert failed.status == "failed"
        assert failed.error == "LLM timeout"
    finally:
        db.close()


def test_agent_run_nonexistent_returns_none():
    db = next(get_db())
    try:
        result = agent_service.complete_run(db, 999999, {})
        assert result is None
    finally:
        db.close()


def test_list_agent_runs_appears_in_api_after_create():
    db = next(get_db())
    try:
        run = agent_service.start_run(db, "seo_aeo", {"draft_id": 42})
        response = client.get("/api/v1/admin/agent-runs?agent_type=seo_aeo")
        assert response.status_code == 200
        ids = [r["id"] for r in response.json()]
        assert run.id in ids
    finally:
        db.close()
