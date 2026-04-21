# TrekYatra Dependency Map

## Purpose
This file tracks structural dependencies, source-of-truth modules, and Nexus/GitNexus workflow rules. It must be read before any code change.

## Current Repository Topology
- `apps/web-static/` — uploaded static frontend source-of-truth, Vite + React + TypeScript + shadcn/ui style components
- `services/api/` — reserved for FastAPI backend
- `packages/` — reserved for shared packages if needed later
- `scripts/` — setup and dependency helpers
- `docs/` — implementation governance

## Source-of-Truth Rules
- Current frontend source of truth: `apps/web-static/`
- Current product scope source of truth: `/mnt/data/Travel_Blog.md`
- Current process source of truth: `docs/PROCESS_GUARDRAILS.md`
- Current progress source of truth: `docs/MASTER_TRACKER.md`

## Frontend Snapshot (from uploaded static repo)
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

## Dependency Discipline Rules
Before editing any existing frontend file:
1. Identify entry file and route usage.
2. Identify imported shared UI components.
3. Identify layout and page dependencies.
4. Check if mock data/contracts are shared elsewhere.
5. Record dependency notes in the active step file.

Before editing any backend file later:
1. Identify route module imports.
2. Identify settings/config usage.
3. Identify DB/session/auth/shared schema dependencies.
4. Identify Docker/runtime changes.
5. Update this map.

## Planned Backend Dependency Layers
- `services/api/app/main.py` -> FastAPI app entry
- `services/api/app/core/*` -> settings, security, logging
- `services/api/app/api/*` -> route registration and endpoints
- `services/api/app/db/*` -> session/base/models
- `services/api/app/modules/*` -> domain modules (auth, users, wordpress, content, etc.)
- `services/api/app/schemas/*` -> Pydantic contracts
- `services/api/tests/*` -> tests

## Nexus / GitNexus Workflow (planned)
- Use Nexus/GitNexus before touching shared modules.
- Generate or refresh repo graph after major structural changes.
- Record blast-radius notes in step docs.
- Never change shared shell/layout/auth/config files without documenting affected surfaces.

## Current Blast Radius Notes
- No code changes have been made yet.
- `apps/web-static/` remains untouched after unzip.
