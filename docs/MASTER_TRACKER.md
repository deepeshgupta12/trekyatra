# TrekYatra Master Tracker

## Purpose
This file is the source of truth for implementation progress. It must be read before every step.

## Product Scope References
- Master business/product scope: `/mnt/data/Travel_Blog.md`
- Static frontend source of truth: `apps/web-static/`
- Process discipline: `docs/PROCESS_GUARDRAILS.md`
- Dependency discipline: `docs/DEPENDENCY_MAP.md`
- Step plan: `docs/IMPLEMENTATION_PLAN.md`

## Current Execution Rule
Do not modify any code file without first:
1. Reading this tracker
2. Reading `docs/PROCESS_GUARDRAILS.md`
3. Reading `docs/DEPENDENCY_MAP.md`
4. Checking impacted files and blast radius
5. Updating the relevant step file in `docs/steps/`

## Current Status
- Project repo scaffold: done
- Static frontend zip unpacked into `apps/web-static`: done
- Backend scaffold: done
- Database scaffold: foundation done
- Docker/local infra: done
- Auth foundation: API layer in progress
- WordPress integration: pending
- API contracts: auth foundation in progress
- Dynamic frontend wiring: blueprint complete (see docs/FRONTEND_WIRING_BLUEPRINT.md)
- Nexus/GitNexus workflow setup: done

## Step History

### Step 00 — Repo bootstrap, docs, and source-of-truth setup
Status: done
What is done:
- Monorepo folders created
- Uploaded frontend preserved untouched in `apps/web-static`
- Tracker, process, dependency, and implementation docs created

### Step 01 — Backend foundation and local infra scaffold
Status: done
What is done:
- Root repo tooling added
- GitNexus installed and initial graph indexed
- Backend FastAPI scaffold added under `services/api`
- Docker Compose added for Postgres and Redis
- Health endpoints and tests added
- Local API boot validated

### Step 02 — Database, config, and auth data model foundation
Status: done
What is done:
- SQLAlchemy base and session foundation added
- Alembic initialized
- Initial migration created
- User, auth identity, user session, role, permission, user-role, and role-permission models added
- Metadata tests added
- Pylance-safe model typing fixed for auth and RBAC relationships

### Step 03 — Auth APIs foundation
Status: done
What is done:
- Email signup/login/logout/me endpoints implemented
- Password hashing implemented
- JWT access token in HttpOnly cookie implemented
- Placeholder Google/mobile auth interfaces added
- Auth tests added
- Python 3.10 compatibility fixes applied
- ORM registration fix applied for runtime mapper resolution
What is pending:
- Nothing for this step

### Step 04 — Static frontend audit and dynamic wiring plan
Status: done
What is done:
- Full audit of apps/web-static: 45 routes, 30 pages, 12 mock trek entries, zero API calls
- Migration strategy decided: keep Vite, wire incrementally, Next.js migration deferred to Step 10+
- Frontend wiring blueprint written to docs/FRONTEND_WIRING_BLUEPRINT.md
- API contracts mapped for all 8 route groups: auth, homepage, explore, trek detail, account, admin, content, system states
- Mock data deprecation plan for src/data/treks.ts documented
- Files to create in Steps 08 and 09 listed