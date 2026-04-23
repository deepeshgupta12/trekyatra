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
- root `docker-compose.yml` — Postgres + Redis; `docker-compose.wordpress.yml` deleted (WordPress removed)

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
- `components/Providers.tsx` -> QueryClient + GoogleOAuthProvider + AuthProvider + TooltipProvider (client)
- `components/account/UserGreeting.tsx` -> client component reading useAuth() for personalised greeting
- `components/admin/CopyableId.tsx` -> click-to-copy UUID component; blast radius: LOW (imported by admin topic/cluster/brief/pipeline pages only)
- `components/admin/AgentRunsPanel.tsx` -> live agent-run panel with 5s polling; reads GET /api/v1/admin/agent-runs?agent_type=TYPE&limit=5; blast radius: LOW (imported by admin topic/cluster/brief/drafts pages)
- `app/(admin)/admin/pipeline/page.tsx` -> new pipeline view page; fetches topics+clusters+briefs+drafts in parallel; client-side join; stage summary + table
- `data/treks.ts` -> static fallback trek dataset (12 treks, string image paths)
- `components/admin/CMSPageForm.tsx` -> shared CMS create/edit form; 10 section textareas + SEO meta + page type/status selectors; blast radius: LOW (used only by /admin/cms/new and /admin/cms/[slug]/edit)
- `app/(admin)/admin/cms/page.tsx` -> Master CMS index: KPI cards, pages table, New page button, edit/cache/view/delete per row
- `app/(admin)/admin/cms/new/page.tsx` -> CMS manual page creation (server shell + CMSPageForm)
- `app/(admin)/admin/cms/[slug]/edit/page.tsx` -> CMS page editor; server-fetches existing page; CMSPageForm pre-populated; Save + Publish + cache clear
- `lib/api.ts` -> universal fetch; CMSPage + TrekContentSections interfaces; fetchCMSPage/fetchCMSPages/createCMSPage/updateCMSPage helpers
- `lib/trekApi.ts` -> trek API adapter with mergeImage() and safe static fallback
- `lib/auth-api.ts` -> typed client-only fetch helpers for all 5 auth endpoints (me/login/signup/logout/google)
- `lib/auth-context.tsx` -> React AuthContext; bootstraps from GET /me; exposes user, isLoading, login(), signup(), loginWithGoogle(), logout(), refresh()
- `middleware.ts` -> Next.js route guard; protects /account/* and bounces authed users from /auth/sign-in, /auth/sign-up
- `next.config.mjs` -> Next.js config; rewrites /api/* → FastAPI; transpilePackages: [@react-oauth/google]
- `env.local.example` -> template for NEXT_PUBLIC_GOOGLE_CLIENT_ID
- `public/images/` -> local trek and hero images

## Frontend Runtime
- `apps/web-next/` is the production Next.js 14 App Router frontend
- Vite SPA (`apps/web-static/`) has been removed — migration is complete
- All 85 routes build cleanly with `next build` (verified after Step 9 auth wiring)
- Dev server runs on port 3000 (`npm run dev` in `apps/web-next/`)
- API calls proxy `/api/:path*` → `http://localhost:8000/api/:path*` via next.config.mjs rewrites

## Backend Snapshot
### App entry chain
- `services/api/app/main.py` -> FastAPI app entry and lifespan
- `services/api/app/api/router.py` -> API router registration
- `services/api/app/api/routes/health.py` -> versioned health route
- `services/api/app/api/routes/auth.py` -> auth route registration and handlers
- `services/api/app/api/routes/cms.py` -> Master CMS CRUD (GET/POST/PATCH/DELETE /cms/pages, POST /cms/cache/invalidate); blast radius: LOW (no upstream callers yet)
- `services/api/app/api/routes/content.py` -> topics, clusters, briefs, drafts APIs
- `services/api/app/api/routes/admin.py` -> internal admin summary APIs
- `services/api/app/api/routes/publish.py` -> draft status patch, CMS publish, publish log APIs
- `services/api/app/api/routes/treks.py` -> public trek list/detail APIs
- `services/api/app/core/config.py` -> settings and connection URIs
- `services/api/app/core/logging.py` -> structured logging
- `services/api/app/core/security.py` -> password hashing, token creation, token parsing
- `services/api/app/db/base_class.py` -> declarative base, naming convention, shared mixins
- `services/api/app/db/base.py` -> model import registry for metadata
- `services/api/app/db/session.py` -> SQLAlchemy engine, session factory, DB dependency
- `services/api/app/schemas/auth.py` -> auth request/response contracts
- `services/api/app/schemas/cms.py` -> CMSPageCreate, CMSPagePatch, CMSPageResponse, CMSCacheInvalidateRequest/Response
- `services/api/app/schemas/content.py` -> content-domain request/response contracts
- `services/api/app/schemas/admin.py` -> admin summary response contracts
- `services/api/app/schemas/treks.py` -> public trek response contracts
- `services/api/app/modules/auth/models.py` -> users, auth identities, sessions
- `services/api/app/modules/auth/service.py` -> email + Google auth business logic; session creation; login_or_register_google_user
- `services/api/app/modules/auth/dependencies.py` -> current user/current session dependencies
- `services/api/app/modules/cms/models.py` -> CMSPage ORM model; blast radius: LOW (new table, no prior callers)
- `services/api/app/modules/cms/service.py` -> CMS CRUD helpers; _md_to_html (markdown→HTML at storage); _parse_sections_from_markdown (agent output → content_json.sections); _process_content_json (section markdown→HTML for manual saves); upsert_page_from_draft (publish bridge, now also populates content_json.sections); cache_invalidate/cache_invalidate_all (Redis DB 2, 5-min TTL); blast radius: MEDIUM (called by publish service + CMS create/update routes)
- `services/api/app/modules/content/models.py` -> topic, cluster, brief (+ structured_brief, word_count_target, versions rel), draft (+ optimized_content, claims rel, cms_page_id), publish_log (+ cms_page_id, published_url), BriefVersion, DraftClaim ORM models; blast radius: MEDIUM
- `services/api/app/modules/publish/service.py` -> VALID_TRANSITIONS state machine, update_draft_status, publish_to_cms (calls upsert_page_from_draft), get_publish_logs
- `services/api/app/schemas/publish.py` -> DraftStatusPatch, PublishLogResponse, DraftPublishResponse
- `services/api/app/modules/content/service.py` -> content-domain create/list service helpers; get_brief, update_brief_status (state machine), create_brief_version, list_brief_versions; get_draft, update_draft_optimized_content, create_draft_claim, list_draft_claims
- `services/api/app/modules/admin/service.py` -> admin dashboard and summary aggregations
- `services/api/app/modules/treks/data.py` -> additive mock/public trek source data
- `services/api/app/modules/treks/service.py` -> public trek list/detail filtering logic
- `services/api/app/modules/agents/trend_discovery/agent.py` -> TrendDiscoveryAgent; calls Claude, writes TopicOpportunity rows
- `services/api/app/modules/agents/trend_discovery/prompts.py` -> Claude prompt for SEO topic scoring
- `services/api/app/modules/agents/keyword_cluster/agent.py` -> KeywordClusterAgent; calls Claude, writes KeywordCluster rows
- `services/api/app/modules/agents/keyword_cluster/prompts.py` -> Claude prompt for semantic clustering
- `services/api/app/modules/agents/content_brief/agent.py` -> ContentBriefAgent; 3-node LangGraph (fetch_context → generate_brief → store_results); writes ContentBrief + BriefVersion
- `services/api/app/modules/agents/content_brief/prompts.py` -> Claude prompt for SEO+AEO structured brief generation
- `services/api/app/modules/agents/content_brief/schema.py` -> BriefStructure TypedDict (input contract for ContentWritingAgent in Step 15)
- `services/api/app/modules/agents/content_writing/agent.py` -> ContentWritingAgent; 3-node LangGraph (fetch_brief → write_draft → store_results); validates brief approved+structured; writes ContentDraft + DraftClaim records; sets requires_review if any claim confidence < 0.7; uses prompt caching
- `services/api/app/modules/agents/content_writing/prompts.py` -> Claude prompt for structured article draft with fact-check claims
- `services/api/app/modules/agents/seo_aeo/agent.py` -> SEOAEOAgent; 3-node LangGraph (fetch_draft → optimize → store_results); runs SEO/AEO pass; stores optimized_content on draft; uses prompt caching
- `services/api/app/modules/agents/seo_aeo/prompts.py` -> Claude prompt for SEO/AEO optimization with snippet_intro, faq_schema, internal_link_opportunities, schema_payload
- `services/api/app/worker/tasks/agent_tasks.py` -> discover_trends_task + cluster_keywords_task + generate_brief_task + write_draft_task + optimize_draft_task Celery tasks
- `services/api/app/api/routes/agent_triggers.py` -> POST /admin/agents/discover-trends + POST /admin/agents/cluster-keywords + POST /admin/agents/generate-brief + POST /admin/agents/write-draft + POST /admin/agents/optimize-draft
- `services/api/app/modules/agents/models.py` -> AgentRun ORM (id, agent_type, status, input/output_json, error, timestamps)
- `services/api/app/modules/agents/state.py` -> BaseAgentState TypedDict (shared across all agents)
- `services/api/app/modules/agents/base_agent.py` -> BaseAgent ABC; wraps LangGraph StateGraph; run() entry point
- `services/api/app/modules/agents/service.py` -> start_run, update_run, complete_run, fail_run, list_runs
- `services/api/app/schemas/agents.py` -> AgentRunResponse Pydantic schema
- `services/api/app/api/routes/agent_runs.py` -> GET /api/v1/admin/agent-runs with filters
- `services/api/app/worker/celery_app.py` -> Celery instance; broker/backend from settings; includes smoke task; beat_schedule stub
- `services/api/app/worker/tasks/base.py` -> BaseTask; max_retries=3, backoff=60s, on_failure/on_retry hooks
- `services/api/app/worker/tasks/smoke.py` -> smoke.ping task; end-to-end queue validation
- `services/api/app/api/routes/worker.py` -> GET /api/v1/worker/health; checks Redis broker connectivity
- `services/api/Dockerfile` -> minimal python:3.12-slim image for Docker-based worker/beat services
- `services/api/app/modules/rbac/associations.py` -> user_roles, role_permissions association tables
- `services/api/app/modules/rbac/models.py` -> roles, permissions
- `services/api/alembic/env.py` -> Alembic environment config
- `services/api/alembic/versions/20260421_0001_initial_auth_and_rbac.py` -> initial schema migration
- `services/api/alembic/versions/20260421_0002_add_password_hash_to_users.py` -> password auth migration
- `services/api/alembic/versions/20260421_0003_content_domain_foundation.py` -> content domain migration
- `services/api/alembic/versions/20260422_0004_publish_log.py` -> publish_logs table + published_at on content_drafts (wordpress_post_id since replaced by cms_page_id in 0008)
- `services/api/alembic/versions/20260422_0005_agent_runs.py` -> agent_runs table
- `services/api/alembic/versions/20260422_0006_brief_versions.py` -> structured_brief + word_count_target on content_briefs; new brief_versions table
- `services/api/alembic/versions/20260422_0007_draft_claims.py` -> optimized_content on content_drafts; new draft_claims table with draft_id FK, claim_text, claim_type, confidence_score, flagged_for_review
- `services/api/tests/test_health.py` -> API health smoke tests
- `services/api/tests/test_models.py` -> metadata table coverage test
- `services/api/tests/test_auth.py` -> auth route tests
- `services/api/tests/test_cms.py` -> Master CMS CRUD + cache invalidation + publish flow tests (18 tests)
- `services/api/tests/test_content_routes.py` -> content route tests
- `services/api/tests/test_admin.py` -> admin summary route tests
- `services/api/tests/test_brief_agent.py` -> ContentBriefAgent unit tests (mocked LLM), brief status state machine tests, BriefVersion tests, admin brief API endpoint tests (15 tests)
- `services/api/tests/test_content_writing_agent.py` -> ContentWritingAgent unit tests (mocked LLM), draft claims endpoint tests, write-draft trigger test (11 tests)
- `services/api/tests/test_seo_aeo_agent.py` -> SEOAEOAgent unit tests (mocked LLM), optimized_content storage test, optimize-draft trigger test (6 tests)
- `services/api/tests/test_treks.py` -> public trek route tests
- `services/api/tests/test_smoke.py` -> smoke tests for all 14 key API surfaces
- `services/api/tests/test_publish.py` -> publish workflow tests (status transitions, WP mock push, log retrieval)

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
- `docker-compose.wordpress.yml` was isolated local WordPress runtime — deleted in Step 16 (WordPress removed)
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

### Step 09 + Google OAuth executed blast radius
- `components/Providers.tsx` changed to add `AuthProvider` + `GoogleOAuthProvider` — affects all pages (low risk; all are client-boundary consumers)
- `components/layout/Header.tsx` changed to inject `useAuth` — auth-aware user menu added; mobile drawer extended
- `app/(auth)/auth/sign-in/page.tsx` + `sign-up/page.tsx` wired to real backend; `useGoogleLogin` hook added
- `lib/auth-api.ts` + `lib/auth-context.tsx` created — new shared auth layer; consumed by Header, sign-in, sign-up, UserGreeting
- `middleware.ts` created — pure Next.js edge middleware; no component deps
- `services/api/app/api/routes/auth.py` changed: `google_auth_placeholder` replaced, `login_or_register_google_user` service added
- `services/api/app/schemas/auth.py` changed: `GoogleAuthRequest.id_token` → `access_token` (test updated accordingly)
- No database migration — existing `auth_identities` table covers Google identity via `provider="google"`
- `next.config.mjs` created (replaces `next.config.ts`) + `transpilePackages: [@react-oauth/google]` added after cache fix

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

### Step 13 executed blast radius
- `app/modules/agents/base_agent.py` changed: return type annotation only — zero callers affected
- `app/modules/agents/trend_discovery/` created: new sub-package; depends on `anthropic`, `langgraph`, `content.service`, `schemas.content`
- `app/modules/agents/keyword_cluster/` created: new sub-package; depends on `anthropic`, `langgraph`, `content.models`, `content.service`, `schemas.content`
- `app/modules/agents/service.py` changed: `get_run` added — additive, no existing callers affected
- `app/worker/tasks/agent_tasks.py` created: new Celery tasks; depends on `db.session.SessionLocal`, `agents.service`, and both new agent modules
- `app/worker/celery_app.py` changed: `agent_tasks` added to `include` — additive
- `app/api/routes/agent_runs.py` changed: `GET /{run_id}` endpoint added — additive
- `app/api/routes/agent_triggers.py` created: 2 POST endpoints; depends on `agents.service`, `worker.tasks.agent_tasks`
- `app/api/router.py` changed: `agent_triggers_router` registered — additive
- `apps/web-next/app/(admin)/admin/topics/page.tsx` rewritten: client component with Discover Trends trigger button
- `apps/web-next/app/(admin)/admin/clusters/page.tsx` rewritten: client component with Cluster Topics trigger button
- No Alembic migration (existing `topic_opportunities` and `keyword_clusters` tables cover all required fields)
- `KeywordCluster.notes` JSON stores `competition_score` and `cannibalization_risk` — no schema change needed

### Step 12 executed blast radius
- `app/db/base.py` changed: `AgentRun` imported and added to `__all__` — additive; all existing model importers unaffected
- `app/api/router.py` changed: `agent_runs_router` registered additively
- `app/modules/agents/` created: new independent module; no existing code depends on it
- `app/api/routes/agent_runs.py` created: depends on `app.db.session.get_db`, `app.modules.agents.service`, `app.schemas.agents`
- `app/modules/agents/service.py` depends on `app.modules.agents.models`, `sqlalchemy.orm.Session`, stdlib `json`/`datetime`
- `app/modules/agents/base_agent.py` depends on `langgraph.graph.StateGraph`, `app.modules.agents.state`
- `app/core/config.py` changed: `anthropic_api_key` field added — additive
- `alembic/versions/20260422_0005_agent_runs.py` — `agent_runs` table; reversible via downgrade
- `pyproject.toml` changed: `anthropic`, `langchain-core`, `langchain-anthropic`, `langgraph` added
- No frontend changes in Step 12

### Step 11 executed blast radius
- `app/core/config.py` changed: `celery_broker_url` and `celery_result_backend` computed fields added — additive only; 12 existing importers of `Settings` unaffected
- `app/api/router.py` changed: `worker_router` registered additively — no existing routes touched
- `app/worker/` created: new module `celery_app.py`, `tasks/base.py`, `tasks/smoke.py` — no existing files depend on it; wired in future agent steps
- `app/api/routes/worker.py` created: depends on `app.core.config.settings` and `redis` library only
- `services/api/Dockerfile` created: new file; no existing code depends on it; used by docker-compose worker/beat services
- `docker-compose.yml` changed: `worker` and `beat` services added under `profiles: [worker]` — existing `postgres` and `redis` services unchanged
- `Makefile` changed: `worker` and `beat` targets added — additive only
- `services/api/.env.example` changed: Celery env var documentation added — additive
- No Alembic migration (no DB changes in Step 11)
- GitNexus re-indexed post-step (counts in step doc Notes)

### Step 10 executed blast radius
- `app/modules/content/models.py` changed: `PublishLog` model added; `ContentDraft` gained `published_at`, `publish_logs` relationship (wordpress_post_id/wordpress_url later replaced by cms_page_id/published_url in Step 16)
- `app/db/base.py` updated to import and register `PublishLog`; `CMSPage` added in Step 16
- `app/api/router.py` changed additively to include `publish_router`; `wordpress_router` replaced by `cms_router` in Step 16
- New module `app/modules/publish/` created — `service.py` only; depends on `content.models`, `cms.service` (Step 16), `schemas.publish`
- `alembic/versions/20260422_0004_publish_log.py` adds `publish_logs` table and two columns to `content_drafts` (reversible)
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` rewritten as client component — fetches `/api/v1/drafts`, `/api/v1/admin/drafts/{id}/status`, `/api/v1/admin/drafts/{id}/publish`; no shared layout changes
- GitNexus re-indexed: 2072 nodes, 3465 edges, 74 flows