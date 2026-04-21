# STEP 04 — frontend-audit-and-nextjs-migration-blueprint

## Goal
Audit the static frontend, document dependency and route structure, and produce the full migration blueprint for rebuilding the public/product frontend in Next.js. No code changes to `apps/web-static` in this step.

## Scope
- Audit `apps/web-static` structure, route tree, layout shells, shared UI, and mock data
- Document GitNexus-based entry chain and blast radius
- Finalize full Next.js migration decision
- Define migration rules from Vite/React Router structure to Next.js App Router structure
- Define API wiring blueprint for auth, homepage, explore, trek detail, account, admin, and content surfaces
- Define mock-data deprecation strategy
- Define future files/modules to create in the Next.js app
- Update tracker and dependency documentation

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm GitNexus graph is up to date
- Confirm current frontend source remains `apps/web-static/`

## Dependency Check
- `apps/web-static/` was not modified in this step
- `services/api/` was not modified in this step
- `apps/web-static/src/main.tsx` is the current mount entry and remains reference-only
- `apps/web-static/src/App.tsx` is the current route/provider hub and remains reference-only
- `apps/web-static/src/components/layout/SiteLayout.tsx` is the public-shell reference for migration
- `apps/web-static/src/pages/auth/*`, `account/*`, and `admin/*` define standalone shell patterns to be recreated in Next.js
- `apps/web-static/src/data/treks.ts` remains the temporary mock source until trek APIs are built and the new Next.js frontend is wired

## Deliverables
- docs/FRONTEND_WIRING_BLUEPRINT.md
- docs/MASTER_TRACKER.md updated
- docs/DEPENDENCY_MAP.md updated
- docs/steps/STEP-04-frontend-audit-and-wiring-plan.md updated

## Key Decisions

### 1. Full Next.js migration
- Do not continue with Vite as the runtime frontend
- Rebuild the frontend as a dedicated Next.js application
- Keep `apps/web-static` as design/source-reference only until migration is complete

### 2. Vite app role
- UI reference
- content/layout reference
- component and route inventory reference
- no live API wiring into this app

### 3. Future frontend runtime
- Next.js
- TypeScript
- Tailwind
- route-segment based architecture
- SSR/SSG/ISR support for SEO-sensitive pages
- backend API integration through shared fetch client
- WordPress content consumption for editorial pages

### 4. Auth integration direction
- Auth APIs already live from Step 03
- They will be consumed in the future Next.js frontend, not in the Vite app

### 5. Mock data rule
- `src/data/treks.ts` remains untouched until the Next.js frontend and trek APIs are ready

## Validation Commands
- gitnexus status
- find apps/web-static/src -maxdepth 3 | sort
- document audit outputs only

## Status
Done

## Notes
- `apps/web-static/` was not modified in this step
- The Vite app is no longer the target runtime frontend
- The Next.js migration is the committed direction going forward
- Wait for user confirmation before Step 05