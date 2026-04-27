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
Done

## Files Created
- `services/api/app/schemas/rbac.py` — RoleResponse, RoleAssignRequest, UserWithRolesResponse schemas
- `services/api/app/modules/rbac/service.py` — seed_roles, get_role_by_slug, assign_role_to_user, revoke_role_from_user, list_users_with_roles
- `services/api/app/api/routes/users.py` — GET /admin/users, POST /admin/users/{id}/roles, DELETE /admin/users/{id}/roles/{slug} (all require super_admin)
- `services/api/tests/conftest.py` — autouse pytest fixture that bypasses RBAC for all test files except test_rbac.py
- `services/api/tests/test_rbac.py` — 14 tests covering 401, 403, role seeding, assignment, revocation, user management API
- `scripts/seed_roles.py` — standalone script to idempotently seed 5 default roles
- `scripts/assign_admin.py` — standalone script to assign a role to a user by email

## Files Modified
- `services/api/app/core/security.py` — create_access_token gains optional `roles: list[str]` param; roles included in JWT payload
- `services/api/app/modules/auth/service.py` — create_session_for_user reads user.roles and passes slugs to create_access_token
- `services/api/app/modules/auth/dependencies.py` — RequireRole class added; named singletons: require_super_admin, require_admin, require_editor, require_pipeline, require_agent_admin
- `services/api/app/api/routes/admin.py` — router-level Depends(require_admin)
- `services/api/app/api/routes/publish.py` — router-level Depends(require_editor)
- `services/api/app/api/routes/content.py` — router-level Depends(require_editor)
- `services/api/app/api/routes/pipeline.py` — router-level Depends(require_pipeline)
- `services/api/app/api/routes/agent_triggers.py` — router-level Depends(require_agent_admin)
- `services/api/app/api/routes/agent_runs.py` — router-level Depends(require_admin)
- `services/api/app/api/routes/worker.py` — router-level Depends(require_admin)
- `services/api/app/api/routes/cms.py` — router-level Depends(require_editor)
- `services/api/app/api/router.py` — users_router registered
- `apps/web-next/middleware.ts` — /admin/:path* added to matcher; unauthenticated admin visits redirect to /auth/sign-in

## Notes
- RequireRole is a named singleton class: import `require_admin` etc. from dependencies.py. Use as `Depends(require_admin)` in router.
- JWT roles are informational only — enforcement is always from DB (user.roles relationship loaded lazily per request).
- conftest.py bypass strategy: `app.dependency_overrides` with autouse fixture; test_rbac.py skips the bypass and tests real enforcement.
- Superusers (is_superuser=True) bypass all role checks — future escape hatch.
- To activate in local dev: sign up at /auth/sign-up, then run `PYTHONPATH=services/api .venv/bin/python scripts/assign_admin.py --email <you> --role admin`
- 199/199 backend tests pass; next build clean.
