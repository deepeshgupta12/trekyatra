# STEP 11 — Worker and Task Queue Infrastructure

## Goal
Establish Celery + Redis worker infrastructure to support all future background agent jobs, scheduled tasks, and async processing. This is the prerequisite for every agent step that follows.

## Scope
- Celery application configuration with Redis as broker and result backend
- Base Task class with retry, backoff, and dead-letter behavior
- Celery Beat scheduler for cron-triggered jobs
- Worker service added to `docker-compose.yml`
- Worker health endpoint: GET /api/v1/worker/health
- Echo/ping smoke task to validate end-to-end queue flow
- Worker integration tests

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm GitNexus graph is up to date (`npx gitnexus analyze`)
- Confirm Step 10 is complete and all 50 backend tests pass
- Redis must be running (`docker-compose up redis -d`)

## Dependency Check
- `services/api/app/core/config.py` — add CELERY_BROKER_URL, CELERY_RESULT_BACKEND
- `docker-compose.yml` — additive: new `worker` and `beat` services; no existing services changed
- `services/api/app/main.py` — no change required
- `services/api/app/api/router.py` — additive: include worker_router
- No Alembic migration needed in this step

## Planned Files to Create
- `services/api/app/worker/celery_app.py` — Celery instance with broker/backend from settings
- `services/api/app/worker/tasks/base.py` — BaseTask with retry policy, dead-letter marker
- `services/api/app/worker/tasks/smoke.py` — ping/echo smoke task
- `services/api/app/api/routes/worker.py` — GET /api/v1/worker/health
- `services/api/tests/test_worker.py` — worker health endpoint tests

## Planned Files to Modify
- `services/api/app/core/config.py` — add CELERY_BROKER_URL, CELERY_RESULT_BACKEND settings
- `services/api/app/api/router.py` — register worker_router
- `docker-compose.yml` — add worker and beat services
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
# Start infra
docker-compose up postgres redis -d

# Install new deps
make install

# Run tests
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Start API
make api

# Health check
curl http://localhost:8000/api/v1/worker/health

# Start worker (separate terminal)
cd services/api && celery -A app.worker.celery_app worker --loglevel=info

# Send smoke task (from Python or test)
# python -c "from app.worker.tasks.smoke import ping; ping.delay()"

# GitNexus re-index
npx gitnexus analyze --force
```

## Files Created
- `services/api/app/worker/__init__.py`
- `services/api/app/worker/celery_app.py`
- `services/api/app/worker/tasks/__init__.py`
- `services/api/app/worker/tasks/base.py`
- `services/api/app/worker/tasks/smoke.py`
- `services/api/app/api/routes/worker.py`
- `services/api/tests/test_worker.py`
- `services/api/Dockerfile`

## Files Modified
- `services/api/app/core/config.py` — `celery_broker_url` and `celery_result_backend` computed fields added
- `services/api/app/api/router.py` — `worker_router` registered
- `docker-compose.yml` — `worker` and `beat` services added under `profiles: [worker]`
- `Makefile` — `make worker` and `make beat` targets added
- `services/api/.env.example` — Celery env vars documented
- `docs/MASTER_TRACKER.md` — Step 11 marked done
- `docs/DEPENDENCY_MAP.md` — Step 11 blast radius notes and new files added
- `docs/IMPLEMENTATION_PLAN.md` — Step 11 marked [DONE]

## Status
Done

## Notes
- Broker/backend use Redis DB 1 (`redis://localhost:6380/1`) to separate from main cache on DB 0
- `celery_broker_url` and `celery_result_backend` are computed fields derived from `redis_host`/`redis_port` — no new env vars required
- Worker and beat Docker services use `profiles: [worker]` so they are opt-in; `make worker` / `make beat` are the preferred local dev method
- `services/api/Dockerfile` uses `python:3.12-slim` (arm64-compatible multi-arch image)
- Dead-letter behavior: `BaseTask.on_failure` logs the failure; `agent_runs` table and `failed` flag wired in Step 12
- Beat schedule stub in `celery_app.conf.beat_schedule` is empty; first real beat task added in Step 23 (refresh engine)
- 54/54 backend tests pass after Step 11 (50 prior + 4 new worker tests)
