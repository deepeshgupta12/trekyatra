# TrekYatra Master Tracker

## Purpose
This file is the source of truth for implementation progress. It must be read before every step.

## Product Scope References
- Master business/product scope: `/mnt/data/Travel_Blog.md`
- Frontend source of truth: `apps/web-next/` (Next.js 14 App Router)
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
- Auth foundation: done
- WordPress integration: foundation done
- Content domain foundation: done
- Internal admin summary APIs: done
- Dynamic frontend wiring: blueprint done
- Nexus/GitNexus workflow setup: done
- Public frontend data integration phase 1: done
- Next.js frontend migration: done
- User account foundation on frontend: done
- Google OAuth: done

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

### Step 04 — Frontend audit and full Next.js migration blueprint
Status: done
What is done:
- Static frontend structure audited using GitNexus and file inventory
- Frontend entry chain and blast radius documented
- Migration direction finalized: full Next.js migration
- Vite app reclassified as source-reference/design-reference only
- API wiring groups mapped for auth, homepage, explore, trek detail, account, admin, and content surfaces
- Mock data deprecation strategy documented

### Step 05 — WordPress integration foundation
Status: done
What is done:
- WordPress config model extended
- WordPress response schemas added
- WordPress REST client skeleton added
- WordPress service helpers added
- WordPress health endpoint added
- WordPress connectivity test endpoint added
- WordPress tests added
- Local WordPress fallback using `?rest_route=/` validated
- Authenticated local WordPress connectivity validated

### Step 06 — Content domain foundation
Status: done
What is done:
- Topic, keyword cluster, content brief, and content draft ORM models added
- Content-domain schemas added
- Content-domain service helpers added
- List/create APIs for topics, clusters, briefs, and drafts added
- Alembic migration `20260421_0003_content_domain_foundation.py` added and validated
- Content route tests added and passing
- Local WordPress bootstrap compose file added
- Local WordPress setup documentation added
- Content insert stability fix applied
- Manual topic create/list curl validation completed

### Step 07 — Internal admin foundation
Status: done
What is done:
- Admin summary schemas added
- Admin service aggregation layer added
- Admin routes added for dashboard, topics, clusters, briefs, drafts, and system summaries
- Admin route tests added and passing
- Manual curl validation completed for:
  - `/api/v1/admin/dashboard/summary`
  - `/api/v1/admin/topics/summary`
  - `/api/v1/admin/clusters/summary`
  - `/api/v1/admin/briefs/summary`
  - `/api/v1/admin/drafts/summary`
  - `/api/v1/admin/system/summary`
What is pending:
- Static admin frontend remains unwired
- Role-aware admin access enforcement is still pending for future steps

### Step 08 — Public frontend data integration phase 1 + full Next.js migration
Status: done
What is done:
- Added public trek read APIs (`GET /api/v1/treks`, `GET /api/v1/treks/{slug}`) in FastAPI
- Added `services/api/app/modules/treks/` domain with in-memory data, service, and schemas
- Added trek route tests (`test_treks.py`)
- Completed full Next.js 14 App Router migration of all ~55 routes from Vite SPA
- Created `apps/web-next/` with: root layout, Providers (QueryClient + Tooltip), globals.css design system, tailwind.config.ts
- Migrated all public pages: homepage (SSG), explore (client), trek detail (SSG + generateStaticParams), compare, regions/[slug], seasons/[slug], all content pages, saved, search, no-results, empty-saved, under-review
- Migrated all auth pages: sign-in, sign-up, otp, forgot-password, reset-password, verify-email, invalid-token, onboarding (multi-step wizard)
- Migrated all success pages (5): newsletter, plan, checkout, password-reset, signup
- Migrated account section: layout with responsive sidebar, dashboard, saved, compare, downloads, enquiries, settings
- Migrated admin section: AdminLayout with dark sidebar, dashboard (KPIs + publish queue), topics, clusters, briefs, drafts, fact-check, linking, monetization, analytics, logs, settings
- Universal `lib/api.ts` with server/client URL detection and 3-second abort timeout
- `lib/trekApi.ts` with mergeImage() and safe static fallback
- `data/treks.ts` with 12 treks using string image paths
- Next.js rewrites proxy `/api/:path*` → `http://localhost:8000/api/:path*`
- All 85 pages build cleanly (`next build` passes)
- `apps/web-static/` Vite reference app removed (migration complete)
What remains:
- Role-aware admin access enforcement is still pending

