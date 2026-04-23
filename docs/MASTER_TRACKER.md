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

## V0 Status — Complete
All V0 foundations are shipped. The stack is live locally with:
- FastAPI backend, PostgreSQL, Redis, Celery-ready infra
- Full Next.js 14 App Router frontend (85 pages)
- Auth (email + Google OAuth), session management, route guards
- WordPress REST integration (health, connectivity, create_post)
- Content domain (topics, clusters, briefs, drafts)
- Draft status machine + publish pipeline + publish logs
- Admin summary APIs, smoke tests, GitNexus indexed

## V1 Status — In Progress
**Current next step: Step 17 — Full publish orchestration pipeline**

| Step | Title | Status |
|------|-------|--------|
| 11 | Worker and task queue infrastructure | done |
| 12 | LangGraph agent framework + agent tracking | done |
| 13 | Trend Discovery Agent + Keyword Cluster Agent | done |
| 14 | Content Brief Agent + brief approval workflow | done |
| 15 | Content Writing Agent + SEO/AEO Optimization Agent | done |
| 15B | Admin CMS enhancements — real API wiring + pipeline view | done |
| 16 | WordPress CMS full integration | done |
| 17 | Full publish orchestration pipeline | pending |
| 18 | Public frontend content page templates | pending |
| 19 | SEO and schema infrastructure (frontend) | pending |
| 20 | Monetization frontend components | pending |
| 21 | RBAC enforcement | pending |
| 22 | Internal linking engine (basic) | pending |
| 23 | Content refresh engine (basic) | pending |
| 24 | Analytics ingestion + admin panel full wiring | pending |

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

### Step 16 — WordPress CMS Full Integration
Status: done
What is done:
- `infrastructure/wordpress/plugins/trekyatra-cpt/trekyatra-cpt.php` — WP plugin registering 8 CPTs (trek_guide, packing_list, comparison, permit_guide, seasonal_page, beginner_roundup, gear_review, destination) with `show_in_rest=true`; registers 10 meta fields (content_type, cluster_id, brief_id, etc.) on all CPTs + standard posts via REST API
- `services/api/app/modules/wordpress/cache.py` — Redis cache module (DB 2, 5-min TTL); `cache_get/set/delete`, `wp_post_key(slug)`, `wp_posts_key(post_type, page)`; all Redis errors swallowed silently
- `services/api/app/modules/wordpress/client.py` — refactored `_request` → `_execute(method, path, use_auth, body)`; backward-compatible `_request()` and `_request_write()` wrappers; `create_post()` extended with `post_type`, `meta`, `category_ids`, `tag_ids` params; added `update_post(post_id, **fields)`, `list_posts(post_type, status, per_page, page)`, `get_post(int|str)`, `upload_media()` placeholder, `ensure_category(name)`, `ensure_tag(name)`; `WordPressClientResult` extended with `total` and `total_pages` from WP response headers
- `services/api/app/schemas/wordpress.py` — extended with `WPPostResponse`, `WPPostsListResponse`, `WPCategoryRequest/Response`, `WPTagRequest/Response`
- `services/api/app/modules/wordpress/service.py` — new helpers: `_normalize_wp_post()` (flattens WP rendered fields), `list_wp_posts()` (cache-first), `get_wp_post()` (cache-first, slug → list query), `ensure_wp_category()`, `ensure_wp_tag()`, `invalidate_post_cache()`
- `services/api/app/api/routes/wordpress.py` — new routes: `GET /api/v1/wordpress/posts`, `GET /api/v1/wordpress/posts/{slug}`, `POST /api/v1/wordpress/categories`, `POST /api/v1/wordpress/tags`; WP down → 503 (never crashes frontend)
- `services/api/tests/test_wordpress_full.py` — 18 tests covering: normalize, list (cache hit/miss/error), get (cache hit/miss/not-found/error), ensure_category (found/error), ensure_tag, API 503 on WP down, API 200 with mocked data for all 4 new routes
- `apps/web-next/lib/api.ts` — `WPPost` interface, `WPPostsResponse` interface, `fetchWPPost(slug)`, `fetchWPPosts(filters)` exported
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — imports `fetchWPPost`; tries WP at server-render time, falls back silently; renders `wpPost.content` via `dangerouslySetInnerHTML` before static blocks if available
- 119/119 backend tests pass; `next build` clean (zero errors)

