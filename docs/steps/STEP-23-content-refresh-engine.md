# STEP 23 — Content Refresh Engine (Basic)

## Goal
Build the system that detects stale content and triggers automated or manual refresh workflows. Keeping content fresh is a direct SEO signal and a core platform capability that compounds over time.

## Scope

### Freshness model
- `freshness_interval_days` field on `content_drafts` and `pages` (default: 90 days)
- `last_refreshed_at` field on `pages`
- Staleness threshold: `last_refreshed_at + freshness_interval_days < today`
- Override field: `do_not_refresh` flag for pinned/evergreen pages

### Stale content detection service
- `get_stale_pages(limit=50)` — returns pages past their freshness interval, sorted by staleness age
- Priority scoring: pages with higher historical traffic rank higher in the queue (static score for now; dynamic in V2)
- Separate queues: auto-refresh candidates vs. manual-review-required refresh

### Refresh workflow
- `RefreshTask` Celery task: re-triggers SEOAEOAgent on the existing draft, then re-publishes if no new fact-check flags
- If new fact-check flags appear post-refresh → status set to requires_review (human must approve before re-publish)
- Manual trigger: POST /api/v1/admin/refresh/trigger — accepts page_id list

### Refresh logs
- `refresh_logs` table: page_id, triggered_by (auto / manual / user_id), trigger_at, completed_at, result (refreshed / flagged / failed), notes
- GET /api/v1/admin/refresh/logs — paginated history

### Celery Beat schedule
- Daily at 03:00 UTC: detect stale pages, enqueue top 5 for auto-refresh
- Weekly: generate refresh summary (count refreshed, count flagged, count failed)

### Admin UI
- Admin refresh page (`/admin/refresh`) rewritten with:
  - Stale pages list with staleness indicator
  - Manual trigger button per page
  - Refresh log history table
  - Last auto-refresh run timestamp

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 17 complete (publish pipeline operational — refresh is a re-run of SEO+Publish stages)
- Confirm Step 22 complete (pages table exists — refresh works against the pages table)
- Celery worker and beat running (Step 11)

## Dependency Check
- `app/modules/linking/models.py` — Page model used (Step 22)
- `app/modules/agents/seo_aeo/agent.py` — re-triggered during refresh (Step 15)
- `app/modules/publish/service.py` — push_draft_to_wordpress called after refresh (Step 10)
- New `refresh_logs` table → Alembic migration
- `app/worker/celery_app.py` — new beat entry for daily refresh job

## Planned Files to Create
- `services/api/app/modules/refresh/__init__.py`
- `services/api/app/modules/refresh/models.py` — RefreshLog
- `services/api/app/modules/refresh/service.py` — get_stale_pages, trigger_refresh, log_refresh_result
- `services/api/app/modules/refresh/tasks.py` — Celery RefreshTask, daily detection beat task
- `services/api/app/api/routes/refresh.py`
- `services/api/app/schemas/refresh.py`
- `services/api/alembic/versions/20260422_0010_refresh_logs.py`
- `services/api/tests/test_refresh.py`
- `apps/web-next/app/(admin)/admin/refresh/page.tsx` — rewrite with real API

## Planned Files to Modify
- `services/api/app/modules/linking/models.py` — add last_refreshed_at, freshness_interval_days, do_not_refresh to Page
- `services/api/app/db/base.py` — register RefreshLog
- `services/api/app/api/router.py` — register refresh_router
- `services/api/app/worker/celery_app.py` — add daily refresh beat task
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install
cd services/api && alembic upgrade head
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Get stale pages
curl http://localhost:8000/api/v1/admin/refresh/stale

# Manual trigger
curl -X POST http://localhost:8000/api/v1/admin/refresh/trigger \
  -H 'Content-Type: application/json' \
  -d '{"page_ids": ["<id>"]}'

# View logs
curl http://localhost:8000/api/v1/admin/refresh/logs

npx gitnexus analyze --force
```

## Status
Done

## Files Created
- `services/api/alembic/versions/20260427_0013_content_refresh.py`
- `services/api/app/modules/refresh/__init__.py`
- `services/api/app/modules/refresh/models.py`
- `services/api/app/modules/refresh/service.py`
- `services/api/app/modules/refresh/tasks.py`
- `services/api/app/api/routes/refresh.py`
- `services/api/app/schemas/refresh.py`
- `services/api/tests/test_refresh.py`
- `apps/web-next/app/(admin)/admin/refresh/page.tsx`

## Files Modified
- `services/api/app/modules/linking/models.py` — Page: freshness_interval_days, last_refreshed_at, do_not_refresh
- `services/api/app/modules/content/models.py` — ContentDraft: freshness_interval_days
- `services/api/app/db/base.py` — RefreshLog registered
- `services/api/app/api/router.py` — refresh_router registered
- `services/api/app/worker/celery_app.py` — refresh tasks + daily beat
- `apps/web-next/lib/api.ts` — StalePage, RefreshLog types + 3 fetch helpers
- `apps/web-next/app/(admin)/admin/layout.tsx` — Content Refresh nav item
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Notes
- Auto-refresh must never publish directly if any new fact-check flags appear — always gate through requires_review
- Safety and YMYL pages (permit guides, beginner safety sections) should have do_not_refresh = false but require_human_review = true on every refresh
- freshness_interval_days defaults: seasonal pages = 30, permit pages = 60, general guides = 90, gear pages = 120
- V2 will add ranking-signal-based prioritization (pages with decaying CTR jump the queue)
- The weekly summary is a simple JSON payload stored in a job_summaries table — wired to admin analytics dashboard in Step 24

## Post-Ship Bug Fixes
Three bugs found during end-to-end testing after Step 23 shipped:

1. **Pipeline StaleDataError** (commit 783a004) — `_update_stage`/`_update_run` in `pipeline/service.py` failed when `TrendDiscoveryAgent.db.rollback()` expired all session-tracked objects. Fix: re-query by PK before every UPDATE.

2. **Published pages absent from stale queue** (commit b5e44a7) — `publish_to_cms` never called `sync_pages_from_cms`, so newly published pages never entered the `pages` table that `get_stale_pages` queries. Fix: `sync_pages_from_cms(db)` called at end of `publish_to_cms`, within same transaction.

3. **refresh_task TypeError** (commit 96c85e2) — `refresh_task` called `agent.run(input=...)` but `BaseAgent.run()` signature is `run(self, input_data, ...)`. Fix: `input=` → `input_data=`.

4. **Test fixtures wiping real pipeline data** (commits b4fc9e1, d3bd4c7) — `clean_state` in `test_cms.py` and `test_publish.py` did blanket `DELETE FROM content_briefs` (CASCADE to drafts) and `DELETE FROM cms_pages`, destroying all real pipeline content on every test run. Fix: snapshot pre-existing IDs for all 5 content tables; post-test cleanup deletes only newly-created rows.
