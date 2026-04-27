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
Done (+ Architectural Fix: Separate CMS Auth)

## Architectural Fix — Post-TC Review

After TC testing revealed that:
1. `/admin/dashboard` 404s (correct URL is `/admin`)
2. Regular users receive 403 because user RBAC was incorrectly applied to CMS admin routes

**Critical requirement added by user:** CMS admin auth must be completely separate from public user auth. No shared user DB. Only guyshazam12@gmail.com should have CMS admin access.

**Resolution:** Replaced RequireRole on all admin routes with a new `get_current_admin` dependency that validates a separate `trekyatra_admin_token` cookie issued by a credential-based admin login flow (ADMIN_EMAIL + ADMIN_PASSWORD in env). No DB table required. Public user auth remains untouched.

## Files Created (original + arch fix)
- `services/api/app/schemas/rbac.py` — RoleResponse, RoleAssignRequest, UserWithRolesResponse schemas
- `services/api/app/modules/rbac/service.py` — seed_roles, assign_role_to_user, revoke_role_from_user, list_users_with_roles
- `services/api/app/api/routes/users.py` — GET/POST/DELETE /admin/users (now requires get_current_admin)
- `services/api/app/api/routes/admin_auth.py` (NEW) — POST /admin/auth/login, POST /admin/auth/logout, GET /admin/auth/me
- `services/api/tests/conftest.py` — autouse fixture bypasses get_current_admin + RequireRole singletons for all test files except test_rbac.py
- `services/api/tests/test_rbac.py` — 20 tests: admin token guards, admin auth endpoints, role seeding, role assignment, user management API
- `scripts/seed_roles.py` — standalone script to idempotently seed 5 default roles
- `scripts/assign_admin.py` — standalone script to assign a role to a user by email
- `apps/web-next/app/(admin-auth)/layout.tsx` (NEW) — minimal pass-through layout for admin auth pages
- `apps/web-next/app/(admin-auth)/admin/sign-in/page.tsx` (NEW) — standalone admin sign-in form (no sidebar)
- `apps/web-next/lib/admin-auth-api.ts` (NEW) — adminLogin, adminLogout, getAdminMe client helpers

## Files Modified (original + arch fix)
- `services/api/app/core/config.py` — admin_email, admin_password, admin_cookie_name, admin_token_expire_hours settings added
- `services/api/app/core/security.py` — create_access_token gains roles; create_admin_token() added (stateless JWT, typ: admin_access)
- `services/api/app/modules/auth/dependencies.py` — RequireRole class + named singletons; get_current_admin added (validates trekyatra_admin_token)
- `services/api/app/modules/auth/service.py` — create_session_for_user reads user.roles and passes slugs to create_access_token
- `services/api/app/api/routes/admin.py` — Depends(get_current_admin)
- `services/api/app/api/routes/publish.py` — Depends(get_current_admin)
- `services/api/app/api/routes/content.py` — Depends(get_current_admin)
- `services/api/app/api/routes/pipeline.py` — Depends(get_current_admin)
- `services/api/app/api/routes/agent_triggers.py` — Depends(get_current_admin)
- `services/api/app/api/routes/agent_runs.py` — Depends(get_current_admin)
- `services/api/app/api/routes/worker.py` — Depends(get_current_admin)
- `services/api/app/api/routes/cms.py` — Depends(get_current_admin)
- `services/api/app/api/router.py` — admin_auth_router registered
- `apps/web-next/middleware.ts` — checks trekyatra_admin_token for /admin/*; redirects to /admin/sign-in; /admin/sign-in exempt from check
- `apps/web-next/app/(admin)/admin/layout.tsx` — Sign out button added to header
- `services/api/.env.example` — ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_COOKIE_NAME, ADMIN_TOKEN_EXPIRE_HOURS added

## Notes
- CMS admin auth is completely separate from public user auth: different cookie, different endpoint, no DB table
- Admin JWT: typ="admin_access", sub=admin_email, stateless (no session revocation — admin must clear cookie)
- ADMIN_PASSWORD must be set in services/api/.env to enable admin login (503 if unset)
- Public user auth (/auth/sign-in, /auth/sign-up) is entirely unaffected
- Admin URL is /admin (not /admin/dashboard) — the Dashboard nav item links to /admin root
- RequireRole class retained in dependencies.py for possible future use but no longer applied to any route
- 202/202 backend tests pass; next build clean (128 pages); GitNexus 4519 nodes | 7744 edges | 165 flows
