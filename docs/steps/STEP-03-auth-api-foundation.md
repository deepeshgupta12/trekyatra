# STEP 03 — auth-api-foundation

## Goal
Add the auth API foundation with email signup/login/logout/me, password hashing, JWT cookie auth, and placeholder Google/mobile auth interfaces without touching the static frontend.

## Scope
- Add password hashing utilities
- Add JWT access-token creation and parsing
- Add DB session dependency wiring
- Add email signup and login APIs
- Add current user and logout APIs
- Add placeholder Google/mobile auth interfaces
- Add auth request/response schemas
- Add password hash migration
- Add auth tests
- Update tracker and dependency map

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Refresh GitNexus graph if stale
- Review blast radius for:
  - services/api/app/main.py
  - services/api/app/api/router.py
  - services/api/app/modules/auth/models.py
  - services/api/app/db/session.py

## Dependency Check
- `apps/web-static/` remains untouched
- `app/api/router.py` change must remain additive
- `app/modules/auth/models.py` must be extended rather than recreated
- `app/db/session.py` becomes the source of DB dependency injection
- New auth APIs rely on existing Step 02 models and migration chain

## Files to Create
- services/api/app/core/security.py
- services/api/app/schemas/__init__.py
- services/api/app/schemas/auth.py
- services/api/app/modules/auth/service.py
- services/api/app/modules/auth/dependencies.py
- services/api/app/api/routes/auth.py
- services/api/alembic/versions/20260421_0002_add_password_hash_to_users.py
- services/api/tests/test_auth.py

## Files to Modify
- services/api/app/api/router.py
- services/api/app/core/config.py
- services/api/app/db/session.py
- services/api/app/modules/auth/models.py
- services/api/.env.example
- services/api/README.md
- docs/MASTER_TRACKER.md
- docs/DEPENDENCY_MAP.md
- docs/steps/STEP-03-auth-api-foundation.md

## Validation Commands
- make install
- make infra-up
- make db-upgrade
- make db-current
- make test
- bash ./scripts/refresh_gitnexus.sh
- gitnexus status

## Status
Ready for user validation

## Notes
- `apps/web-static/` must remain untouched in this step
- Cookie strategy in Step 03 uses access token in HttpOnly cookie only
- Refresh token support can be added in a later step
- Wait for user confirmation before Step 04