### Step 15B — Admin CMS Enhancements (real API wiring + pipeline view)
Status: done
What is done:
- `components/admin/CopyableId.tsx` — click-to-copy UUID component; `Copy` icon on hover, `Check` icon on copied (2s reset); shows truncated UUID with optional label prefix
- `components/admin/AgentRunsPanel.tsx` — live last-5 agent-run panel; polls every 5s while any run has status="running"; auto-stops when all complete; remounts per dispatch via `key={runKey}`; shows status badge + duration; non-intrusive (returns null on empty)
- `admin/topics/page.tsx` — fully rewritten; loads real topics from `GET /api/v1/topics`; trend_score and urgency_score progress bars; status badges; CopyableId per topic; "Generate brief →" nav link with `?topic_id=&kw=` query params; AgentRunsPanel for trend_discovery agent
- `admin/clusters/page.tsx` — fully rewritten; loads real clusters from `GET /api/v1/clusters`; intent badges (informational/commercial/transactional); supporting keywords expandable (first 6 shown, +N more toggle); AgentRunsPanel for keyword_cluster agent
- `admin/briefs/page.tsx` — structured brief content viewer expanded (heading tree H1/H2/H3 indented, FAQs list, key_entities + secondary_keywords tag pills); CopyableId for brief/topic/cluster UUIDs; "Write draft →" cross-nav link on approved briefs; AgentRunsPanel for content_brief agent
- `admin/drafts/page.tsx` — requires_review and review status badges added; per-card agentFeedback state shows dispatch confirmation after optimize; await-outside-setState bug fixed
- `admin/pipeline/page.tsx` — new page; parallel fetches all 4 entities; client-side join (topicMap, clusterMap, draftByBrief); stage summary pills (In Progress→In Review→Approved→Draft Stage→Published); full pipeline table with brief/topic/cluster/draft status + confidence %, all UUIDs via CopyableId, nav links to /admin/briefs and /admin/drafts
- `admin/layout.tsx` — Pipeline View nav item added (GitMerge icon, href /admin/pipeline)
- GitNexus re-indexed: 3,268 nodes | 5,350 edges | 81 clusters | 101 flows (commit aab2d3e)

### Step 15 — Content Writing Agent + SEO/AEO Optimization Agent
Status: done
What is done:
- Alembic migration `20260422_0007_draft_claims.py` — adds `optimized_content` (Text nullable) to `content_drafts`; creates `draft_claims` table (id UUID PK, draft_id FK→content_drafts CASCADE, claim_text, claim_type, confidence_score, flagged_for_review, created_at) with indexes on draft_id and flagged_for_review
- `app/modules/content/models.py` — `ContentDraft` extended with `optimized_content` and `claims` relationship; new `DraftClaim` ORM model added
- `app/db/base.py` — `DraftClaim` registered in metadata
- `app/schemas/content.py` — `ContentDraftCreate`/`ContentDraftResponse` extended with `optimized_content`; `DraftClaimCreate` and `DraftClaimResponse` added
- `app/modules/content/service.py` — `get_draft`, `update_draft_optimized_content`, `create_draft_claim`, `list_draft_claims` added; `create_draft` updated for `optimized_content`
- `app/modules/agents/content_writing/__init__.py` + `agent.py` + `prompts.py` — `ContentWritingAgent`: 3-node LangGraph (fetch_brief → write_draft → store_results); validates brief is approved + has structured_brief; calls Claude claude-sonnet-4-6 with prompt caching; stores draft + all DraftClaim records; sets status `requires_review` if any claim confidence < 0.7
- `app/modules/agents/seo_aeo/__init__.py` + `agent.py` + `prompts.py` — `SEOAEOAgent`: 3-node LangGraph (fetch_draft → optimize → store_results); runs SEO/AEO pass; stores `optimized_content` on draft; returns changes_count + faq_count
- `app/worker/tasks/agent_tasks.py` — `write_draft_task` + `optimize_draft_task` Celery tasks added
- `app/api/routes/agent_triggers.py` — `POST /api/v1/admin/agents/write-draft` + `POST /api/v1/admin/agents/optimize-draft` added
- `app/api/routes/content.py` — `GET /api/v1/admin/drafts/{id}/claims` added; `_draft_to_response` helper added; `get_drafts`/`post_draft` refactored to use it
- `tests/test_content_writing_agent.py` — 11 tests: missing brief_id, invalid format, not found, unapproved brief, no structured_brief, mocked-LLM creates draft+claims, no-flagged sets status=draft, claims empty, claims returns data, invalid ID, trigger dispatch
- `tests/test_seo_aeo_agent.py` — 6 tests: missing draft_id, invalid format, not found, mocked-LLM optimizes + stores optimized_content, content unchanged, trigger dispatch
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — fully rewritten: expandable content preview (optimized if available), flagged claims panel with confidence % and claim type badges, Optimize button, Write Draft trigger form, `requires_review` status badge
- 101/101 backend tests pass; `next build` clean (zero errors)
What remains:
- Real LLM calls require ANTHROPIC_API_KEY in services/api/.env
- Draft status machine: `requires_review` → `review` transition manually wired via Submit for Review button

