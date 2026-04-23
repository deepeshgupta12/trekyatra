"""Tests for pipeline orchestration: models, service CRUD, API routes, orchestrator stages."""
from __future__ import annotations

import json
import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.modules.pipeline import service as pipeline_service
from app.modules.pipeline.models import PipelineRun, PipelineStage

client = TestClient(app)


# ── CRUD helpers ──────────────────────────────────────────────────────────────

def test_create_pipeline_run_persists():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(
            db,
            start_stage="trend_discovery",
            end_stage="content_brief",
            input_data={"seed_topics": ["kedarkantha trek"]},
        )
        assert run.id is not None
        assert run.status == "running"
        assert run.start_stage == "trend_discovery"
        assert run.end_stage == "content_brief"
        assert run.pipeline_type == "full"
    finally:
        db.close()


def test_create_partial_pipeline_run():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(
            db,
            start_stage="content_writing",
            end_stage="publish",
            input_data={"brief_id": str(uuid.uuid4())},
        )
        assert run.pipeline_type == "partial"
        assert run.start_stage == "content_writing"
    finally:
        db.close()


def test_get_pipeline_run_returns_record():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(
            db, input_data={"seed_topics": ["test"]}
        )
        fetched = pipeline_service.get_pipeline_run(db, run.id)
        assert fetched is not None
        assert fetched.id == run.id
    finally:
        db.close()


def test_get_pipeline_run_not_found():
    db = next(get_db())
    try:
        result = pipeline_service.get_pipeline_run(db, uuid.uuid4())
        assert result is None
    finally:
        db.close()


def test_list_pipeline_runs():
    db = next(get_db())
    try:
        before = len(pipeline_service.list_pipeline_runs(db, limit=100))
        pipeline_service.create_pipeline_run(db, input_data={"seed_topics": ["list-test"]})
        after = pipeline_service.list_pipeline_runs(db, limit=100)
        assert len(after) == before + 1
    finally:
        db.close()


def test_cancel_pipeline_run():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(db, input_data={})
        cancelled = pipeline_service.cancel_pipeline_run(db, run.id)
        assert cancelled is not None
        assert cancelled.status == "cancelled"
        assert cancelled.completed_at is not None
    finally:
        db.close()


def test_cancel_already_completed_run_is_idempotent():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(db, input_data={})
        run.status = "completed"
        db.commit()
        result = pipeline_service.cancel_pipeline_run(db, run.id)
        assert result.status == "completed"
    finally:
        db.close()


# ── stages_slice validation ───────────────────────────────────────────────────

def test_stages_slice_valid():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(
            db, start_stage="trend_discovery", end_stage="content_brief", input_data={}
        )
        orch = pipeline_service.PipelineOrchestrator(db=db, run_id=run.id)
        orch._run = run
        stages = orch._stages_slice("trend_discovery", "content_brief")
        assert stages == ["trend_discovery", "keyword_cluster", "content_brief"]
    finally:
        db.close()


def test_stages_slice_invalid_stage():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(db, input_data={})
        orch = pipeline_service.PipelineOrchestrator(db=db, run_id=run.id)
        orch._run = run
        with pytest.raises(ValueError, match="Invalid stage name"):
            orch._stages_slice("nonexistent_stage", "publish")
    finally:
        db.close()


# ── API routes ────────────────────────────────────────────────────────────────

def test_trigger_pipeline_returns_run_id():
    with patch("app.modules.pipeline.tasks.run_pipeline_task.apply_async") as mock_task:
        mock_task.return_value = MagicMock()
        response = client.post(
            "/api/v1/admin/pipeline/run",
            json={"seed_topics": ["kedarkantha trek guide"], "start_stage": "trend_discovery", "end_stage": "content_brief"},
        )
    assert response.status_code == 200
    data = response.json()
    assert "pipeline_run_id" in data
    assert data["status"] == "running"


def test_trigger_pipeline_dispatches_celery():
    with patch("app.modules.pipeline.tasks.run_pipeline_task.apply_async") as mock_task:
        mock_task.return_value = MagicMock()
        client.post(
            "/api/v1/admin/pipeline/run",
            json={"seed_topics": ["test"], "start_stage": "trend_discovery", "end_stage": "content_brief"},
        )
    mock_task.assert_called_once()


