# STEP 41 — B2B Content / API Extensions

## Goal
Build an API access layer for partner integrations, white-label content feeds, and travel industry data products. Allows external partners (state tourism boards, travel aggregators, gear brands) to consume TrekYatra content programmatically under a key-based access model.

## Scope

### API key management
- `api_keys` table: id UUID PK, partner_id FK→partners CASCADE, key_hash (SHA-256 of the raw key, stored; raw key shown once on create), name, scopes JSON (e.g. `["content:read", "leads:write"]`), rate_limit_per_min int, active bool, created_at, last_used_at
- `partners` table: id UUID PK, name, contact_email, plan (free/standard/enterprise), active, created_at
- Alembic migration
- `generate_api_key()` service: generates a 40-char random key; stores `sha256(key)` in DB; returns raw key once
- `get_partner_from_key(raw_key)` dependency: hashes the key, looks up in `api_keys`, checks active + rate limit (Redis counter with 60s TTL)
- Rate limit: 60 req/min default (configurable per key); returns `429 Too Many Requests` when exceeded
- Admin: `GET/POST /admin/partners`, `GET/POST /admin/partners/{id}/keys`, `DELETE /admin/partners/{id}/keys/{key_id}`, `PATCH /admin/partners/{id}/keys/{key_id}/deactivate`

### Partner content API (read-only, key-scoped)
- `GET /api/partner/v1/pages` — paginated list of published cms_pages; supports `?page_type=`, `?cluster_id=`, `?updated_since=` filters; returns title, slug, page_type, content_html, content_json, seo fields, published_at, updated_at
- `GET /api/partner/v1/pages/{slug}` — full page detail
- `GET /api/partner/v1/treks` — published trek_guide pages with structured content_json fields
- `GET /api/partner/v1/clusters` — all keyword clusters (for taxonomy integration)
- All partner routes require `X-API-Key: <key>` header; use `get_partner_from_key` dependency
- Response includes `X-Rate-Limit-Remaining` and `X-Rate-Limit-Reset` headers

### White-label content feed
- `GET /api/partner/v1/feed` — RSS-compatible JSON feed of recent published pages; supports `?page_type=` filter
- Feed format: `{feed_title, feed_url, items: [{title, slug, url, summary, published_at, image_url, page_type}]}`
- No authentication required for the feed endpoint (public), but rate-limited by IP (60 req/min)

### Lead write API (scope-gated)
- `POST /api/partner/v1/leads` — allows partners to submit leads from their own platforms into TrekYatra's lead pipeline; requires `leads:write` scope on API key
- Payload: `{name, email, phone, trek_interest, source, operator_id?}`; creates a `lead_submission` record with `source = "partner:{partner_id}"`

### Usage analytics
- `api_usage_logs` table: id, api_key_id FK, endpoint, method, status_code, response_ms, created_at
- Logged asynchronously via Celery task (non-blocking)
- Admin: `GET /admin/partners/{id}/usage` — usage summary (requests/day, top endpoints, error rate)

### Admin UI
- `/admin/partners` — partner list with key count, last-used date, plan badge
- Per-partner detail: key management (create/deactivate), usage chart (daily requests), scope viewer

### Developer documentation
- `GET /api/partner/v1/` — returns OpenAPI-like endpoint index with descriptions and scope requirements (JSON, no auth required)

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 16 complete (cms_pages as the content source)
- Confirm Step 21 complete (RBAC patterns; separate auth dependency pattern to follow)
- Confirm Step 22 complete (lead_submissions for lead write API)

## Dependency Check
- `services/api/app/modules/auth/dependencies.py` — `get_current_admin` pattern to follow for `get_partner_from_key`
- `services/api/app/modules/cms/service.py` — `list_pages` and `get_page_by_slug` reused
- `services/api/app/modules/leads/service.py` — `create_lead` reused for lead write API
- `services/api/app/api/router.py` — register partner router under `/api/partner/v1`
- `apps/web-next/lib/api.ts` — admin partner management helpers

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0030_partners_api_keys.py`
- `services/api/app/modules/partners/__init__.py`
- `services/api/app/modules/partners/models.py` — Partner, ApiKey, ApiUsageLog
- `services/api/app/modules/partners/service.py` — generate_api_key, get_partner_from_key, log_usage_task
- `services/api/app/schemas/partners.py`
- `services/api/app/api/routes/partner_api.py` — all /api/partner/v1/* routes
- `services/api/app/api/routes/admin_partners.py` — admin partner + key management
- `services/api/tests/test_partners.py`
- `apps/web-next/app/(admin)/admin/partners/page.tsx`

## Planned Files to Modify
- `services/api/app/db/base.py` — Partner, ApiKey, ApiUsageLog registered
- `services/api/app/api/router.py` — partner_api_router + admin_partners_router registered
- `services/api/app/worker/celery_app.py` — log_api_usage_task in include list
- `apps/web-next/lib/api.ts` — Partner, ApiKey interfaces; fetchPartners, createPartner, createApiKey, deactivateApiKey, fetchPartnerUsage helpers
- `apps/web-next/app/(admin)/admin/layout.tsx` — Partners nav item added to System group

## Files Created
(to be filled when step is executed)

## Files Modified
(to be filled when step is executed)

## Status
pending

## Notes
- Raw API key shown exactly once at creation time — not stored; only SHA-256 hash stored; admin cannot recover the raw key; partner must store it securely
- Rate limiting uses Redis incr with 60s expiry — same Redis instance as CMS cache (use a separate DB index, e.g. DB 3)
- Usage logging is async (Celery task) — never blocks the API response; if Celery is down, logging is skipped (non-critical)
- Partner API is versioned at `/api/partner/v1/` from the start — anticipates future `v2` without breaking existing integrations
- White-label feed is public (no key required) to maximize distribution; lead write API requires explicit `leads:write` scope to prevent abuse
- Do not build a self-serve partner signup portal in this step — partners are onboarded by admin only
- OpenAPI docs for the partner API are exposed at `/api/partner/v1/` (JSON index) and also auto-generated at `/docs` (FastAPI default); consider a separate `/partner-docs` route if public docs are desired