### Step 14 — Content Brief Agent + Brief Approval Workflow
Status: done
What is done:
- Alembic migration `20260422_0006_brief_versions.py` — adds `structured_brief` (JSON) and `word_count_target` (int) to `content_briefs`; creates `brief_versions` table (id UUID PK, brief_id FK→content_briefs CASCADE, version_number, structured_brief, created_at)
- `app/modules/content/models.py` — `ContentBrief` extended with `structured_brief`, `word_count_target`, `versions` relationship; new `BriefVersion` ORM model
- `app/db/base.py` — `BriefVersion` registered in metadata
- `app/schemas/content.py` — `ContentBriefCreate`/`ContentBriefResponse` extended; `BriefStatusPatch`, `BriefVersionResponse`, `BRIEF_STATUS_TRANSITIONS` state machine added
- `app/modules/content/service.py` — `get_brief`, `update_brief_status` (state machine: draft→review→approved/rejected→scheduled), `create_brief_version`, `list_brief_versions`, `list_briefs` (status filter) added
- `app/modules/agents/content_brief/__init__.py` — package init
- `app/modules/agents/content_brief/schema.py` — `BriefStructure` TypedDict (all brief fields)
- `app/modules/agents/content_brief/prompts.py` — Claude prompt for SEO+AEO execution-grade brief generation
- `app/modules/agents/content_brief/agent.py` — `ContentBriefAgent`: 3-node LangGraph (fetch_context → generate_brief → store_results); fetches topic + cluster context, calls Claude, stores brief + version 1
- `app/worker/tasks/agent_tasks.py` — `generate_brief_task` Celery task added (`agents.generate_brief`)
- `app/api/routes/agent_triggers.py` — `POST /api/v1/admin/agents/generate-brief` added
- `app/api/routes/content.py` — `GET /api/v1/admin/briefs/{id}`, `PATCH /api/v1/admin/briefs/{id}/status`, `GET /api/v1/admin/briefs/{id}/versions` added; `get_briefs` supports `?status_filter=`
- `app/api/router.py` — `admin_router` moved before `content_router` to prevent route shadowing
- `tests/test_brief_agent.py` — 15 tests: agent no-topic, invalid-topic, mocked-LLM creates brief+version, state machine valid/invalid/not-found, version increment, API detail/404, PATCH valid/invalid, versions empty/filled, trigger missing IDs, trigger dispatch
- `apps/web-next/app/(admin)/admin/briefs/page.tsx` — fully wired to real API: loads briefs, approve/reject via PATCH, generate-brief trigger with topic UUID + keyword inputs
- 84/84 backend tests pass; `next build` clean (zero errors)
What remains:
- Real LLM calls require ANTHROPIC_API_KEY in services/api/.env
- Brief detail expanded view (structured_brief JSON viewer) deferred to a later step

### Step 13 — Trend Discovery Agent + Keyword Cluster Agent
Status: done
What is done:
- `app/modules/agents/base_agent.py` — `_build_graph` return type fixed to `Any` (compiled graph)
- `app/modules/agents/trend_discovery/prompts.py` — Claude prompt for SEO topic scoring
- `app/modules/agents/trend_discovery/agent.py` — `TrendDiscoveryAgent`: 2-node LangGraph (score_topics → store_results); calls Claude, writes `TopicOpportunity` rows
- `app/modules/agents/keyword_cluster/prompts.py` — Claude prompt for semantic topic clustering
- `app/modules/agents/keyword_cluster/agent.py` — `KeywordClusterAgent`: 3-node LangGraph (fetch_topics → cluster_topics → store_results); writes `KeywordCluster` rows with `competition_score` and `cannibalization_risk` in `notes`
- `app/modules/agents/service.py` — `get_run` added
- `app/worker/tasks/agent_tasks.py` — `discover_trends_task` and `cluster_keywords_task` Celery tasks; use `SessionLocal` directly; call agent, then `complete_run`/`fail_run`
- `app/worker/celery_app.py` — `agent_tasks` added to `include` list
- `app/api/routes/agent_runs.py` — `GET /api/v1/admin/agent-runs/{id}` endpoint added
- `app/api/routes/agent_triggers.py` — `POST /api/v1/admin/agents/discover-trends` and `POST /api/v1/admin/agents/cluster-keywords`; both dispatch Celery tasks and return `agent_run_id`
- `app/api/router.py` — `agent_triggers_router` registered
- `apps/web-next/app/(admin)/admin/topics/page.tsx` — "Discover trends" button wired; shows run ID + poll link
- `apps/web-next/app/(admin)/admin/clusters/page.tsx` — "Cluster topics" button wired; accepts topic UUID input
- `tests/test_agent_triggers.py` — 8 tests (trigger dispatch, run_id returned, GET by ID, 404, mocked LLM unit test, empty input error)
- No new DB migration (TopicOpportunity and KeywordCluster models already have all required fields)
- 69/69 backend tests pass; `next build` clean
What remains:
- Real LLM calls require ANTHROPIC_API_KEY in services/api/.env
- Admin topics/clusters pages still show static seed data; live data wiring deferred to Step 18

