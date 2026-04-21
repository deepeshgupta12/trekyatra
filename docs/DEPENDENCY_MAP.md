# TrekYatra Dependency Map

## Purpose
This file tracks structural dependencies, source-of-truth modules, and Nexus/GitNexus workflow rules. It must be read before any code change.

## Current Repository Topology
- `apps/web-static/` — uploaded static frontend source-of-truth, Vite + React + TypeScript + shadcn/ui style components
- `services/api/` — FastAPI backend foundation
- `services/api/alembic/` — database migration system
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
- `services/api/app/db/base_class.py` -> declarative base, naming convention, shared mixins
- `services/api/app/db/base.py` -> model import registry for metadata
- `services/api/app/db/session.py` -> SQLAlchemy engine and session factory
- `services/api/app/modules/auth/models.py` -> users, auth identities, sessions
- `services/api/app/modules/rbac/associations.py` -> user_roles, role_permissions association tables
- `services/api/app/modules/rbac/models.py` -> roles, permissions
- `services/api/alembic/env.py` -> Alembic environment config
- `services/api/alembic/versions/20260421_0001_initial_auth_and_rbac.py` -> initial schema migration
- `services/api/tests/test_health.py` -> API health smoke tests
- `services/api/tests/test_models.py` -> metadata table coverage test

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
- `services/api/app/schemas/*` -> Pydantic contracts (future)
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
### Step 01 additions
- No changes to `apps/web-static/`
- New root tooling files affect repo-level workflows only
- New backend files are isolated under `services/api/`
- New Docker Compose affects local infra only
- Host port mappings:
  - Postgres: `5433 -> 5432`
  - Redis: `6380 -> 6379`

### Step 02 additions
- No changes to `apps/web-static/`
- New DB and model files only affect backend metadata, migrations, and future auth/data layers
- `app/db/base.py` is the metadata import registry and must include all ORM models that should be migrated
- Alembic environment depends on `app.core.config.settings` and `app.db.base.Base.metadata`
- Future auth API work must respect current model relationships and association tables