def test_trigger_pipeline_invalid_stage():
    response = client.post(
        "/api/v1/admin/pipeline/run",
        json={"seed_topics": ["test"], "start_stage": "bad_stage", "end_stage": "publish"},
    )
    assert response.status_code == 422


def test_list_pipeline_runs_api():
    with patch("app.modules.pipeline.tasks.run_pipeline_task.apply_async"):
        client.post(
            "/api/v1/admin/pipeline/run",
            json={"seed_topics": ["api-list-test"], "start_stage": "trend_discovery", "end_stage": "content_brief"},
        )
    response = client.get("/api/v1/admin/pipeline/runs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_pipeline_run_api():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(db, input_data={"seed_topics": ["api-get"]})
        response = client.get(f"/api/v1/admin/pipeline/runs/{run.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(run.id)
        assert "stages" in data
    finally:
        db.close()


def test_get_pipeline_run_not_found_api():
    response = client.get(f"/api/v1/admin/pipeline/runs/{uuid.uuid4()}")
    assert response.status_code == 404


def test_cancel_pipeline_run_api():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(db, input_data={})
        response = client.post(f"/api/v1/admin/pipeline/runs/{run.id}/cancel")
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"
    finally:
        db.close()


def test_resume_not_paused_returns_409():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(db, input_data={})
        response = client.post(f"/api/v1/admin/pipeline/runs/{run.id}/resume")
        assert response.status_code == 409
    finally:
        db.close()


def test_resume_paused_run_dispatches_task():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(db, input_data={"brief_id": str(uuid.uuid4())})
        run.status = "paused_at_brief_approval"
        db.commit()
        with patch("app.modules.pipeline.tasks.resume_pipeline_task.apply_async") as mock_task:
            mock_task.return_value = MagicMock()
            response = client.post(f"/api/v1/admin/pipeline/runs/{run.id}/resume")
        assert response.status_code == 200
        mock_task.assert_called_once()
    finally:
        db.close()


# ── Orchestrator: resume from draft approval runs seo_aeo first ───────────────

def test_resume_from_draft_approval_dispatches_task():
    """Resuming a paused_at_draft_approval run dispatches resume_pipeline_task."""
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(
            db,
            start_stage="trend_discovery",
            end_stage="publish",
            input_data={"draft_id": str(uuid.uuid4())},
        )
        run.status = "paused_at_draft_approval"
        db.commit()
        with patch("app.modules.pipeline.tasks.resume_pipeline_task.apply_async") as mock_task:
            mock_task.return_value = MagicMock()
            response = client.post(f"/api/v1/admin/pipeline/runs/{run.id}/resume")
        assert response.status_code == 200
        mock_task.assert_called_once()
    finally:
        db.close()


def test_resume_from_draft_approval_resumes_at_seo_aeo():
    """After draft approval, next stages slice begins at seo_aeo, not publish."""
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(
            db,
            start_stage="trend_discovery",
            end_stage="publish",
            input_data={"draft_id": str(uuid.uuid4())},
        )
        run.status = "paused_at_draft_approval"
        run.output_json = json.dumps({"draft_id": str(uuid.uuid4())})
        db.commit()
        orch = pipeline_service.PipelineOrchestrator(db=db, run_id=run.id)
        orch._run = run
        stages = orch._stages_slice("seo_aeo", "publish")
        assert stages == ["seo_aeo", "publish"]
    finally:
        db.close()


# ── Orchestrator: failed stage marks run as failed ────────────────────────────

def test_orchestrator_stage_failure_marks_run_failed():
    db = next(get_db())
    try:
        run = pipeline_service.create_pipeline_run(
            db,
            start_stage="trend_discovery",
            end_stage="content_brief",
            input_data={"seed_topics": []},
        )
        orch = pipeline_service.PipelineOrchestrator(db=db, run_id=run.id)
        # Patch dispatch to always fail
        with patch.object(orch, "_dispatch_stage", side_effect=ValueError("forced failure")):
            orch.run()

        db.refresh(run)
        assert run.status == "failed"
        assert "forced failure" in (run.error_detail or "")
        assert len(run.stages) == 1
        assert run.stages[0].status == "failed"
    finally:
        db.close()


# ── metadata / table coverage ─────────────────────────────────────────────────

def test_pipeline_tables_in_metadata():
    from app.db.base import Base
    table_names = {t.name for t in Base.metadata.sorted_tables}
    assert "pipeline_runs" in table_names
    assert "pipeline_stages" in table_names
