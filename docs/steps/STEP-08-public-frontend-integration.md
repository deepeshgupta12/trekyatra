# STEP 08 — public-frontend-data-integration-phase-1 + next-js-migration

## Status: done

## Goal
Wire public trek APIs from the FastAPI backend and complete the full Next.js 14 App Router migration of all Vite SPA routes.

## Scope
- Add public trek read APIs from backend
- Add frontend API helper layer
- Wire homepage, explore, and trek detail to backend with static fallback
- Migrate entire Vite SPA (~55 routes) to Next.js 14 App Router
- Remove Vite SPA once migration is verified

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm GitNexus graph is up to date
- Confirm Step 07 is complete

## Dependency Check
- `services/api/app/api/router.py` change must remain additive
- No database schema change is needed
- `apps/web-static/src/data/treks.ts` remains the static fallback dataset and media source
- `apps/web-static/src/App.tsx` and `src/main.tsx` remain untouched
- Vite dev server port must not collide with local WordPress on `8080`

## Files to Create
- services/api/app/api/routes/treks.py
- services/api/app/modules/treks/__init__.py
- services/api/app/modules/treks/data.py
- services/api/app/modules/treks/service.py
- services/api/app/schemas/treks.py
- services/api/tests/test_treks.py
- apps/web-static/src/lib/api.ts
- apps/web-static/src/lib/trekApi.ts

## Files to Modify
- docs/MASTER_TRACKER.md
- docs/DEPENDENCY_MAP.md
- apps/web-static/vite.config.ts
- apps/web-static/src/pages/Index.tsx
- apps/web-static/src/pages/Explore.tsx
- apps/web-static/src/pages/TrekDetail.tsx
- services/api/app/api/router.py

## What Was Done

### Backend
- `services/api/app/api/routes/treks.py` — `GET /api/v1/treks` and `GET /api/v1/treks/{slug}` endpoints
- `services/api/app/modules/treks/data.py` — 12 in-memory trek records
- `services/api/app/modules/treks/service.py` — list/detail service with filtering
- `services/api/app/schemas/treks.py` — `TrekSummary` and `TrekDetail` Pydantic schemas
- `services/api/tests/test_treks.py` — trek route tests

### Frontend (Next.js 14 App Router — apps/web-next/)
- Foundation: `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- Design system: `app/globals.css` (full TrekYatra CSS variables, utilities, keyframes)
- Root layout: `app/layout.tsx` + `components/Providers.tsx` (QueryClient + Tooltip)
- Shared components: Header (client), Footer (client), SiteLayout, Logo, TrekCard (client), ContentPage, SuccessHero
- UI primitives: `components/ui/button.tsx`
- Data layer: `lib/api.ts` (universal fetch, 3s timeout), `lib/trekApi.ts` (mergeImage + fallback), `data/treks.ts`
- Public pages (SSG/client): homepage, explore, trek/[slug], compare, regions/[slug], seasons/[slug], all content pages (packing, permits, costs, gear, safety, itineraries, beginner, newsletter, products, about, methodology, contact, privacy, terms, affiliate-disclosure, safety-disclaimer), saved, plan, search, no-results, empty-saved, under-review, maintenance, checkout, products/[slug]
- Success pages: newsletter, plan, checkout, password-reset, signup
- Auth pages (standalone): sign-in, sign-up, otp, forgot-password, reset-password, verify-email, invalid-token, onboarding
- Account pages (with sidebar layout): dashboard, saved, compare, downloads, enquiries, settings
- Admin pages (dark sidebar layout): dashboard, topics, clusters, briefs, drafts, fact-check, linking, monetization, analytics, logs, settings

### Vite SPA Removed
- `apps/web-static/` deleted — migration complete and build verified

## Validation Results
- `next build` passes: 85/85 pages generated
- All key routes return 200 in dev server smoke test
- Static fallback works when backend is offline (3s timeout → static data)

## What Remains (future steps)
- Auth endpoints wired to real JWT sessions
- Account pages wired to real user data (saved treks, downloads, enquiries)
- Admin pages wired to real backend APIs
- Role-aware admin access enforcement