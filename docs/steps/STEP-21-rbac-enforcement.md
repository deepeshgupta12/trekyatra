# STEP 21 — RBAC Enforcement

## Goal
Enforce role-based access control on all admin API endpoints and the admin frontend. This has been deferred since Step 03 (auth foundation). With V1 content pipeline live, real access control is non-negotiable before any external users or collaborators are added.

## Scope

### FastAPI role enforcement
- `RequireRole(roles: list[str])` dependency factory
- Applied to all `/admin/*` routes: requires at minimum the "admin" role
- Applied to publish routes: requires "editor" or "admin"
- Applied to content write routes (topic create, brief create, etc.): requires "editor" or "admin"
- Unauthorized → 403 with clear message
- Unauthenticated → 401 (already handled by `get_current_user` dependency)

### Role seeding
- Seed script: `scripts/seed_roles.py` — creates Super Admin, Admin, Editor, Reviewer, Content Ops roles with correct permissions
- Management command: `make seed-roles`
- First admin user assignment: `scripts/assign_admin.py --email <email>`

### User role management APIs
- POST /api/v1/admin/users/{id}/roles — assign role to user
- DELETE /api/v1/admin/users/{id}/roles/{role_name} — revoke role
- GET /api/v1/admin/users — list users with their roles
- These endpoints require Super Admin role

### Next.js admin access guard
- `middleware.ts` updated: check role claim in session cookie for `/admin/*` routes
- If session has no admin/editor role → redirect to `/auth/sign-in?next=<path>`
- Role claim added to JWT payload during login (from user's roles in DB)

### Tests
- Test: admin endpoint with no auth → 401
- Test: admin endpoint with regular user (no roles) → 403
- Test: admin endpoint with admin role → 200
- Test: publish endpoint with editor role → 200
- Test: role assignment and revocation

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 20 complete (all V1 routes implemented)
- Role and permission models exist (created in Step 02)

## Dependency Check
- `app/modules/rbac/models.py` — Roles, Permissions tables (Step 02)
- `app/modules/rbac/associations.py` — user_roles, role_permissions (Step 02)
- `app/modules/auth/dependencies.py` — `get_current_user` dependency; extended to resolve roles
- `app/api/routes/auth.py` — JWT payload extended to include role list
- All `/admin/*` route files modified to add RequireRole dependency
- `apps/web-next/middleware.ts` — modified to check role claim

## Planned Files to Create
- `services/api/app/modules/rbac/service.py` — role assignment, revocation, seeding helpers
- `services/api/app/api/routes/users.py` — user management + role assignment endpoints
- `services/api/app/schemas/rbac.py` — role assignment request/response schemas
- `scripts/seed_roles.py`
- `scripts/assign_admin.py`
- `services/api/tests/test_rbac.py`

## Planned Files to Modify
- `services/api/app/modules/auth/dependencies.py` — resolve and attach user roles to current_user
- `services/api/app/core/security.py` — include roles in JWT payload
- `services/api/app/api/routes/admin.py` — add RequireRole dependency
- `services/api/app/api/routes/publish.py` — add RequireRole(["editor","admin"])
- `services/api/app/api/routes/content.py` — add RequireRole(["editor","admin"])
- `services/api/app/api/routes/pipeline.py` — add RequireRole(["admin"])
- `services/api/app/api/routes/agent_triggers.py` — add RequireRole(["admin"])
- `services/api/app/api/router.py` — register users_router
- `apps/web-next/middleware.ts` — add role check for /admin/*
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
make install
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Seed roles
python scripts/seed_roles.py

# Assign yourself as admin
python scripts/assign_admin.py --email guyshazam12@gmail.com

make api

# Test without auth → 401
curl http://localhost:8000/api/v1/admin/dashboard/summary

# Test with regular user token → 403
# Test with admin token → 200
npx gitnexus analyze --force
```

## Status
pending

## Notes
- JWT roles payload: add `"roles": ["admin"]` to the token claims; `get_current_user` resolves this from DB on each request (do not trust JWT roles alone — verify from DB)
- RequireRole is a dependency factory: `Depends(RequireRole(["admin", "super_admin"]))` — any matching role passes
- Seed roles with: Super Admin (all permissions), Admin (all content + publish), Editor (create/edit content, no admin config), Reviewer (read + approve/reject briefs+drafts only), Content Ops (create topics/clusters only)
- The role check in Next.js middleware is a belt-and-suspenders UX guard only — the real enforcement is in the FastAPI dependencies
- After this step, any dev login must use an account with admin role to access the admin panel
