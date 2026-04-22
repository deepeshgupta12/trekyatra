# STEP 10 — Publish, Tracking, and Validation Workflows

## Goal
Implement the full content publish pipeline: lifecycle state machine for drafts, WordPress push endpoint, publish log tracking, smoke tests covering all API surfaces, and frontend admin drafts page wired to real APIs.

## Scope
- Content draft status machine: `draft → review → approved → published`
- `PATCH /api/v1/admin/drafts/{id}/status` — controlled transitions with validation
- `POST /api/v1/admin/drafts/{id}/publish` — push to WordPress (graceful skip when not configured)
- `GET /api/v1/admin/drafts/{id}/publish-log` — log of push attempts
- `PublishLog` ORM model and Alembic migration
- `published_at` and `wordpress_post_id` columns on `content_drafts`
- `WordPressClient.create_post()` write method
- Smoke tests for all API surfaces
- Publish workflow tests (transitions, WP mock, log retrieval)
- Admin drafts page rewritten as client component using real API

## Preconditions
- Read docs/MASTER_TRACKER.md ✓
- Read docs/PROCESS_GUARDRAILS.md ✓
- Read docs/DEPENDENCY_MAP.md ✓

## Dependency Check
- `content_drafts` table — modified with new columns (migration required)
- `app/db/base.py` — added `PublishLog` to registry
- `app/api/router.py` — `publish_router` registered additively
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — client component, fetches `/api/v1/drafts`

## Files Created
- `services/api/app/modules/publish/__init__.py`
- `services/api/app/modules/publish/service.py`
- `services/api/app/api/routes/publish.py`
- `services/api/app/schemas/publish.py`
- `services/api/alembic/versions/20260422_0004_publish_log.py`
- `services/api/tests/test_smoke.py`
- `services/api/tests/test_publish.py`

## Files Modified
- `services/api/app/modules/content/models.py` — added `PublishLog` model, `published_at`/`wordpress_post_id` on `ContentDraft`, `publish_logs` relationship
- `services/api/app/modules/wordpress/client.py` — added `create_post()` method
- `services/api/app/db/base.py` — registered `PublishLog`
- `services/api/app/api/router.py` — registered `publish_router`
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — fully rewritten as real API client

## Validation Commands
```bash
# Backend: run all tests (50/50 pass)
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Migration
cd services/api && alembic upgrade head

# Frontend: build clean
cd apps/web-next && npm run build

# GitNexus re-index
npx gitnexus analyze --force
# → 2072 nodes | 3465 edges | 54 clusters | 74 flows

# Smoke curl
curl http://localhost:8000/api/v1/admin/drafts/<id>/publish-log
curl -X PATCH http://localhost:8000/api/v1/admin/drafts/<id>/status -H 'Content-Type: application/json' -d '{"status":"review"}'
curl -X POST http://localhost:8000/api/v1/admin/drafts/<id>/publish
```

## Status
Done

## Notes
- `push_draft_to_wordpress` gracefully degrades: when `wordpress_credentials_configured=False`, draft is marked published locally and log entry set to `status="skipped"`
- `VALID_TRANSITIONS` enforces the one-way lifecycle; attempting a disallowed transition returns HTTP 400
- Admin drafts page shows per-draft action buttons (Submit for Review, Approve, Send Back, Publish to WordPress) with loading spinners and error display
- WordPress publish status `"publish"` (not `"published"`) is the WP REST API value for live posts
