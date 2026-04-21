# STEP 01 — backend-foundation

## Goal
Create the backend foundation, local infra scaffold, and real GitNexus workflow integration without touching the static frontend.

## Scope
- Add FastAPI app foundation
- Add app config and logging
- Add versioned health routes
- Add backend tests
- Add Docker Compose for Postgres and Redis
- Add root repo scripts for GitNexus
- Update tracker and dependency map

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md

## Dependency Check
- `apps/web-static/` remains untouched
- Backend files are newly created under `services/api/`
- Root tooling additions do not alter frontend behavior
- Docker Compose only adds local infra support
- GitNexus integration is repo-level and does not modify application runtime code

## Files to Create
- .gitignore
- package.json
- docker-compose.yml
- Makefile
- scripts/setup_gitnexus.sh
- scripts/refresh_gitnexus.sh
- services/api/pyproject.toml
- services/api/.env.example
- services/api/README.md
- services/api/app/__init__.py
- services/api/app/main.py
- services/api/app/core/__init__.py
- services/api/app/core/config.py
- services/api/app/core/logging.py
- services/api/app/api/__init__.py
- services/api/app/api/router.py
- services/api/app/api/routes/__init__.py
- services/api/app/api/routes/health.py
- services/api/tests/test_health.py

## Files to Modify
- docs/MASTER_TRACKER.md
- docs/DEPENDENCY_MAP.md
- docs/steps/STEP-01-backend-foundation.md

## Validation Commands
- find services/api -maxdepth 4 | sort
- cp services/api/.env.example services/api/.env
- make venv
- make install
- make infra-up
- make api
- curl http://localhost:8000/health
- curl http://localhost:8000/api/v1/health
- make test
- bash ./scripts/setup_gitnexus.sh
- gitnexus status

## Status
Ready for user validation

## Notes
- Do not modify `apps/web-static/` in this step
- Wait for user confirmation before Step 02