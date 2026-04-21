# STEP 05 — wordpress-foundation

## Goal
Add the WordPress integration foundation in the backend with config model extension, REST client skeleton, and health/test connectivity endpoints, without touching frontend code.

## Scope
- Extend backend settings for WordPress timeout and SSL controls
- Add WordPress response schemas
- Add WordPress client skeleton
- Add WordPress service helpers
- Add WordPress health endpoint
- Add WordPress connectivity test endpoint
- Add WordPress route tests
- Update tracker and dependency map

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm GitNexus graph is up to date

## Dependency Check
- `apps/web-static/` remains untouched
- `services/api/app/api/router.py` change remains additive
- `services/api/app/core/config.py` is extended, not restructured
- WordPress integration is isolated under a new `app/modules/wordpress` domain
- No database schema or Alembic migration changes are needed in this step

## Files to Create
- services/api/app/schemas/wordpress.py
- services/api/app/modules/wordpress/__init__.py
- services/api/app/modules/wordpress/client.py
- services/api/app/modules/wordpress/service.py
- services/api/app/api/routes/wordpress.py
- services/api/tests/test_wordpress.py

## Files to Modify
- services/api/app/core/config.py
- services/api/app/api/router.py
- services/api/.env.example
- services/api/.env
- services/api/README.md
- docs/MASTER_TRACKER.md
- docs/DEPENDENCY_MAP.md
- docs/steps/STEP-05-wordpress-foundation.md

## Validation Commands
- make install
- make test
- make api
- curl http://localhost:8000/api/v1/wordpress/health
- curl -X POST http://localhost:8000/api/v1/wordpress/test-connection
- bash ./scripts/refresh_gitnexus.sh
- gitnexus status

## Status
Ready for user validation

## Notes
- `apps/web-static/` must remain untouched in this step
- WordPress write/publish workflows are not part of this step
- Wait for user confirmation before Step 06