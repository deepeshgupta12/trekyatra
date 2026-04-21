# STEP 02 — db-auth-model-foundation

## Goal
Add the database foundation, Alembic migrations, and auth/RBAC data model layer without touching the static frontend.

## Scope
- Add SQLAlchemy declarative base and shared mixins
- Add SQLAlchemy engine/session foundation
- Initialize Alembic
- Add initial migration
- Add user/auth identity/user session models
- Add role/permission/association models
- Add metadata tests
- Update tracker and dependency map

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md

## Dependency Check
- `apps/web-static/` remains untouched
- Step 01 backend foundation is already in place
- New DB files are isolated under `services/api/app/db`, `services/api/app/modules`, and `services/api/alembic`
- `app.db.base` becomes the source-of-truth metadata registry for migrations
- Any future auth or admin work must reuse these models rather than redefining them

## Files to Create
- services/api/alembic.ini
- services/api/alembic/env.py
- services/api/alembic/script.py.mako
- services/api/alembic/versions/20260421_0001_initial_auth_and_rbac.py
- services/api/app/db/__init__.py
- services/api/app/db/base_class.py
- services/api/app/db/base.py
- services/api/app/db/session.py
- services/api/app/modules/__init__.py
- services/api/app/modules/auth/__init__.py
- services/api/app/modules/auth/models.py
- services/api/app/modules/rbac/__init__.py
- services/api/app/modules/rbac/associations.py
- services/api/app/modules/rbac/models.py
- services/api/tests/test_models.py

## Files to Modify
- services/api/pyproject.toml
- Makefile
- services/api/README.md
- docs/MASTER_TRACKER.md
- docs/DEPENDENCY_MAP.md
- docs/steps/STEP-02-db-auth-model-foundation.md

## Validation Commands
- make install
- make infra-up
- make db-upgrade
- make db-current
- make db-history
- make test
- bash ./scripts/refresh_gitnexus.sh
- gitnexus status

## Status
Done

## Notes
- `apps/web-static/` was not modified in this step
- No schema change was needed for the Pylance-safe typing fix
- Wait for user confirmation before Step 03