### Google OAuth (addendum to Step 09)
Status: done
What is done:
- Backend: replaced `google_auth_placeholder` (501) with real `google_auth` handler
- Backend: added `login_or_register_google_user` service — handles new user, existing email link, and returning Google user
- Backend: `POST /api/v1/auth/google` accepts `{ access_token }`, verifies with Google's userinfo endpoint via httpx, upserts user + auth_identity, creates session, sets HttpOnly cookie
- Backend schema: `GoogleAuthRequest.access_token` (was `id_token`)
- Backend tests: 3 new Google auth tests (creates user, 401 for bad token, links to existing email account) — all 7 auth tests pass
- Frontend: installed `@react-oauth/google`
- Frontend: `googleAuth()` added to `lib/auth-api.ts`
- Frontend: `loginWithGoogle()` added to `AuthContext` and `AuthProvider`
- Frontend: `Providers.tsx` wrapped with `GoogleOAuthProvider` (reads `NEXT_PUBLIC_GOOGLE_CLIENT_ID`)
- Frontend: "Continue with Google" button wired with `useGoogleLogin` in both sign-in and sign-up pages
- Frontend: `apps/web-next/.env.local.example` created with `NEXT_PUBLIC_GOOGLE_CLIENT_ID` instruction
- All 85 pages build cleanly
What is required to activate:
- Create OAuth 2.0 credentials at Google Cloud Console (Web application type)
- Set Authorized JavaScript origins: `http://localhost:3000`
- Copy Client ID → `apps/web-next/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<id>`

### Step 09 — User account foundation on frontend
Status: done
What is done:
- Created `apps/web-next/lib/auth-api.ts`: typed client-only fetch helpers for `/auth/me`, `/auth/login`, `/auth/signup`, `/auth/logout`
- Created `apps/web-next/lib/auth-context.tsx`: React context with `AuthProvider` that bootstraps from `GET /me` on mount; exposes `user`, `isLoading`, `login()`, `signup()`, `logout()`, `refresh()`
- Created `apps/web-next/middleware.ts`: Next.js middleware protecting `/account/*` routes (redirects to `/auth/sign-in?next=<path>`) and bouncing authenticated users from `/auth/sign-in` and `/auth/sign-up` to `/account`
- Created `apps/web-next/components/account/UserGreeting.tsx`: client component reading `useAuth()` to display personalised welcome in account dashboard
- Modified `apps/web-next/components/Providers.tsx`: wrapped children in `<AuthProvider>`
- Modified `apps/web-next/app/(auth)/auth/sign-in/page.tsx`: wired to `login()` from `useAuth()`, `useSearchParams` redirect after login, `<Suspense>` boundary for static generation compatibility
- Modified `apps/web-next/app/(auth)/auth/sign-up/page.tsx`: wired to `signup()` from `useAuth()`, redirects to `/auth/onboarding` on success
- Modified `apps/web-next/components/layout/Header.tsx`: auth-aware desktop dropdown (avatar with initials, name/email, Dashboard link, Sign out) and mobile drawer (Dashboard link, Sign out)
- Modified `apps/web-next/app/(public)/account/page.tsx`: replaced static greeting with `<UserGreeting />` component
- All 85 pages build cleanly with Step 9 changes applied
What remains:
- Saved treks/downloads/enquiries wired to real user data (future step)
- Onboarding form data persisted to backend (future step)
- OTP and Google auth (backend stubs return 501; frontend UI exists)
- Role-aware admin access enforcement (future step)