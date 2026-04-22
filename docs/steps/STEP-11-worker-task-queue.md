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

## Status
pending

## Notes
- Use `redis://localhost:6379/1` as default broker to separate from cache on /0
- Worker and beat should use arm64-safe Docker images for M1 compatibility
- Dead-letter behavior: failed tasks after max_retries should set a `failed` flag in agent_runs (wired in Step 12)
- Beat scheduler config lives in `celeryconfig.py` or inline in `celery_app.py`
