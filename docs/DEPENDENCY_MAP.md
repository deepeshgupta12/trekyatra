# TrekYatra Dependency Map

## Purpose
This file tracks structural dependencies, source-of-truth modules, and Nexus/GitNexus workflow rules. It must be read before any code change.

## Current Repository Topology
- `apps/web-next/` — Next.js 14 App Router frontend (production frontend, replaces Vite SPA)
- `services/api/` — FastAPI backend foundation
- `services/api/alembic/` — database migration system
- `packages/` — reserved for shared packages if needed later
- `scripts/` — setup and dependency helpers
- `docs/` — implementation governance
- root `package.json` — repo-level scripts including GitNexus commands
- root `docker-compose.yml` — local infra for Postgres and Redis
- root `docker-compose.wordpress.yml` — isolated local WordPress stack

## Source-of-Truth Rules
- Current frontend source of truth: `apps/web-next/` (Next.js 14 App Router)
- Current product scope source of truth: `/mnt/data/Travel_Blog.md`
- Current process source of truth: `docs/PROCESS_GUARDRAILS.md`
- Current progress source of truth: `docs/MASTER_TRACKER.md`

## Frontend Snapshot
### App entry chain (Next.js 14 App Router)
- `app/layout.tsx` -> root layout, imports globals.css, wraps in Providers
- `app/(public)/layout.tsx` -> public route group layout (SiteLayout with Header + Footer)
- `app/(auth)/` -> auth route group (standalone split-screen layouts, no shared header)
- `app/(admin)/admin/layout.tsx` -> admin layout with dark sidebar
- `components/layout/Header.tsx` -> site header with mega menu, mobile drawer (client)
- `components/layout/Footer.tsx` -> site footer with newsletter form (client)
- `components/layout/SiteLayout.tsx` -> Header + main + Footer wrapper
- `components/brand/Logo.tsx` -> brand logo with light/default variant
- `components/trek/TrekCard.tsx` -> trek card component (client)
- `components/content/ContentPage.tsx` -> reusable content page with blocks
- `components/success/SuccessHero.tsx` -> shared success state layout
- `components/ui/*` -> shadcn/ui primitives (Button, etc.)
- `components/Providers.tsx` -> QueryClient + TooltipProvider (client)
- `data/treks.ts` -> static fallback trek dataset (12 treks, string image paths)
- `lib/api.ts` -> universal fetch with server/client URL detection, 3s abort timeout
- `lib/trekApi.ts` -> trek API adapter with mergeImage() and safe static fallback
- `public/images/` -> local trek and hero images

## Frontend Runtime
- `apps/web-next/` is the production Next.js 14 App Router frontend
- Vite SPA (`apps/web-static/`) has been removed — migration is complete
- All 85 routes build cleanly with `next build`
- Dev server runs on port 3000 (`npm run dev` in `apps/web-next/`)
- API calls proxy `/api/:path*` → `http://localhost:8000/api/:path*` via next.config.mjs rewrites

## Backend Snapshot
### App entry chain
- `services/api/app/main.py` -> FastAPI app entry and lifespan
- `services/api/app/api/router.py` -> API router registration
- `services/api/app/api/routes/health.py` -> versioned health route
- `services/api/app/api/routes/auth.py` -> auth route registration and handlers
- `services/api/app/api/routes/wordpress.py` -> WordPress health and connectivity test handlers
- `services/api/app/api/routes/content.py` -> topics, clusters, briefs, drafts APIs
- `services/api/app/api/routes/admin.py` -> internal admin summary APIs
- `services/api/app/api/routes/treks.py` -> public trek list/detail APIs
- `services/api/app/core/config.py` -> settings and connection URIs
- `services/api/app/core/logging.py` -> structured logging
- `services/api/app/core/security.py` -> password hashing, token creation, token parsing
- `services/api/app/db/base_class.py` -> declarative base, naming convention, shared mixins
- `services/api/app/db/base.py` -> model import registry for metadata
- `services/api/app/db/session.py` -> SQLAlchemy engine, session factory, DB dependency
- `services/api/app/schemas/auth.py` -> auth request/response contracts
- `services/api/app/schemas/wordpress.py` -> WordPress request/response contracts
- `services/api/app/schemas/content.py` -> content-domain request/response contracts
- `services/api/app/schemas/admin.py` -> admin summary response contracts
- `services/api/app/schemas/treks.py` -> public trek response contracts
- `services/api/app/modules/auth/models.py` -> users, auth identities, sessions
- `services/api/app/modules/auth/service.py` -> email auth business logic and session creation
- `services/api/app/modules/auth/dependencies.py` -> current user/current session dependencies
- `services/api/app/modules/wordpress/client.py` -> WordPress REST client skeleton
- `services/api/app/modules/wordpress/service.py` -> WordPress health and connectivity service helpers
- `services/api/app/modules/content/models.py` -> topic, cluster, brief, draft ORM models
- `services/api/app/modules/content/service.py` -> content-domain create/list service helpers
- `services/api/app/modules/admin/service.py` -> admin dashboard and summary aggregations
- `services/api/app/modules/treks/data.py` -> additive mock/public trek source data
- `services/api/app/modules/treks/service.py` -> public trek list/detail filtering logic
- `services/api/app/modules/rbac/associations.py` -> user_roles, role_permissions association tables
- `services/api/app/modules/rbac/models.py` -> roles, permissions
- `services/api/alembic/env.py` -> Alembic environment config
- `services/api/alembic/versions/20260421_0001_initial_auth_and_rbac.py` -> initial schema migration
- `services/api/alembic/versions/20260421_0002_add_password_hash_to_users.py` -> password auth migration
- `services/api/alembic/versions/20260421_0003_content_domain_foundation.py` -> content domain migration
- `services/api/tests/test_health.py` -> API health smoke tests
- `services/api/tests/test_models.py` -> metadata table coverage test
- `services/api/tests/test_auth.py` -> auth route tests
- `services/api/tests/test_wordpress.py` -> WordPress route tests
- `services/api/tests/test_content_routes.py` -> content route tests
- `services/api/tests/test_admin.py` -> admin summary route tests
- `services/api/tests/test_treks.py` -> public trek route tests

