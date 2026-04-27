# STEP 22 — Internal Linking Engine + Lead Pipeline + Newsletter Platform

## Goal
Two parallel workstreams merged into one step:

**A. Internal Linking Engine** — build the content graph that strengthens crawl equity, surfaces related content, and detects orphan pages. This is the structural SEO backbone that compounds value as content grows.

**B. Lead Pipeline + Newsletter Platform Wiring** — complete the lead-to-operator funnel (admin view + email notification) and connect the newsletter subscriber list to an external email platform (Mailchimp or Brevo) for real delivery.

---

## Scope

### A. Internal Linking Engine

#### Data model
- `pages` table: id, slug, title, cms_page_id (FK→cms_pages), cluster_id (FK→keyword_clusters nullable), page_type (trek_guide, packing_list, comparison, permit_guide, beginner_guide, seasonal), published_at, indexed_at, created_at
- `page_links` table: id, from_page_id (FK→pages), to_page_id (FK→pages), anchor_text, link_type (editorial, suggested), created_at
- Sync job: populate `pages` from cms_pages on demand and after every publish

#### Services
- `sync_pages_from_cms(db)` — upserts rows in `pages` from cms_pages; sets cluster_id where cms_page.cluster_id is present
- `get_related_pages(db, page_id, limit=5)` — returns pages in the same cluster ranked by page_type relevance; fallback: most-recent pages of same page_type
- `get_orphan_pages(db)` — published pages with 0 inbound page_links entries
- `get_anchor_suggestions(db, page_id)` — candidate anchor texts from title + cluster keyword + page_type suffix variants

#### Celery task
- `sync_pages_task` — daily, syncs cms_pages → pages table
- `detect_orphans_task` — daily, logs orphan page count to admin log

#### APIs
- `POST /api/v1/admin/links/sync` — trigger sync (require_admin)
- `GET /api/v1/links/suggestions/{page_id}` — public, returns related pages
- `GET /api/v1/admin/links/orphans` — admin, returns orphan page list (require_admin)
- `GET /api/v1/admin/links/anchors/{page_id}` — admin, returns anchor suggestions (require_admin)

#### Frontend
- `RelatedContent` component wired to real `/links/suggestions/{page_id}` endpoint
- Admin linking page (`/admin/linking`) rewritten with real API: orphan list + sync trigger + anchor suggestions

---

### B. Lead Pipeline

#### Backend
- `GET /api/v1/admin/leads` — paginated list of all lead submissions (require_admin)
- `PATCH /api/v1/admin/leads/{id}` — mark lead as contacted/converted/archived (require_admin)
- `lead_submissions` table already exists (Step 20); add `status` column (new, contacted, converted, archived) via Alembic migration
- Email notification to admin on new lead (send via SMTP/Resend on `POST /leads` success)

#### Frontend
- `/admin/leads` page — table of leads with status badges and mark-as-contacted action

---

### C. Newsletter Platform Wiring

#### Backend
- `POST /newsletter/sync` (admin) — push all current subscribers to Mailchimp/Brevo list via API
- `subscribe()` service updated: after DB insert, fire async Celery task to sync single subscriber to platform
- New env var: `NEWSLETTER_PLATFORM_API_KEY`, `NEWSLETTER_LIST_ID`, `NEWSLETTER_PLATFORM` (mailchimp | brevo)

#### Frontend
- No new frontend components needed (NewsletterCapture is already built)
- Admin dashboard: subscriber count card updated to show platform-synced count

---

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Step 21 complete (RBAC — admin routes are now role-protected)
- Step 20 complete (lead_submissions + newsletter_subscribers tables exist)
- Step 18 complete (RelatedContent component exists)
- Step 16 complete (cms_pages table exists with slug, cluster_id)