### Step 12 — LangGraph agent framework + agent tracking
Status: done
What is done:
- `pyproject.toml` — `anthropic`, `langchain-core`, `langchain-anthropic`, `langgraph` added and installed
- `app/core/config.py` — `anthropic_api_key` setting added
- `app/modules/agents/models.py` — `AgentRun` ORM model (id, agent_type, status, input_json, output_json, error, started_at, completed_at, created_at, updated_at)
- `app/modules/agents/state.py` — `BaseAgentState` TypedDict (run_id, agent_type, input, output, errors, metadata)
- `app/modules/agents/base_agent.py` — `BaseAgent` ABC wrapping LangGraph `StateGraph`; subclasses define `_build_graph()` and call `run()`
- `app/modules/agents/service.py` — `start_run`, `update_run`, `complete_run`, `fail_run`, `list_runs`
- `app/schemas/agents.py` — `AgentRunResponse` Pydantic schema
- `app/api/routes/agent_runs.py` — `GET /api/v1/admin/agent-runs` with agent_type, status, limit, offset filters
- `app/api/router.py` — `agent_runs_router` registered
- `app/db/base.py` — `AgentRun` imported and registered in metadata
- `alembic/versions/20260422_0005_agent_runs.py` — `agent_runs` table with status/agent_type indexes; migration applied
- `tests/test_agent_runs.py` — 7 tests (list empty, filter by type, filter by status, CRUD lifecycle, fail lifecycle, nonexistent run, API list after create)
- 61/61 backend tests pass; `next build` not needed (no frontend changes)
What remains:
- Actual LLM calls wired through agents (Steps 13–15)
- ANTHROPIC_API_KEY must be set in `.env` before agents make real LLM calls

### Step 11 — Worker and task queue infrastructure
Status: done
What is done:
- `app/core/config.py` — `celery_broker_url` and `celery_result_backend` computed fields added (Redis DB 1)
- `app/worker/celery_app.py` — Celery instance with broker/backend from settings; task serializer, UTC, acks_late, prefetch=1 configured; empty beat_schedule stub
- `app/worker/tasks/base.py` — `BaseTask` with `max_retries=3`, `default_retry_delay=60s`, `on_failure` and `on_retry` hooks
- `app/worker/tasks/smoke.py` — `smoke.ping` task using `BaseTask`; validates end-to-end queue flow
- `app/api/routes/worker.py` — `GET /api/v1/worker/health`; checks Redis broker connectivity, returns broker status and URL
- `app/api/router.py` — `worker_router` registered additively
- `docker-compose.yml` — `worker` and `beat` services added under `profiles: [worker]`; arm64-safe `python:3.12-slim` base via Dockerfile
- `services/api/Dockerfile` — minimal Python image for Docker-based worker/beat runs
- `Makefile` — `make worker` and `make beat` targets for local host-based worker runs
- `services/api/.env.example` — Celery broker/backend documented (derived automatically, override comment provided)
- `tests/test_worker.py` — 4 new tests: 200 status, response shape, broker connected, broker URL uses DB 1
- 54/54 backend tests pass; no Alembic migration (infra-only step)
What remains:
- `agent_runs` table and LangGraph wiring (Step 12)
- Dead-letter `failed` flag on `agent_runs` referenced in base.py on_failure (wired in Step 12)

### Step 10 — Publish, tracking, and validation workflows
Status: done
What is done:
- `PublishLog` ORM model added to `content_drafts` cascade (tracks every push attempt)
- `published_at` and `wordpress_post_id` columns added to `content_drafts` via migration `20260422_0004`
- `WordPressClient.create_post()` method added
- `schemas/publish.py` — `DraftStatusPatch`, `PublishLogResponse`, `DraftPublishResponse`
- `modules/publish/service.py` — `VALID_TRANSITIONS` dict, `update_draft_status`, `push_draft_to_wordpress`, `get_publish_logs`
- `api/routes/publish.py` — `PATCH /admin/drafts/{id}/status`, `POST /admin/drafts/{id}/publish`, `GET /admin/drafts/{id}/publish-log`
- `publish_router` registered in `api/router.py`
- `test_smoke.py` — smoke tests for all key API surfaces (14 tests)
- `test_publish.py` — full publish workflow tests (9 tests, including mocked WP push)
- Admin drafts page rewritten as real API client with status badges and action buttons
- 50/50 backend tests pass; `next build` clean; GitNexus re-indexed (2072 nodes, 74 flows)
What remains:
- Role-aware admin access enforcement (future step)
- OTP mobile auth (future step)

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