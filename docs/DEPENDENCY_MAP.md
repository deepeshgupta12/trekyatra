# TrekYatra Dependency Map

## Purpose
This file tracks structural dependencies, source-of-truth modules, and Nexus/GitNexus workflow rules. It must be read before any code change.

## Current Repository Topology
- `apps/web-static/` — uploaded static frontend source-of-truth, Vite + React + TypeScript + shadcn/ui style components
- `services/api/` — FastAPI backend foundation
- `packages/` — reserved for shared packages if needed later
- `scripts/` — setup and dependency helpers
- `docs/` — implementation governance
- root `package.json` — repo-level scripts including GitNexus commands
- root `docker-compose.yml` — local infra for Postgres and Redis

## Source-of-Truth Rules
- Current frontend source of truth: `apps/web-static/`
- Current product scope source of truth: `/mnt/data/Travel_Blog.md`
- Current process source of truth: `docs/PROCESS_GUARDRAILS.md`
- Current progress source of truth: `docs/MASTER_TRACKER.md`

## Frontend Snapshot
### App entry chain
- `src/main.tsx` -> app boot
- `src/App.tsx` -> main route/shell composition
- `src/components/layout/*` -> site shell
- `src/pages/*` -> page-level static screens
- `src/pages/auth/*` -> auth static screens
- `src/pages/account/*` -> account static screens
- `src/pages/admin/*` -> internal static admin screens
- `src/pages/content/*` -> content screen collections
- `src/components/ui/*` -> shared UI primitives
- `src/data/treks.ts` -> current mock content data

## Backend Snapshot
### App entry chain
- `services/api/app/main.py` -> FastAPI app entry and lifespan
- `services/api/app/api/router.py` -> API router registration
- `services/api/app/api/routes/health.py` -> versioned health route
- `services/api/app/core/config.py` -> settings and connection URIs
- `services/api/app/core/logging.py` -> structured logging
- `services/api/tests/test_health.py` -> health smoke tests

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
- `services/api/app/db/*` -> session/base/models (future)
- `services/api/app/modules/*` -> domain modules (future)
- `services/api/app/schemas/*` -> Pydantic contracts (future)
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
### Step 01 additions only
- No changes to `apps/web-static/`
- New root tooling files affect repo-level workflows only
- New backend files are isolated under `services/api/`
- New Docker Compose affects local infra only
- Host port mappings now use:
  - Postgres: `5433 -> 5432`
  - Redis: `6380 -> 6379`