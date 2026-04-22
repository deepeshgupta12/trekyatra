# STEP 22 — Internal Linking Engine (Basic)

## Goal
Build the internal linking engine that strengthens the site's content graph, improves crawl equity distribution, and surfaces related content to users. This is the structural SEO backbone that compounds value as content grows.

## Scope

### Data model
- `pages` table: id, slug, title, post_type, cluster_id, wordpress_post_id, page_type (trek_guide, packing_list, comparison, etc.), published_at, indexed_at
- `page_links` table: id, from_page_id, to_page_id, anchor_text, link_type (editorial, suggested, auto-inserted), created_at
- Sync job: populate `pages` from WordPress posts on demand and on publish

### Related page suggestion service
- `get_related_pages(page_id, limit=5)` — returns pages in the same cluster, ranked by page_type relevance match
- Fallback: if cluster is empty, return most-recently-published pages of the same page_type
- Used by `RelatedContent` component in frontend

### Orphan page detection
- `get_orphan_pages()` — returns published pages with 0 inbound page_links entries
- Scheduled daily via Celery Beat
- Results exposed via API for admin review

### Anchor text recommendation
- `get_anchor_suggestions(page_id)` — returns candidate anchor text options based on page title, target keyword, and cluster topic
- Simple heuristic: title words + keyword + "guide" / "trek" / "packing list" variants

### APIs
- GET /api/v1/links/suggestions/{page_id} — related pages for content component
- GET /api/v1/admin/links/orphans — orphan pages list
- GET /api/v1/admin/links/anchors/{page_id} — anchor text suggestions
- POST /api/v1/admin/links/sync — trigger pages table sync from WordPress

### Frontend
- `RelatedContent` component (created in Step 18) wired to real /links/suggestions endpoint
- Admin linking page (`/admin/linking`) shows orphan list and suggestion dashboard

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 18 complete (RelatedContent component exists)
- Confirm Step 16 complete (WordPress posts are pullable via backend)
- At least 10 published posts in WordPress for meaningful suggestions

## Dependency Check
- `app/modules/wordpress/client.py` — list_posts() used to sync pages table
- New `pages` and `page_links` tables require Alembic migration
- `app/db/base.py` — register new models
- Frontend: RelatedContent component from Step 18 updated to use real API
- No changes to auth, publish, or content write routes

## Planned Files to Create
- `services/api/app/modules/linking/__init__.py`
- `services/api/app/modules/linking/models.py` — Page, PageLink models
- `services/api/app/modules/linking/service.py` — get_related, get_orphans, get_anchors, sync_pages
- `services/api/app/modules/linking/tasks.py` — Celery task for daily orphan detection + sync
- `services/api/app/api/routes/linking.py`
- `services/api/app/schemas/linking.py`
- `services/api/alembic/versions/20260422_0009_internal_linking.py`
- `services/api/tests/test_linking.py`
- `apps/web-next/app/(admin)/admin/linking/page.tsx` — rewrite with real API

## Planned Files to Modify
- `services/api/app/db/base.py` — register Page, PageLink
- `services/api/app/api/router.py` — register linking_router
- `services/api/app/worker/celery_app.py` — add beat schedule for daily orphan detection
- `apps/web-next/components/content/RelatedContent.tsx` — wire to /links/suggestions
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install
cd services/api && alembic upgrade head
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Sync pages from WordPress
curl -X POST http://localhost:8000/api/v1/admin/links/sync

# Get suggestions for a page
curl http://localhost:8000/api/v1/links/suggestions/<page_id>

# Get orphans
curl http://localhost:8000/api/v1/admin/links/orphans

# Get anchor suggestions
curl http://localhost:8000/api/v1/admin/links/anchors/<page_id>

npx gitnexus analyze --force
```

## Status
pending

## Notes
- V1 internal linking is suggestion-only; auto-insertion into drafts is V2
- The `pages` table is a local mirror of WP content — it does not replace WP; it enables link graph logic without repeated WP API calls
- Sync trigger: also fired automatically after each successful publish in Step 17
- pgvector-based semantic similarity for related content is V2; V1 uses cluster_id + page_type matching
- Orphan pages list in admin should show: slug, title, cluster, days since publish — sorted by oldest first
