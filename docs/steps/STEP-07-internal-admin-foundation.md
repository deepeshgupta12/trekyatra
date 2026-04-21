# STEP 07 — internal-admin-foundation

## Goal
Add the backend internal admin summary foundation without touching frontend code, so the static admin views can later be wired to stable placeholder APIs.

## Scope
- Add admin summary response schemas
- Add admin service aggregation helpers
- Add admin routes for dashboard, topics, clusters, briefs, drafts, and system summaries
- Add admin route tests
- Update tracker and dependency map

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm GitNexus graph is up to date
- Confirm Step 06 is complete

## Dependency Check
- `services/api/app/api/router.py` change must remain additive
- `services/api/app/api/routes/admin.py` depends on `app.db.session.get_db`
- `services/api/app/modules/admin/service.py` depends on:
  - `app.core.config.settings`
  - `app.modules.content.models`
  - `sqlalchemy.orm.Session`
  - `app.schemas.admin`
- No Alembic migration is needed in this step
- `apps/web-static/` remains untouched

## Files to Create
- services/api/app/api/routes/admin.py
- services/api/app/modules/admin/__init__.py
- services/api/app/modules/admin/service.py
- services/api/app/schemas/admin.py
- services/api/tests/test_admin.py

## Files to Modify
- services/api/app/api/router.py
- docs/MASTER_TRACKER.md
- docs/DEPENDENCY_MAP.md
- docs/steps/STEP-07-internal-admin-foundation.md

## Validation Commands
- make install
- make db-current
- make test
- lsof -ti :8000 | xargs kill -9 2>/dev/null || true
- make api
- curl http://localhost:8000/api/v1/admin/dashboard/summary
- curl http://localhost:8000/api/v1/admin/topics/summary
- curl http://localhost:8000/api/v1/admin/clusters/summary
- curl http://localhost:8000/api/v1/admin/briefs/summary
- curl http://localhost:8000/api/v1/admin/drafts/summary
- curl http://localhost:8000/api/v1/admin/system/summary
- bash ./scripts/refresh_gitnexus.sh
- gitnexus status

## Status
Done

## Notes
- `apps/web-static/` remained untouched in this step
- This step introduced additive summary-only admin APIs
- No database schema change was required
- Manual curl validation completed successfully
- Current summary responses are correctly returning zero-state payloads when content tables are empty
- Static admin frontend wiring remains for a later step