## Dependency Discipline Rules
Before editing any existing frontend file:
1. Identify entry file and route usage.
2. Identify imported shared UI components.
3. Identify layout and page dependencies.
4. Check if mock data/contracts are shared elsewhere.
5. Record dependency notes in the active step file.

Before editing any backend file:
1. Identify route module imports.
2. Identify settings/config usage.
3. Identify DB/session/auth/shared schema dependencies.
4. Identify Docker/runtime changes.
5. Update this map.

## Planned Backend Dependency Layers
- `services/api/app/main.py` -> FastAPI app entry
- `services/api/app/core/*` -> settings, security, logging
- `services/api/app/api/*` -> route registration and endpoints
- `services/api/app/db/*` -> engine, base, metadata, models
- `services/api/app/modules/*` -> domain modules
- `services/api/app/schemas/*` -> Pydantic contracts
- `services/api/alembic/*` -> migrations
- `services/api/tests/*` -> tests

## GitNexus Workflow
- Install globally with `npm install -g gitnexus` or use `npx gitnexus ...`
- Build/refresh graph from repo root
- Local graph is stored in `.gitnexus/`
- Use GitNexus before touching shared modules
- Refresh graph after meaningful structural changes
- Record blast radius notes in step docs
- Never change shared shell/layout/auth/config files without documenting affected surfaces

## Current Blast Radius Notes
### Step 06 executed blast radius
- `app/db/base.py` is the metadata registry and includes the content-domain ORM models
- `alembic/env.py` depends on `app.db.base`, so Step 06 models flow automatically into migration metadata
- `app/api/router.py` was changed additively to include `content_router`
- `docker-compose.yml` remained untouched
- `docker-compose.wordpress.yml` isolates local WordPress runtime from the main Postgres/Redis infra
- `apps/web-static/` remained untouched in Step 06

### Step 07 executed blast radius
- `app/api/router.py` was changed additively to include `admin_router`
- `app/api/routes/admin.py` depends on `app.db.session.get_db`, `app.modules.admin.service`, and `app.schemas.admin`
- `app/modules/admin/service.py` depends on:
  - `app.core.config.settings`
  - `app.modules.content.models`
  - `sqlalchemy.orm.Session`
  - `app.schemas.admin`
- Step 07 introduced no database migration and no frontend file change
- Admin endpoints are summary-only placeholders and remain low-risk additive APIs
- `apps/web-static/` remained untouched in Step 07

### Step 08 executed blast radius
- `app/api/router.py` changed additively to include `treks_router`
- `app/api/routes/treks.py` depends on `app.modules.treks.service` and `app.schemas.treks`
- `app/modules/treks/service.py` depends only on in-memory `app.modules.treks.data`
- No database migration introduced in Step 08
- `apps/web-next/` created as full Next.js 14 App Router migration (85 routes)
- `apps/web-static/` removed — Vite SPA no longer needed
- `apps/web-next/lib/api.ts` is the new universal fetch layer (server + client)
- `apps/web-next/lib/trekApi.ts` mirrors the previous Vite trekApi with Next.js-compatible image paths
- Auth, account, and admin pages are UI-complete but backend wiring is deferred to a future step