# STEP 06 — content-domain-foundation

## Goal
Add the content domain foundation and local WordPress bootstrap support without touching frontend code.

## Scope
- Add topic, cluster, brief, and draft ORM models
- Add content-domain schemas
- Add content-domain service helpers
- Add list/create APIs for topics, clusters, briefs, and drafts
- Add Alembic migration for the content domain
- Add route tests
- Add isolated local WordPress compose file
- Add local WordPress setup documentation
- Update tracker and dependency map

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm GitNexus graph is up to date

## Dependency Check
- `app/db/base.py` is the central metadata registry and must be extended
- `alembic/env.py` depends on `app.db.base`
- `app/api/router.py` change remains additive
- `docker-compose.yml` remains untouched
- local WordPress is isolated in `docker-compose.wordpress.yml`
- `apps/web-static/` remains untouched

## Files to Create
- services/api/app/modules/content/__init__.py
- services/api/app/modules/content/models.py
- services/api/app/modules/content/service.py
- services/api/app/schemas/content.py
- services/api/app/api/routes/content.py
- services/api/alembic/versions/20260421_0003_content_domain_foundation.py
- services/api/tests/test_content_routes.py
- docker-compose.wordpress.yml
- docs/LOCAL_WORDPRESS_SETUP.md

## Files to Modify
- services/api/app/db/base.py
- services/api/app/api/router.py
- services/api/README.md
- docs/MASTER_TRACKER.md
- docs/DEPENDENCY_MAP.md
- docs/steps/STEP-06-content-domain-foundation.md

## Validation Commands
- make install
- make db-upgrade
- make db-current
- make test
- make api
- curl http://localhost:8000/api/v1/topics
- curl -X POST http://localhost:8000/api/v1/topics -H "Content-Type: application/json" -d '{...}'
- docker compose -f docker-compose.wordpress.yml up -d
- curl http://localhost:8080/wp-json
- curl -X POST http://localhost:8000/api/v1/wordpress/test-connection
- bash ./scripts/refresh_gitnexus.sh
- gitnexus status

## Status
Ready for user validation

## Notes
- `apps/web-static/` must remain untouched in this step
- local WordPress setup is intentionally isolated from the main infra stack
- Wait for user confirmation before Step 07