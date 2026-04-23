# STEP 17 — Full Publish Orchestration Pipeline

## Goal
Wire all agents and approval gates into a single orchestrated content pipeline. A single trigger should be able to run the full Trend → Cluster → Brief → Write → SEO → Publish chain, with human checkpoints at brief approval and draft approval. Manual and scheduled execution both supported.

## Scope

### Orchestration service
- `PipelineOrchestrator` service that chains: TrendDiscoveryAgent → KeywordClusterAgent → ContentBriefAgent → ContentWritingAgent → SEOAEOAgent → PublishingAgent
- Each stage creates an AgentRun record; pipeline tracks overall status
- Checkpoints: pipeline pauses at "brief approval" and "draft approval" gates; resumes after human approval via API

### Pipeline models
- `pipeline_runs` table: id, pipeline_type, status, current_stage, input_json, created_at, completed_at
- `pipeline_stages` table: pipeline_run_id, stage_name, agent_run_id, status, started_at, completed_at

### Admin APIs
- POST /api/v1/admin/pipeline/run — trigger full or partial pipeline (accepts start_stage and end_stage params)
- GET /api/v1/admin/pipeline/runs — list pipeline runs
- GET /api/v1/admin/pipeline/runs/{id} — pipeline run detail with all stages
- POST /api/v1/admin/pipeline/runs/{id}/resume — resume a paused pipeline (after human approval)
- POST /api/v1/admin/pipeline/runs/{id}/cancel — cancel in-flight pipeline

### Celery orchestration
- Each pipeline stage runs as a Celery task in a chain
- Beat scheduler: daily pipeline trigger (discover 3 topics, create briefs) — gated at brief approval
- Failure of any stage marks pipeline as failed; stages before checkpoint are not re-run unless explicitly retried

### Admin UI
- Admin pipeline monitor page (`/admin/pipeline`) with:
  - Active runs with stage progress indicator
  - Approval gates clearly marked (brief approval pending, draft approval pending)
  - Resume / Cancel buttons per run
  - Stage-level error detail

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 15 is complete (all 5 agents operational)
- Confirm Step 16 is complete (Master CMS publish_to_cms working end-to-end)
- Celery worker running (Step 11)

## Dependency Check
- All agent modules (Steps 12–15) consumed by orchestrator
- `app/modules/publish/service.py` (Step 10) called at final publish stage
- New Alembic migration for pipeline_runs and pipeline_stages tables
- `apps/web-next/app/(admin)/admin/` — new pipeline page

## Planned Files to Create
- `services/api/app/modules/pipeline/__init__.py`
- `services/api/app/modules/pipeline/models.py` — PipelineRun, PipelineStage
- `services/api/app/modules/pipeline/service.py` — PipelineOrchestrator, stage handlers
- `services/api/app/modules/pipeline/tasks.py` — Celery task chain definitions
- `services/api/app/api/routes/pipeline.py`
- `services/api/app/schemas/pipeline.py`
- `services/api/alembic/versions/20260422_0007_pipeline.py`
- `services/api/tests/test_pipeline.py`
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx`

## Planned Files to Modify
- `services/api/app/db/base.py` — register PipelineRun, PipelineStage
- `services/api/app/api/router.py` — register pipeline_router
- `services/api/app/worker/celery_app.py` — add beat schedule for daily pipeline
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install
cd services/api && alembic upgrade head
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Trigger full pipeline
curl -X POST http://localhost:8000/api/v1/admin/pipeline/run \
  -H 'Content-Type: application/json' \
  -d '{"seed_topics": ["triund trek guide"], "start_stage": "trend_discovery", "end_stage": "brief"}'

# Poll runs
curl http://localhost:8000/api/v1/admin/pipeline/runs

# Resume after brief approval
curl -X POST http://localhost:8000/api/v1/admin/pipeline/runs/<id>/resume

npx gitnexus analyze --force
```

## Status
Done

## Files Created
- `services/api/app/modules/pipeline/__init__.py`
- `services/api/app/modules/pipeline/models.py` — PipelineRun, PipelineStage
- `services/api/app/modules/pipeline/service.py` — PipelineOrchestrator + CRUD helpers
- `services/api/app/modules/pipeline/tasks.py` — run_pipeline_task, resume_pipeline_task, daily_discovery_task
- `services/api/app/api/routes/pipeline.py` — 5 endpoints
- `services/api/app/schemas/pipeline.py` — 4 Pydantic schemas
- `services/api/alembic/versions/20260423_0009_pipeline.py`
- `services/api/tests/test_pipeline.py` — 20 tests

## Files Modified
- `services/api/app/db/base.py` — PipelineRun, PipelineStage registered
- `services/api/app/api/router.py` — pipeline_router registered
- `services/api/app/worker/celery_app.py` — pipeline.tasks included; beat_schedule daily_discovery
- `apps/web-next/lib/api.ts` — PipelineRun/PipelineStage types + 5 pipeline helpers
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx` — full rewrite as orchestration monitor
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Notes
- Pipeline pauses at "brief_approval" checkpoint (after ContentBriefAgent); human approves the brief in admin UI; POST /runs/{id}/resume dispatches resume_pipeline_task which continues from content_writing
- Pipeline pauses again at "paused_at_draft_approval" if ContentWritingAgent marks draft as requires_review
- Partial pipeline: start_stage=content_writing + brief_id, or start_stage=seo_aeo/publish + draft_id
- Beat schedule: daily_discovery_task runs every 24h; triggers trend_discovery → content_brief; pauses at brief_approval gate (never auto-publishes)
- Migration 20260423_0009 was initially created with duplicate index bug (index=True in Column + explicit op.create_index); fixed in-place before first successful apply (migration had never applied to any DB)
- 137/137 backend tests pass; next build clean
