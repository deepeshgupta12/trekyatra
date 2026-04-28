# STEP 29 — Operator Listing + Lead Marketplace Basics

## Goal
Build an operator data model and a basic lead marketplace where submitted leads can be routed to matching trek operators. Enables the first B2B revenue stream beyond affiliate links.

## Scope

### Operator model
- `operators` table: id, name, slug, region[], trek_types[], contact_email, phone, website_url, active, created_at
- `operator_specializations` table: operator_id, trek_slug, priority (1–5)
- CRUD admin API for operators

### Lead routing
- When a lead is submitted (POST /api/v1/leads), match operators by `trek_interest` → `trek_types` overlap
- Store `assigned_operator_id` on `lead_submissions`
- Notify matched operator by email (same SMTP pattern as Step 22 lead notification, but sent to operator email)

### Lead lifecycle tracking
- `lead_submissions.status` (already exists from Step 22): extend states to: `new` → `routed` → `contacted` → `converted` → `lost`
- `status_history` JSON array on lead_submissions: [{status, changed_at, changed_by}]
- Operator can update lead status via a token-authenticated link (no full login required)

### Admin UI
- `/admin/operators` (new page): operator list + add/edit form
- `/admin/leads` enhanced: show assigned_operator column, status history drawer

### Backend
- Alembic migration: `operators` table + `operator_specializations` table + `assigned_operator_id` on `lead_submissions`
- `GET/POST /api/v1/admin/operators` — list + create
- `GET/PATCH/DELETE /api/v1/admin/operators/{id}`
- `PATCH /api/v1/admin/leads/{id}/assign-operator` — manual re-assign

## Preconditions
- Read docs/MASTER_TRACKER.md, PROCESS_GUARDRAILS.md, DEPENDENCY_MAP.md
- Confirm Step 28 complete
- Confirm Step 22 complete (lead_submissions table + SMTP pattern)

## Dependency Check
- `app/modules/leads/` — existing service, extend with routing logic
- `app/modules/leads/models.py` — LeadSubmission (add assigned_operator_id)
- New `operators` + `operator_specializations` tables

## Planned Files to Create
- `services/api/alembic/versions/YYYYMMDD_0019_operators.py`
- `services/api/app/modules/operators/__init__.py`
- `services/api/app/modules/operators/models.py`
- `services/api/app/modules/operators/service.py`
- `services/api/app/api/routes/operators.py`
- `services/api/app/schemas/operators.py`
- `services/api/tests/test_operators.py`
- `apps/web-next/app/(admin)/admin/operators/page.tsx`

## Planned Files to Modify
- `services/api/app/modules/leads/models.py`
- `services/api/app/modules/leads/service.py` — routing logic
- `services/api/app/modules/leads/tasks.py` — notify operator on route
- `services/api/app/db/base.py`
- `services/api/app/api/router.py`
- `apps/web-next/app/(admin)/admin/leads/page.tsx`
- `apps/web-next/app/(admin)/admin/layout.tsx` — Operators nav item
- `apps/web-next/lib/api.ts`

## Status
pending

## Notes
- Operator email notification uses the same SMTP config as Step 22. If SMTP is unconfigured, routing still happens (DB update) but email is skipped gracefully.
- Token-authenticated lead status update link: sign a JWT with {lead_id, operator_id, exp: 7 days}, validate on PATCH /leads/operator-update/{token} — no full auth needed for operators.