## Dependency Check
- `services/api/app/modules/cms/models.py` — CMSPage (slug, cluster_id, published_at) — source for pages sync
- `services/api/app/modules/leads/models.py` — LeadSubmission (existing); add `status` column
- `services/api/app/modules/newsletter/service.py` — subscribe() updated to fire Celery task
- `services/api/app/db/base.py` — register Page, PageLink
- `services/api/app/api/router.py` — register linking_router, leads_admin_router
- `services/api/app/worker/celery_app.py` — add beat schedule for daily sync + orphan detection
- `apps/web-next/components/content/RelatedContent.tsx` — wire to /links/suggestions
- `apps/web-next/app/(admin)/admin/linking/page.tsx` — rewrite with real API
- `apps/web-next/app/(admin)/admin/leads/page.tsx` — new admin leads list

## Planned Files to Create
- `services/api/app/modules/linking/__init__.py`
- `services/api/app/modules/linking/models.py` — Page, PageLink ORM models
- `services/api/app/modules/linking/service.py` — sync_pages_from_cms, get_related_pages, get_orphan_pages, get_anchor_suggestions
- `services/api/app/modules/linking/tasks.py` — Celery daily sync + orphan detection tasks
- `services/api/app/api/routes/linking.py` — 4 endpoints
- `services/api/app/schemas/linking.py` — PageResponse, PageLinkResponse, AnchorSuggestion
- `services/api/alembic/versions/20260427_0012_internal_linking_lead_status.py` — pages + page_links tables; lead_submissions.status column
- `services/api/tests/test_linking.py`
- `services/api/tests/test_leads_admin.py`
- `apps/web-next/app/(admin)/admin/leads/page.tsx`

## Planned Files to Modify
- `services/api/app/modules/leads/models.py` — add `status` column (default: "new")
- `services/api/app/modules/newsletter/service.py` — fire Celery task after subscribe
- `services/api/app/modules/newsletter/tasks.py` — NEW: sync_subscriber_task
- `services/api/app/db/base.py` — register Page, PageLink
- `services/api/app/api/router.py` — register linking_router; register admin leads route
- `services/api/app/worker/celery_app.py` — add beat schedule entries
- `services/api/.env.example` — NEWSLETTER_PLATFORM, NEWSLETTER_PLATFORM_API_KEY, NEWSLETTER_LIST_ID, SMTP_HOST/PORT/USER/PASSWORD
- `services/api/app/core/config.py` — newsletter + SMTP settings
- `apps/web-next/components/content/RelatedContent.tsx` — wire to /links/suggestions/{page_id}
- `apps/web-next/app/(admin)/admin/linking/page.tsx` — rewrite with real API
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
# Migration
cd services/api && ../../.venv/bin/alembic upgrade head

# Full test suite
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Sync pages from CMS
curl -X POST http://localhost:8000/api/v1/admin/links/sync \
  -H "Cookie: trekyatra_access_token=<admin-token>"

# Get suggestions
curl http://localhost:8000/api/v1/links/suggestions/<page_id>

# Orphans
curl http://localhost:8000/api/v1/admin/links/orphans \
  -H "Cookie: trekyatra_access_token=<admin-token>"

# Admin leads
curl http://localhost:8000/api/v1/admin/leads \
  -H "Cookie: trekyatra_access_token=<admin-token>"

npx gitnexus analyze --force
```

## Status
pending

## Notes
- WordPress sync in original Step 22 doc is removed — WordPress has been replaced by Master CMS (Step 16). Pages table syncs from `cms_pages` instead.
- Migration number: `20260427_0012` (next in sequence after `0011_leads_newsletter.py` from Step 20)
- Lead status state machine: new → contacted → converted | archived
- Newsletter platform wiring is conditional on `NEWSLETTER_PLATFORM` env var being set; service degrades gracefully (logs warning) if not configured
- `RelatedContent` component currently renders static related treks from props; update to fetch from `/links/suggestions/{page_id}` using the CMS page ID
- Admin leads page uses the same dark admin design system (bg-[#14161f], border-white/10 card pattern)
- Orphan page detection is additive — no existing pages are modified; purely advisory output for admins
