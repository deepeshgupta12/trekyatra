# STEP 04 — Frontend Wiring Blueprint

## Goal
Audit the static Vite frontend, decide the migration strategy, and produce the full wiring blueprint that maps every route group to its API contract. No code changes to `apps/web-static` in this step.

## Scope
- Full audit of `apps/web-static` structure, routes, components, and mock data
- Migration strategy decision (Vite vs Next.js)
- Vite proxy plan
- Auth context architecture
- API contract mapping for all 8 route groups
- Mock data deprecation plan
- Files-to-create checklist for Steps 08 and 09

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md

## Dependency Check
- `apps/web-static/` was NOT modified in this step
- `services/api/` was NOT modified in this step
- Blueprint only — no runnable code changes

## Deliverables
- `docs/FRONTEND_WIRING_BLUEPRINT.md` — full blueprint
- `docs/MASTER_TRACKER.md` — step 04 status recorded
- `docs/steps/STEP-04-frontend-wiring-blueprint.md` — this file

## Key Decisions

### 1. Keep Vite (no Next.js migration now)
TanStack Query already installed. All 45 routes stable. Next.js migration is a separate step (10+) after API layer is stable.

### 2. API transport: `credentials: 'include'` fetch client
Auth uses HttpOnly JWT cookie — every fetch must send `credentials: 'include'`.

### 3. Auth context via TanStack Query + `/auth/me`
Single `useQuery` for current user. `RequireAuth` and `RequireAdmin` wrappers added to `App.tsx` in Step 09.

### 4. Mock data lives until Step 08
`src/data/treks.ts` is not touched until `GET /treks` is live. Deprecation checklist in blueprint.

### 5. Live auth API surface (Step 03)
These endpoints are working today and will be consumed in Step 09:
- `POST /api/v1/auth/signup/email`
- `POST /api/v1/auth/login/email`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

### 6. All trek and user endpoints are not yet built
Slotted for Steps 08 and 09 respectively.

## Status
Done

## Notes
- `apps/web-static/` was not modified in this step
- All API contracts are documented in `docs/FRONTEND_WIRING_BLUEPRINT.md`
- Admin endpoints require a `roles` field added to `UserResponse` — flagged for Step 07
- Wait for user confirmation before Step 05
