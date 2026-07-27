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
- `app/(admin)/admin/pipeline/page.tsx` -> orchestration monitor; TriggerForm (start stage + inputs), RunCard (StageTrack, output chips, resume/cancel buttons, approval gate notice), KPI strip, auto-refresh while runs active; reads from GET /admin/pipeline/runs
- `data/treks.ts` -> static fallback trek dataset (12 treks, string image paths)
- `components/admin/CMSPageForm.tsx` -> shared CMS create/edit form; hero_image_url input + preview, trek_facts strip (6 fields), 10 section textareas, SEO meta, page type/status selectors; blast radius: LOW (used only by /admin/cms/new and /admin/cms/[slug]/edit)
- `app/(admin)/admin/cms/page.tsx` -> Master CMS index: KPI cards, pages table, New page button, edit/cache/view/delete per row
- `app/(admin)/admin/cms/new/page.tsx` -> CMS manual page creation (server shell + CMSPageForm)
- `app/(admin)/admin/cms/[slug]/edit/page.tsx` -> CMS page editor; server-fetches existing page; CMSPageForm pre-populated; Save + Publish + cache clear
- `lib/api.ts` -> universal fetch; CMSPage (+ hero_image_url, content_json.trek_facts) + TrekContentSections + TrekFacts interfaces; fetchCMSPage/fetchCMSPages/createCMSPage/updateCMSPage helpers
- `lib/trekApi.ts` -> trek API adapter with mergeImage() and safe static fallback
- `lib/auth-api.ts` -> typed client-only fetch helpers for all 5 auth endpoints (me/login/signup/logout/google)
- `lib/auth-context.tsx` -> React AuthContext; bootstraps from GET /me; exposes user, isLoading, login(), signup(), loginWithGoogle(), logout(), refresh()
- `lib/admin-auth-api.ts` -> CMS admin auth helpers: adminLogin (POST /admin/auth/login), adminLogout, getAdminMe; uses trekyatra_admin_token cookie
- `app/(admin-auth)/admin/sign-in/page.tsx` -> Standalone admin sign-in page at /admin/sign-in; no sidebar; calls adminLogin(); redirects to /admin on success
- `middleware.ts` -> Next.js route guard; /admin/* checks trekyatra_admin_token (redirects to /admin/sign-in); /account/* checks trekyatra_access_token; /admin/sign-in exempt from admin auth check
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
- `services/api/app/schemas/cms.py` -> CMSPageCreate, CMSPagePatch, CMSPageResponse (all include hero_image_url), CMSCacheInvalidateRequest/Response
- `services/api/app/schemas/content.py` -> content-domain request/response contracts
- `services/api/app/schemas/admin.py` -> admin summary response contracts
- `services/api/app/schemas/treks.py` -> public trek response contracts
- `services/api/app/modules/auth/models.py` -> users, auth identities, sessions
- `services/api/app/modules/auth/service.py` -> email + Google auth business logic; session creation; login_or_register_google_user
- `services/api/app/modules/auth/dependencies.py` -> current user/current session dependencies; get_current_admin (validates trekyatra_admin_token, returns JWT payload dict); RequireRole class (retained but no longer applied to routes); blast radius: MEDIUM (10 route files import from here)
- `services/api/app/api/routes/admin_auth.py` -> CMS admin auth: POST /admin/auth/login (issues trekyatra_admin_token cookie), POST /admin/auth/logout, GET /admin/auth/me; credential-based, no DB; blast radius: LOW
- `services/api/app/modules/cms/models.py` -> CMSPage ORM model + hero_image_url (String 512, nullable) + language/translations/source_page_id (Step 37, additive); blast radius: HIGH structurally (38 importers) but additive-only — no existing callers break
- `services/api/app/schemas/cms.py` -> CMSPageCreate/Patch/Response: language, translations, source_page_id added (Step 37, backward-compatible with defaults); blast radius: MEDIUM (all CMS API consumers)
- `services/api/app/data/glossary_hi.json` -> proper nouns preserved during translation; blast radius: LOW (only read by TranslationAgent)
- `services/api/app/modules/operators/models.py` -> Operator: logo_url, description_long, rating_avg, review_count added (additive, Step 38); OperatorReview + OperatorAgreement models added; blast radius: MEDIUM (additive — no existing callers break)
- `services/api/app/modules/operators/review_service.py` -> list_reviews, create_review, delete_review, _update_rating_avg; blast radius: LOW (only called by operators_public + operators admin routes)
- `services/api/app/modules/operators/agreement_service.py` -> get_agreement, upsert_agreement, patch_agreement; blast radius: LOW (only called by operators admin routes)
- `services/api/app/schemas/operators.py` -> OperatorPublicResponse, OperatorReviewCreate/Response, OperatorAgreementCreate/Patch/Response, InquiryCreate/Response added; OperatorCreate/Patch/Response extended (Step 38, additive); blast radius: LOW (new schemas are additive)
- `services/api/app/api/routes/operators_public.py` -> GET /operators, GET /operators/{slug}, GET/POST /operators/{slug}/reviews, POST /inquiries; blast radius: LOW (new public routes)
- `apps/web-next/components/operators/` -> OperatorCard, OperatorGrid, OperatorReviewList, OperatorInquiryForm; blast radius: LOW (leaf components, imported only by /operators pages)
- `apps/web-next/app/(public)/operators/page.tsx` -> public operator listing; blast radius: LOW (new page)
- `apps/web-next/app/(public)/operators/[slug]/page.tsx` -> public operator detail + inquiry form; blast radius: LOW (new page)
- `services/api/app/modules/plan/models.py` -> TripPlan ORM (trip_plans table); blast radius: LOW (new table, no prior callers)
- `services/api/app/modules/agents/trip_planner/agent.py` -> TripPlannerAgent 4-node LangGraph: gather_constraints, select_treks, build_itinerary, package_response; blast radius: LOW (called only by plan service)
- `services/api/app/modules/plan/service.py` -> generate_plan, get_plan, email_plan; blast radius: LOW (called only by plan routes)
- `services/api/app/api/routes/plan.py` -> POST /plan/generate, GET /plan/{id}, POST /plan/{id}/email; blast radius: LOW (new endpoints)
- `apps/web-next/components/plan/` -> WizardStep, TrekPlanCard, ItineraryDay; blast radius: LOW (used only by /plan page)
- `services/api/app/modules/subscriptions/models.py` -> Subscription ORM (subscriptions table); blast radius: LOW (new table)
- `services/api/app/modules/subscriptions/service.py` -> create_checkout_session (Stripe or test-mode), handle_webhook, cancel_subscription, get_subscription_status; blast radius: LOW (called only by subscriptions routes)
- `services/api/app/api/routes/subscriptions.py` -> POST /subscriptions/create-checkout, GET /subscriptions/status, POST /subscriptions/cancel, POST /subscriptions/webhook; blast radius: LOW (new endpoints)
- `services/api/app/api/routes/cms.py` -> GET /cms/pages/{slug} now includes get_optional_user + is_premium gating (content_html="" + is_gated=True for free users on premium pages); blast radius: MEDIUM (public CMS endpoint, additive optional auth)
- `services/api/app/modules/auth/models.py` -> User.subscription_plan String(20) default='free' added (additive); blast radius: HIGH structurally but no existing callers break
- `services/api/app/modules/cms/models.py` -> CMSPage.is_premium bool default=False added (additive); blast radius: HIGH structurally but no existing callers break
- `apps/web-next/components/subscription/` -> PremiumBadge, GatedContent, SubscriptionStatusCard, PricingTable; blast radius: LOW (new components)
- `apps/web-next/app/(public)/premium/page.tsx` -> public pricing/marketing page; blast radius: LOW (new page)
- `apps/web-next/app/(public)/account/premium/page.tsx` -> auth-gated subscription dashboard; blast radius: LOW (new page)
- `apps/web-next/app/(public)/plan/page.tsx` -> full rewrite: 4-step wizard + TrekPlanCard result; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/about/page.tsx` -> Step 42: CMS-first (slug "about") with static ContentPage fallback; blast radius: LOW
- `apps/web-next/app/(public)/privacy/page.tsx` -> Step 42: CMS-first (slug "privacy"); blast radius: LOW [note: DEPENDENCY_MAP previously said "privacy-policy" — corrected; page always used "privacy"; _SITE_INFO_MAP had the wrong slug, fixed in TrekSage hotfix 9]
- `apps/web-next/app/(public)/terms/page.tsx` -> Step 42: CMS-first (slug "terms"); blast radius: LOW [note: previously said "terms-of-service" — corrected; same mismatch pattern, fixed in TrekSage hotfix 9]
- `apps/web-next/app/(public)/contact/page.tsx` -> Step 42: CMS-first (slug "contact"); blast radius: LOW
- `apps/web-next/app/(public)/affiliate-disclosure/page.tsx` -> Step 42: CMS-first (slug "affiliate-disclosure"); blast radius: LOW
- `apps/web-next/app/(public)/methodology/page.tsx` -> Step 42: CMS-first (slug "editorial-methodology"); blast radius: LOW
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` -> Step 43: dynamicParams=true, revalidate=60; CMS wins over static data; blast radius: LOW
- `apps/web-next/app/sitemap.ts` -> Step 43: dynamic="force-dynamic", revalidate=0; always fetches live published CMS pages; blast radius: LOW
- `apps/web-next/app/(public)/page.tsx` -> PSI #1 (TTFB): removed `force-dynamic`; 7 catalog fetches wrapped in `unstable_cache(…, {revalidate:300, tags:["cms:all"]})` + `export const revalidate = 300` → route is now `○` Static/ISR (`Cache-Control: s-maxage=300, stale-while-revalidate`, edge-cacheable) instead of `no-store`. Personalisation stays client-side (`makeDynamic ssr:false`). Invalidated by the Master CMS cache-clear's existing `revalidateTag("cms:all")`. blast radius: MEDIUM (home; verified prod-mode: HIT, ~5ms, 0 static→dynamic errors). Depends on: `next/cache`, all 7 `lib/api.ts` fetchers.
- `apps/web-next/components/trek/TrekCard.tsx` -> PSI #2 (image weight): card `<img>` → Next `<Image fill sizes="(max-width:640px)100vw,(max-width:1024px)50vw,33vw">` → auto WebP/AVIF + resize + srcset via `/_next/image`. blast radius: MEDIUM (rendered on home, /explore, /saved, /trek/[slug], /regions/[slug], /beginner|moderate|challenging, treksage). Needs `next.config.mjs` remotePatterns (Spaces host already allowed). Note: prod lacks `sharp` → JS optimizer fallback (client payload fixed regardless).
- `services/api/app/api/routes/media.py` -> PSI #3: `_upload_to_spaces` now sends `CacheControl: public, max-age=31536000, immutable` on `put_object` (uuid4 keys are content-unique). blast radius: LOW (single upload endpoint; only affects NEW uploads' response metadata). Pattern mirrors `modules/reports/service.py:76`. Test: `tests/test_media_cache_control.py`.
- `services/api/scripts/backfill_spaces_cache_control.py` -> PSI #3 one-off: rewrites `CacheControl` on EXISTING Spaces objects via `copy_object(MetadataDirective=REPLACE)`. Idempotent; `--dry-run`, `--prefix`. Run from DO api Console: `cd services/api && python scripts/backfill_spaces_cache_control.py`. blast radius: LOW (metadata-only; preserves ContentType, re-applies public-read ACL).
- `apps/web-next/components/auth/GoogleAuthButton.tsx` -> PSI #5 (defer GSI): self-contained Google button that mounts `GoogleOAuthProvider` (which injects `accounts.google.com/gsi/client` ~95KB) only when rendered. Consumers: `app/(auth)/auth/sign-in/page.tsx`, `app/(auth)/auth/sign-up/page.tsx`, `components/plan/AuthGateModal.tsx`. Returns `null` when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` unset. blast radius: MEDIUM (auth flows on sign-in/sign-up/plan/compare).
- `apps/web-next/components/Providers.tsx` -> PSI #5: removed the app-wide `GoogleOAuthProvider` (was loading GSI on every page). blast radius: MEDIUM — VERIFIED via `.next/app-build-manifest.json` that home + root layout no longer load the GSI chunk. Every Google-login consumer must now wrap itself via `GoogleAuthButton` (or a local `GoogleOAuthProvider`), else `useGoogleLogin` throws.
- `apps/web-next/lib/date.ts` -> PSI #4: `formatDate(input, "short"|"long")` — TZ/ICU-deterministic (UTC getters + fixed month names) to prevent hydration text mismatch from `toLocaleDateString`. Applied in home `page.tsx`, `trek/[slug]/page.tsx`, `news/page.tsx`, `news/[slug]/page.tsx`. blast radius: LOW (pure util; identical output to prior UTC-server behaviour, just ICU-independent).
- `apps/web-next/components/layout/Footer.tsx` -> PSI #4 latent bug: copyright year `{new Date().getFullYear()}` (client component via `components/layout/SiteLayout.tsx` → all public pages) now on a `<span suppressHydrationWarning>` — prevents a New-Year static-vs-client #425. blast radius: LOW (one attribute; no visual/logic change; `suppressHydrationWarning` is not emitted to HTML).
- `apps/web-next/next.config.mjs` -> `productionBrowserSourceMaps` was enabled temporarily (`69f602f`) then **REVERTED** (`n`) — the live hydration-error frames are pure React reconciler internals (no app frame), so source maps could not name the component. #4 closed as benign (see MASTER_TRACKER PSI #4). blast radius: build-only.
- PSI minor quick-wins (2026-07-27): `app/(public)/page.tsx` (4 non-card `<img>` → `<Image fill>`), `app/layout.tsx` (removed unused unsplash preconnect), `components/brand/Logo.tsx` (`<img>` → `<Image>`; rendered on every page via `SiteLayout` header/footer — blast radius MEDIUM but same verified img→Image pattern), `components/home/HomeSearchBar.tsx` (`<select>` aria-labels). All LOW-risk; VERIFIED build clean + home ISR intact. Deliberately skipped: browserslist (drops older-device support), `401 /auth/me` (browser network log, JS already handles), render-blocking CSS (framework-level). **NOTE:** routing the logo through the optimizer on every page + no `sharp` starved the web dyno → prod incident; fixed by adding `sharp` (`12c6ee0`). `sharp` is REQUIRED whenever `next/image` is used at scale.
- `apps/web-next/next.config.mjs` -> `images.minimumCacheTTL: 31536000` (2026-07-27) — sets the Cache-Control TTL on optimized **local** `/public` images (hero, logo, region art) to 1 year; without it they defaulted to 60s → Cloudflare MISS/REVALIDATE per load → slow mobile LCP + origin optimizer load. Spaces images already inherit `immutable`. blast radius: build-config, header-only, all `/_next/image` local responses site-wide; `gitnexus detect-changes` → 0 affected processes, LOW. Caveat: replacing a `/public` image needs a CF purge or filename bump.
- `apps/web-next/components/util/ClientOnly.tsx` -> PSI #4 polish: renders children only after client mount (`useState(false)`+`useEffect`) so on the server + first client render it emits nothing → nothing to hydrate. `app/(public)/page.tsx` wraps the two `ssr:false` sections (`RecentlyViewedSection`, `PersonalisedFeed`) in it, moving their `next/dynamic` Suspense boundary out of the hydration path → clears the benign prod-only #418/#423/#425. blast radius: LOW (leaf util, home only; adds NO image/optimizer load — sections were already client-only). `explore/page.tsx` imports `PersonalisedFeed` directly (client page) and is unaffected. NOTE: warnings only reproduce in the live prod build, so the clear is confirmable only post-deploy.
- `services/api/app/modules/agents/content_writing/prompts.py` -> CONTENT_WRITING_SYSTEM updated: current year 2026 injected; blast radius: LOW (only called by ContentWritingAgent)
- `apps/web-next/components/admin/CMSPageForm.tsx` -> PAGE_TYPES: added "editorial" (Editorial / Static Page) type; blast radius: LOW (only used by /admin/cms/new and /admin/cms/[slug]/edit)
- `apps/web-next/app/sitemap.ts` -> editorial page_type mapped to /{slug}; 12 static pages added; /treks/ → /trek/ fix; blast radius: LOW
- `services/api/scripts/seed_static_cms_pages.py` -> one-shot script: creates 6 editorial CMS pages; run from DO Console (fixed: db.commit() added, verified working)
- `apps/web-next/app/(admin)/admin/cms/page.tsx` -> getLiveUrl() helper: page_type→URL mapping; PROTECTED_PAGE_TYPES: editorial pages undeletable; deletePage() requires confirm(); blast radius: LOW (admin-only page)
- `apps/web-next/app/(admin)/admin/cms/[slug]/edit/page.tsx` -> converted to 'use client' to bypass Cloudflare enhanced_threat_control challenge on server-to-server fetches; getLiveUrl() used; blast radius: LOW (admin-only page)
- `apps/web-next/app/(public)/about/page.tsx` -> generateMetadata + JSON-LD AboutPage schema; blast radius: LOW
- `apps/web-next/app/(public)/privacy/page.tsx` -> generateMetadata + JSON-LD WebPage schema, robots nofollow; blast radius: LOW
- `apps/web-next/app/(public)/terms/page.tsx` -> generateMetadata + JSON-LD WebPage schema, robots nofollow; blast radius: LOW
- `apps/web-next/app/(public)/contact/page.tsx` -> generateMetadata + JSON-LD ContactPage schema; blast radius: LOW
- `apps/web-next/app/(public)/affiliate-disclosure/page.tsx` -> generateMetadata + JSON-LD WebPage schema; blast radius: LOW
- `apps/web-next/app/(public)/methodology/page.tsx` -> generateMetadata + JSON-LD WebPage schema; blast radius: LOW; CMS slug corrected to 'methodology' (was 'editorial-methodology')
- `apps/web-next/app/(public)/gear/page.tsx` -> breadcrumb + JSON-LD added; blast radius: LOW
- `apps/web-next/app/(public)/costs/page.tsx` -> breadcrumb + JSON-LD added; blast radius: LOW
- `apps/web-next/app/(public)/itineraries/page.tsx` -> breadcrumb + JSON-LD added; blast radius: LOW
- `apps/web-next/app/(public)/beginner/page.tsx` -> generateMetadata + breadcrumb + JSON-LD added; blast radius: LOW
- `apps/web-next/app/(public)/explore/page.tsx` -> breadcrumb (client) added; blast radius: LOW
- `apps/web-next/components/home/DifficultyTabsSection.tsx` -> new client component: Easy/Moderate/Challenging tabs; blast radius: LOW
- `apps/web-next/app/(public)/moderate/page.tsx` -> new page: generateMetadata + trek cards + FAQPage schema + BreadcrumbList; blast radius: LOW (new route)
- `apps/web-next/app/(public)/challenging/page.tsx` -> new page: generateMetadata + trek cards + FAQPage schema + BreadcrumbList; blast radius: LOW (new route)
- `apps/web-next/components/plan/TrekPlanCard.tsx` -> trek hero image, match tags, visual gear pills, share button, improved operator CTA; blast radius: LOW (only plan page uses it)
- `apps/web-next/app/(public)/plan/page.tsx` -> selection summary strip, emoji experience cards; blast radius: LOW
- `apps/web-next/lib/behavior-tracker.ts` -> NEW: localStorage behavior tracking; recordTrekView, getBehaviorProfile, hasBehaviorData; no backend calls
- `apps/web-next/components/trek/TrekViewTracker.tsx` -> NEW: invisible client component; records trek visits via useEffect → recordTrekView()
- `apps/web-next/components/content/PersonalisedFeed.tsx` -> behavior-gated: hides section when hasBehaviorData()=false AND not logged in; blast radius: LOW
- `apps/web-next/components/home/DifficultyTabsSection.tsx` -> accepts cmsPages prop; cmsToTrek() converts CMSPage→Trek; CMS-first with static fallback; blast radius: LOW
- `services/api/app/api/routes/sitemap_data.py` (NEW) -> GET /api/v1/public/sitemap-pages; no auth; returns slug/page_type/updated_at for published CMS pages; used by sitemap.ts; blast radius: LOW
- `apps/web-next/app/sitemap.ts` -> replaced apiFetch (3s timeout) with fetchCmsSitemapPages() (20s + fallback to api subdomain); maps to new /public/sitemap-pages endpoint; blast radius: LOW
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` -> permanentRedirect when static slug has CMS version at different (extended) slug; deduplicates /trek/ URLs for Google; blast radius: LOW
- `services/api/app/modules/agents/content_writing/agent.py` -> _slugify: UUID suffix removed; _store_results: canonical slug from meta['target_keyword']; blast radius: LOW (only ContentWritingAgent uses it)
- `services/api/app/modules/agents/content_writing/prompts.py` -> slug instruction updated to use short canonical trek name; blast radius: LOW
- `services/api/app/api/routes/media.py` (NEW) -> POST /admin/media/upload; JPG/PNG/WEBP; DO Spaces if configured, local fallback; blast radius: LOW
- `services/api/app/api/router.py` -> media_router registered; blast radius: LOW
- `services/api/app/core/config.py` -> DO_SPACES_* settings added; blast radius: LOW (additive)
- `apps/web-next/components/content/Breadcrumb.tsx` -> className prop added for colour override; blast radius: MEDIUM (used on 12+ pages)
- `apps/web-next/components/admin/CMSPageForm.tsx` -> Upload button + handleImageUpload(); DO Spaces upload or local fallback; blast radius: LOW (admin-only)
- `apps/web-next/app/(public)/privacy/page.tsx` -> CMS slug corrected to 'privacy' (was 'privacy-policy'); blast radius: LOW
- `apps/web-next/app/(public)/terms/page.tsx` -> CMS slug corrected to 'terms' (was 'terms-of-service'); blast radius: LOW
- `apps/web-next/app/(public)/about/authors/page.tsx` -> updated: fictional authors replaced with real editorial lead Deepesh Kumar Gupta; Metadata + JSON-LD Person schema added; blast radius: LOW
- `services/api/app/modules/agents/translation/agent.py` -> TranslationAgent: translate_page(title, content_html, target_language); Anthropic claude-haiku with ephemeral caching; rule-based fallback; blast radius: LOW (only called by translation route)
- `services/api/app/schemas/translation.py` -> TranslateRequest, TranslateResponse; blast radius: LOW
- `services/api/app/api/routes/translation.py` -> POST /admin/cms/{slug}/translate; blast radius: LOW (new endpoint)
- `apps/web-next/app/(public)/hi/trek/[slug]/page.tsx` -> Hindi trek detail route; blast radius: LOW (new page)
- `apps/web-next/app/(public)/hi/guides/[slug]/page.tsx` -> Hindi guide route; blast radius: LOW (new page)
- `apps/web-next/app/(public)/hi/packing/[slug]/page.tsx` -> Hindi packing list route; blast radius: LOW (new page)
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
- `services/api/app/modules/agents/content_brief/agent.py` -> ContentBriefAgent; 3-node LangGraph (fetch_context → generate_brief → store_results); writes ContentBrief + BriefVersion; `_generate_brief` uses three-layer JSON parse: `json.loads` → `_clean_llm_json` → `json_repair` (bugfix 2026-05-29)
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
- `services/api/app/modules/agents/client.py` -> `get_anthropic_client()` factory; max_retries=6 (~32s backoff); imported by all 5 agent modules; blast radius: all agents fail if this import breaks
- `services/api/app/modules/agents/service.py` -> start_run, update_run, complete_run, fail_run, list_runs
- `services/api/app/schemas/agents.py` -> AgentRunResponse Pydantic schema
- `services/api/app/api/routes/agent_runs.py` -> GET /api/v1/admin/agent-runs with filters
- `services/api/app/worker/celery_app.py` -> Celery instance; broker/backend from settings; includes smoke + agent_tasks + pipeline.tasks; beat_schedule: daily_discovery every 24h
- `services/api/app/modules/pipeline/models.py` -> PipelineRun + PipelineStage ORM models; blast radius: LOW (new tables, no prior callers)
- `services/api/app/modules/pipeline/service.py` -> PipelineOrchestrator (run/resume/stage dispatchers) + CRUD helpers; PIPELINE_STAGES list; CHECKPOINT_AFTER map; resume() from paused_at_draft_approval now resumes at seo_aeo (not publish); blast radius: LOW (only called by pipeline tasks and pipeline routes)
- `services/api/app/modules/cms/service.py:reparse_sections_from_draft` -> re-parses content_json.sections from draft markdown; now also calls _extract_trek_facts_from_markdown and merges trek_facts (editor values take priority); called by reparse route; blast radius: LOW
- `services/api/app/modules/cms/service.py:_process_content_json` -> now skips HTML passthrough (values starting with '<'); affects create_page + update_page; blast radius: LOW
- `services/api/app/api/routes/cms.py:reparse_cms_page_sections` -> POST /cms/pages/{slug}/reparse-sections; blast radius: LOW (new endpoint)
- `services/api/app/modules/cms/service.py:_parse_sections_from_markdown` -> UPDATED: H1/H2-only boundaries (H3 = section content); H1 opens why_this_trek; faqs first in heading map (first-match-wins); difficult\b + key facts patterns added; blast radius: MEDIUM (called by upsert_page_from_draft + reparse_sections_from_draft + pipeline publish chain)
- `services/api/app/modules/cms/service.py:_extract_trek_facts_from_markdown` -> UPDATED: permits pattern handles `**Permit Required:**` format; base pattern handles `**Nearest Base Villages:**` + note stripping; blast radius: LOW (internal helper only)
- `services/api/app/modules/cms/service.py:_extract_faq_section_raw` -> NEW: finds FAQ section in raw markdown by heading pattern; returns raw lines until next H2; blast radius: LOW
- `services/api/app/modules/cms/service.py:_parse_faqs_from_section` -> NEW: parses bold-question/paragraph-answer FAQ markdown into [{q, a}] list; converts answers via _md_to_html; called by upsert_page_from_draft + reparse_sections_from_draft; blast radius: LOW
- `apps/web-next/app/globals.css` -> overflow-x changed from hidden to clip; affects all pages (sticky positioning fix)
- `apps/web-next/components/admin/CMSPageForm.tsx` -> UPDATED: FAQ Q&A pair editor (add/remove); faqs included in buildPayload; Re-parse updates FAQ state; blast radius: LOW (leaf component)
- `apps/web-next/components/content/FAQAccordion.tsx` -> NEW: client accordion component; blast radius: LOW
- `apps/web-next/components/content/TableOfContents.tsx` -> NEW: client TOC with IntersectionObserver scroll spy; blast radius: LOW
- `apps/web-next/components/content/Breadcrumb.tsx` -> NEW; blast radius: LOW
- `apps/web-next/components/content/RelatedContent.tsx` -> NEW; blast radius: LOW
- `apps/web-next/components/content/AuthorBlock.tsx` -> NEW; blast radius: LOW
- `apps/web-next/components/content/UpdatedBadge.tsx` -> NEW; blast radius: LOW
- `apps/web-next/components/content/SafetyDisclaimer.tsx` -> NEW; blast radius: LOW
- `apps/web-next/components/content/AffiliateDisclosure.tsx` -> NEW; blast radius: LOW
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` -> UPDATED: TableOfContents + FAQAccordion + Breadcrumb + AuthorBlock; Quick Facts body block; generic cost/permits fallbacks; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` -> NEW: CMS-powered packing list template; blast radius: LOW
- `apps/web-next/app/(public)/permits/[slug]/page.tsx` -> NEW: CMS-powered permit guide template; blast radius: LOW
- `apps/web-next/app/(public)/guides/[slug]/page.tsx` -> NEW: CMS-powered beginner guide template; blast radius: LOW
- `services/api/app/modules/pipeline/tasks.py` -> run_pipeline_task, resume_pipeline_task, daily_discovery_task Celery tasks
- `services/api/app/api/routes/pipeline.py` -> POST/GET /admin/pipeline/run, GET /admin/pipeline/runs, GET/POST /admin/pipeline/runs/{id}, POST /admin/pipeline/runs/{id}/resume, POST /admin/pipeline/runs/{id}/cancel; blast radius: LOW
- `services/api/app/schemas/pipeline.py` -> PipelineRunCreate, PipelineRunResponse, PipelineStageResponse, PipelineTriggerResponse
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
- `services/api/alembic/versions/20260423_0010_cms_hero_image.py` -> adds hero_image_url (String 512, nullable) to cms_pages
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

### Step 19 Bug Fixes (post-TC) blast radius
- `services/api/app/modules/content/service.py:update_draft_claim` -> NEW: updates flagged_for_review on DraftClaim; blast radius: LOW (called only by new admin PATCH route)
- `services/api/app/schemas/admin.py:ClaimPatch` -> NEW: Pydantic schema for PATCH body; blast radius: LOW
- `services/api/app/api/routes/admin.py` -> UPDATED: `PATCH /admin/fact-check/claims/{claim_id}` endpoint added; imports `ClaimPatch`, `update_draft_claim`; blast radius: LOW (additive endpoint)
- `services/api/app/modules/cms/service.py:_strip_flagged_markers` -> NEW: strips `*(flagged for verification)*` and bracket forms from markdown; called by `_md_to_html`; blast radius: MEDIUM (all markdown-to-HTML conversions go through _md_to_html → publish pipeline + reparse route)
- `services/api/app/modules/cms/service.py:_strip_flagged_markers_html` -> NEW: strips `<em>(flagged...)</em>` from stored HTML; called by `_process_content_json`; blast radius: MEDIUM (same callers as _process_content_json)
- `services/api/app/modules/cms/service.py:_md_to_html` -> UPDATED: calls `_strip_flagged_markers` before conversion; blast radius: HIGH (all section conversions)
- `services/api/app/modules/cms/service.py:_process_content_json` -> UPDATED: strips HTML markers from existing HTML values; blast radius: MEDIUM
- `services/api/app/modules/cms/service.py:_SECTION_HEADING_MAP` -> UPDATED: safety pattern adds `medical|health.*altitude|mountain.*safe|know before`; cost_estimate adds `invest|spend|financial|tariff|expenditure`; blast radius: MEDIUM (parse_sections_from_markdown callers)
- `apps/web-next/lib/api.ts` -> UPDATED: `patchFactCheckClaim`, `clearPipelineRuns`, `clearAgentRuns` helpers added; blast radius: LOW (additive)
- `apps/web-next/app/(admin)/admin/fact-check/page.tsx` -> UPDATED: "Mark verified" / "Flag for editor" buttons wired with loading states; optimistic updates; blast radius: LOW
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx` -> UPDATED: `handleClearFailed()` + "Clear all" button in Failed/Cancelled section; imports `clearPipelineRuns`; blast radius: LOW
- `services/api/tests/test_cms.py` -> UPDATED: 6 new tests (claim PATCH, 404, flagged-marker strip, bracket-marker strip, medical→safety, financial→cost); 174/174 total pass

### Step 19 Bug Fixes — Pipeline keyword_cluster fallback
- `services/api/app/modules/pipeline/service.py:_run_keyword_cluster` -> UPDATED: falls back to 10 most-recent DB topics when `topic_ids` from trend_discovery is empty; only hard-fails if DB has no topics at all; blast radius: LOW (0 direct callers — method is only dispatched by _dispatch_stage within same class)
- `services/api/app/modules/agents/trend_discovery/agent.py:TrendDiscoveryAgent._store_results` -> UPDATED: added `logger.warning()` + `self.db.rollback()` in except block; fixes silent DB session corruption when first `create_topic` leaves an aborted transaction (all subsequent topic inserts would silently fail with PendingRollbackError); blast radius: LOW (0 direct callers — internal LangGraph node)

### Step 19 + Step 18 fixes blast radius
- `apps/web-next/lib/schema.ts` -> NEW: schema builder utilities (buildArticleSchema, buildFAQSchema, buildBreadcrumbSchema, buildItemListSchema, buildWebSiteSchema); uses NEXT_PUBLIC_SITE_URL; blast radius: LOW (new file, imported only by page files)
- `apps/web-next/components/seo/SchemaInjector.tsx` -> NEW: renders JSON-LD <script> tags; blast radius: LOW (leaf component, imported by trek/packing/permits/guides/homepage pages)
- `apps/web-next/app/sitemap.ts` -> NEW: Next.js App Router sitemap; fetches treks + fetchCMSPages; blast radius: LOW (build-time only, graceful fallback on API unavailable)
- `apps/web-next/app/robots.ts` -> NEW: Next.js App Router robots; blocks /admin/, /account/, /auth/, /api/; blast radius: LOW
- `apps/web-next/app/layout.tsx` -> UPDATED: metadataBase, global OG/Twitter defaults, robots index/follow; blast radius: MEDIUM (root layout — affects all pages' metadata inheritance)
- `apps/web-next/app/(public)/page.tsx` -> UPDATED: WebSite JSON-LD via SchemaInjector; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` -> UPDATED: canonical + OG + Twitter in generateMetadata; Article + FAQPage + BreadcrumbList JSON-LD; section padding increased; TOC history.pushState reinstated; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` -> UPDATED: canonical + OG + Twitter; Article + FAQ JSON-LD; blast radius: LOW
- `apps/web-next/app/(public)/permits/[slug]/page.tsx` -> UPDATED: canonical + OG + Twitter; Article + FAQ JSON-LD; blast radius: LOW
- `apps/web-next/app/(public)/guides/[slug]/page.tsx` -> UPDATED: canonical + OG + Twitter; Article + FAQ JSON-LD; blast radius: LOW
- `apps/web-next/lib/api.ts` -> UPDATED: FactCheckClaim interface + fetchFactCheckClaims helper; blast radius: LOW (additive)
- `apps/web-next/app/(admin)/admin/fact-check/page.tsx` -> REWRITTEN: real-API client component; reads GET /admin/fact-check/claims; blast radius: LOW (leaf admin page)
- `apps/web-next/components/content/TableOfContents.tsx` -> UPDATED: history.pushState on item click (URL hash update); blast radius: LOW
- `services/api/app/main.py` -> UPDATED: _cancel_stale_runs() called in lifespan startup; marks orphaned agent_runs + pipeline_runs with status="running" as "cancelled"; blast radius: LOW (startup hook, additive)
- `services/api/app/api/routes/pipeline.py` -> UPDATED: DELETE /admin/pipeline/runs/clear — deletes pipeline_stages first (FK), then non-completed runs; blast radius: LOW (additive endpoint)
- `services/api/app/api/routes/agent_runs.py` -> UPDATED: DELETE /admin/agent-runs/clear — deletes failed/cancelled/running AgentRuns; blast radius: LOW (additive endpoint)
- `services/api/app/api/routes/admin.py` -> UPDATED: GET /admin/fact-check/claims — joins DraftClaim with ContentDraft for title; supports flagged_only param; blast radius: LOW (additive endpoint)
- `services/api/app/schemas/admin.py` -> UPDATED: ClaimResponse Pydantic model added; blast radius: LOW (additive)
- `services/api/app/modules/cms/service.py:_extract_trek_facts_from_markdown` -> UPDATED: two-pass extraction — _FACT_TABLE (markdown table format) first, _FACT_KV (bold key:value, colon required) fallback; season headings no longer captured; blast radius: LOW (internal helper, called by upsert_page_from_draft + reparse_sections_from_draft)
- `services/api/app/modules/cms/service.py:_parse_faqs_from_section` -> UPDATED: handles ### H3 format AND **bold** format; blast radius: LOW (internal helper)
- `services/api/app/modules/agents/seo_aeo/agent.py` -> UPDATED: _clean_llm_json() fallback parser escapes literal \\n/\\r/\\t inside JSON strings; blast radius: LOW (agent only)
- `services/api/app/modules/agents/seo_aeo/prompts.py` -> UPDATED: explicit instruction to escape newlines in JSON string values; blast radius: LOW
- `services/api/tests/test_cms.py` -> UPDATED: 11 new tests (table format, season-heading guard, H3 FAQ, clear endpoints); 168/168 total pass
- `CLAUDE.md` -> UPDATED: Section 16 (Inter-Step Dependency Check Protocol) + Section 15 (Admin UI Design System) added; GitNexus skill table added to GitNexus section

### Post-Step 28 Bug Fixes blast radius
- `services/api/app/api/routes/compliance.py:compliance_check` -> UPDATED: added `db.commit()` after successful `run_compliance_check`; without this the agent's `db.flush()` was rolled back when the session closed (`autocommit=False` + `get_db` never commits); blast radius: LOW (0 upstream callers)
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` -> UPDATED: "Re-check" label condition changed from `compStatus === "passed"` to `compStatus !== "unchecked"` — shows "Re-check" for passed/flagged/overridden states; blast radius: LOW (leaf admin page)

### Step 30 — Dynamic Destination Hubs blast radius
- `services/api/app/modules/agents/seasonal_content/__init__.py` — NEW: package init; blast radius: LOW
- `services/api/app/modules/agents/seasonal_content/agent.py:SeasonalContentAgent` — NEW: 3-node LangGraph; reads SEASON_META; calls Claude (max_tokens=2000); upserts CMSPage (seasonal_hub); blast radius: LOW (new module, called only by hubs route)
- `services/api/app/modules/hubs/__init__.py` — NEW: package init; blast radius: LOW
- `services/api/app/modules/hubs/tasks.py:regenerate_seasonal_hubs_task` — NEW: quarterly Celery task; iterates 4 seasons; blast radius: LOW (new Celery task, no sync callers)
- `services/api/app/schemas/hubs.py` — NEW: HubPageResponse, HubRegenerateRequest/Response; HUB_PAGE_TYPES set; blast radius: LOW (new file)
- `services/api/app/api/routes/hubs.py` — NEW: GET /admin/hubs + POST /admin/hubs/{slug:path}/regenerate; requires get_current_admin; blast radius: LOW (new routes)
- `services/api/app/api/router.py` — UPDATED: hubs_router registered; blast radius: LOW (additive)
- `services/api/app/worker/celery_app.py` — UPDATED: `app.modules.hubs.tasks` in include; `quarterly-seasonal-hub-regeneration` beat entry (7776000s); blast radius: LOW (additive)
- `services/api/tests/test_hubs.py` — NEW: 9 tests; blast radius: LOW (test-only)
- `apps/web-next/lib/api.ts` — UPDATED: HubPage, HubRegenerateResult interfaces; fetchHubPages, regenerateHub helpers; blast radius: LOW (additive)
- `apps/web-next/app/(public)/trek-types/[slug]/page.tsx` — NEW: CMS-powered cluster hub page; server component; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/regions/[slug]/page.tsx` — UPDATED: CMS-first fetchCMSPage + FAQAccordion + BreadcrumbSchema; static fallback preserved; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/seasons/[slug]/page.tsx` — UPDATED: CMS-first fetchCMSPage + FAQAccordion + BreadcrumbSchema; spring slug + Leaf icon; AffiliateDisclosure; blast radius: LOW (leaf page)
- `apps/web-next/app/(admin)/admin/hubs/page.tsx` — NEW: hub list table + KPI strip + filter pills + missing seasonal hubs panel; blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/layout.tsx` — UPDATED: "Destination Hubs" nav item (Globe icon) after Operators; blast radius: MEDIUM (admin layout, visible to all admin pages)

### Step 29 — Operator Listing + Lead Marketplace blast radius
- `services/api/alembic/versions/20260430_0019_operators.py` — NEW: operators + operator_specializations tables; adds assigned_operator_id FK + status_history JSON to lead_submissions; blast radius: LOW (new tables, additive columns)
- `services/api/app/modules/operators/models.py` — NEW: Operator + OperatorSpecialization ORM; blast radius: LOW (new models)
- `services/api/app/modules/operators/service.py` — NEW: CRUD + find_matching_operator; blast radius: LOW (new module, called only by leads service + operators routes)
- `services/api/app/schemas/operators.py` — NEW: OperatorCreate, OperatorPatch, OperatorResponse, AssignOperatorRequest; blast radius: LOW
- `services/api/app/api/routes/operators.py` — NEW: GET/POST/GET/PATCH/DELETE /admin/operators + PATCH /admin/leads/{id}/assign-operator; blast radius: LOW
- `services/api/app/db/base.py` — UPDATED: Operator + OperatorSpecialization registered; blast radius: LOW (additive)
- `services/api/app/api/router.py` — UPDATED: operators_router + operators_leads_router registered; blast radius: LOW (additive)
- `services/api/app/modules/leads/models.py` — UPDATED: added assigned_operator_id FK (SET NULL), status_history JSON, assigned_operator relationship; blast radius: MEDIUM (5 callers: create_lead, base.py, tasks.py, service.py, analytics/service.py)
- `services/api/app/modules/leads/service.py` — UPDATED: _push_status_history helper; create_lead auto-routes; update_lead_status records history; assign_operator_to_lead added; blast radius: MEDIUM (2 route callers: leads.py + leads_admin.py)
- `services/api/app/modules/leads/tasks.py` — UPDATED: _send_email extracted; notify_admin_new_lead_task shows operator line; notify_operator_new_lead_task added; blast radius: LOW (Celery tasks, no sync callers)
- `services/api/app/api/routes/leads.py` — UPDATED: fires notify_operator_new_lead_task.delay() when lead is routed; blast radius: LOW (leaf route)
- `services/api/app/schemas/leads.py` — UPDATED: routed/lost added to VALID_LEAD_STATUSES; assigned_operator_id + status_history added to LeadResponse; blast radius: MEDIUM (used by leads + leads_admin routes)
- `services/api/tests/test_operators.py` — NEW: 15 tests; blast radius: LOW (test file)
- `apps/web-next/lib/api.ts` — UPDATED: AdminLead extended; Operator + helpers added; blast radius: LOW (additive)
- `apps/web-next/app/(admin)/admin/operators/page.tsx` — NEW: operator list + inline add/edit form; blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/leads/page.tsx` — REWRITTEN: operator column, assign-dropdown, history drawer, new statuses; blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/layout.tsx` — UPDATED: Operators nav item (Building2) added; blast radius: LOW (nav only)

### Step 20 — Monetization Frontend Components blast radius
- `services/api/alembic/versions/20260427_0011_leads_newsletter.py` — NEW: creates lead_submissions + newsletter_subscribers tables; blast radius: LOW (new tables, no callers yet)
- `services/api/app/modules/leads/models.py` — NEW: LeadSubmission ORM model; blast radius: LOW
- `services/api/app/modules/newsletter/models.py` — NEW: NewsletterSubscriber ORM model; blast radius: LOW
- `services/api/app/db/base.py` — UPDATED: imports LeadSubmission + NewsletterSubscriber; blast radius: LOW (additive)
- `services/api/app/schemas/leads.py` — NEW: LeadCreate (custom field_validator for email) + LeadResponse; blast radius: LOW
- `services/api/app/schemas/newsletter.py` — NEW: NewsletterSubscribeCreate + NewsletterSubscribeResponse (already_subscribed bool); blast radius: LOW
- `services/api/app/modules/leads/service.py` — NEW: create_lead(); blast radius: LOW
- `services/api/app/modules/newsletter/service.py` — NEW: subscribe() with idempotent duplicate check; blast radius: LOW
- `services/api/app/api/routes/leads.py` — NEW: POST /api/v1/leads (201); blast radius: LOW
- `services/api/app/api/routes/newsletter.py` — NEW: POST /api/v1/newsletter/subscribe (200); blast radius: LOW
- `services/api/app/api/router.py` — UPDATED: leads_router + newsletter_router registered; blast radius: LOW (additive)
- `services/api/tests/test_leads_newsletter.py` — NEW: 8 tests; unique UUID-suffixed emails per run
- `apps/web-next/lib/api.ts` — UPDATED: LeadPayload, LeadResponse, NewsletterPayload, NewsletterResponse + submitLead() + subscribeNewsletter(); blast radius: LOW (additive)
- `apps/web-next/app/layout.tsx` — UPDATED: conditional AdSense <script> in <head> via NEXT_PUBLIC_ADSENSE_ID; blast radius: MEDIUM (root layout, affects all pages)
- `apps/web-next/components/monetization/InArticleAdSlot.tsx` — NEW; blast radius: LOW (imported by trek page)
- `apps/web-next/components/monetization/SidebarAdSlot.tsx` — NEW; blast radius: LOW
- `apps/web-next/components/monetization/FooterAdSlot.tsx` — NEW; blast radius: LOW
- `apps/web-next/components/monetization/AffiliateCard.tsx` — NEW: exports AffiliateCardItem interface; blast radius: LOW (imported by AffiliateRail + page files)
- `apps/web-next/components/monetization/AffiliateRail.tsx` — NEW: snap-scroll rail; blast radius: LOW
- `apps/web-next/components/monetization/ComparisonTable.tsx` — NEW; blast radius: LOW
- `apps/web-next/components/monetization/GearRecommendation.tsx` — NEW; blast radius: LOW
- `apps/web-next/components/monetization/LeadForm.tsx` — NEW: calls submitLead(); uses localStorage; blast radius: LOW
- `apps/web-next/components/monetization/OperatorCard.tsx` — NEW: wraps LeadForm; blast radius: LOW
- `apps/web-next/components/monetization/ConsultationCTA.tsx` — NEW: wraps LeadForm; blast radius: LOW
- `apps/web-next/components/monetization/NewsletterCapture.tsx` — NEW: calls subscribeNewsletter(); localStorage guard + already_subscribed handling; blast radius: LOW
- `apps/web-next/components/monetization/LeadMagnetCapture.tsx` — NEW: wraps NewsletterCapture; blast radius: LOW
- `apps/web-next/components/monetization/InlineNewsletterBlock.tsx` — NEW: mid-article wrapper; blast radius: LOW
- `apps/web-next/components/trust/DisclosureBlock.tsx` — NEW: affiliate/ads/AI disclosure; blast radius: LOW
- `apps/web-next/components/trust/TrustSignals.tsx` — NEW: date/author/fact-checked trust bar; blast radius: LOW (imported by trek page)
- `apps/web-next/components/trust/StickyMobileCTA.tsx` — NEW: lg:hidden sticky CTA, 7-day localStorage dismiss; blast radius: LOW (imported by trek page)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: InArticleAdSlot + AffiliateRail + TrustSignals + StickyMobileCTA inserted; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — UPDATED: AffiliateRail + NewsletterCapture inserted; blast radius: LOW (leaf page)

### Step 22 — Internal Linking Engine + Lead Pipeline + Newsletter Platform blast radius
- `services/api/alembic/versions/20260427_0012_internal_linking_lead_status.py` — NEW: creates `pages` + `page_links` tables; adds `status` column to `lead_submissions`; blast radius: LOW (new tables, additive column)
- `services/api/app/modules/linking/models.py` — NEW: Page + PageLink ORM models; FK to cms_pages (CASCADE) + keyword_clusters (SET NULL); blast radius: LOW (new models)
- `services/api/app/modules/linking/service.py` — NEW: sync_pages_from_cms, get_related_pages, get_orphan_pages, get_anchor_suggestions; blast radius: LOW (new module)
- `services/api/app/modules/linking/tasks.py` — NEW: sync_pages_task + detect_orphans_task (Celery daily beat); blast radius: LOW
- `services/api/app/modules/leads/models.py` — UPDATED: status column (String 32, NOT NULL, default "new"); blast radius: LOW (additive column)
- `services/api/app/modules/leads/service.py` — UPDATED: list_leads + update_lead_status added; blast radius: LOW (additive)
- `services/api/app/modules/leads/tasks.py` — NEW: notify_admin_new_lead_task (SMTP, graceful skip if unconfigured); blast radius: LOW
- `services/api/app/modules/newsletter/tasks.py` — NEW: sync_subscriber_task (Mailchimp/Brevo, graceful skip); blast radius: LOW
- `services/api/app/modules/newsletter/service.py` — UPDATED: subscribe() fires sync_subscriber_task.delay() after DB insert; blast radius: LOW (additive side-effect)
- `services/api/app/api/routes/linking.py` — NEW: POST /admin/links/sync, GET /links/suggestions/{slug}, GET /admin/links/orphans, GET /admin/links/anchors/{slug}; blast radius: LOW (new routes)
- `services/api/app/api/routes/leads_admin.py` — NEW: GET /admin/leads, PATCH /admin/leads/{id}; blast radius: LOW (new routes)
- `services/api/app/api/routes/leads.py` — UPDATED: fires notify_admin_new_lead_task.delay() after create; blast radius: LOW (additive side-effect)
- `services/api/app/api/routes/newsletter.py` — UPDATED: POST /newsletter/sync (admin) added; blast radius: LOW (additive endpoint)
- `services/api/app/api/router.py` — UPDATED: linking_admin_router, linking_public_router, leads_admin_router registered; blast radius: LOW (additive)
- `services/api/app/worker/celery_app.py` — UPDATED: include list + 2 beat schedule entries (daily-sync-pages, daily-detect-orphans); blast radius: LOW (additive)
- `services/api/app/modules/publish/service.py` — NOTE: Step 22 stated sync_pages_from_cms() was hooked in here — it was NOT in the actual code. This was fixed in the post-Step-23 bug fix (commit b5e44a7); see below.
- `services/api/app/schemas/leads.py` — UPDATED: LeadResponse gains status field; VALID_LEAD_STATUSES set + LeadStatusPatch schema added; blast radius: LOW (additive)
- `services/api/app/schemas/linking.py` — NEW: PageResponse, RelatedPageResponse, AnchorSuggestion, SyncResponse, OrphanResponse; blast radius: LOW
- `services/api/app/db/base.py` — UPDATED: Page + PageLink registered; blast radius: LOW (additive)
- `services/api/.env.example` — UPDATED: SMTP + newsletter platform env vars documented; blast radius: LOW (docs only)
- `services/api/tests/test_linking.py` — NEW: 12 tests (sync, related pages, orphans, anchors, leads list/filter/patch); blast radius: LOW
- `apps/web-next/lib/api.ts` — UPDATED: RelatedPage, OrphanPage, AnchorSuggestion, AdminLead types + 5 fetch helpers; blast radius: LOW (additive)
- `apps/web-next/components/content/RelatedContent.tsx` — UPDATED: accepts optional pageSlug prop; server-component async path fetches from /links/suggestions/{slug}; static items prop path unchanged; blast radius: LOW (leaf component, no change to existing callers using items prop)
- `apps/web-next/app/(admin)/admin/linking/page.tsx` — REWRITTEN: real API; orphan table + sync trigger + anchor suggestion row-expand; blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/leads/page.tsx` — NEW: admin leads table; KPI row; status filter; mark-as-contacted action; blast radius: LOW
- `apps/web-next/app/(admin)/admin/layout.tsx` — UPDATED: Leads nav item (Users icon, href /admin/leads) added to Growth group; blast radius: MEDIUM (admin layout, visible to all admin pages)

### Step 23 — Content Refresh Engine blast radius
- `services/api/alembic/versions/20260427_0013_content_refresh.py` — NEW: adds freshness_interval_days + last_refreshed_at + do_not_refresh to `pages`; adds freshness_interval_days to `content_drafts`; creates `refresh_logs` table; blast radius: LOW (additive columns + new table)
- `services/api/app/modules/linking/models.py:Page` — UPDATED: freshness_interval_days (Integer, default 90), last_refreshed_at (DateTime nullable), do_not_refresh (Boolean, default False) added; blast radius: LOW (only affects Linking module callers; columns are additive)
- `services/api/app/modules/content/models.py:ContentDraft` — UPDATED: freshness_interval_days (Integer, default 90) added; blast radius: LOW (additive column; no existing query references it)
- `services/api/app/modules/refresh/__init__.py` — NEW: package init; blast radius: LOW
- `services/api/app/modules/refresh/models.py` — NEW: RefreshLog ORM (id, page_id FK→pages CASCADE, triggered_by, trigger_at, completed_at, result, notes, created_at); blast radius: LOW
- `services/api/app/modules/refresh/service.py` — NEW: get_stale_pages (PostgreSQL interval arithmetic, excludes do_not_refresh), create_refresh_log, update_refresh_log, get_refresh_logs; blast radius: LOW (new module, no callers except refresh routes and tasks)
- `services/api/app/modules/refresh/tasks.py` — NEW: refresh_task (Celery: SEOAEOAgent re-run → flagged-claim gate → upsert_page_from_draft or requires_review); auto_refresh_task (beat: detects 5 stale pages, dispatches refresh_task); blast radius: LOW
- `services/api/app/api/routes/refresh.py` — NEW: GET /admin/refresh/stale, POST /admin/refresh/trigger, GET /admin/refresh/logs; all require get_current_admin; blast radius: LOW
- `services/api/app/schemas/refresh.py` — NEW: StalePageResponse, RefreshTriggerRequest, RefreshLogResponse, RefreshTriggerResponse; blast radius: LOW
- `services/api/app/db/base.py` — UPDATED: RefreshLog imported and registered; blast radius: LOW (additive)
- `services/api/app/api/router.py` — UPDATED: refresh_router registered; blast radius: LOW (additive)
- `services/api/app/worker/celery_app.py` — UPDATED: app.modules.refresh.tasks in include list; daily-auto-refresh beat entry (86400s); blast radius: LOW (additive)
- `services/api/tests/test_refresh.py` — NEW: 13 tests (stale detection, do_not_refresh guard, recently-refreshed guard, trigger happy-path/404/422, logs list); blast radius: LOW
- `apps/web-next/lib/api.ts` — UPDATED: StalePage, RefreshLog, RefreshTriggerResponse interfaces + fetchStalePages, triggerRefresh, fetchRefreshLogs; blast radius: LOW (additive)
- `apps/web-next/app/(admin)/admin/refresh/page.tsx` — NEW: stale pages table + Refresh-now button per row + refresh log history; blast radius: LOW
- `apps/web-next/app/(admin)/admin/layout.tsx` — UPDATED: "Content Refresh" nav item (RefreshCw icon) added to Growth group; blast radius: MEDIUM (admin layout affects all admin pages)

### Post-Step 23 Bug Fixes blast radius (commits 783a004 → d3bd4c7)
- `services/api/app/modules/pipeline/service.py:_update_stage` — FIXED: re-queries PipelineStage by PK before UPDATE; callers: `_execute_stages` only; blast radius: LOW (internal to Pipeline module; all 3 pipeline Celery tasks benefit)
- `services/api/app/modules/pipeline/service.py:_update_run` — FIXED: re-queries PipelineRun by PK before UPDATE; same pattern as _update_stage; blast radius: LOW
- `services/api/app/modules/publish/service.py:publish_to_cms` — FIXED: now calls `sync_pages_from_cms(db)` after upsert_page_from_draft; both callers (publish_draft route + PipelineOrchestrator._run_publish) benefit; blast radius: LOW (additive, same transaction)
- `services/api/app/modules/refresh/tasks.py:refresh_task` — FIXED: `agent.run(input=...)` → `agent.run(input_data=...)`; blast radius: LOW (internal Celery task only)
- `services/api/tests/test_cms.py:clean_state` — FIXED: snapshot-based cleanup for all 5 content tables; blast radius: LOW (test-only)
- `services/api/tests/test_publish.py:clean_state` — FIXED: same snapshot approach; blast radius: LOW (test-only)

### Step 27 — Newsletter Automation + Repurposing Agent blast radius
- `services/api/alembic/versions/20260429_0017_newsletter_campaigns.py` — NEW: creates `newsletter_campaigns` + `social_snippets` tables; blast radius: LOW (new tables, no existing callers)
- `services/api/app/modules/newsletter/models.py` — UPDATED: NewsletterCampaign + SocialSnippet ORM models added alongside existing NewsletterSubscriber; blast radius: LOW (additive, no existing callers reference new classes)
- `services/api/app/modules/newsletter/service.py` — UPDATED: list_campaigns, get_campaign, send_campaign, _send_mailchimp, _send_brevo, list_snippets added; existing `subscribe()` unchanged; blast radius: LOW (new functions only; existing callers of subscribe() unaffected)
- `services/api/app/modules/newsletter/tasks.py` — UPDATED: auto_generate_newsletter_task Celery task added; existing sync_subscriber_task unchanged; blast radius: LOW (additive)
- `services/api/app/modules/agents/newsletter/__init__.py` — NEW: package init; blast radius: LOW
- `services/api/app/modules/agents/newsletter/agent.py:NewsletterAgent` — NEW: 3-node LangGraph; reads published CMSPages (read-only query); writes NewsletterCampaign; blast radius: LOW (new file, called only by /generate route)
- `services/api/app/modules/agents/social_repurpose/__init__.py` — NEW: package init; blast radius: LOW
- `services/api/app/modules/agents/social_repurpose/agent.py:SocialRepurposeAgent` — NEW: 3-node LangGraph; reads CMSPage + Page (read-only); writes SocialSnippet; blast radius: LOW (new file, called only by /repurpose route)
- `services/api/app/schemas/newsletter.py` — UPDATED: 5 new schema classes (NewsletterCampaignResponse, GenerateCampaignResponse, SendCampaignResponse, SocialSnippetResponse, RepurposeResponse) added; existing schemas unchanged; blast radius: LOW (additive)
- `services/api/app/db/base.py` — UPDATED: NewsletterCampaign + SocialSnippet registered; blast radius: LOW (additive)
- `services/api/app/api/routes/newsletter_admin.py` — NEW: 6 endpoints; blast radius: LOW (new file)
- `services/api/app/api/router.py` — UPDATED: newsletter_admin_router + newsletter_pages_router registered; blast radius: LOW (additive)
- `services/api/app/worker/celery_app.py` — UPDATED: weekly-newsletter-generate beat entry (604800s); blast radius: LOW (additive beat schedule only)
- `services/api/tests/test_newsletter_agent.py` — NEW: 15 tests (1 conditionally skipped); blast radius: LOW (test-only)
- `apps/web-next/lib/api.ts` — UPDATED: 5 interfaces + 5 fetch helpers; blast radius: LOW (additive, no existing callers modified)
- `apps/web-next/app/(admin)/admin/newsletter/page.tsx` — NEW: campaigns tab (iframe preview modal + Send action) + snippets tab (repurpose form + clipboard copy); blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/layout.tsx` — UPDATED: "Newsletter" nav item (Mail icon) added to Growth group before Cannibalization; blast radius: MEDIUM (admin layout, visible to all admin pages — additive change only)

### Step 26 — Cannibalization Detection + Consolidation Agent blast radius
- `services/api/alembic/versions/20260429_0016_cannibalization_issues.py` — NEW: creates `cannibalization_issues` table; blast radius: LOW (new table, no existing callers)
- `services/api/app/modules/cannibalization/models.py:CannibalizationIssue` — NEW: ORM model (FK→pages CASCADE × 2); blast radius: LOW (new model)
- `services/api/app/modules/cannibalization/service.py` — NEW: detect_cannibalization, get_issues, resolve_issue, get_issue; blast radius: LOW (new module, called only by cannibalization route)
- `services/api/app/modules/agents/consolidation/agent.py:ConsolidationAgent` — NEW: 3-node LangGraph agent; creates ContentBrief stub + ContentDraft; blast radius: LOW (new file, called only by /merge route)
- `services/api/app/api/routes/cannibalization.py` — NEW: 4 endpoints; blast radius: LOW (new routes)
- `services/api/app/schemas/cannibalization.py` — NEW: 4 schemas; blast radius: LOW (new file)
- `services/api/app/db/base.py` — UPDATED: CannibalizationIssue imported; blast radius: LOW (additive)
- `services/api/app/api/router.py` — UPDATED: cannibalization_router registered; blast radius: LOW (additive)
- `services/api/app/api/routes/refresh.py:list_stale_pages` — UPDATED: limit raised from le=200 to le=1000; blast radius: LOW (additive relaxation of constraint)
- `services/api/tests/test_refresh.py` — UPDATED: 2 stale page tests use ?limit=500 (growing test data exceeds prior limit); blast radius: LOW (test-only)
- `apps/web-next/lib/api.ts` — UPDATED: CannibalizationIssue + 3 helper interfaces + 4 fetch functions; blast radius: LOW (additive)
- `apps/web-next/app/(admin)/admin/cannibalization/page.tsx` — NEW: scan trigger, severity+status filter pills, issue cards, merge/dismiss/resolve actions; blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/layout.tsx` — UPDATED: "Cannibalization" nav item (Swords icon) added to Growth group; blast radius: MEDIUM (admin layout, affects all admin pages)

### Step 25 — Advanced Fact Validation System blast radius
- `services/api/alembic/versions/20260428_0015_draft_claims_ymyl.py` — NEW: additive nullable columns `evidence_url` (Text) + `ymyl_flag` (bool, default false) on `draft_claims`; blast radius: LOW (additive, no existing callers break)
- `services/api/app/modules/content/models.py:DraftClaim` — UPDATED: ymyl_flag + evidence_url added; blast radius: HIGH (37 symbols reference DraftClaim) — change is additive, no existing callers break; all callers unaffected because columns have server defaults
- `services/api/app/schemas/content.py:DraftClaimCreate` — UPDATED: ymyl_flag (bool, default False) + evidence_url (str|None) added; blast radius: LOW (additive fields with defaults)
- `services/api/app/schemas/content.py:DraftClaimResponse` — UPDATED: ymyl_flag + evidence_url added; blast radius: LOW (additive fields)
- `services/api/app/schemas/admin.py:ClaimResponse` — UPDATED: ymyl_flag (bool, default False) + evidence_url (str|None) added; blast radius: LOW (only used by admin fact-check routes)
- `services/api/app/api/routes/admin.py:list_fact_check_claims` — UPDATED: passes ymyl_flag + evidence_url in ClaimResponse; blast radius: LOW (fact-check admin endpoint only)
- `services/api/app/api/routes/admin.py:patch_fact_check_claim` — UPDATED: passes ymyl_flag + evidence_url in ClaimResponse; blast radius: LOW
- `services/api/app/api/routes/content.py:get_draft_claims` — UPDATED: serialization dict includes ymyl_flag + evidence_url; blast radius: LOW (draft claims endpoint only)
- `services/api/app/modules/agents/fact_validation/__init__.py` — NEW: package init; blast radius: LOW
- `services/api/app/modules/agents/fact_validation/agent.py:ClaimExtractionAgent` — NEW: 3-node LangGraph agent; YMYL_CLAIM_TYPES set; uses `.replace()` not `.format()` for prompt; blast radius: LOW (new module, called only by fact_validation route)
- `services/api/app/api/routes/fact_validation.py` — NEW: POST /admin/drafts/{id}/fact-check → FactCheckTriggerResponse; requires get_current_admin; blast radius: LOW (new route)
- `services/api/app/api/router.py` — UPDATED: fact_validation_router registered; blast radius: LOW (additive)
- `services/api/tests/test_fact_validation.py` — NEW: 7 tests; blast radius: LOW (test-only)
- `services/api/tests/test_refresh.py` — UPDATED: stale pages test uses `?limit=200`; blast radius: LOW (test-only; fixes pre-existing false-failure due to 50+ real pages in DB)
- `apps/web-next/lib/api.ts:FactCheckClaim` — UPDATED: ymyl_flag + evidence_url added; blast radius: LOW (only used by admin fact-check page)
- `apps/web-next/lib/api.ts:triggerFactCheck` — NEW: POST /admin/drafts/{id}/fact-check helper; blast radius: LOW (leaf function)
- `apps/web-next/app/(admin)/admin/fact-check/page.tsx` — REWRITTEN: claims grouped by draft (byDraft map), per-draft Re-run button, YMYL badge (ShieldAlert/red), evidence URL link, YMYL+flagged counts in header, confidence bar, flaggedOnly filter; blast radius: LOW (leaf admin page)

### Step 21 — RBAC Enforcement blast radius
- `services/api/app/core/security.py:create_access_token` — UPDATED: optional `roles: list[str]` param; roles added to JWT payload; blast radius: HIGH (called by create_session_for_user → signup/login/google_auth); change is additive and backward-compatible
- `services/api/app/modules/auth/service.py:create_session_for_user` — UPDATED: reads user.roles slugs and passes to create_access_token; blast radius: MEDIUM (called by signup/login/google_auth routes)
- `services/api/app/modules/auth/dependencies.py` — UPDATED: RequireRole class + named singletons (require_super_admin, require_admin, require_editor, require_pipeline, require_agent_admin); blast radius: HIGH (imported by all protected route files)
- `services/api/app/schemas/rbac.py` — NEW: RoleResponse, RoleAssignRequest, UserWithRolesResponse; blast radius: LOW (only used by users.py route)
- `services/api/app/modules/rbac/service.py` — NEW: seed_roles, assign/revoke helpers, list_users_with_roles; blast radius: LOW (called by users route + scripts)
- `services/api/app/api/routes/users.py` — NEW: user management endpoints (super_admin guarded); blast radius: LOW (new file)
- `services/api/app/api/routes/admin.py` — UPDATED: router-level Depends(require_admin); blast radius: MEDIUM (all admin summary routes now require admin role)
- `services/api/app/api/routes/publish.py` — UPDATED: Depends(require_editor); blast radius: MEDIUM
- `services/api/app/api/routes/content.py` — UPDATED: Depends(require_editor); blast radius: MEDIUM
- `services/api/app/api/routes/pipeline.py` — UPDATED: Depends(require_pipeline); blast radius: MEDIUM
- `services/api/app/api/routes/agent_triggers.py` — UPDATED: Depends(require_agent_admin); blast radius: MEDIUM
- `services/api/app/api/routes/agent_runs.py` — UPDATED: Depends(require_admin); blast radius: MEDIUM
- `services/api/app/api/routes/worker.py` — UPDATED: Depends(require_admin); blast radius: LOW
- `services/api/app/api/routes/cms.py` — UPDATED: Depends(require_editor); blast radius: MEDIUM
- `services/api/app/api/router.py` — UPDATED: users_router registered; blast radius: LOW (additive)
- `services/api/tests/conftest.py` — NEW: autouse RBAC bypass fixture; skips bypass for test_rbac.py; blast radius: HIGH (affects all test files)
- `services/api/tests/test_rbac.py` — NEW: 14 RBAC tests; blast radius: LOW
- `scripts/seed_roles.py` — NEW: standalone role seeding script; blast radius: LOW
- `scripts/assign_admin.py` — NEW: CLI role assignment by email; blast radius: LOW
- `apps/web-next/middleware.ts` — UPDATED: /admin/:path* added to matcher + redirect guard; blast radius: MEDIUM (affects all admin page requests in Next.js edge runtime)

### TrekSage enhancements — conversation logs, rate limiting, topic guard, CMS trek filters (2026-07-02)
- `services/api/app/schemas/trek_intelligence.py` — UPDATED: `session_id: str | None` added to `AIInteractionLogResponse`; new `SessionMessageOut` + `SessionTranscriptOut` models; blast radius: LOW (additive schema fields)
- `services/api/app/modules/trek_intelligence/service.py` — UPDATED: `list_ai_interaction_logs` propagates `session_id`; `get_session_transcript(db, session_key)` function added (joins TreksageChatSession → TreksageChatMessage → User); blast radius: LOW (additive)
- `services/api/app/api/routes/admin_treks.py` — UPDATED: `SessionTranscriptOut` imported; static route `GET /ai-logs/session/{session_key}` added BEFORE dynamic `/{slug}/` routes; blast radius: LOW (additive; static route must precede dynamic to avoid shadowing)
- `services/api/app/modules/trek_intelligence/treksage_agent.py` — UPDATED: `_RATE_LIMIT_DB=3`, `_DAILY_LIMIT_ANON=10`, `_DAILY_LIMIT_AUTH=30`, `_BYPASS_IPS`, `_TREK_KEYWORDS`, `_OFF_TOPIC_SIGNALS`; `_rate_redis()` factory (Redis DB 3); `is_off_topic(message)` fail-open keyword check; `check_daily_limit(user_id, ip)` Redis counter with 90000s TTL; blast radius: MEDIUM (called by chat route on every TrekSage message)
- `services/api/app/api/routes/treksage.py` — UPDATED: `check_daily_limit()` + `is_off_topic()` wired in `POST /treksage/chat`; `except HTTPException: raise` guard added before generic except; blast radius: MEDIUM (every TrekSage chat request now runs rate-limit + topic checks)
- `services/api/app/schemas/cms.py` — UPDATED: `trek_permit_required: bool | None` added to `CMSPageResponse`; blast radius: LOW (additive field, ORM column already existed)
- `apps/web-next/lib/api.ts` — UPDATED: `trek_permit_required` on `CMSPage` interface; `session_id` on `AIInteractionLogEntry`; `SessionMessageOut`/`SessionTranscriptOut` interfaces; `fetchTreksageSessionTranscript(sessionKey)` function; blast radius: LOW (additive)
- `apps/web-next/app/(admin)/admin/treksage-logs/page.tsx` — UPDATED: `Link` imported; "Conversation" column header + "View chat →" link per row; blast radius: LOW (admin leaf page)
- `apps/web-next/app/(admin)/admin/treksage-logs/[session_key]/page.tsx` — NEW: client component; session meta card + chat bubble transcript; blast radius: LOW (new page, no callers)
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — UPDATED: local `CMSPage` interface extended; 8 trek filter state vars + `trekStates` useMemo + `visiblePages` extended; trek filter UI row (state, difficulty, duration, permit, date ranges); blast radius: LOW (admin leaf page, client-side filtering only)

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

### Step 24 executed blast radius
- `app/modules/analytics/` created: new independent module; no existing code depends on it
- `app/modules/analytics/models.py` — AffiliateClick ORM; depends on `db.base.Base`, `db.mixins.UUIDPrimaryKeyMixin`
- `app/modules/analytics/service.py` — depends on `analytics.models`, `modules.leads.models`, `modules.newsletter.models`, `modules.cms.models`, `modules.pipeline.models`, `modules.agents.models`; all read-only COUNT queries (no writes to other modules)
- `app/schemas/analytics.py` — new schema file; no existing schemas depend on it
- `app/api/routes/analytics.py` — dual routers (public + admin); depends on `analytics.service`, `schemas.analytics`, `auth.dependencies`
- `app/db/base.py` changed: AffiliateClick imported and registered — additive; all existing importers unaffected
- `app/api/router.py` changed: analytics_public_router + analytics_admin_router registered — additive
- `alembic/versions/20260428_0014_analytics.py` — `affiliate_clicks` table; reversible via downgrade
- `apps/web-next/lib/analytics.ts` created: trackEvent utility; consumed by AffiliateCard, LeadForm, NewsletterCapture — no other files depend on it
- `apps/web-next/lib/api.ts` changed: AnalyticsSummary, AffiliateClickPayload, AgentRun interfaces added; fetchAnalyticsSummary, trackAffiliateClick, fetchAgentRuns helpers added — additive; no existing callers affected
- `apps/web-next/components/monetization/AffiliateCard.tsx` changed: onClick tracking added — additive; no layout or parent changes
- `apps/web-next/components/monetization/LeadForm.tsx` changed: trackEvent on submit — additive
- `apps/web-next/components/monetization/NewsletterCapture.tsx` changed: trackEvent on subscribe — additive
- `apps/web-next/app/layout.tsx` changed: GA4 script injection in head — conditional on NEXT_PUBLIC_GA4_ID; safe no-op if unset
- `apps/web-next/app/(admin)/admin/page.tsx` rewritten: "use client" component; fetches analytics summary + agent runs; no API contract changes
- `apps/web-next/app/(admin)/admin/analytics/page.tsx` rewritten: "use client" component; fetches analytics summary; no new API surface
- `apps/web-next/app/(admin)/admin/logs/page.tsx` rewritten: "use client" component; fetches /admin/agent-runs; no new API surface
- `apps/web-next/.env.local.example` changed: NEXT_PUBLIC_GA4_ID documented — additive
- `services/api/tests/test_cms.py` changed: 2 tests fixed with limit=10000 to handle 50+ pages in dev DB — no functional change
- GitNexus re-indexed: 5,106 nodes | 8,744 edges | 165 clusters | 172 flows

### Step 28 executed blast radius
- `alembic/versions/20260430_0018_compliance_fields.py` — additive: 5 columns on `content_drafts`, new `compliance_rules` table; reversible via downgrade
- `app/modules/compliance/` created — new independent module; no existing code depends on it at module level
- `app/modules/compliance/models.py` — ComplianceRule ORM; depends on `db.base.Base`, stdlib `uuid`/`datetime`
- `app/modules/compliance/service.py` — depends on `compliance.models`, `agents.compliance.agent`, `content.models.ContentDraft`; all writes scoped to compliance columns
- `app/modules/agents/compliance/` created — new agent module; depends on `langchain_anthropic`, `langgraph`, `content.models.ContentDraft`; reads draft, writes compliance_status + compliance_notes
- `app/schemas/compliance.py` — new schema file; consumed by `api/routes/compliance.py` only
- `app/api/routes/compliance.py` — two routers; depends on `compliance.service`, `schemas.compliance`, `auth.dependencies`; both require get_current_admin
- `app/db/base.py` changed: ComplianceRule imported and registered — additive; all existing importers unaffected
- `app/api/router.py` changed: compliance_router + compliance_rules_router registered — additive
- `app/modules/content/models.py` changed: ContentDraft gained 5 compliance columns — additive; all existing readers/writers of ContentDraft unaffected (new columns nullable/defaulted)
- `app/modules/publish/service.py` changed: publish_to_cms gained compliance gate — BREAKING for unchecked drafts with risky content (auto-runs check; may return 400 if flagged); existing tests updated with mock patch
- `services/api/tests/test_publish.py` changed: 3 publish success tests patched to mock compliance — no functional test regression
- `services/api/tests/test_compliance.py` created — 13 new tests; all isolated to compliance tables
- `apps/web-next/lib/api.ts` changed: 3 interfaces + 2 helpers appended — additive; no existing callers affected
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` changed: Draft interface + compliance UI added — additive; existing status/claims/publish flows unchanged
- `apps/web-next/next.config.mjs` changed: experimental.proxyTimeout: 120_000 — affects all proxied /api/v1 calls; raises timeout ceiling from 30s to 120s
- `CLAUDE.md` + `docs/PROCESS_GUARDRAILS.md` changed: process documentation only; no code impact
- GitNexus re-indexed post-step: 6,164 nodes | 10,475 edges | 200 clusters | 187 flows
### Step 31 — Email Automation and Audience Workflows blast radius
- `services/api/alembic/versions/20260430_0020_email_sequences.py` — NEW: subscriber_tags, email_sequences, email_sequence_steps, subscriber_sequence_enrollments tables; preferences JSON + active Boolean on newsletter_subscribers; blast radius: LOW (new tables, additive columns)
- `services/api/app/modules/email_sequences/models.py` — NEW: SubscriberTag, EmailSequence, EmailSequenceStep, SubscriberSequenceEnrollment ORM models; blast radius: LOW (new module)
- `services/api/app/modules/email_sequences/service.py` — NEW: seed_default_sequences, add_subscriber_tag, enroll_subscriber, enroll_by_tag, update_subscriber_preferences, generate/verify_preferences_token, get_pending_enrollments; blast radius: LOW (called by tasks + routes only)
- `services/api/app/modules/email_sequences/tasks.py` — NEW: send_welcome_email_task + process_nurture_sequences_task Celery tasks; blast radius: LOW (async tasks, no sync callers)
- `services/api/app/api/routes/email_sequences.py` — NEW: admin_router (GET/GET/{id}/POST seed/POST enroll) + public_router (PATCH /newsletter/preferences, GET /newsletter/unsubscribe); blast radius: LOW (new routes)
- `services/api/app/schemas/email_sequences.py` — NEW: response schemas; blast radius: LOW
- `services/api/app/modules/newsletter/models.py` — UPDATED: preferences JSON + active Boolean added to NewsletterSubscriber; blast radius: MEDIUM (7 direct callers: subscribe, base.py, newsletter service, analytics service, newsletter_admin, social_repurpose agent, newsletter agent — all additive-safe since new fields are nullable/have defaults)
- `services/api/app/modules/leads/service.py` — UPDATED: subscriber tagging hook added after commit in create_lead; blast radius: LOW (1 direct caller: submit_lead route; tagging is try/except wrapped)
- `services/api/app/api/routes/auth.py` — UPDATED: send_welcome_email_task.delay() fired after signup; try/except wrapped; blast radius: LOW (never blocks signup response)
- `services/api/app/worker/celery_app.py` — UPDATED: email_sequences tasks in include; daily-nurture-sequences beat entry; blast radius: LOW (additive)
- `services/api/app/db/base.py` — UPDATED: 4 new models registered; blast radius: LOW (additive)
- `services/api/app/api/router.py` — UPDATED: email_sequences_admin_router + email_sequences_public_router registered; blast radius: LOW (additive)
- `services/api/pyproject.toml` — UPDATED: jinja2>=3.1,<4.0 added; blast radius: LOW (new transitive dep)
- `services/api/tests/test_email_sequences.py` — NEW: 17 tests; blast radius: LOW (test file)
- `apps/web-next/lib/api.ts` — UPDATED: EmailSequence, EmailSequenceStep, SeedSequencesResult; fetchEmailSequences, fetchEmailSequence, seedEmailSequences; blast radius: LOW (additive)
- `apps/web-next/app/(admin)/admin/email-sequences/page.tsx` — NEW: admin email sequences list page; blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/layout.tsx` — UPDATED: Email Sequences nav item (Workflow icon) added to Growth group; blast radius: MEDIUM (admin nav, affects sidebar for all admin pages)
- GitNexus re-indexed: 6,857 nodes | 11,664 edges | 236 clusters | 185 flows

### Step 32 — Revenue Attribution Dashboards blast radius
- `services/api/alembic/versions/20260430_0021_revenue_attributions.py` — NEW: revenue_config + revenue_attributions + executive_summaries tables; blast radius: LOW (new tables)
- `services/api/app/modules/revenue/__init__.py` — NEW: package init; blast radius: LOW
- `services/api/app/modules/revenue/models.py:RevenueConfig` — NEW: ORM for revenue config constants; blast radius: LOW (only imported by revenue service/routes)
- `services/api/app/modules/revenue/models.py:RevenueAttribution` — NEW: ORM for daily revenue rows; FK→pages (linking module), FK→keyword_clusters; blast radius: LOW
- `services/api/app/modules/revenue/models.py:ExecutiveSummary` — NEW: ORM for weekly digest storage; blast radius: LOW
- `services/api/app/modules/revenue/service.py` — NEW: _ensure_config (lazy default seed), aggregate_revenue, revenue_by_cluster, revenue_by_page_type, decaying_pages, upsert_executive_summary; blast radius: LOW (called only by revenue routes + tasks)
- `services/api/app/modules/revenue/tasks.py` — NEW: aggregate_revenue_task (daily), generate_executive_summary_task (weekly); blast radius: LOW (new Celery tasks)
- `services/api/app/modules/agents/executive_summary/__init__.py` — NEW; blast radius: LOW
- `services/api/app/modules/agents/executive_summary/agent.py:ExecutiveSummaryAgent` — NEW: 3-node LangGraph; gather_data → generate_summary → store_summary; uses get_anthropic_client(); blast radius: LOW (new module, called only by generate_executive_summary_task)
- `services/api/app/api/routes/revenue.py` — NEW: 8 endpoints under /admin/revenue; requires get_current_admin; blast radius: LOW (new routes)
- `services/api/app/schemas/revenue.py` — NEW: 7 response/request schemas; blast radius: LOW
- `services/api/app/db/base.py` — UPDATED: RevenueConfig, RevenueAttribution, ExecutiveSummary registered; blast radius: LOW (additive)
- `services/api/app/api/router.py` — UPDATED: revenue_router registered; blast radius: LOW (additive)
- `services/api/app/worker/celery_app.py` — UPDATED: revenue.tasks in include; daily-aggregate-revenue + weekly-executive-summary beat entries; blast radius: LOW (additive)
- `services/api/tests/test_revenue.py` — NEW: 18 tests; blast radius: LOW (test file)
- `apps/web-next/app/(admin)/admin/revenue/page.tsx` — NEW: cluster table, page-type table, decay list, config editor, summaries panel; blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/layout.tsx` — UPDATED: Revenue nav item (TrendingUp icon) added before Monetization; blast radius: MEDIUM (admin nav)
- `apps/web-next/lib/api.ts` — UPDATED: 7 revenue types + 7 fetch/patch helpers; blast radius: LOW (additive)

### Step 33 — Premium User Accounts + Bookmarks blast radius
- `services/api/alembic/versions/20260430_0022_user_accounts.py` — NEW: user_bookmarks + user_downloads + trek_alerts + user_profiles tables; blast radius: LOW (new tables)
- `services/api/app/modules/account/__init__.py` — NEW; blast radius: LOW
- `services/api/app/modules/account/models.py` — NEW: UserBookmark (FK→users CASCADE, FK→cms_pages CASCADE), UserDownload (FK→users CASCADE), TrekAlert (FK→users CASCADE), UserProfile (FK→users CASCADE UNIQUE); blast radius: LOW (new models)
- `services/api/app/modules/account/service.py` — NEW: add/remove/list_bookmarks (enriched with CMSPage), record/list_downloads, add/remove/list_alerts, get/upsert_profile; blast radius: LOW (called only by account routes)
- `services/api/app/api/routes/account.py` — NEW: 9 endpoints under /account; all require get_current_user; blast radius: LOW (new routes)
- `services/api/app/schemas/account.py` — NEW: 6 response/request schemas; blast radius: LOW
- `services/api/app/db/base.py` — UPDATED: UserBookmark, UserDownload, TrekAlert, UserProfile registered; blast radius: LOW (additive)
- `services/api/app/api/router.py` — UPDATED: account_router registered; blast radius: LOW (additive)
- `services/api/tests/test_account.py` — NEW: 20 tests; blast radius: LOW (test file)
- `apps/web-next/app/(public)/account/saved/page.tsx` — REWRITTEN: client component; real bookmarks API; blast radius: LOW (leaf account page)
- `apps/web-next/app/(public)/account/downloads/page.tsx` — REWRITTEN: client component; real downloads API; blast radius: LOW (leaf account page)
- `apps/web-next/components/account/BookmarkButton.tsx` — NEW: client toggle component; blast radius: LOW (not yet imported by any trek page)
- `apps/web-next/app/(auth)/auth/onboarding/page.tsx` — UPDATED: step 3 submit wired to upsertUserProfile + router.push("/explore"); blast radius: LOW (leaf auth page)
- `apps/web-next/lib/api.ts` — UPDATED: 5 account types + 9 account helpers; blast radius: LOW (additive)
- GitNexus re-indexed: 7,396 nodes | 12,613 edges | 266 clusters | 199 flows

### Step 33 Bug Fixes blast radius
- `apps/web-next/components/trek/TrekCard.tsx` — UPDATED: bookmark button now calls fetchCMSPage(slug) → addBookmark/removeBookmark; local bookmarked state with optimistic toggle; graceful silent fail on 401/404; blast radius: MEDIUM (used on explore page, homepage, account dashboard, trek rails — all get working bookmark toggle)
- `apps/web-next/app/(public)/account/page.tsx` — REWRITTEN: converted from server component with hardcoded stats to client component; fetches fetchBookmarks + fetchDownloads + fetchAlerts; real counts in stat cards; Recently Saved shows real bookmarked CMS pages; blast radius: LOW (leaf account page)

### Step 36 — User-Intent Aware Monetization blast radius
- `services/api/alembic/versions/20260505_0026_intent_monetization.py` — NEW: affiliate_products + page_intent_sessions; blast radius: LOW (new tables)
- `services/api/app/modules/monetization/__init__.py` — NEW; blast radius: LOW
- `services/api/app/modules/monetization/models.py` — NEW: AffiliateProduct + PageIntentSession ORM; blast radius: LOW (new models, only imported by monetization service/routes)
- `services/api/app/modules/agents/intent/__init__.py` — NEW; blast radius: LOW
- `services/api/app/modules/agents/intent/agent.py` — NEW: `classify_intent` with Anthropic SDK + rule-based fallback; blast radius: LOW (called only by monetization service)
- `services/api/app/modules/monetization/service.py` — NEW: intent classification, affiliate CRUD, stats; blast radius: LOW (called only by monetization routes)
- `services/api/app/schemas/monetization.py` — NEW: monetization schemas; blast radius: LOW
- `services/api/app/api/routes/monetization.py` — NEW: 7 endpoints; blast radius: LOW (new routes)
- `services/api/app/modules/auth/dependencies.py` — UPDATED: `get_optional_user` added (additive, does not change existing `get_current_user`); blast radius: LOW
- `services/api/app/db/base.py` — UPDATED: AffiliateProduct + PageIntentSession registered; blast radius: LOW (additive)
- `services/api/app/api/router.py` — UPDATED: monetization_router registered; blast radius: LOW (additive)
- `services/api/tests/test_intent.py` — NEW: 15 tests; blast radius: LOW (test file)
- `apps/web-next/lib/api.ts` — UPDATED: Intent/Affiliate/MonetizationStats types + 8 fetch helpers; blast radius: LOW (additive)
- `apps/web-next/components/monetization/MonetizationSlot.tsx` — NEW: server component for dynamic CTA; blast radius: LOW (leaf component)
- `apps/web-next/app/(admin)/admin/monetization/page.tsx` — REWRITTEN: real API data; blast radius: LOW (leaf admin page)
- GitNexus: pending re-index after commit

### Step 35 — Advanced Recommendation Engine blast radius
- `docker-compose.yml` — UPDATED: postgres image → `pgvector/pgvector:pg16`; blast radius: LOW (data volume preserved, same PG16 data format)
- `services/api/alembic/versions/20260504_0025_pgvector_embeddings.py` — NEW: CREATE EXTENSION vector; ADD COLUMN embedding vector(1536) to cms_pages; blast radius: LOW (additive column, nullable)
- `services/api/app/modules/cms/models.py` — UPDATED: `embedding` Vector(1536) column added; blast radius: MEDIUM (CMSPage model used by all CMS routes — column is nullable, non-breaking reads)
- `services/api/app/modules/agents/embedding/__init__.py` — NEW; blast radius: LOW
- `services/api/app/modules/agents/embedding/agent.py` — NEW: `generate_embedding`, `embed_page`; blast radius: LOW (called by publish service + refresh tasks, all wrapped in try/except)
- `services/api/app/modules/recommendations/__init__.py` — NEW; blast radius: LOW
- `services/api/app/modules/recommendations/service.py` — NEW: `find_similar_pages`, `find_similar_to_query`, `get_recommendations_for_user`, `get_anonymous_recommendations`, helpers; blast radius: LOW (new module, called only by recommendations routes)
- `services/api/app/schemas/recommendations.py` — NEW: `RecommendationItem`, `SimilarPagesResponse`, `RecommendationsResponse`; blast radius: LOW
- `services/api/app/api/routes/recommendations.py` — NEW: 4 endpoints (`/pages/{slug}/similar`, `/account/recommendations`, `/recommendations`, `/search`); blast radius: LOW (new routes)
- `services/api/app/api/router.py` — UPDATED: `recommendations_router` registered; blast radius: LOW (additive)
- `services/api/app/modules/publish/service.py` — UPDATED: `embed_page` triggered post-publish; blast radius: LOW (wrapped try/except, never blocks publish)
- `services/api/app/modules/refresh/tasks.py` — UPDATED: `embed_page` triggered post-refresh; blast radius: LOW (same try/except pattern)
- `services/api/app/core/config.py` — UPDATED: `openai_api_key` setting added; blast radius: LOW (optional, defaults None)
- `services/api/pyproject.toml` — UPDATED: openai + pgvector deps; blast radius: LOW (new deps)
- `services/api/tests/test_recommendations.py` — NEW: 15 tests; blast radius: LOW (test file)
- `apps/web-next/lib/api.ts` — UPDATED: `RecommendationItem`, `SimilarPagesResponse`, `RecommendationsResponse` types + 3 fetch helpers; blast radius: LOW (additive)
- `apps/web-next/components/content/RecommendedContent.tsx` — NEW: server component for similar pages on trek detail; blast radius: LOW (leaf component)
- `apps/web-next/components/content/PersonalisedFeed.tsx` — NEW: client component for personalised/anonymous feed on explore; blast radius: LOW (leaf component)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: `<RecommendedContent>` replaces static related section; blast radius: LOW (leaf page, content-only change)
- `apps/web-next/app/(public)/explore/page.tsx` — UPDATED: `<PersonalisedFeed>` section added below trek grid; blast radius: LOW (additive UI section)
- `apps/web-next/app/(public)/search/page.tsx` — UPDATED: semantic search useEffect + Sparkles results section for >3-word queries; blast radius: LOW (additive UI section)
- GitNexus: 7,443 symbols | 12,689 relationships | 196 flows (pending re-index after commit)

### Step 34 — Digital Product Checkout and File Delivery blast radius
- `services/api/alembic/versions/20260501_0024_digital_products.py` — NEW: digital_products + user_orders tables; ALTERs user_downloads (order_id FK + download_url); blast radius: LOW (new tables, one non-breaking ALTER)
- `services/api/app/modules/products/__init__.py` — NEW; blast radius: LOW
- `services/api/app/modules/products/models.py` — NEW: DigitalProduct + UserOrder ORM models; blast radius: LOW (new models, only imported by products service/routes)
- `services/api/app/modules/products/service.py` — NEW: HMAC token helpers, product CRUD, create_checkout_order (Razorpay/test), verify_checkout_payment, serve_download_file, list_orders; blast radius: LOW (called only by products/checkout routes)
- `services/api/app/api/routes/products.py` — NEW: 7 public + admin endpoints; blast radius: LOW (new routes)
- `services/api/app/api/routes/checkout.py` — NEW: POST /checkout/create-order, POST /checkout/verify, GET /account/downloads/file; blast radius: LOW (new routes)
- `services/api/app/schemas/products.py` — NEW: ProductResponse, ProductCreate, ProductPatch, OrderResponse, Checkout* schemas; blast radius: LOW
- `services/api/app/modules/account/models.py` — UPDATED: UserBookmark cms_page_id nullable + trek_slug/bookmark_title/bookmark_image_url; UserDownload order_id FK + download_url; blast radius: MEDIUM (UserDownload used by account service/routes — schema-additive, non-breaking)
- `services/api/app/db/base.py` — UPDATED: DigitalProduct, UserOrder registered; blast radius: LOW (additive)
- `services/api/app/api/router.py` — UPDATED: products_public_router, products_admin_router, checkout_router registered; blast radius: LOW (additive)
- `services/api/pyproject.toml` — UPDATED: razorpay>=1.4.1,<2.0.0; blast radius: LOW (new dep)
- `services/api/tests/test_products.py` — NEW: 20 tests; blast radius: LOW (test file)
- `apps/web-next/app/(public)/products/page.tsx` — REWRITTEN: real API; blast radius: LOW (leaf public page)
- `apps/web-next/app/(public)/products/[slug]/page.tsx` — REWRITTEN: real product detail + Razorpay embed; blast radius: LOW (leaf dynamic page)
- `apps/web-next/app/(public)/success/checkout/page.tsx` — REWRITTEN: reads order_id query param, fetches real download URL; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/account/downloads/page.tsx` — UPDATED: DownloadButton with real signed URL fetch; blast radius: LOW (leaf account page)
- `apps/web-next/app/(admin)/admin/products/page.tsx` — NEW: admin product CRUD page; blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/orders/page.tsx` — NEW: admin orders list; blast radius: LOW (leaf admin page)
- `apps/web-next/app/(admin)/admin/layout.tsx` — UPDATED: Products (Package) + Orders (ShoppingBag) nav items added; blast radius: MEDIUM (admin nav)
- `apps/web-next/lib/api.ts` — UPDATED: DigitalProduct/UserOrder types + 9 product/checkout helpers; DownloadResponse: order_id + download_url added; blast radius: LOW (additive)

### Pre-Launch Sprint — Auth gaps blast radius
- `services/api/app/core/security.py` — UPDATED: create_reset_token (1h JWT with typ=password_reset), parse_reset_token; blast radius: LOW (new helpers, not called by existing code)
- `services/api/app/schemas/auth.py` — UPDATED: ForgotPasswordRequest, ResetPasswordRequest, AccountSettingsUpdate, LeadResponse added; UserResponse.subscription_plan: str = "free" added; blast radius: LOW (additive schemas)
- `services/api/app/api/routes/auth.py` — UPDATED: POST /auth/forgot-password (HMAC JWT, graceful SMTP), POST /auth/reset-password (verify + set password_hash), PATCH /auth/me (update full_name/display_name), GET /auth/me/leads (enquiries by user email); blast radius: MEDIUM (auth route touched, additive endpoints)
- `apps/web-next/app/(auth)/auth/forgot-password/page.tsx` — REWRITTEN: wired to POST /auth/forgot-password; success state with "Check your inbox"; blast radius: LOW (leaf auth page)
- `apps/web-next/app/(auth)/auth/reset-password/page.tsx` — REWRITTEN: reads ?token= from URL, calls POST /auth/reset-password, success redirect; Suspense boundary for useSearchParams; blast radius: LOW (leaf auth page)

### Pre-Launch Sprint — Frontend stubs blast radius
- `apps/web-next/components/content/CMSPageHub.tsx` — NEW: reusable CMS page grid for hub pages; fetchCMSHubPages helper (server-side, 1h revalidate); blast radius: LOW (imported by content hub pages only)
- `apps/web-next/app/(public)/compare/page.tsx` — REWRITTEN: dynamic trek selector (two dropdowns from static data, live comparison table, full guide links); client component; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/account/settings/page.tsx` — REWRITTEN: wired to PATCH /auth/me for profile update; password change via forgot-password flow; blast radius: LOW (leaf account page)
- `apps/web-next/app/(public)/account/enquiries/page.tsx` — REWRITTEN: wired to GET /auth/me/leads; status badges, empty state, new enquiry CTA; blast radius: LOW (leaf account page)
- `apps/web-next/app/(public)/itineraries/page.tsx` — UPDATED: CMSPageHub (page_type=itinerary) + ContentPage static fallback; blast radius: LOW
- `apps/web-next/app/(public)/costs/page.tsx` — UPDATED: CMSPageHub (page_type=cost_guide) + static fallback; blast radius: LOW
- `apps/web-next/app/(public)/gear/page.tsx` — UPDATED: CMSPageHub (page_type=gear_guide) + static fallback; blast radius: LOW
- `apps/web-next/app/(public)/beginner/page.tsx` — UPDATED: CMSPageHub (page_type=beginner_guide) + beginner trek grid + static fallback; blast radius: LOW
- `apps/web-next/app/(public)/safety/page.tsx` — UPDATED: CMSPageHub (page_type=safety_guide) + static fallback; blast radius: LOW

### Pre-Launch Sprint — Admin + Testing blast radius
- `apps/web-next/app/(admin)/admin/operators/[id]/page.tsx` — NEW: operator detail page; agreement GET/POST/PATCH form; review list with delete; blast radius: LOW (new admin page)
- `apps/web-next/app/(admin)/admin/operators/page.tsx` — UPDATED: FileText icon linking to detail page per operator row; blast radius: LOW (additive icon)
- `apps/web-next/playwright.config.ts` — NEW: Playwright config (chromium, baseURL=localhost:3000, webServer auto-start); blast radius: LOW (test infrastructure only)
- `apps/web-next/e2e/homepage.spec.ts` — NEW: 6 E2E tests (hero, search, pills, operators CTA, plan CTA, mobile); blast radius: LOW (test file)
- `apps/web-next/e2e/auth.spec.ts` — NEW: 5 E2E tests (sign-up, sign-in, wrong creds, forgot-password page, account redirect); blast radius: LOW
- `apps/web-next/e2e/search.spec.ts` — NEW: 2 E2E tests (search loads, query returns results); blast radius: LOW
- `apps/web-next/e2e/plan.spec.ts` — NEW: 4 E2E tests (wizard loads, 4-step navigation, generate button); blast radius: LOW
- `docs/PRELAUNCH_CHECKLIST.md` — NEW: comprehensive 60+ item go-live checklist across 9 sections; blast radius: LOW (documentation only)

### Pre-Launch Sprint — UI polish blast radius
- `apps/web-next/app/(public)/page.tsx` — UPDATED: hero overflow:hidden moved to image container (fixes search bar clip); pt-32→pt-24; font 88px→72px; pill text "Explore · Experience · Escape"; planning resources section uses real trek images; operators CTA section added; blast radius: MEDIUM (homepage — visible to all users)
- `apps/web-next/components/trek/TrekCard.tsx` — UPDATED: diffColors replaced from bg-*/15 (15% opacity, invisible on photos) to solid bg-emerald-600/bg-amber-500/bg-orange-600/bg-red-600 with white text + shadow; backdrop-blur removed from difficulty tag; Beginner tag → bg-blue-600; blast radius: HIGH structurally (TrekCard used on homepage, explore, search, beginner pages — visual fix only, no behaviour change)
- `apps/web-next/components/layout/Footer.tsx` — UPDATED: newsletter card backdrop-blur-sm removed (was bleeding through mountain SVG boundary) → solid bg-foreground/40; "Bengaluru" → "Gurgaon"; Heart icon added to copyright; pt-32→pt-28; blast radius: MEDIUM (footer on every public page — visual fix only)
- `apps/web-next/app/(public)/about/page.tsx` — REWRITTEN: full editorial mission, story, promises, team, contact content; blast radius: LOW (leaf trust page)
- `apps/web-next/app/(public)/about/authors/page.tsx` — REWRITTEN: editor bios, contributor policy, join team; blast radius: LOW
- `apps/web-next/app/(public)/contact/page.tsx` — REWRITTEN: contact channels, response times, FAQs; blast radius: LOW
- `apps/web-next/app/(public)/privacy/page.tsx` — REWRITTEN: full 8-section privacy policy; blast radius: LOW
- `apps/web-next/app/(public)/terms/page.tsx` — REWRITTEN: full 9-section T&C with liability and governing law; blast radius: LOW
- `apps/web-next/app/(public)/affiliate-disclosure/page.tsx` — REWRITTEN: affiliate programme disclosure, independence policy; blast radius: LOW
- `apps/web-next/app/(public)/safety-disclaimer/page.tsx` — REWRITTEN: AMS, permit accuracy, emergency contacts, liability; blast radius: LOW
- `apps/web-next/app/(public)/methodology/page.tsx` — REWRITTEN: verification cycle, YMYL policy, AI use disclosure, error correction; blast radius: LOW

### Logo + Hero + Footer fixes blast radius
- `apps/web-next/components/brand/Logo.tsx` — REWRITTEN: SVG LogoMark circular badge (orange/green gradient, mountain silhouette, trekker) replaces lucide Mountain icon; tagline "Explore · Experience · Escape"; blast radius: MEDIUM (Logo used in Header, Footer, auth pages — visual change only)
- `apps/web-next/app/(public)/page.tsx` — UPDATED: hero layout `flex items-end` removed → `flex flex-col` with content in `flex-1 justify-center`; trust stats use `mt-auto`; heading now visible on page load; blast radius: LOW (leaf homepage)
- `apps/web-next/components/layout/Footer.tsx` — UPDATED: newsletter card bg-foreground/40 (invisible dark-on-dark) → bg-white/[0.07] border border-white/20; pt-28 → pt-36 to clear mountain SVG; blast radius: MEDIUM (footer on every public page — visual fix only)

### Logo Redesign + Fuse.js Search + Hero Height blast radius
- `apps/web-next/components/brand/Logo.tsx` — REWRITTEN (v3): navy outer ring, orange-amber sky gradient, corrected tagline "Explore. Dream. Discover."; blast radius: MEDIUM (Header, Footer, auth pages — visual only)
- `apps/web-next/app/(public)/page.tsx` — UPDATED: min-h-screen → min-h-[85vh] md:min-h-[78vh]; pt-20 pb-16; font 64px; pill "Explore. Dream. Discover."; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/search/page.tsx` — REWRITTEN: Fuse.js fuzzy search (trekFuse/guideFuse/suggestionFuse instances); autocomplete dropdown; outside-click/Escape dismiss; no-results quick suggestions; blast radius: LOW (leaf page)
- `apps/web-next/package.json` — UPDATED: fuse.js@^7.3.0 added; blast radius: LOW (new dep, build-time only)
- `docs/PRELAUNCH_CHECKLIST.md` — REWRITTEN: comprehensive 8-section audit (80+ items); blast radius: LOW (documentation)

### Header Nav + Compare Responsive blast radius
- `apps/web-next/components/brand/Logo.tsx` — UPDATED: compact prop added (hides tagline); blast radius: LOW (additive prop, default false preserves existing behaviour)
- `apps/web-next/components/layout/Header.tsx` — UPDATED: Logo compact, search functional (onClick+⌘K→/search), mobile search functional, nav px-2.5, useEffect import; blast radius: MEDIUM (header on every public page — visual + functional fix only)
- `apps/web-next/app/(public)/page.tsx` — UPDATED: compare section fully responsive (heading text-2xl→sm:text-3xl→md:text-4xl, card p-3 md:p-4, text-sm md:text-base, no overflow); blast radius: LOW (leaf homepage)

### fix: badge dedup + TouristTrip schema (2026-05-21) blast radius
- `apps/web-next/lib/schema.ts` — ADDED: buildTrekSchema() — new TouristTrip JSON-LD schema function; blast radius: LOW (additive, doesn't touch buildArticleSchema)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: badge dedup IIFE prevents suitability badge when identical to difficulty (case-insensitive); trekSchema injected alongside articleSchema; blast radius: LOW (trek detail pages only)

### fix: trek detail page difficulty + suitability badges (2026-05-21) blast radius
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — FIXED: difficulty badge no longer uses .split(" ")[0] (was showing "VERY" instead of "Very Difficult"); now reads cmsPage.trek_difficulty first, falls back to trek_facts.difficulty; suitability badge reads cmsPage.trek_suitability so "Advanced / Experienced", "Intermediate" etc. display correctly; blast radius: LOW (trek detail pages only)

### Step 54 — Explore + Home Completeness (2026-05-21) blast radius
- `services/api/alembic/versions/20260521_0035_cms_is_featured.py` — NEW: is_featured column; blast radius: LOW
- `services/api/app/modules/cms/models.py` — UPDATED: is_featured mapped column; blast radius: LOW (additive)
- `services/api/app/schemas/cms.py` — UPDATED: CMSPagePatch + Response include is_featured; blast radius: LOW
- `services/api/app/api/routes/cms.py` — ADDED: GET /cms/pages/trending endpoint; blast radius: LOW
- `apps/web-next/lib/api.ts` — ADDED: fetchAllCMSTreks() + fetchTrendingTreks() + is_featured fields; blast radius: LOW
- `apps/web-next/app/(public)/explore/page.tsx` — UPDATED: fetchAllCMSTreks() as baseList, is_featured sort, PAGE_SIZE pagination, empty state, removed hardcoded stub sections; blast radius: HIGH (explore page)
- `apps/web-next/app/(public)/page.tsx` — UPDATED: fetchTrendingTreks(4) for trending section; blast radius: MEDIUM (homepage)
- `apps/web-next/components/home/SeasonalTreksSection.tsx` — UPDATED: cmsPages prop + cmsToTrek() + improved season range matching; blast radius: MEDIUM (homepage seasonal section)
- `apps/web-next/components/admin/CMSPageForm.tsx` — UPDATED: isFeatured state + checkbox in Trek metadata; blast radius: LOW (admin-only)

### Step 53 — UX Bug Fixes (2026-05-20) blast radius
- `apps/web-next/lib/api.ts` — ADDED: CMSTrekCard interface + fetchCMSTreksByState() + FilterFacets + fetchFilterFacets() + STATIC_FILTER_FACETS; blast radius: LOW (additive)
- `apps/web-next/app/(public)/regions/[slug]/page.tsx` — UPDATED: CMS state treks merge, season chart replaced, CMSTrekCard typed import; blast radius: MEDIUM (regions pages)
- `apps/web-next/app/(public)/explore/page.tsx` — UPDATED: dynamic filterGroups from facets, applyFilters() AND/OR logic wired, sidebar scroll CSS; blast radius: HIGH (explore page — filter now actually hides/shows treks)
- `apps/web-next/app/(public)/page.tsx` — UPDATED: home trending applies cmsOverrides; blast radius: MEDIUM (homepage)
- `apps/web-next/components/home/DifficultyTabsSection.tsx` — UPDATED: trek_difficulty + trek_state columns used; blast radius: MEDIUM (home difficulty section)
- `services/api/app/api/routes/treks.py` — ADDED: GET /filter-facets endpoint; blast radius: LOW

### Step 52 — Dynamic Explore Filters (2026-05-20) blast radius
(see Step 53 above — both implemented together)

### Step 51 — Trek Entity Wiring + Explore/Regions Fixes (2026-05-20) blast radius
- `apps/web-next/lib/api.ts` — UPDATED: fetchTrekCMSOverrides() extended to return CMSTrekOverride {image,title,difficulty,duration,season,suitability,altitude}; blast radius: MEDIUM (explore + regions + any consumer)
- `apps/web-next/components/trek/TrekCard.tsx` — UPDATED: Trek.difficulty widened to string; diffColors extended (Easy–Moderate etc.); suitability?: string added; beginner badge checks suitability; blast radius: HIGH (TrekCard used everywhere — additive only, no breaking change)
- `apps/web-next/app/(public)/regions/[slug]/page.tsx` — UPDATED: removed .concat(treks) dedup fix; full entity merge (difficulty/duration/season/altitude/suitability); "View all treks in X" → /explore?state=X; blast radius: MEDIUM (regions pages)
- `apps/web-next/app/(public)/explore/page.tsx` — UPDATED: ExploreContent + Suspense wrapper; functional sort with tiebreakers (Featured/Difficulty/Duration/Altitude); ?state= URL param pre-filter; full entity merge; blast radius: HIGH (explore page)
- `apps/web-next/lib/state-sitemap.ts` — NEW: generateStateTrekSitemap() helper; blast radius: LOW
- 7 state sitemap route files (uttarakhand/himachal/kashmir/ladakh/maharashtra/sikkim/karnataka) — NEW; blast radius: LOW
- `apps/web-next/app/sitemap.ts` — UPDATED: 7 state sitemap URLs added; blast radius: LOW
- `docs/steps/STEP-51-trek-entity-wiring-explore-regions.md` — NEW

### Step 50 — Trek Page Quality Fixes (2026-05-20) blast radius
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: seo_title strip; blast radius: LOW (fixes title only)
- `services/api/app/modules/linking/service.py` — UPDATED: sync_pages_from_cms adds DELETE for excluded types; blast radius: MEDIUM (next admin sync will remove stale editorial pages from linking graph)
- `apps/web-next/lib/api.ts` — ADDED: fetchTrekCMSOverrides(); blast radius: LOW (new additive export)
- `apps/web-next/app/(public)/explore/page.tsx` — UPDATED: CMS image merge in useEffect; blast radius: MEDIUM (explore page trek cards, graceful fallback to static)
- `apps/web-next/app/(public)/regions/[slug]/page.tsx` — UPDATED: server-side CMS image merge; blast radius: MEDIUM (regions pages trek cards, graceful fallback)

### Step 49 — Breadcrumb State Fix + Dropdowns (2026-05-19) blast radius
- `services/api/app/modules/cms/service.py` — ADDED: _STATE_ALIASES dict + _normalize_state(); _state_from_base() normalizes to canonical spelling; blast radius: LOW (additive, only affects auto-extracted trek_state values going forward)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: STATE_TO_REGION_SLUG map replaces raw toLowercase slug generation for breadcrumb; blast radius: MEDIUM (every trek guide page breadcrumb — but safer, never falls through to himachal)
- `apps/web-next/components/admin/CMSPageForm.tsx` — UPDATED: trek_state/difficulty/season/suitability → controlled dropdowns with canonical option lists; blast radius: LOW (admin-only)

### Step 48 — Critical Pipeline + CMS Fixes (2026-05-19) blast radius
- `services/api/app/modules/content/service.py` — ADDED: upsert_topic() upsert function; blast radius: LOW (additive)
- `services/api/app/modules/agents/trend_discovery/agent.py` — UPDATED: create_topic → upsert_topic; blast radius: MEDIUM (fixes pipeline for all re-runs; behavior change: slug conflict now returns existing topic instead of skipping)
- `services/api/app/modules/cms/service.py` — UPDATED: reparse_sections_from_draft rewritten for robustness; blast radius: LOW (only called by reparse endpoint; now partial success vs hard failure)
- `services/api/app/schemas/cms.py` — UPDATED: CMSPagePatch has 6 trek_* fields; blast radius: MEDIUM (all CMS PATCH requests now accept trek metadata)
- `apps/web-next/lib/api.ts` — UPDATED: CMSPagePayload has 6 trek_* fields; blast radius: LOW (additive)
- `apps/web-next/components/admin/CMSPageForm.tsx` — UPDATED: trek metadata editable inputs replacing read-only display; blast radius: LOW (admin-only)
- `services/api/tests/test_cms.py`, `test_pipeline.py` — UPDATED: assertions updated for new behavior

### Step 47 — Trek Guide Quality Fixes (2026-05-19) blast radius
- `services/api/app/modules/linking/service.py` — UPDATED: _EXCLUDED_FROM_LINKING frozenset; sync_pages_from_cms excludes editorial/hub types; get_related_pages filters to safe_types; _page_type_from_cms explicit mapping expanded; blast radius: MEDIUM (linking sync runs post-publish + admin sync; now filters correctly)
- `services/api/app/modules/cms/service.py` — UPDATED: _FACT_TABLE base and season patterns broadened; _FACT_KV base and permits patterns improved; blast radius: LOW (purely additive regex, doesn't break existing matches)
- `apps/web-next/components/admin/CMSPageForm.tsx` — UPDATED: trek metadata read-only panel added for trek_guide pages; blast radius: LOW (admin-only, additive display)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: Quick Utilities links to /trek/[slug]/packing etc.; blast radius: MEDIUM (every trek guide page sidebar)
- `apps/web-next/app/(public)/trek/[slug]/packing/page.tsx` — NEW: trek-specific packing page; blast radius: LOW (new route)
- `apps/web-next/app/(public)/trek/[slug]/permits/page.tsx` — NEW: trek-specific permit page; blast radius: LOW (new route)
- `apps/web-next/app/(public)/trek/[slug]/costs/page.tsx` — NEW: trek-specific cost page; blast radius: LOW (new route)
- `docs/URL_MAP.md` — UPDATED: /trek/[slug]/packing, /permits, /costs added

### fix: search did-you-mean + pipeline force_page_type (commit 4fa074a, 2026-05-19) blast radius
- `apps/web-next/app/(public)/search/page.tsx` — UPDATED: dedicated `didYouMeanFuse` (name-only, threshold 0.55) replaces trekFuse-based check; blast radius: LOW (leaf page)
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx` — UPDATED: Force page type dropdown added to TriggerForm; blast radius: LOW (admin-only)
- `apps/web-next/lib/api.ts` — UPDATED: `force_page_type?: string` added to triggerPipeline payload; blast radius: LOW (additive)
- `services/api/app/schemas/pipeline.py` — UPDATED: `force_page_type: str | None` on PipelineRunCreate; blast radius: LOW (additive)
- `services/api/app/api/routes/pipeline.py` — UPDATED: force_page_type forwarded into input_data; blast radius: LOW
- `services/api/app/modules/agents/trend_discovery/agent.py` — UPDATED: filters topics to forced page_type; blast radius: MEDIUM (affects topic selection for all pipeline runs using force_page_type)
- `services/api/app/modules/pipeline/service.py` — UPDATED: force_page_type propagated to trend_discovery and content_brief inputs; blast radius: MEDIUM (pipeline orchestration)

### fix: publish HTTP 500 — trek_meta savepoint (commit 2026-05-19) blast radius
- `services/api/app/modules/cms/service.py` — UPDATED: _apply_trek_meta() helper uses nested savepoint so trek column failures never block publish; blast radius: HIGH (publish flow) — but fix makes it SAFER (gracefully degrades if migration 0034 not applied)

### Step 46 — Trek CMS Unification + Pipeline Quality Fixes (2026-05-19) blast radius
- `services/api/alembic/versions/20260519_0034_cms_trek_metadata.py` — NEW: trek_state/name/difficulty/duration/season/suitability on cms_pages; blast radius: LOW (additive columns, nullable)
- `services/api/app/modules/cms/models.py` — UPDATED: 6 trek metadata mapped columns; blast radius: MEDIUM (CMSPage used everywhere, but additive nullable fields)
- `services/api/app/modules/cms/service.py` — UPDATED: _strip_flagged_markers regex extended; _state_from_base, _suitability_from_difficulty helpers; upsert_page_from_draft populates trek columns; blast radius: HIGH for _strip_flagged_markers (affects all CMS write paths — but change is additive)
- `services/api/app/schemas/cms.py` — UPDATED: CMSPageResponse has 6 trek metadata fields; blast radius: LOW (additive)
- `services/api/app/modules/agents/content_writing/agent.py` — UPDATED: _slugify_trek() strips noise suffixes; _store_results uses _slugify_trek; blast radius: LOW (content writing only)
- `services/api/app/modules/pipeline/service.py` — UPDATED: image agent moved to post-content-writing; _attempt_image_search_for_draft replaces _attempt_image_search; blast radius: MEDIUM (pipeline orchestration)
- `services/api/tests/test_trek_cms_unification.py` — NEW: 22 tests for slug, flagged regex, state extraction, trek metadata
- `apps/web-next/lib/api.ts` — UPDATED: CMSPage interface + 6 trek fields; blast radius: LOW (additive)
- `apps/web-next/app/(public)/search/page.tsx` — UPDATED: TC-F02 (recent searches refresh), TC-F03 (did-you-mean new threshold), removed "fuzzy matched" text; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: breadcrumb uses trek_state/trek_name from CMS; schema also updated; blast radius: MEDIUM (every trek guide page)

### Step 44 remaining — Discovery Engine (2026-05-19) blast radius
- `services/api/alembic/versions/20260519_0032_page_views.py` — NEW: `page_views` table; blast radius: LOW (new table)
- `services/api/alembic/versions/20260519_0033_account_comparisons.py` — NEW: `account_comparisons` table (FK → users CASCADE); blast radius: LOW (new table)
- `services/api/app/modules/search/models.py` — UPDATED: `PageView` ORM added; blast radius: LOW
- `services/api/app/modules/account/models.py` — UPDATED: `AccountComparison` ORM added; blast radius: LOW
- `services/api/app/db/base.py` — UPDATED: PageView + AccountComparison registered; blast radius: LOW
- `services/api/app/modules/recommendations/service.py` — UPDATED: `get_anonymous_recommendations()` popularity + recency blended SQL; blast radius: MEDIUM (called by recommendations API)
- `services/api/app/modules/linking/service.py` — UPDATED: `get_anchor_suggestions()` returns quality score (0.5–0.9), sorted desc; blast radius: LOW (admin endpoint)
- `services/api/app/schemas/linking.py` — UPDATED: AnchorSuggestion.quality field (default 0.5); blast radius: LOW
- `services/api/app/api/routes/analytics.py` — UPDATED: POST /track/page-view added; blast radius: LOW
- `services/api/app/api/routes/account.py` — UPDATED: GET/POST/DELETE /account/comparisons added; blast radius: LOW
- `services/api/tests/test_discovery_improvements.py` — NEW: 11 tests; blast radius: LOW
- `apps/web-next/lib/api.ts` — UPDATED: trackPageView, fetchComparisons, saveComparison, deleteComparison, AnchorSuggestion.quality; blast radius: LOW (additive)
- `apps/web-next/app/(public)/search/page.tsx` — REWRITTEN: CMS suggestions API, click tracking, type badges, recent searches, did-you-mean; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/account/compare/page.tsx` — REWRITTEN: wired to real /account/comparisons API; blast radius: LOW
- `apps/web-next/app/(public)/account/page.tsx` — UPDATED: "Recently viewed" section from localStorage; blast radius: LOW
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: server-side cluster pages fetch + "In this cluster" sidebar; blast radius: MEDIUM (every trek guide page, graceful fallback)
- `apps/web-next/components/trek/TrekViewTracker.tsx` — UPDATED: title prop + writes ty_recently_viewed localStorage; blast radius: LOW

### Step 63 — Hindi CMS translation fix + SEO blast radius
- `services/api/app/modules/agents/translation/agent.py` — UPDATED: translate_page() signature extended (seo_title, seo_description, faqs params); max_tokens 12000; returns dict with all translated fields + fallback flag; blast radius: LOW (only called by translation.py route)
- `services/api/app/api/routes/translation.py` — UPDATED: extracts source FAQs from content_json; passes SEO + FAQ fields to agent; status="published" (was draft); stores translated seo_title, seo_description, content_json; blast radius: LOW (POST /admin/cms/{slug}/translate admin-only endpoint)
- `services/api/app/api/routes/sitemap_data.py` — UPDATED: sitemap_pages() language filter added (en only); new GET /public/sitemap-pages/hindi endpoint; blast radius: MEDIUM (sitemap_pages used by apps/web-next/app/sitemap.ts — any change affects Google indexing of all CMS pages)
- `apps/web-next/app/(public)/hi/trek/[slug]/page.tsx` — UPDATED: JSON-LD schemas, og:locale, x-default hreflang, robots index; blast radius: LOW (Hindi trek detail page, no downstream callers)
- `apps/web-next/app/(public)/hi/guides/[slug]/page.tsx` — UPDATED: same SEO improvements; blast radius: LOW
- `apps/web-next/app/(public)/hi/packing/[slug]/page.tsx` — UPDATED: same SEO improvements; blast radius: LOW
- NEW `apps/web-next/app/hi-trek-sitemap.xml/route.ts` — NEW: dynamic sitemap for Hindi trek pages with xhtml:link hreflang alternates; blast radius: LOW (new leaf route)
- `apps/web-next/app/sitemap.ts` — UPDATED: /hi-trek-sitemap.xml added to entries; blast radius: LOW (additive entry, no existing URLs changed)
- `apps/web-next/app/robots.ts` — UPDATED: sitemap property changed from string to array; blast radius: LOW (additive change)
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — UPDATED: full translation progress modal with timer, progress bar, success/error states; translate button logic extended; blast radius: LOW (admin-only leaf page)

### Step 62 — Plan My Trek inline auth gate modal blast radius
- `apps/web-next/middleware.ts` — UPDATED: `/plan` removed from PROTECTED_PREFIXES + config.matcher; blast radius: LOW (plan is now fully public; auth enforcement moves to UI layer)
- NEW `apps/web-next/components/plan/AuthGateModal.tsx` — NEW: Radix Dialog modal; consumes `useAuth()`, `useGoogleLogin`; blast radius: LOW (leaf component, only rendered from plan/page.tsx)
- `apps/web-next/app/(public)/plan/page.tsx` — UPDATED: `useAuth()` + `AuthGateModal` wired; `pendingPayload` ref + `handleAuthSuccess` callback; blast radius: MEDIUM (primary plan wizard page; consumers: homepage trust pillar card `/`, any Link to /plan)

### Step 61 — Plan My Trek auth gate + TC-F05 full ?next= chain blast radius
- `apps/web-next/middleware.ts` — UPDATED: `/plan` and `/plan/:path*` added to `config.matcher`; GUEST_ONLY redirect now honours `?next=` with open-redirect safety; blast radius: LOW (additive matcher entries — unauthenticated /plan users now redirect to sign-in, authenticated users unaffected)
- `apps/web-next/app/(auth)/auth/sign-in/page.tsx` — UPDATED: "Create account" link passes `?next=` param through to sign-up URL; blast radius: LOW (1-line change, leaf component)
- `apps/web-next/app/(auth)/auth/sign-up/page.tsx` — UPDATED: email signup path now passes `?next=` to `/auth/onboarding?next=...`; blast radius: LOW (auth-only page, no downstream callers)
- `apps/web-next/app/(auth)/auth/onboarding/page.tsx` — REFACTORED: split into `OnboardingContent` + `Suspense` wrapper; `useSearchParams` added; `handleFinish()` redirects to `?next=` param instead of hardcoded `/explore`; blast radius: LOW (leaf auth page, only called after new user email signup)

### Step 56 — Weekly News Agent + /news/[slug] Pages blast radius
- `services/api/app/modules/agents/news/__init__.py` — NEW: package init; blast radius: LOW
- `services/api/app/modules/agents/news/prompts.py` — UPDATED (Fix): ARTICLE_PROMPT replaced with INDIVIDUAL_ARTICLE_PROMPT; per-item 300-word article, strips source attribution; blast radius: LOW
- `services/api/app/modules/agents/news/agent.py` — UPDATED (Fix): rewritten for per-item design; `_slug_from_title`, `_clean_title`, `_fallback_for_item`, `_llm_article_for_item`, `write_and_store_articles`; content_json now `{trek_slug, news_item, faqs}`; blast radius: LOW
- `services/api/app/worker/tasks/news.py` — UPDATED (Fix): log statement matches new return format; blast radius: LOW
- `services/api/app/api/routes/news.py` — UPDATED (Fix): `get_news_by_trek` filter changed from slug prefix to `content_json ->> 'trek_slug'` JSON operator; blast radius: LOW
- `services/api/app/api/router.py` — UPDATED: news_router registered; blast radius: LOW (additive)
- `services/api/app/worker/celery_app.py` — UPDATED: news task module + weekly beat schedule; blast radius: LOW (additive)
- `services/api/tests/test_news.py` — UPDATED (Fix): completely rewritten; 19 tests (was 18); tests for new functions + per-item design; blast radius: LOW
- `apps/web-next/lib/api.ts` — UPDATED (Fix): NewsArticle.content_json adds `news_item` field (new) alongside legacy `news_items`; blast radius: LOW (additive)
- `apps/web-next/lib/trek-utils.ts` — NEW: shared `cmsPageToTrek()` utility; eliminates duplicate logic in DifficultyTabsSection + SeasonalTreksSection; blast radius: LOW
- `apps/web-next/components/home/DifficultyTabsSection.tsx` — UPDATED (Fix): imports `cmsPageToTrek` from trek-utils; removed local `cmsToTrek`; blast radius: LOW
- `apps/web-next/components/home/SeasonalTreksSection.tsx` — UPDATED (Fix): imports `cmsPageToTrek` from trek-utils; removed local `cmsToTrek`; blast radius: LOW
- `apps/web-next/app/(public)/news/page.tsx` — NEW: news hub page; blast radius: LOW (leaf page)
- `apps/web-next/app/(public)/news/[slug]/page.tsx` — UPDATED (Fix): improved hero (trek badge, source in byline), TableOfContents from h2 IDs, sidebar shows TOC+trek links+source; uses `content_json.news_item`; blast radius: LOW
- `apps/web-next/app/news-sitemap.xml/route.ts` — NEW: Google News sitemap; blast radius: LOW (new system route)
- `apps/web-next/app/sitemap.ts` — UPDATED: /news, /news-sitemap.xml, news_article page_type; blast radius: LOW (additive entries)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED (Fix): fixed "Trek Trek" heading → `{trek.name} — Latest News`; blast radius: MEDIUM (every trek guide page)
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — UPDATED (Fix): tabs (All/Trek Guides/News/Other), status+language filters, Generate News popup modal, news_article in PAGE_PREFIX; blast radius: LOW (admin-only leaf page)

#### Step 56 Production Bug Fixes (2026-05-26)
- `services/api/app/modules/agents/news/agent.py` — UPDATED (Prod Fix): added `_is_recent(pub_date_str, days=90)` using `email.utils.parsedate_to_datetime`; applied in `_fetch_rss()` to reject items older than 90 days; added outer + per-part code-fence stripping in `_llm_article_for_item()`; blast radius: LOW (callers: fetch_news, write_and_store_articles — same file)
- `apps/web-next/app/(public)/news/[slug]/page.tsx` — UPDATED (Prod Fix): hero bg changed from broken CSS-var opacity modifier (`from-foreground/96`) to `bg-[#0c0e14] text-white`; all `text-surface/x` in hero → `text-white/x`; blast radius: LOW (leaf page)
- `services/api/tests/test_news.py` — UPDATED (Prod Fix): `_is_recent` imported; TC-B19/B20/B21 added; 22 tests total; blast radius: LOW (test file only)

### Step 60 — Enhancement batch: CMS translation UX + search quality fixes blast radius
- `services/api/app/api/routes/translation.py` — UPDATED: `content_html or ""` guard before calling translate_page; blast radius: LOW (additive null-safety, same callers)
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — UPDATED: `translatingSlug` loading state; spinner replaces Languages icon while in-flight; button disabled during request; real API error surfaced in feedback; blast radius: LOW (admin-only leaf page)
- `apps/web-next/components/content/RecommendedContent.tsx` — UPDATED: `excludeSlugs` prop added; over-fetches by excludeSlugs.length+2 then filters; static fallback also respects excludeSet; blast radius: MEDIUM (imported by trek/[slug]/page.tsx — every trek guide page)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: passes `clusterPages.map(p => p.slug)` as `excludeSlugs` to RecommendedContent; cluster sidebar and "Similar treks" sections guaranteed non-overlapping; blast radius: LOW (leaf page, no downstream callers)
- `services/api/app/modules/search/service.py:get_trending_queries` — UPDATED: COUNT threshold lowered 2→1; `_CURATED_TRENDING` fallback list added (10 terms); real queries ranked first, curated supplement; blast radius: LOW (called only by GET /search/trending endpoint)
- `services/api/app/api/routes/search.py:semantic_search` — UPDATED: season_months intent filter applied (graceful skip when no trek_season data); `all_results` fallback copy retained; blast radius: LOW (POST /search/semantic endpoint only)
- `apps/web-next/app/(public)/search/page.tsx` — UPDATED: SEASON_BUCKETS winter bucket fixed (April removed from winter); `exactTreks`/`fuzzyTreks` split by Fuse score (< 0.05 = exact); `semanticUniq` deduped against exact; `fuzzyNotInSemantic` deduped against semantic; result sections reordered (exact → semantic → fuzzy → guides); semantic section moved above trek grid; "Ranked by…" subtitle removed; section headers user-friendly; blast radius: LOW (leaf page)
- `apps/web-next/app/(admin)/admin/linking/page.tsx` — UPDATED: quality score badge per anchor suggestion; blast radius: LOW

#### Search Page Personalization Bug Fixes (2026-05-26)
- `apps/web-next/app/(public)/search/page.tsx` — UPDATED (Prod Fix): `handleSuggestionClick` now logs `q.trim() || label` (actual typed query) instead of destination page title; `q` added to useCallback deps (stale closure fix); `handleResultClick` now calls `handleQueryCommit(q)` to save recent on TrekCard click; added debounced (1.5s) auto-save useEffect for passive browsing sessions; blast radius: LOW (leaf page, no upstream callers)

### Step 64 — CDP Analytics Layer (2026-05-27)

#### New Files — Backend
- `services/api/alembic/versions/20260527_0036–0040_cdp_*.py` — 5 migrations; blast radius: NONE
- `services/api/app/modules/cdp/models.py` — 5 ORM models; blast radius: LOW
- `services/api/app/modules/cdp/service.py` — CDP service layer; blast radius: LOW
- `services/api/app/schemas/cdp.py` — CDP Pydantic schemas; blast radius: LOW
- `services/api/app/api/routes/cdp.py` — 12 endpoints; blast radius: LOW
- `services/api/app/worker/tasks/cdp.py` — 3 Celery tasks; blast radius: LOW
- `services/api/tests/test_cdp.py` — 24 tests; blast radius: NONE

#### Modified Files — Backend
- `services/api/app/db/base.py` — 5 new CDP model imports; blast radius: LOW (additive)
- `services/api/app/api/router.py` — cdp_public_router + cdp_admin_router registered; blast radius: LOW (additive)
- `services/api/app/worker/celery_app.py` — cdp tasks + 3 beat schedules added; blast radius: LOW (additive)
- `services/api/app/core/config.py` — ga4_measurement_id, ga4_api_secret, gsc_service_account_json added; blast radius: LOW
- `services/api/app/api/routes/auth.py` — DPDP data-export + data-delete endpoints added; blast radius: LOW

#### New Files — Frontend
- `apps/web-next/lib/analytics.ts` — CDP client SDK (REPLACED stub); blast radius: MEDIUM — callers updated to 4-arg signature
- `apps/web-next/components/analytics/AnalyticsProvider.tsx` — blast radius: LOW
- `apps/web-next/components/analytics/ConsentBanner.tsx` — blast radius: LOW
- `apps/web-next/components/analytics/ScrollDepthTracker.tsx` — blast radius: NONE
- `apps/web-next/app/(admin)/admin/cdp/` (8 pages) — blast radius: LOW (new pages)

#### Modified Files — Frontend
- `apps/web-next/components/Providers.tsx` — AnalyticsProvider + ConsentBanner added; blast radius: MEDIUM (wraps entire app, additive)
- `apps/web-next/app/(admin)/admin/layout.tsx` — CDP nav group added; blast radius: LOW
- `apps/web-next/components/monetization/AffiliateCard.tsx` — trackEvent 4-arg; blast radius: LOW
- `apps/web-next/components/monetization/NewsletterCapture.tsx` — trackEvent 4-arg; blast radius: LOW
- `apps/web-next/components/monetization/LeadForm.tsx` — trackEvent 4-arg; blast radius: LOW

### Step 65 — CDP Analytics Enhancement (2026-05-27)

#### Modified Files — Backend
- `services/api/app/schemas/cdp.py` — Added FunnelStepIn, DynamicFunnelIn/Out, EventCatalogOut, CohortHeatmapOut (replaces CohortOut), UserActivityOut; blast radius: LOW (schema change is additive except cohort which is a breaking change — both FE+BE shipped together)
- `services/api/app/modules/cdp/service.py` — Replaced get_funnel/get_cohorts/SEGMENTS/get_segments with get_event_catalog, get_dynamic_funnel, get_cohort_heatmap, get_user_activity, expanded SEGMENTS (10); blast radius: LOW (only called by cdp route layer)
- `services/api/app/api/routes/cdp.py` — Replaced /funnels/{name} with POST /funnels/dynamic; updated GET /cohorts to return heatmap; added GET /events/catalog, GET /users/activity (static route registered before /users/{user_id}); blast radius: LOW
- `services/api/tests/test_cdp.py` — 2 tests updated (funnels + segments count); blast radius: NONE

#### New Files — Backend
- `services/api/tests/test_cdp_step65.py` — 13 new tests; blast radius: NONE

#### Modified Files — Frontend
- `apps/web-next/lib/analytics.ts` — Added trackPlanWizardStep(); blast radius: LOW (additive)
- `apps/web-next/app/(public)/plan/page.tsx` — Added useEffect step tracking + trackPlanWizardCompleted on submit; blast radius: LOW
- `apps/web-next/app/(admin)/admin/cdp/funnels/page.tsx` — Full rewrite: dynamic builder UI; blast radius: LOW
- `apps/web-next/app/(admin)/admin/cdp/cohorts/page.tsx` — Full rewrite: N×M heatmap; blast radius: LOW
- `apps/web-next/app/(admin)/admin/cdp/segments/page.tsx` — Rewrite: 10-segment grid with criteria_label; blast radius: LOW
- `apps/web-next/app/(admin)/admin/layout.tsx` — User Activity nav link added; blast radius: LOW

#### New Files — Frontend
- `apps/web-next/app/(admin)/admin/cdp/activity/page.tsx` — User activity timeline page; blast radius: NONE (new page)

## Step 67 — CDP Analytics Full Revamp (2026-05-29)

### New Files — Backend
- `services/api/alembic/versions/20260529_0041_cdp_phase0.py` — migration: event_definitions, custom_segments, cdp_webhook_rules tables; is_internal column on analytics_events; 4 composite indexes; 35 event seeds; blast radius: LOW (additive, no existing tables modified except one column add)
- `services/api/tests/test_cdp_step67.py` — 25 new tests (TC-B01–TC-B25); blast radius: NONE

### Modified Files — Backend
- `services/api/app/modules/cdp/models.py` — added EventDefinition, CustomSegment, CdpWebhookRule ORM models; added `is_internal` Boolean to AnalyticsEvent; blast radius: LOW — is_internal is additive; new models are new tables
- `services/api/app/db/base.py` — 3 new model imports registered in metadata; blast radius: LOW (additive)
- `services/api/app/schemas/cdp.py` — ~20 new Pydantic schemas; `is_internal: bool` added to EventIn; blast radius: LOW (additive — new schemas only; EventIn change backward-compatible with default=False)
- `services/api/app/modules/cdp/service.py` — `_is_internal_event` helper; updated `log_event` to pass is_internal; 17 new service functions; blast radius: LOW (only called by cdp routes layer)
- `services/api/app/api/routes/cdp.py` — 18 new admin route handlers; static routes registered before dynamic to prevent path shadowing; blast radius: LOW (additive routes)
- `services/api/app/core/config.py` — `internal_anonymous_ids` list setting; blast radius: LOW (additive field, default empty list)
- `services/api/.env.example` — INTERNAL_ANONYMOUS_IDS env var; blast radius: NONE

### New Files — Frontend
- `apps/web-next/app/(admin)/admin/cdp/content/page.tsx` — content analytics page; blast radius: NONE (new page)
- `apps/web-next/app/(admin)/admin/cdp/content/treks/page.tsx` — trek funnel analytics page; blast radius: NONE (new page)
- `apps/web-next/app/(admin)/admin/cdp/segments/builder/page.tsx` — dynamic segment builder; blast radius: NONE (new page)
- `apps/web-next/app/(admin)/admin/cdp/webhooks/page.tsx` — webhook rules CRUD; blast radius: NONE (new page)

### Modified Files — Frontend
- `apps/web-next/lib/analytics.ts` — IS_INTERNAL flag; is_internal field on EventPayload; 18 new trackEvent wrappers; blast radius: MEDIUM — every existing call site continues to work (new field default false; new functions additive)
- `apps/web-next/app/(admin)/admin/cdp/page.tsx` — full rewrite executive dashboard; blast radius: LOW (self-contained admin page)
- `apps/web-next/app/(admin)/admin/cdp/events/page.tsx` — full rewrite event explorer; blast radius: LOW (self-contained admin page)
- `apps/web-next/app/(admin)/admin/layout.tsx` — 4 new CDP nav links added; exact flag on CDP Overview; blast radius: LOW (additive nav items)

### Endpoints Added (all under `/api/v1/admin/cdp/`)
- `GET /kpis` — 8 KPI tiles with deltas + sparklines
- `GET /realtime-feed` — last 50 events
- `GET /alerts` — computed alert cards
- `GET /events/definitions` — event catalog (static before /events/stream)
- `GET /events/export` — CSV streaming download (static before /events/stream)
- `GET /events` — paginated event explorer (static before /events/stream)
- `GET /funnels/templates` — 6 preset funnel templates
- `POST /cohorts/custom` — custom cohort heatmap by event type
- `GET /segments/custom` — list custom segments
- `POST /segments/custom` — create custom segment
- `POST /segments/preview` — estimate user count for condition set
- `GET /segments/{id}/export` — export segment as CSV
- `GET /content/pages` — per-page CMS analytics
- `GET /content/treks` — trek funnel analytics
- `GET /webhooks` — list webhook rules
- `POST /webhooks` — create webhook rule
- `DELETE /webhooks/{rule_id}` — delete webhook rule
- `GET /suppressions` — suppressed user list

## Step 66 — Homepage Section Logic by User State

### New Files — Frontend
- `apps/web-next/components/home/HomeWelcomeBanner.tsx` — NEW: client component; reads useAuth() + getBehaviorProfile(); renders logged-in welcome banner (States A+B only); blast radius: NONE (leaf component, imported only by homepage)
- `apps/web-next/components/home/HomeTrendingHeader.tsx` — NEW: client component; renders 4-state personalized heading for Trending section (heading text only — TrekCards remain SSR); blast radius: NONE (leaf component, imported only by homepage)
- `apps/web-next/components/home/RecentlyViewedSection.tsx` — NEW: client component; State D only (repeat logged-out); horizontal scroll row of last 5 viewed treks from localStorage; enriched with static trekList prop; blast radius: NONE (leaf component, imported only by homepage)

### Modified Files — Frontend
- `apps/web-next/components/content/PersonalisedFeed.tsx` — 4-state logic: State A (new logged-in) → anonymous recs + "Popular treks" label; State B (repeat logged-in) → personalized recs + "For [name]" label; State C (new logged-out) → hidden; State D (repeat logged-out) → anonymous recs + "Continue exploring" label; blast radius: LOW (used only by homepage)
- `apps/web-next/components/home/DifficultyTabsSection.tsx` — added useEffect on mount to pre-select preferred difficulty tab from getBehaviorProfile()?.topDifficulties[0]; falls back to "Easy" if no behavior data; added matchDifficultyToTab() helper; blast radius: LOW (used only by homepage)
- `apps/web-next/app/(public)/page.tsx` — imports HomeWelcomeBanner, HomeTrendingHeader, RecentlyViewedSection; HomeWelcomeBanner added below hero; Trending section refactored to use HomeTrendingHeader over SSR TrekCards; RecentlyViewedSection added between SeasonalTreks and PersonalisedFeed; blast radius: MEDIUM (homepage)

### No Backend Changes
All Step 66 logic is entirely client-side using useAuth() + lib/behavior-tracker.ts (localStorage). No new API routes, no DB migrations.

### Bug Fixes — Step 66 (2026-05-29)
- `apps/web-next/components/home/RecentlyViewedSection.tsx` — UPDATED: added `cmsImageMap?: Record<string, string>` prop (slug → hero_image_url). Image enrichment now checks `staticMatch?.image || cmsImageMap[v.slug] || ""` so CMS-only treks (e.g., Prashar Lake, Chandrakhani Pass) show their CMS hero image instead of ⛰ placeholder.
- `apps/web-next/components/content/PersonalisedFeed.tsx` — UPDATED: component now owns its own `<section className="py-16 md:py-24"><div className="container-wide">` wrapper. Previously the outer `<Section>` wrapper in page.tsx always rendered the heading even when PersonalisedFeed returned null for State C. Blast radius: LOW (homepage only).
- `apps/web-next/components/home/HomeTrendingHeader.tsx` — UPDATED: removed `subLabel` state, all `setSubLabel` calls, `topRegion` local vars (States B+D), `getBehaviorProfile` import, and `<p>{subLabel}</p>` render. Subheading removed across all 4 states per user request.
- `apps/web-next/app/(public)/page.tsx` — UPDATED: builds `cmsImageMap: Record<string,string>` from `cmsTrekPages` and passes to `RecentlyViewedSection`; removed `<Section eyebrow="For you">` wrapper around PersonalisedFeed — component renders its own section wrapper.
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: `TrekViewTracker` region prop changed from `trek.region` (sub-location) to `cmsPage?.trek_state || trek.state || trek.region` (state name). Ensures `topRegions[0]` in localStorage stores state names ("Himachal Pradesh") not sub-locations ("Munsiyari, Pithoragarh district").

### Bug Fix — ContentBrief Pipeline JSON Repair (2026-05-29)
- `services/api/app/modules/agents/content_brief/agent.py` — UPDATED: Added `_clean_llm_json()` function (identical to the one in `seo_aeo/agent.py` and `content_writing/agent.py`) and replaced the single `json.loads(raw)` call with the three-layer parse pattern: Layer 1 `json.loads(raw)`, Layer 2 `json.loads(_clean_llm_json(raw))` (fixes literal `\n`/`\r`/`\t` chars inside JSON strings), Layer 3 `json_repair.repair_json(raw)` (handles unescaped quotes). Root cause: the 9-section trek guide template generates a longer `editorial_brief_markdown` field with real control characters embedded in JSON string values. `json-repair` library was already in `pyproject.toml`. Blast radius: LOW — only affects `ContentBriefAgent._generate_brief()`, 0 external callers.

## Step 68 — Email Infrastructure, SMTP + Email Verification (Z04) + Trek Alert Delivery (Z05)

### New Files
- `services/api/app/modules/account/tasks.py` — NEW: `send_trek_alerts_task` Celery task (name: `account.send_trek_alerts`, bind=True, max_retries=3); `_send_trek_alert_digest` helper; blast radius: LOW (scheduled only — no external callers)
- `services/api/tests/test_email_step68.py` — NEW: 8 tests for email verification + trek alert task
- `apps/web-next/app/(auth)/auth/verify-email/page.tsx` — FULL REWRITE: 4-state flow (idle/verifying/success/error); auto-verify on `?token=`; resend button; `refresh()` on success; Suspense wrapper; blast radius: LOW (standalone auth page)

### Modified Files — Backend
- `services/api/app/core/config.py` — UPDATED: `admin_email` default → `explore@trekyatra.co.in`; `smtp_from_email` default → `explore@trekyatra.co.in`; `frontend_url: str = "https://trekyatra.co.in"` added; blast radius: MEDIUM (all SMTP-sending code reads these settings)
- `services/api/.env.example` — UPDATED: GoDaddy SMTP defaults documented; `FRONTEND_URL` added
- `services/api/app/core/security.py` — UPDATED: `create_email_verification_token(user_id)` + `parse_email_verification_token(token)` added; blast radius: LOW (new functions, no existing callers)
- `services/api/app/modules/auth/service.py` — UPDATED: `mark_email_verified(db, user_id)` added; blast radius: LOW (called only by verify-email route)
- `services/api/app/schemas/auth.py` — UPDATED: `VerifyEmailRequest` schema added; blast radius: LOW (additive)
- `services/api/app/api/routes/auth.py` — UPDATED: `POST /auth/send-verification` + `POST /auth/verify-email` endpoints added; `_send_verification_email_helper` module-level function added; blast radius: LOW (new endpoints, no change to existing routes)
- `services/api/app/worker/celery_app.py` — UPDATED: `app.modules.account.tasks` added to include list; `daily-trek-alert-digest` added to beat_schedule (86400s); blast radius: MEDIUM (celery worker must be restarted to pick up new task registration)
- `services/api/scripts/seed_static_cms_pages.py` — UPDATED: `hello@trekyatra.in` → `explore@trekyatra.co.in` (×2); blast radius: LOW (script, not imported)

### Modified Files — Frontend (email replacement)
- `apps/web-next/app/(public)/contact/page.tsx` — `hello@trekyatra.in` → `explore@trekyatra.co.in` (×4); blast radius: LOW
- `apps/web-next/app/(public)/privacy/page.tsx` — email replaced; blast radius: LOW
- `apps/web-next/app/(public)/affiliate-disclosure/page.tsx` — email replaced; blast radius: LOW
- `apps/web-next/app/(public)/methodology/page.tsx` — email replaced (×2); blast radius: LOW
- `apps/web-next/app/(public)/terms/page.tsx` — email replaced; blast radius: LOW
- `apps/web-next/app/(public)/about/page.tsx` — email replaced; blast radius: LOW
- `apps/web-next/app/maintenance/page.tsx` — email replaced; blast radius: LOW
- `apps/web-next/components/layout/Footer.tsx` — `hello@trekyatra.co.in` → `explore@trekyatra.co.in`; blast radius: MEDIUM (site-wide footer)
- `apps/web-next/app/(public)/account/page.tsx` — email verification amber banner added (conditional on `user && !user.is_verified_email`); blast radius: LOW (account dashboard only)

### New API Routes
- `POST /api/v1/auth/send-verification` — auth-required; issues 24h JWT verification link; graceful SMTP skip
- `POST /api/v1/auth/verify-email` — no auth; validates JWT token + marks `is_verified_email=True`

### Celery Task Registration
- Task name: `account.send_trek_alerts` (beat: daily at 86400s)
- Include path: `app.modules.account.tasks`
- **Worker must be restarted** on DO after deploy to register this task

## Step 69 — Compare Feature SEO/AEO Revamp

### New Files — Frontend
- `apps/web-next/app/(public)/compare/CompareClient.tsx` — NEW: `"use client"` component; exports `CompareTrek` interface and `CompareClient({ initialTreks })` function; dropdown selectors, URL sync, AuthGateModal save flow, share with clipboard feedback, 8-field comparison table; blast radius: LOW (used only by compare/page.tsx)

### Modified Files — Frontend
- `apps/web-next/app/(public)/compare/page.tsx` — FULL REWRITE: Server Component; `generateMetadata()` with canonical + OG; fetches `fetchCMSPages({ page_type: "trek_guide", limit: 200 })`; altitude from `content_json.trek_facts.altitude`; permits/base/suitability added; no JSON-LD scripts; `revalidate=3600`; blast radius: LOW (leaf page, no upstream importers)
- `apps/web-next/components/trek/TrekCTAs.tsx` — bug fix: `/compare?a=${slug}` → `/compare?slugs=${slug}`; blast radius: MEDIUM (used on every trek detail page, but change is a 1-char URL param fix — no logic change)

### Post-Production Fixes (2026-06-03)
- `compare/page.tsx` — fixed `altitude: undefined` → `content_json.trek_facts.altitude`; added `permits`, `base`, `suitability` fields; removed all 3 JSON-LD scripts (dirty URL); blast radius: LOW
- `compare/CompareClient.tsx` — removed FAQ section; expanded `COMPARE_FIELDS` (5→8); `handleShare` shows "Link copied!" feedback; `handleSave` uses `AuthGateModal` (logged-out) + success banner (logged-in); added `useAuth` + `AuthGateModal` imports; blast radius: LOW

### No Backend Changes
No new API routes, no DB migrations. Uses `GET /api/v1/cms/pages` (Step 16) and `POST /api/v1/account/comparisons` (Step 44).
- `services/api/tests/test_brief_agent.py` — UPDATED: 4 new tests added: `test_clean_llm_json_fixes_literal_newlines_in_string`, `test_clean_llm_json_preserves_escaped_sequences`, `test_clean_llm_json_fixes_tabs_and_carriage_returns`, `test_generate_brief_recovers_from_literal_newlines_in_json`. Total: 19 tests in file, 610 pass suite-wide.

## Step 69C — Post-Production Fixes #2

### Modified Files — Backend
- `services/api/app/api/routes/auth.py` — `signup_email` now calls `_send_verification_email_helper(email, name, verify_url)` after welcome email; wrapped in try/except; blast radius: LOW (signup response unchanged, only side effect added)
- `services/api/tests/test_email_step68.py` — TC-B09 added (`test_signup_email_sends_verification_on_register`); total: 9 tests; blast radius: TEST only

### Modified Files — Frontend
- `apps/web-next/app/(public)/account/page.tsx` — `loadData` Promise.all now includes `fetchComparisons()`; `compareCount` state drives "Compare Lists" stat tile; blast radius: LOW (account dashboard leaf page, no importers)
- `apps/web-next/app/(public)/search/page.tsx` — added `allLoadedTreks` state + `compareMatch` useMemo + compare suggestion UI card; blast radius: LOW (new derived state only; existing search/fuse/semantic logic unchanged)

### No New Routes or Migrations
All changes use existing endpoints: `GET /api/v1/account/comparisons` (Step 44), `POST /api/v1/auth/signup/email` (Step 26). No DB changes.

## Step 69D — Post-Production Fixes #3

### Modified Files — Frontend
- `apps/web-next/app/(public)/compare/CompareClient.tsx` — `doSave` now generates `name` from selected trek names and includes it in POST body; blast radius: LOW (Compare module only)
- `apps/web-next/app/(public)/account/page.tsx` — amber verification banner "Resend" changed from `<Link>` navigation to inline API call (`POST /api/v1/auth/send-verification`); added `resendStatus` state; added `handleResendVerification`; blast radius: LOW (account dashboard leaf page)
- `apps/web-next/app/(auth)/auth/verify-email/page.tsx` — idle state resend button now guarded by `authLoading` spinner → `user && !user.is_verified_email` → sign-in redirect; prevents 401 for unauthenticated visitors; blast radius: LOW (verify-email leaf page)

### No Backend Changes
All fixes are purely frontend. No new endpoints, no schema changes, no migrations.

## Step 71 — Core Web Vitals Optimisation

### Modified Files — Frontend Only (no backend changes, no migrations)

| File | Change | Blast Radius |
|------|--------|-------------|
| `apps/web-next/app/globals.css` | Removed render-blocking `@import url(fonts.googleapis.com...)` line 1 | LOW — purely removes a network request; fonts now served via next/font |
| `apps/web-next/app/layout.tsx` | Added Fraunces/Inter/JetBrains_Mono from `next/font/google`; CSS variable class on `<html>`; preconnect hints; favicon 16/32px; GA4+AdSense strategy `lazyOnload` | LOW — root layout; changes affect all pages but are additive only |
| `apps/web-next/tailwind.config.ts` | fontFamily values changed from string literals to CSS variable references | LOW — requires `layout.tsx` CSS variables to be present (set atomically) |
| `apps/web-next/next.config.mjs` | Removed `unoptimized:true`; added AVIF/WebP formats + remotePatterns | MEDIUM — all `<Image>` components now go through optimiser; remote domains not in remotePatterns would 500 (all covered) |
| `apps/web-next/app/(public)/page.tsx` | Hero `<img>` → `<Image priority fill>`; dynamic imports for RecentlyViewedSection + PersonalisedFeed; region/editorial images → .webp | LOW — homepage SSR; dynamic imports reduce initial JS |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | `fetchPriority="high"` on trek hero `<img>` | LOW — non-breaking HTML attribute |
| `apps/web-next/app/(public)/explore/page.tsx` | `aria-label` on sort select | LOW — accessibility only |
| `apps/web-next/app/(public)/compare/CompareClient.tsx` | `aria-label` on trek picker select | LOW — accessibility only |
| `apps/web-next/components/layout/Footer.tsx` | `aria-label` on all 3 social icon links | LOW — accessibility only |
| `apps/web-next/.browserslistrc` | New file — modern browser targets | LOW — reduces polyfill bundle; no functional impact |
| `apps/web-next/public/images/favicon-16.png` | New — 814 B favicon | LOW — new asset only |
| `apps/web-next/public/images/favicon-32.png` | New — 2.2 KB favicon | LOW — new asset only |
| `apps/web-next/public/images/*.webp` | 8 new WebP files converted from JPEG | LOW — new assets; old JPEGs kept for compatibility |

### No Backend Changes
No API routes, no DB migrations, no Celery tasks, no schema changes.

### Infrastructure Notes (user action required)
- DigitalOcean Spaces: set `Cache-Control: public, max-age=31536000, immutable` on the bucket — currently Cache TTL: None (9,871 KiB wasted on repeat visits). This is a DO console action, not a code change.
- Server TTFB 1,955ms: partially addressed by next/font + image optimisation; further improvement requires CDN/edge caching at DO App Platform level.

## Step 71 — Infrastructure Pending (User Action — No Code Changes)

### DO Spaces Cache-Control Backfill

**Problem:** All existing images in `trekyatra-media` bucket served with `Cache-Control: none` — 9,871 KiB re-downloaded on every repeat visit.

**Action 1 — Code fix (new uploads):** Add `CacheControl="public, max-age=31536000, immutable"` to `put_object` call in `services/api/app/modules/media/service.py`. Blast radius: LOW (media upload only).

**Action 2 — CLI backfill (existing objects, one-time):**
```bash
aws s3 cp s3://trekyatra-media/ s3://trekyatra-media/ \
  --recursive --profile do-spaces \
  --endpoint-url https://sgp1.digitaloceanspaces.com \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable" \
  --acl public-read
```

### TTFB Fix via Cloudflare Cache Rules

**Problem:** Server TTFB 1,955ms. Site is behind Cloudflare (IPs 162.159.140.98 + 172.66.0.96). Cloudflare caches nothing by default for HTML.

**Action 1 — Next.js headers()** (code change, next step): Add `headers()` to `next.config.mjs`:
- `/_next/static/*` → `Cache-Control: public, max-age=31536000, immutable`
- `/images/*` → `Cache-Control: public, max-age=604800, stale-while-revalidate=86400`
- All public HTML routes → `Cache-Control: s-maxage=300, stale-while-revalidate=86400`

**Action 2 — Cloudflare Dashboard:**
- Caching → Cache Rules: cache HTML with `s-maxage=300`
- Speed → Auto Minify (JS+CSS+HTML) + Brotli

**Expected outcome:** TTFB drops from 1,955ms to 15–40ms on Cloudflare cache hits.

---

## Step M01 — Expo Mobile Bootstrap (2026-06-03)

### New Files Created
| File | Purpose |
|------|---------|
| `apps/mobile/` | New workspace entry (added to root package.json workspaces) |
| `apps/mobile/package.json` | Expo SDK 56 deps — RN 0.85.3, React 19, expo-router, NativeWind v4 |
| `apps/mobile/app.config.ts` | Dynamic Expo config (name, slug, bundle IDs, plugins, EAS) |
| `apps/mobile/eas.json` | EAS Build profiles: development, preview, production |
| `apps/mobile/metro.config.js` | NativeWind Metro transformer (`withNativeWind`) |
| `apps/mobile/babel.config.js` | Babel expo preset with `jsxImportSource: "nativewind"` |
| `apps/mobile/tsconfig.json` | Strict TS config, extends expo/tsconfig.base, `@/*` alias |
| `apps/mobile/global.css` | NativeWind CSS entry (`@tailwind base/components/utilities`) |
| `apps/mobile/tailwind.config.js` | TrekYatra design tokens (background, surface, accent, pine) |
| `apps/mobile/nativewind-env.d.ts` | NativeWind type declarations |
| `apps/mobile/app/_layout.tsx` | Root layout: providers, fonts, splash, Sentry init |
| `apps/mobile/app/(tabs)/_layout.tsx` | 5-tab bar (Home/Browse/Plan/Saved/Account) |
| `apps/mobile/app/(tabs)/index.tsx` | Home placeholder |
| `apps/mobile/app/(tabs)/browse.tsx` | Browse placeholder |
| `apps/mobile/app/(tabs)/plan.tsx` | Plan placeholder |
| `apps/mobile/app/(tabs)/saved.tsx` | Saved placeholder |
| `apps/mobile/app/(tabs)/account.tsx` | Account placeholder |
| `apps/mobile/app/(auth)/_layout.tsx` | Auth group layout (slide_from_bottom animation) |
| `apps/mobile/app/(auth)/sign-in.tsx` | Sign-in placeholder |
| `apps/mobile/app/(auth)/sign-up.tsx` | Sign-up placeholder |
| `apps/mobile/app/+not-found.tsx` | 404 screen |
| `apps/mobile/components/ui/Button.tsx` | Pressable with variant (hero/outline/ghost) + loading |
| `apps/mobile/components/ui/Badge.tsx` | Status badge (matches web admin colour map) |
| `apps/mobile/components/ui/Card.tsx` | Surface card with border |
| `apps/mobile/components/ui/SkeletonLoader.tsx` | Animated loading placeholder |
| `apps/mobile/components/ui/SafeArea.tsx` | SafeAreaView with background colour |
| `apps/mobile/components/ui/Typography.tsx` | Display/Heading/Body/Caption/Mono components |
| `apps/mobile/constants/theme.ts` | colors, fonts, spacing, radius tokens |
| `apps/mobile/providers/QueryProvider.tsx` | TanStack Query v5 client (staleTime 5m) |
| `apps/mobile/providers/AuthProvider.tsx` | Auth context wrapping Zustand authStore |
| `apps/mobile/stores/authStore.ts` | Zustand v5 store: token, user, clearAuth, loadStoredToken |
| `packages/types/package.json` | `@trekyatra/types` package |
| `packages/types/index.ts` | Trek, CMSPage, User, RecommendationItem, PaginatedResponse |

### Modified Files
| File | Change |
|------|--------|
| `package.json` (root) | Added `"workspaces": ["apps/web-next", "packages/*"]` — mobile excluded (see Fix 3 below) |

### Blast Radius
- **M01 changes are additive only** — no existing web or API files modified
- All new files isolated in `apps/mobile/` and `packages/types/`
- Root `package.json` workspaces change is non-breaking for existing `apps/web-next/` workspace

---

## Steps M02 + M03 — Mobile Auth + Backend Mobile Extensions (2026-06-08)

### New Files Created — M03 Backend
| File | Purpose |
|------|---------|
| `services/api/app/modules/mobile/__init__.py` | Mobile module init |
| `services/api/app/modules/mobile/models.py` | MobileDevice ORM (device_id UNIQUE, refresh_token_hash, platform, push tokens) |
| `services/api/app/modules/mobile/service.py` | mobile_login, mobile_signup, issue_mobile_token, refresh_mobile_token, register_device, unregister_device, get_sync_pages |
| `services/api/app/schemas/mobile.py` | 12 Pydantic schemas for all mobile endpoints |
| `services/api/app/api/routes/auth_mobile.py` | POST /auth/mobile/login, /signup, /token, /token/refresh |
| `services/api/app/api/routes/mobile.py` | GET /mobile/sync, POST /mobile/device, DELETE /mobile/device/{id} |
| `services/api/alembic/versions/20260608_0042_mobile_devices.py` | mobile_devices table + cms_pages.deleted_at + partial index |
| `services/api/tests/test_mobile_step_m03.py` | 11 backend tests |

### New Files Created — M02 Mobile Frontend
| File | Purpose |
|------|---------|
| `apps/mobile/lib/authStorage.ts` | SecureStore token helpers |
| `apps/mobile/lib/authApi.ts` | Typed API calls: signIn, signUp, getMe, refreshAccessToken, etc. |
| `apps/mobile/lib/googleAuth.ts` | expo-auth-session Google OAuth (ResponseType.Token) |
| `apps/mobile/lib/appleAuth.ts` | expo-apple-authentication native prompt |
| `apps/mobile/lib/biometricAuth.ts` | expo-local-authentication helpers |
| `apps/mobile/hooks/useAuth.ts` | Re-exports useAuth |
| `apps/mobile/hooks/useRequireAuth.ts` | Route guard: redirects unauthenticated to sign-in |
| `apps/mobile/components/auth/SocialSignInButtons.tsx` | Google + Apple (iOS only) buttons |
| `apps/mobile/app/(auth)/welcome.tsx` | 3-slide onboarding carousel |
| `apps/mobile/app/(auth)/otp.tsx` | OTP placeholder (M04) |
| `apps/mobile/app/(auth)/forgot-password.tsx` | Forgot password form |
| `apps/mobile/app/(auth)/reset-password.tsx` | Reset password form |
| `apps/mobile/.env.example` | EXPO_PUBLIC_API_URL, EXPO_PUBLIC_GOOGLE_CLIENT_ID, EXPO_PUBLIC_SENTRY_DSN |

### Modified Files — M03 Backend
| File | Change | Blast Radius |
|------|--------|-------------|
| `services/api/app/api/router.py` | Added auth_mobile_router + mobile_router | LOW — additive only |
| `services/api/app/db/base.py` | Added MobileDevice import | LOW — additive only |
| `services/api/app/core/config.py` | Added mobile_token_expire_days: int = 30 | LOW — new field |
| `services/api/app/core/security.py` | Added 3 mobile token functions | LOW — additive only |
| `services/api/app/modules/auth/dependencies.py` | Added get_current_user_bearer | LOW — new function, no existing callers affected |
| `services/api/app/modules/cms/models.py` | Added deleted_at nullable column | LOW — nullable, no existing queries break |

### Modified Files — M02 Mobile Frontend
| File | Change | Blast Radius |
|------|--------|-------------|
| `apps/mobile/app/(auth)/sign-in.tsx` | Full rewrite — email+password+Google form | LOW — was placeholder |
| `apps/mobile/app/(auth)/sign-up.tsx` | Full rewrite — registration form | LOW — was placeholder |
| `apps/mobile/app/(auth)/_layout.tsx` | Added 4 new screens to Stack | LOW — additive |
| `apps/mobile/app/_layout.tsx` | Added AuthGate with onboarding redirect | MEDIUM — controls all navigation |
| `apps/mobile/app/(tabs)/saved.tsx` | Added useRequireAuth() | LOW — adds redirect for unauth |
| `apps/mobile/app/(tabs)/account.tsx` | Added useRequireAuth() | LOW — adds redirect for unauth |
| `apps/mobile/stores/authStore.ts` | Replaced setTokens→setAuth, added setLoading | MEDIUM — touched by AuthProvider |
| `apps/mobile/providers/AuthProvider.tsx` | Added signIn, signUp, signInWithGoogle, signInWithApple | MEDIUM — all auth consumers |
| `apps/mobile/lib/googleAuth.ts` | Added ResponseType.Token | LOW — auth flow only |
| `apps/mobile/package.json` | Added async-storage@2.2.0 | LOW — new dep |

### Blast Radius Summary
- **Backend changes**: additive only — no web endpoints touched, no existing tests broken
- **Mobile changes**: isolated to apps/mobile/ — zero impact on apps/web-next/ production website
- **Database**: migration adds nullable column (deleted_at) to cms_pages — safe, no queries break

### Key Decisions
- Expo SDK 56 (not SDK 51 as specced) — latest at time of implementation (RN 0.85.3, React 19 peer dep)
- `react-native-reanimated` pinned to ~3.16.0 — v4 requires `react-native-worklets`; add in Step M07
- `apps/mobile` excluded from npm workspaces — `react-native@0.85.3` peer dep on `react@^19` conflicts with web-next React 18 when both are in the workspace graph (causes React error #31 on SSR)
- `@sentry/react-native` v8 (config-plugin approach changed from v5 — removed from `plugins` array)
- Sentry guarded by `EXPO_PUBLIC_SENTRY_DSN` env var — disabled in dev without key

---

## Step M01 — Post-push Deployment Fixes (2026-06-03)

### Problem: npm workspaces hoisting breaks DO web deployment

Adding `workspaces` to root `package.json` caused DO's npm 10.9.7 to install ALL workspace packages (web + mobile) at the monorepo root, hoisting packages to their latest compatible versions. Before workspaces, each app installed in isolation with its own lockfile-pinned versions.

### Fix 1 — `ERESOLVE @expo/log-box` (commit `5de7269`)
| File | Change | Production Impact |
|------|--------|-------------------|
| `.npmrc` (root) | `legacy-peer-deps=true` | None — install-time only |
| `apps/mobile/package.json` | Removed explicit `@expo/log-box: ^56.0.12`; loosened expo-linking/expo-constants/@expo/metro-runtime to `~56.0.0` | None |

Root cause: DO's npm 10.9.7 strict resolver rejected `@expo/log-box@^56.0.12` conflicting with expo-router's exact peer dep `56.0.4`.

### Fix 2 — `button.tsx` & `AuthGateModal.tsx` TypeScript errors (commit `54fde37`)
| File | Change | Production Impact |
|------|--------|-------------------|
| `apps/web-next/components/ui/button.tsx` | Cast `(asChild ? Slot : "button") as React.ElementType` | **None — type cast only; runtime identical** |
| `apps/web-next/components/plan/AuthGateModal.tsx` | Replaced `import * as Dialog` namespace with named imports, each cast `as React.ElementType` | **None — same Radix components rendered; JS output byte-identical** |
| `package.json` (root) | Added `overrides: { "@types/react": "^18.3.23", "@types/react-dom": "^18.3.7", "@radix-ui/react-dialog": "1.1.14" }` | None |
| `apps/mobile/package.json` | Changed `@types/react` devDep `^19.0.0` → `^18.3.0` | None |

Root causes:
- `@radix-ui/react-slot@1.2.3` hoisted (was isolated before) — tightened `onChange` type breaks `button.tsx` JSX spread
- `@radix-ui/react-dialog@1.1.15` hoisted (new patch) — added `Promise<ReactNode>` return type for RSC, breaking JSX element type check in `@types/react@18.3.x`
- `react-native@0.85.3` peer dep `@types/react: "^19.1.1"` would have hoisted React 19 types over the whole workspace — blocked by root `overrides`

### Fix 3 — React error #31 on `/404` and `/500` SSR prerender
| File | Change | Production Impact |
|------|--------|-------------------|
| `package.json` (root) | Changed workspaces from `["apps/*", "packages/*"]` → `["apps/web-next", "packages/*"]` — explicitly excludes `apps/mobile` | **None — web build unchanged; mobile uses EAS separately** |
| `apps/mobile/package.json` | Changed `react`/`react-dom` from `^19.0.0` → `^18.3.0` | **None — mobile local install only; EAS builds run standalone** |

Root cause: `react-native@0.85.3` declares `react@^19.2.3` as a peer dep. With `apps/mobile` in workspaces, npm hoisted React 19.2.7 to root `node_modules`, creating two React instance registries (React 18 in web-next, React 19 at root). Next.js's SSR prerender for `/404`/`/500` pages hit the dual-React boundary and threw minified React error #31 ("Objects are not valid as a React child — {$typeof, type, key, ref, props, _owner}").

Fix attempted and rejected: Root `overrides: { "react": "^18.3.0" }` — npm returns `EOVERRIDE` because workspace members' direct deps cannot be overridden via root overrides. Overrides only apply to transitive (nested) deps.

Fix applied: Exclude mobile from workspaces entirely. Mobile is EAS-built; it does not participate in DO's npm install graph. With only `apps/web-next` in workspaces, React 18.3.1 installs cleanly into `apps/web-next/node_modules` with no conflict.

Verification: `npx next build` → ✓ Compiled successfully, ✓ Generating static pages (193/193).

### Xcode Build Failure + Metro Runtime Error — reanimated resolution (2026-06-08)
| File | Change | Impact |
|------|--------|--------|
| `apps/mobile/package.json` | `react-native-reanimated` `~3.16.0` → `4.3.1`; added `react-native-worklets@0.8.3` | None on web |
| `apps/mobile/babel.config.js` | Added `react-native-reanimated/plugin` | None on web |

Root cause chain:
1. `react-native-reanimated@~3.16.0` → Xcode build error: `folly/coro/Coroutine.h` not found (RN 0.85.3 ships newer Folly that removed this header)
2. Removing reanimated entirely → Metro runtime error: `react-native-css-interop` (NativeWind v4) imports `makeMutable`, `withRepeat`, `withSequence` from reanimated at line 281 of `native-interop.js`
3. reanimated 4.3.1 alone → pod install error: `RNReanimated.podspec` validates worklets version, fails if `react-native-worklets` not present
4. Final fix: reanimated 4.3.1 + worklets 0.8.3 (both via `npx expo install`) → ✔ pod install succeeds, no folly errors

Other Xcode issues (non-blocking): Sentry `@_implementationOnly` warnings (~150) are cosmetic. Signing "Failed Registering Bundle Identifier" only affects physical device builds; simulator builds skip signing.

### Safe-to-modify Files (TypeScript-only changes)
Both web-next file changes are **compile-time type annotations only**. They do not change:
- Component identity (same Radix components instantiated)
- Props passed at runtime
- DOM output
- Styling
- Event handlers
- Behaviour on Desktop or Mobile Web

### Step M04 — CMS Offline Content Engine blast radius
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/db/schema.ts` | Drizzle schema: cmsPages + syncMeta | LOW — new file; imported by db/client.ts + syncService.ts |
| `apps/mobile/db/client.ts` | expo-sqlite + Drizzle client + initDb() | LOW — imported by syncService, _layout.tsx |
| `apps/mobile/services/syncService.ts` | syncContent(), getCachedPage(), download/remove helpers | LOW — new file; imported by backgroundSync, offlineStore |
| `apps/mobile/services/backgroundSync.ts` | AppState listener, 15-min throttle | LOW — new file; imported by _layout.tsx |
| `apps/mobile/hooks/useSync.ts` | isSyncing / triggerSync React hook | LOW — new file; used by consumer screens in M05+ |
| `apps/mobile/components/cms/types.ts` | Block union type | LOW — imported by all block components + CMSContentRenderer |
| `apps/mobile/components/cms/CMSContentRenderer.tsx` | Block dispatcher | LOW — new file; used by trek detail screen (M05+) |
| `apps/mobile/components/cms/blocks/*.tsx` | 8 block components | LOW — leaf components; no shared state |
| `apps/mobile/stores/offlineStore.ts` | Zustand offline download state | LOW — new file; imported by OfflineToggle + downloads screen |
| `apps/mobile/components/trek/OfflineBadge.tsx` | Offline indicator | LOW — leaf component |
| `apps/mobile/components/trek/OfflineToggle.tsx` | Download/delete toggle | LOW — leaf component; imports offlineStore + useAuth |
| `apps/mobile/app/(tabs)/downloads.tsx` | Downloads list screen | LOW — leaf screen; no upstream callers |
| `apps/mobile/app/_layout.tsx` | Root layout | MEDIUM — wired initDb + backgroundSync + offlineStore; any error here affects app boot |
| `apps/mobile/app.config.ts` | Added expo-sqlite plugin | LOW — additive plugin config |

**No backend changes.** All M04 work is mobile-only (apps/mobile). Zero blast radius on web-next or services/api.

---

### Step M-DS1 — Mobile Design System Overhaul blast radius
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/constants/theme.ts` | Full rewrite — lightColors + darkColors + backward-compat `colors` alias | MEDIUM — `colors` alias preserves backward compat; new light/dark palettes used by ThemeProvider |
| `apps/mobile/tailwind.config.js` | New tokens (pine, saffron, sky, earth, mist, paper) + darkMode:class | MEDIUM — NativeWind CSS class compilation for all components |
| `apps/mobile/providers/ThemeProvider.tsx` | NEW — NativeWind v4 `setColorScheme` + AsyncStorage preference | LOW — new provider; wraps app in _layout.tsx |
| `apps/mobile/hooks/useTheme.ts` | NEW — `isDark`, `colors`, `toggleTheme` | LOW — new hook; consumed by auth screens + UI components |
| `apps/mobile/components/ui/Logo.tsx` | NEW — TrekYatra logo (assets/logo.png) | LOW — leaf component |
| `apps/mobile/components/tabs/CustomTabBar.tsx` | NEW — FAB tab bar (Plan as saffron FAB) | LOW — leaf component; replaces default tab bar in _layout.tsx |
| `apps/mobile/app/(auth)/welcome.tsx` | Full rewrite — 4-slide photo carousel | LOW — leaf screen; no upstream callers |
| `apps/mobile/app/(tabs)/_layout.tsx` | CustomTabBar prop; href:null on downloads; label renames | LOW — only affects tab bar visual + downloads visibility |
| `apps/mobile/app/(auth)/sign-in.tsx` | Light design + Logo + useTheme | LOW — leaf screen |
| `apps/mobile/app/(auth)/sign-up.tsx` | Light design + Logo + useTheme | LOW — leaf screen |
| `apps/mobile/components/ui/SafeArea.tsx` | useTheme() background color | LOW — leaf component |
| `apps/mobile/components/ui/Button.tsx` | bg-saffron hero + useTheme text colors | LOW — leaf component |
| `apps/mobile/app/_layout.tsx` | ThemeProvider wrapper added | LOW — additive wrapper |
| `apps/mobile/app.config.ts` | splash.backgroundColor Pine + userInterfaceStyle: automatic | LOW — config only |

**No backend changes. No web-next changes.** All M-DS1 work is mobile-only. Zero blast radius on production website.

---

### Step M05 — Trek Detail Screen blast radius
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/lib/mobileApi.ts` | NEW — Bearer-token API client with auto-refresh; contentApi helpers | LOW — new file; no existing callers |
| `apps/mobile/lib/behaviorProfile.ts` | NEW — AsyncStorage ty_behavior_v1 read/write | LOW — new file; imported by useTrekDetail + home screen |
| `apps/mobile/hooks/useTrekDetail.ts` | NEW — TanStack Query: network-first + SQLite upsert/fallback | LOW — new hook; used by trek detail screen only |
| `apps/mobile/app/(tabs)/(home)/_layout.tsx` | NEW — Stack layout for home route group | LOW — new file; enables back-nav from trek detail |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | NEW — Trek detail screen | LOW — new dynamic route; no upstream callers |
| `apps/mobile/components/trek/TrekHero.tsx` | NEW — expo-image hero + LinearGradient + title | LOW — leaf component |
| `apps/mobile/components/trek/TrekMetaStrip.tsx` | NEW — duration/altitude/difficulty/season chips | LOW — leaf component |
| `apps/mobile/components/trek/TrekTabBar.tsx` | NEW — Guide/Packing/Permits/Costs switcher | LOW — leaf component |
| `apps/mobile/components/trek/TrekStickyBar.tsx` | NEW — Plan CTA + Save button (auth-gated) | LOW — leaf component; imports useAuth + mobileApi |
| `apps/mobile/components/trek/TrekCard.tsx` | NEW — Reusable trek card (expo-image, difficulty badge) | LOW — new component; shared with M06 home screen |
| `apps/mobile/components/trek/TrekRelatedRow.tsx` | NEW — Horizontal related treks row | LOW — leaf component; uses TrekCard |
| `apps/mobile/app/(tabs)/_layout.tsx` | Home tab name: `"index"` → `"(home)"` | LOW — cosmetic route group rename; navigation unchanged |
| `apps/mobile/app.config.ts` | Added `"expo-image"` to plugins | LOW — additive config |

**No backend changes. No web-next changes.** All M05 work is mobile-only. Zero blast radius on production website.

---

### Step M06 — Home Screen + 4-State Personalisation blast radius
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/app/(tabs)/(home)/index.tsx` | NEW — 4-state home screen | LOW — new route; replaces placeholder |
| `apps/mobile/hooks/useBehaviorProfile.ts` | NEW — Reads ty_behavior_v1 from AsyncStorage | LOW — new hook; used by home screen |
| `apps/mobile/hooks/useHomeData.ts` | NEW — Parallel TanStack useQueries (trending + seasonal + recs) | LOW — new hook; used by home screen |
| `apps/mobile/components/home/HomeWelcomeBanner.tsx` | NEW — States A+B greeting cards | LOW — leaf component |
| `apps/mobile/components/home/HomeTrendingSection.tsx` | NEW — Horizontal trek card row | LOW — leaf component; uses TrekCard |
| `apps/mobile/components/home/RegionsRow.tsx` | NEW — Region filter chip row | LOW — leaf component |
| `apps/mobile/components/home/SeasonalPicksRow.tsx` | NEW — Monthly seasonal treks row | LOW — leaf component; uses TrekCard |
| `apps/mobile/components/home/RecentlyViewedRow.tsx` | NEW — State D recently viewed | LOW — leaf component |
| `apps/mobile/components/home/PersonalisedFeedSection.tsx` | NEW — States A/B/D feed grid | LOW — leaf component; uses expo-image |
| `apps/mobile/components/home/HomeSkeleton.tsx` | NEW — Pulse skeleton loader | LOW — leaf component |

**No backend changes. No web-next changes.** All M06 work is mobile-only. Zero blast radius on production website.

---

### Mobile Crosscheck Bugfix Pass (M-DS1–M06) blast radius — Done (2026-06-11)
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `services/api/app/api/routes/treks.py` | NEW `GET /api/v1/treks/seasonal` route, registered before `/{slug}` | LOW — additive route; `gitnexus_detect_changes` confirmed no impact on `/treks/{slug}` or `/treks/filter-facets` |
| `services/api/app/modules/cms/service.py` | NEW `get_seasonal_pages()` + `_parse_season_range()`/`_month_in_season()` helpers | LOW — additive functions; no existing callers modified |
| `services/api/tests/test_treks_seasonal.py` | NEW — 7 tests for `/treks/seasonal` | LOW — new test file |
| `apps/mobile/lib/mobileApi.ts` | Rewired `contentApi` (trending/seasonal/recommendations/save) to real backend endpoints + response mappers | MEDIUM — consumed by `useHomeData`, `useTrekDetail`, `TrekStickyBar`; all call sites already expected `TrekListItem[]`/save semantics, so shape is unchanged at the call site |
| `apps/mobile/hooks/useHomeData.ts` | `getAnonymousRecommendations()` call no longer passes `topRegions`/`topDifficulties` (backend doesn't accept them; kept in queryKey only) | LOW — query result shape unchanged |
| `apps/mobile/components/tabs/CustomTabBar.tsx` | `getIconName`/`getLabelText` `"index"` → `"(home)"`; added `options.href === null` filter to hide `downloads` tab | LOW — restores intended M-DS1/M05 tab-bar behaviour; impact analysis (`gitnexus_impact`, downstream) shows only internal helper calls (`useTheme`, `getIconName`, `getLabelText`) |
| `apps/mobile/app/(tabs)/browse.tsx` | Placeholder text "coming in M03" → "coming in M07" | LOW — copy-only change |
| `apps/mobile/app/_layout.tsx` | Added `PlayfairDisplay_700Bold`/`_600SemiBold` to `useFonts()`; fixed post-login redirect `"/(tabs)"` → `"/(tabs)/(home)"` | MEDIUM — root layout; redirect fix restores navigation after login (was a dead route since M05's `(home)` rename) |
| `.claude/skills/mobile-design-system/SKILL.md` | NEW — mobile design-system skill doc | LOW — documentation only |
| Root `CLAUDE.md` | Added skill to CLI table + Pre-Step Checklist item 9 | LOW — process documentation only |

**No web-next changes.** Zero blast radius on production website (desktop + mobile web unaffected).

### Step M-DS2 — Splash, Onboarding & Auth Polish blast radius — Done (2026-06-11)
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/components/ui/AnimatedSplash.tsx` | NEW — "Trail Comes Alive" cinematic splash (`react-native-svg` + `react-native-reanimated`) | LOW — new leaf component; `gitnexus_impact` upstream = 0 callers (only imported by `_layout.tsx`) |
| `apps/mobile/app/_layout.tsx` | Renders `AnimatedSplash` overlay; `AuthGate` no longer redirects unauthenticated users to `(auth)/sign-in` | MEDIUM — root layout; `gitnexus_impact` on `AuthGate` (upstream) = 0 (no other callers); anonymous users now reach `(tabs)`, but `useRequireAuth()` (used by `account.tsx`/`saved.tsx`) is unchanged and continues to gate those screens |
| `apps/mobile/app.config.ts` | `splash.backgroundColor` `#1D3A2E` → `#0c0e14` | LOW — native splash background color only |
| `apps/mobile/app/(auth)/welcome.tsx` | Full-bleed (`Dimensions.get("screen")`), contrast fix, back-chevron, new slide 3/4 copy | LOW — leaf onboarding screen, no downstream consumers |
| `apps/mobile/app/(auth)/sign-in.tsx` | Skip button + `onApple` handler | LOW — leaf screen |
| `apps/mobile/app/(auth)/sign-up.tsx` | Skip button | LOW — leaf screen |
| `apps/mobile/components/auth/SocialSignInButtons.tsx` | Google/Apple icons; Apple button always renders with default "coming soon" handler | LOW — `gitnexus_impact` upstream = 0 (used only by sign-in.tsx) |
| `apps/mobile/components/ui/Button.tsx` | Added optional `icon?: React.ReactNode` prop | LOW — additive optional prop; `gitnexus_impact` upstream = 0 in graph (widely used via JSX, existing call sites unaffected since `icon` is optional) |
| `apps/mobile/lib/authApi.ts` | `apiPost`/`apiGet` → `fetchWithTimeout` (15s `AbortController`) | HIGH (graph) but contained — `gitnexus_impact` upstream shows `signIn`, `signUp`, `refreshAccessToken`, `forgotPassword`, `resetPassword`, `mobileApi.fetchWithAuth`, `forgot-password.tsx`/`reset-password.tsx` handlers, all within `apps/mobile`; signature/return type unchanged, purely additive timeout wrapper |
| `apps/mobile/package.json` / `package-lock.json` | Added `react-native-svg` | LOW — new SDK 56-compatible native module, `npx expo install` |

**No backend changes. No web-next changes.** All M-DS2 work is mobile-only. Zero blast radius on production website (desktop + mobile web unaffected).

### Repo Housekeeping — removed files (2026-06-11)
| File | Status | Note |
|------|--------|------|
| `.claude/CLAUDE.md` | Removed (tracked, `git rm`) | Held `vexp` MCP-pipeline instructions; vexp daemon was never running this session, instructions caused tool-selection hallucination (told agent to avoid Grep/Glob/Read) |
| `.claude/hooks/vexp-guard.sh` | Removed (was untracked) | PreToolUse hook script for the vexp daemon |
| `.claude/settings.json` | Removed (was untracked) | Its only hook entry pointed at the now-deleted `vexp-guard.sh` |
| `CLAUDE.md` (root) | Modified | Restored an accidentally-dropped CLI table row referencing `.claude/skills/mobile-design-system/SKILL.md`; row was dropped a second time by a subsequent `npx gitnexus analyze --force` auto-regeneration (counts refreshed to 472099 symbols / 766819 relationships) and restored again on 2026-06-11 — this row appears to be silently removed by every gitnexus reindex and may need re-restoring after future reindexes |

LOW — config/doc only, zero blast radius on `apps/mobile` or `apps/web-next` code.

### Step M-DS2 — QA Follow-up Fixes blast radius — Done (2026-06-11)
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/components/ui/AnimatedSplash.tsx` | Logo size 72×72 → 140×140 | LOW — `gitnexus_impact` upstream = 0 (only `_layout.tsx` imports it) |
| `apps/mobile/providers/OnboardingProvider.tsx` | NEW — React Context wrapping `AsyncStorage` `trekyatra_onboarding_done`; exposes `{ isLoading, done, markDone }` | LOW — new leaf provider; consumed by `AuthGate` + `welcome.tsx`/`sign-in.tsx`/`sign-up.tsx` (all already in this pass) |
| `apps/mobile/app/_layout.tsx` | `AuthGate` now reads `useOnboarding()` instead of local `AsyncStorage`-backed state; `RootLayout` wraps tree in `OnboardingProvider` | LOW — `gitnexus_impact` on `AuthGate` upstream = 0 (no other callers); fixes Skip → Home redirect loop |
| `apps/mobile/app/(auth)/welcome.tsx` | Replaced 7-layer hard-edge overlay with single `LinearGradient` (`transparent → rgba(5,8,15,0.92)`); `handleGetStarted`/`handleSignIn` use `markDone()` | LOW — leaf onboarding screen, no downstream consumers |
| `apps/mobile/app/(auth)/sign-in.tsx` | `handleSkip` uses `markDone()` instead of direct `AsyncStorage.setItem` | LOW — leaf screen |
| `apps/mobile/app/(auth)/sign-up.tsx` | `handleSkip` uses `markDone()` instead of direct `AsyncStorage.setItem` | LOW — leaf screen |

**Native dev-client rebuild**: `apps/mobile/ios/` (gitignored, prebuilt EAS dev-client project) was rebuilt via `npx expo prebuild --platform ios` + `pod install` (added `RNSVG 15.15.4`, 118 total pods) + `npx expo run:ios` to link `react-native-svg`'s native module — fixes the "Unimplemented component: <RNSVGSvgView>" splash crash. No files under `apps/mobile/ios/` are tracked by git (`.gitignore: ios/`), so nothing to commit from the rebuild itself.

**No backend changes. No web-next changes.** Zero blast radius on production website (desktop + mobile web unaffected).

### Step M-DS3 — Home Screen Web-Parity + Content Hub Screens blast radius — Done (2026-06-12)

**Backend (additive only — no breaking changes to existing consumers):**
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `services/api/app/schemas/recommendations.py` | `RecommendationItem` gains 4 new optional fields: `trek_difficulty`, `trek_state`, `trek_duration`, `trek_season` | LOW — additive optional fields; existing consumers (`apps/web-next`, mobile) ignore unknown fields |
| `services/api/app/modules/recommendations/service.py` | `_page_to_dict`, `find_similar_pages`, `find_similar_to_query`, `get_anonymous_recommendations`, `_row_to_dict` extended to SELECT + populate the 4 new `CMSPage` columns | MEDIUM upstream (feeds `/api/v1/recommendations`, `/api/v1/account/recommendations`) — verified via `gitnexus_impact`; response shape change is additive only |
| `services/api/tests/test_recommendations.py` | +TC-B16, +TC-B17 (new fields populated, anonymous + personalised) | LOW — test-only |

**Mobile (new files + Home rewiring):**
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/lib/mobileApi.ts` | `RecommendationItem` +4 fields, `mapRecommendationToTrekListItem` maps them through; new `Product`/`Operator`/`PlanRecommendRequest`/`TrekRecommendation`/`PlanRecommendResponse` types; `contentApi.getCmsPagesByType/getProducts/getOperators`; new `planApi.recommend` | LOW — additive exports; `mapRecommendationToTrekListItem` change only affects display (now shows real tags instead of `null`) |
| `apps/mobile/components/cms/CMSHubScreen.tsx` (NEW) | Shared CMS hub-list screen | LOW — new leaf component, used only by new hub screens |
| `apps/mobile/app/(tabs)/(home)/guide/[slug].tsx` (NEW) | Generic CMS page detail screen | LOW — new route |
| `apps/mobile/app/(tabs)/(home)/{packing,permits,costs,safety,beginner,plan-my-trek,compare,products,operators}.tsx` (NEW) | Content-hub destination screens | LOW — new routes, no existing screen depends on them |
| `apps/mobile/app/(tabs)/(home)/_layout.tsx` | Added `Stack.Screen` registrations + titles for all new routes | LOW — additive registrations |
| `apps/mobile/components/home/{CategoryHubRow,DifficultyTabsSection,EditorialFeatureCard,ComparisonCTACard,ResourcesRow,OperatorsCTACard}.tsx` (NEW) | New Home section components | LOW — new leaf components |
| `apps/mobile/app/(tabs)/(home)/index.tsx` | Rewired section order to mirror web Home; added `dedupedTreks` (merge trending+seasonal) for `DifficultyTabsSection` | MEDIUM — `gitnexus_impact` upstream on `HomeScreen`/`resolveState` confirmed only `(tabs)/(home)` route consumes it; no other screen imports `HomeScreen` |

`gitnexus_detect_changes(scope:"all")` confirmed changed/affected scope = `HomeScreen`, `mobileApi.ts`, recommendations service/schema/tests — matches expected files, no unexpected blast radius.

**No `apps/web-next` files touched.** Zero blast radius on production website (desktop + mobile web unaffected).

### Step M-DS4 — Trek Detail Screen Web-Parity blast radius — Done (2026-06-12)

**Mobile-only — no backend changes:**
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/lib/mobileApi.ts` | `CMSPage` gains `published_at`/`updated_at` (additive); new `NewsArticle`/`RelatedPage` interfaces; new `contentApi.getNewsByTrek`/`getRelatedPages` | HIGH/54 impacted via `gitnexus_impact` — purely file-import fan-out (18 files import from `mobileApi.ts`); change itself is additive (2 new optional fields), confirmed by 0 `tsc` errors across all consumers |
| `apps/mobile/hooks/useTrekDetail.ts` | `mapDbToPage` (offline SQLite fallback) sets `published_at: null, updated_at: null` to satisfy extended `CMSPage` type | LOW — single internal mapper, 0 impacted |
| `apps/mobile/components/trek/TrustSignals.tsx` (NEW) | "Updated/Published {date}" + author + fact-checked badge row | LOW — new leaf component |
| `apps/mobile/components/trek/TrekNewsSection.tsx` (NEW) | Horizontal news-article card row for this trek (external deep link to `trekyatra.co.in/news/{slug}`) | LOW — new leaf component, fetches `/api/v1/public/news/by-trek/{slug}` |
| `apps/mobile/components/trek/RelatedPagesSection.tsx` (NEW) | "In this cluster" vertical related-pages list | LOW — new leaf component, fetches `/api/v1/links/suggestions/{slug}` |
| `apps/mobile/components/trek/TrekContentsSheet.tsx` (NEW) | Native "Contents" bottom-sheet modal (TOC) | LOW — new leaf component |
| `apps/mobile/components/cms/blocks/HeadingBlock.tsx` | Accepts optional `onLayout` prop, passed through to wrapping `View` | LOW — 0 impacted, additive optional prop |
| `apps/mobile/components/cms/CMSContentRenderer.tsx` | Accepts optional `onHeadingLayout?: (id, y) => void`, passed to `HeadingBlock` only when `block.id` set | LOW — 0 impacted, additive optional prop |
| `apps/mobile/components/trek/TrekStickyBar.tsx` | Added third icon button (Ionicons `git-compare-outline`) → `/compare?slug={slug}` | LOW — 0 impacted |
| `apps/mobile/app/(tabs)/(home)/compare.tsx` | Reads `?slug=` search param; pre-selects that trek on mount if present in trending-treks list | LOW — 0 impacted |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Wires in `TrustSignals`, "☰ Contents" pill + `TrekContentsSheet`, `TrekNewsSection` + `RelatedPagesSection`; `scrollViewRef` + `headingOffsets`/`tabBodyOffset` refs for scroll-to-section | LOW — 0 impacted, top-level route screen |

`gitnexus_detect_changes(scope:"all")` confirmed `risk_level: "medium"`, 14 changed symbols / 5 affected / 8 changed files — all expected for this step (the 4 new components are picked up by `npx gitnexus analyze --force` re-index, not in `detect_changes`).

**No `apps/web-next` files touched.** Zero blast radius on production website (desktop + mobile web unaffected).

### Step M-DS5 — Splash Screen Rebuild blast radius — Done (2026-06-12)

**Mobile-only — no backend changes:**
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/assets/splash-background.jpg` (NEW) | Full-bleed splash background photo (user-provided) | LOW — static asset, only referenced by `AnimatedSplash.tsx` |
| `apps/mobile/components/ui/AnimatedSplash.tsx` | Rewritten as static composition (background image + white logo card); same `onFinish()` contract | LOW — `gitnexus_impact` upstream: 0 impacted; sole consumer `app/_layout.tsx` unchanged (prop contract identical) |

`gitnexus_detect_changes(scope:"all")` confirmed `risk_level: "low"`, 5 changed symbols / 0 affected / 1 changed file — all within `AnimatedSplash.tsx`, as expected.

**No `apps/web-next` files touched.** Zero blast radius on production website (desktop + mobile web unaffected).

### Step M-DS6 — Splash→Onboarding Transition + Onboarding Skip CTA blast radius — Done (2026-06-12)

**Mobile-only — no backend changes:**
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/components/ui/AnimatedSplash.tsx` | Re-added `react-native-reanimated` logo scale/fade-in + container fade-out before `onFinish()`; enlarged card (152×152) and logo (110×110) | LOW — `gitnexus_impact` upstream: 0 impacted; sole consumer `app/_layout.tsx` unchanged (prop contract identical) |
| `apps/mobile/app/(auth)/welcome.tsx` | New `handleSkip()` + top-right "Skip" pill button (slides 1-3) → `markDone()` + `router.replace("/(auth)/sign-up")` | LOW — `gitnexus_impact` upstream: 0 impacted; leaf route screen |

`gitnexus_detect_changes(scope:"all")` confirmed `risk_level: "low"`, 14 changed symbols / 0 affected / 2 changed files — all within `AnimatedSplash.tsx` and `welcome.tsx`, as expected.

**No `apps/web-next` files touched.** Zero blast radius on production website (desktop + mobile web unaffected).

### Step M-DS7 — QA Bugfix Pass blast radius — Done (2026-06-12)

**Mobile-only — no backend changes:**
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/components/tabs/CustomTabBar.tsx` | Added `if (route.name === "downloads") return null;` to the tab-route map, removing the ghost 6th tab | LOW — `gitnexus_impact` upstream: 0 impacted |
| `apps/mobile/app/(tabs)/(home)/_layout.tsx` | Added `headerBackButtonDisplayMode: "minimal"` to Stack `screenOptions` — icon-only back chevron app-wide in this stack | LOW — single config line, no symbol-level callers |
| `apps/mobile/package.json` | New dependency `react-native-render-html` (peer `react-native-svg` already present) | LOW — additive dependency |
| `apps/mobile/components/cms/HtmlContentRenderer.tsx` (NEW) | Renders `content_html` string via `RenderHTML`, theme-token `tagsStyles` (PlayfairDisplay headings, Inter body, saffron links/blockquote) | LOW — new leaf component |
| `apps/mobile/lib/mobileApi.ts` | `CMSPage` gains `content_html: string` + `content_json: {sections?: Record<string,string>} \| null` (additive) | LOW — `gitnexus_impact` upstream on `CMSContentRenderer`/`useTrekDetail`: 0–1 impacted (`TrekDetailScreen` only); 0 `tsc` errors across consumers |
| `apps/mobile/hooks/useTrekDetail.ts` | `mapDbToPage` sets `content_html: ""`, `content_json: null` for offline-cached pages (not persisted to SQLite) | LOW — single internal mapper, 1 impacted (`TrekDetailScreen`, expected) |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Removed dead 404-causing `${slug}-packing/-permits/-costs` sub-page fetches; `getTabContent()` simplified to Guide-only `body_json`; new `getTabHtml()` maps Packing/Permits/Costs tabs to `content_json.sections.{packing,permits,cost_estimate}`, Guide tab falls back to full `content_html` via `HtmlContentRenderer` | LOW — top-level route screen, 0 impacted |
| `apps/mobile/components/home/HomeHero.tsx` (NEW) | Full-width hero banner (`onboarding-1.jpg` + pine gradient + wordmark/tagline) | LOW — new leaf component |
| `apps/mobile/components/home/HomeSearchBar.tsx` (NEW) | Tappable search pill, navigates to `/(tabs)/browse/search` (M07a) | LOW — new leaf component |
| `apps/mobile/app/(tabs)/(home)/index.tsx` | Replaced `HomeHeader` with `<HomeHero />` + `<HomeSearchBar />` in both skeleton and loaded states; removed unused `HomeHeader`/styles | LOW — top-level route screen, 0 impacted |

`gitnexus_detect_changes(scope:"all")` confirmed 11 changed symbols / 10 affected / 9 changed files — all within the files above (plus a pre-existing unrelated `CLAUDE.md` touch from before this step). `npx tsc --noEmit` → 0 errors.

**No `apps/web-next` files touched.** Zero blast radius on production website (desktop + mobile web unaffected).

### Step M07a — Browse Tab blast radius — Done (2026-06-12)

**Backend (additive only):**
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `services/api/app/api/routes/cms.py` | `list_cms_pages` (`GET /api/v1/cms/pages`) gains optional `trek_state`, `trek_difficulty`, `trek_season`, `trek_duration_min`, `trek_duration_max` query params, passed through to `list_pages()` | LOW — all new params default to `None`; existing callers (web-next CMS admin, mobile `getCmsPagesByType`/`getTrendingTreks`/`getSeasonalTreks`) unaffected |
| `services/api/app/modules/cms/service.py` | `list_pages()` adds matching optional filter clauses; `trek_duration` range filter via `regexp_replace`/`cast(Integer)` extraction of leading day count, guarded by `~ '^[0-9]'` regex | LOW — `gitnexus_impact` upstream confirmed only `list_cms_pages` calls `list_pages`; new clauses only applied when params provided |

**Mobile:**
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/lib/mobileApi.ts` | New `FilterFacets`, `SearchSuggestion`, `ExploreFilters` types; new `contentApi.getFilterFacets`, `exploreTreks`, `getSearchSuggestions` | LOW — additive exports only |
| `apps/mobile/stores/exploreStore.ts` (NEW) | Zustand store: `trekState`/`trekDifficulty`/`trekSeason`/`durationBucket` filter state, `DURATION_BUCKETS` constant | LOW — new isolated store |
| `apps/mobile/hooks/useFilterFacets.ts` (NEW) | `useQuery` wrapper over `GET /api/v1/treks/filter-facets` | LOW — new leaf hook |
| `apps/mobile/hooks/useExplore.ts` (NEW) | `useInfiniteQuery` wrapper over `GET /api/v1/cms/pages` with explore filters | LOW — new leaf hook |
| `apps/mobile/components/browse/SearchBar.tsx` (NEW) | Shared tappable search pill (`SearchBar` + `SearchBarWrapper`), navigates to `/(tabs)/browse/search` | LOW — new leaf component |
| `apps/mobile/components/home/HomeSearchBar.tsx` | Refactored to wrap shared `SearchBar` (same visual output via `marginTop: -24` override) | LOW — `gitnexus_impact` upstream: only `(home)/index.tsx`, no visual change |
| `apps/mobile/components/browse/TrekGrid.tsx` (NEW) | 2-col `FlatList` of `TrekCard`, infinite scroll, empty/loading states, `ListHeaderComponent` | LOW — new component, reuses existing `TrekCard` |
| `apps/mobile/components/browse/FilterChips.tsx` (NEW) | Horizontal active-filter chip row, opens `FilterSheet` | LOW — new component |
| `apps/mobile/components/browse/FilterSheet.tsx` (NEW) | Full-screen Modal filter sheet (Region/Difficulty/Season/Duration), no new dependency | LOW — new component |
| `apps/mobile/app/(tabs)/browse.tsx` (DELETED) | Old placeholder screen | LOW — replaced by `browse/` directory, Expo Router resolves automatically |
| `apps/mobile/app/(tabs)/browse/_layout.tsx` (NEW) | Stack layout mirroring `(home)/_layout.tsx`, `headerBackButtonDisplayMode: "minimal"` | LOW — new route layout |
| `apps/mobile/app/(tabs)/browse/index.tsx` (NEW) | Rebuilt Browse screen: title + `SearchBar` + `FilterChips` + Regions row + Seasons row + `TrekGrid` via `useExplore`; reads `?region=` param from existing Home `RegionsRow` | LOW — top-level route screen, 0 impacted |
| `apps/mobile/app/(tabs)/browse/regions/[state].tsx` (NEW) | Region hub — `TrekGrid` filtered by `trek_state` via `useExplore` | LOW — new route screen |
| `apps/mobile/app/(tabs)/browse/seasons/[season].tsx` (NEW) | Season hub — uses existing `GET /treks/seasonal?month=` via static slug→month map (Winter/Spring/Summer/Monsoon/Autumn) | LOW — new route screen, reuses existing `getSeasonalTreks` |
| `apps/mobile/app/(tabs)/browse/search.tsx` (NEW) | Basic search via `GET /api/v1/search/suggestions?q=`; "Start typing to search" placeholder (recent/trending/semantic/voice deferred to M07b) | LOW — new route screen, reuses existing endpoint |

`gitnexus_detect_changes(scope:"all")` confirmed `risk_level: "low"`, 36 changed symbols / 0 affected / 5 changed files — `mobileApi.ts`, `cms.py` (routes), `cms/service.py`, `test_cms.py`, `CLAUDE.md` (pre-existing). New mobile route files not yet reflected pending `npx gitnexus analyze --force` re-index. `npx tsc --noEmit` → 0 errors.

**No `apps/web-next` files touched.** Zero blast radius on production website (desktop + mobile web unaffected).

### Step M07b — Advanced Search blast radius — Done (2026-06-14)

**Backend:** no changes — `POST /api/v1/search/semantic`, `GET /api/v1/search/trending`, `POST /api/v1/search/log` (`services/api/app/api/routes/search.py`) already existed; only consumed from mobile.

**Mobile:**
| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/package.json` / `app.config.ts` | New dependency `expo-speech-recognition@^56.0.1` + `plugins` entry (mic/speech usage strings, Android speech service package) | LOW — additive native module, requires existing `expo-dev-client`; gracefully hidden on Expo Go/web |
| `apps/mobile/lib/mobileApi.ts` | New `SemanticSearchResult` type; new `contentApi.semanticSearch`, `getTrendingSearches`, `logSearch` | LOW — additive exports only |
| `apps/mobile/hooks/useRecentSearches.ts` (NEW) | AsyncStorage-backed recent searches (`ty_recent_searches`, max 8) | LOW — new leaf hook |
| `apps/mobile/hooks/useTrendingSearches.ts` (NEW) | `useQuery` wrapper over `GET /api/v1/search/trending` | LOW — new leaf hook |
| `apps/mobile/hooks/useSemanticSearch.ts` (NEW) | Debounced (800ms, >3-word) `useQuery` wrapper over `POST /api/v1/search/semantic` | LOW — new leaf hook |
| `apps/mobile/app/(tabs)/browse/search.tsx` | Rewritten: Recent/Trending chip sections (empty query), mic-based voice input via `expo-speech-recognition`, "Suggested for you" semantic section with "Smart match" badge, `addRecentSearch`/`logSearch` on selection | LOW — leaf route screen, only consumer of new hooks |

### bugfix + Step M07c — Home screen difficulty/region fixes — Done (2026-06-14)

**Backend:** no changes — both fixes reuse the existing `contentApi.exploreTreks()` → `GET /api/v1/cms/pages?page_type=trek_guide&status=published&...` (added in M07a).

| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/hooks/useDifficultyTreks.ts` (NEW) | Per-tab `useQuery` over `exploreTreks({trekDifficulty: value})` for a fuzzy list of raw DB values (`Moderate` → `["Moderate","Moderate-Difficult"]`, etc.), merged + deduped | LOW — new leaf hook |
| `apps/mobile/components/home/DifficultyTabsSection.tsx` | Dropped `treks` prop; now uses `useDifficultyTreks(activeTab)` directly, with a loading state | LOW — `gitnexus_impact` confirmed 0 upstream callers besides Home screen |
| `apps/mobile/app/(tabs)/(home)/index.tsx` | Removed now-unused `dedupedTreks` computation and `treks` prop on `<DifficultyTabsSection />` | LOW — `dedupedTreks` was only consumed here |
| `apps/mobile/hooks/useRegionTreks.ts` (NEW) | `useQuery` over `exploreTreks({trekState: region}, 5, 0)` | LOW — new leaf hook |
| `apps/mobile/components/home/RegionsRow.tsx` | Region chips are now selectable tabs (default: first region); added "View all →" header link to `/(tabs)/browse?region=<activeRegion>` (Browse already reads this param); renders up to 5 `TrekCard`s or an empty state below the chips | LOW — `gitnexus_impact` confirmed 0 upstream callers besides Home screen |

`gitnexus_detect_changes(scope:"all")` (pre-re-index, commit 1 only) → risk "low", 6 changed symbols / 0 affected / 3 changed files (`(home)/index.tsx`, `DifficultyTabsSection.tsx`, `RegionsRow.tsx`); new hook files appear after `npx gitnexus analyze --force`. No `apps/web-next` or backend files touched — zero blast radius on production website (desktop + mobile web).

`gitnexus_detect_changes(scope:"all")` confirmed `risk_level: "low"`, 9 changed symbols / 0 affected / 6 changed files — `search.tsx`, `mobileApi.ts`, `CLAUDE.md` (pre-existing). New hook files + `app.config.ts`/`package.json` reflected after `npx gitnexus analyze --force` re-index. `npx tsc --noEmit` → 0 errors.

### bugfix (2026-06-15) — Voice search crash on Browse → Search mic tap

| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/app/(tabs)/browse/search.tsx` | `handleMicPress` body wrapped in `try/catch` — any error thrown by `ExpoSpeechRecognitionModule.requestPermissionsAsync()` / `.start()` / `.stop()` (native module not yet present in the installed dev-client binary, permission dialog errors, etc.) is now caught, logged via `console.warn`, and `isRecording` is reset, instead of propagating as an unhandled rejection that crashes the app | LOW — `gitnexus_impact` confirmed `SearchScreen` has 0 upstream callers; `gitnexus_detect_changes(scope:"all")` → risk "medium" (3-step process touch, expected for the screen's own functions), 7 changed symbols / 2 affected processes (both `SearchScreen`-rooted, step 1 only) / 2 changed files (`search.tsx`, pre-existing `CLAUDE.md`) |

**Root cause note**: `expo-speech-recognition` was added as a new native module in M07b (2026-06-14). If the installed Expo dev-client binary was built before that step, `ExpoSpeechRecognitionModule` native calls throw at runtime on first use even though `isRecognitionAvailable()` (called at module-eval time) may still report `true`. The `try/catch` prevents this from crashing the app; if voice search still doesn't start after this fix, a new dev-client build (`eas build --profile development` or `npx expo run:ios`/`run:android`) is required to compile in the native module. No backend or `apps/web-next` changes.

**No `apps/web-next` files touched.** Zero blast radius on production website (desktop + mobile web unaffected).

### Step M-DS8 — Glass UI Overhaul blast radius — Done (2026-06-15)

**Mobile-only — no backend changes.** New dependencies: `expo-glass-effect`, `expo-blur` (both native modules, require dev-client rebuild).

| File | Purpose | Blast Radius |
|------|---------|-------------|
| `apps/mobile/constants/theme.ts` | New `glassTint`/`glassBorder`/`glassOverlay` tokens in `lightColors`/`darkColors` | LOW — additive tokens |
| `apps/mobile/components/ui/GlassSurface.tsx` (NEW) | Single reusable glass primitive — `GlassView` (expo-glass-effect, iOS 26+) / `BlurView` (expo-blur, fallback) | LOW — new leaf component |
| `apps/mobile/components/tabs/CustomTabBar.tsx`, `components/trek/TrekStickyBar.tsx`, `components/trek/TrekTabBar.tsx` | Solid chrome backgrounds → `GlassSurface` absolute-fill, borders/shadows preserved | LOW — `gitnexus_impact` 0 callers each |
| `apps/mobile/components/home/HomeWelcomeBanner.tsx`, `CategoryHubRow.tsx`, `EditorialFeatureCard.tsx`, `ComparisonCTACard.tsx`, `OperatorsCTACard.tsx`, `ResourcesRow.tsx`, `components/browse/SearchBar.tsx` | Surface containers → `GlassSurface` | LOW — leaf home-screen components |
| `apps/mobile/components/browse/FilterSheet.tsx`, `components/trek/TrekContentsSheet.tsx` | Bottom-sheet modal backgrounds → `GlassSurface` (`rounded="none"` + top-corner-only radius override) | LOW — leaf modal components |
| `apps/mobile/components/trek/TrekMetaStrip.tsx`, `components/trek/TrekCard.tsx`, `components/home/RecentlyViewedRow.tsx` | Meta strip / card info footer / recently-viewed cards → `GlassSurface` | LOW — `TrekCard` disambiguated via `target_uid` (3 same-named symbols across mobile/web-next); mobile `TrekCard` consumed by `SeasonalPicksRow`, `TrekRelatedRow`, `DifficultyTabsSection`, `RegionsRow` |
| `apps/mobile/components/browse/FilterChips.tsx` | Inactive "Filters"/active-filter pills → `GlassSurface`; active "Filters" toggle (filters set) stays solid saffron | LOW — 0 callers |
| `apps/mobile/app/(auth)/welcome.tsx` | Back button, skip pill, slide-icon chip (solid `rgba(13,20,16,0.55)` chrome over photo carousel) → `GlassSurface` | LOW — leaf route screen |
| `apps/mobile/app/(auth)/sign-in.tsx`, `sign-up.tsx` | Email/password/name `TextInput`s wrapped in `GlassSurface` (rounded "md"), replacing solid `inputBg`/`inputBorder`; unused vars removed | LOW — leaf route screens |
| `apps/mobile/app/(auth)/forgot-password.tsx`, `reset-password.tsx` | `TextInput`s wrapped in `GlassSurface`, replacing `bg-surface border border-white/10` className | LOW — leaf route screens; "sent" confirmation banner (forgot-password) kept solid pine-tinted (semantic color) |

**Deferred**: stack header glass (`headerTransparent` + `headerBackground`) — attempted on `(home)/_layout.tsx`, reverted; every screen in the affected `Stack` would need new top-padding/safe-area handling to avoid content being covered, judged too high blast-radius for "without hampering UX".

`gitnexus_detect_changes(scope:"all")` confirmed low/medium risk per commit (medium risk limited to expected `useTheme`-trace touches on edited screens), scope matched expected files each commit (plus pre-existing unrelated `CLAUDE.md` touch). `npx tsc --noEmit` → 0 errors after every commit.

**No `apps/web-next` files touched.** Zero blast radius on production website (desktop + mobile web unaffected).

---

### Step 72 — "TrekSage" MCP Server + Trek Intelligence Data Layer + Datacenter Subdomain blast radius — Done (2026-06-15)

New tables: `ai_interaction_logs`, `trek_qa_cache` (no existing readers — zero blast radius). New `cms_pages` columns (`trek_region`, `trek_max_altitude_ft`, `trek_duration_days_min/max`, `trek_best_months`/`trek_open_months`/`trek_avoid_months`, `trek_permit_required`/`trek_permit_notes`, `trek_budget_min/max`, `trek_themes`, `trek_crowd_level`, `trek_beginner_friendly`/`trek_solo_friendly`/`trek_family_friendly`, `trek_operator_available`, `trek_is_unsafe_closed`, `trek_data_confidence`, `trek_last_verified_at`) are all nullable/defaulted — existing `CMSPage` readers unaffected. New `lead_submissions.details_json` (nullable) — existing `LeadSubmission` readers unaffected.

| File | Purpose | Blast Radius |
|------|---------|-------------|
| `services/api/alembic/versions/20260615_0043_step72_trek_intelligence.py` (NEW) | Migration: 16 `cms_pages.trek_*` cols, `ai_interaction_logs`, `trek_qa_cache`, `lead_submissions.details_json` | LOW — additive, nullable/defaulted |
| `services/api/app/modules/trek_intelligence/` (NEW: `models.py`, `matching.py`, `service.py`, `__init__.py`) | `AIInteractionLog`/`TrekQACache` ORM models (registered in `app/db/base.py`); deterministic matching refinements; 10 PRD-tool functions shared by REST + MCP | LOW — new module, registered in `db/base.py` only |
| `services/api/app/schemas/trek_intelligence.py` (NEW) | `TrekProfile`, `CompareTreksRequest/Response`, `AskTrekQuestionRequest/Response`, `OperatorHelpLeadRequest`, `TrekMetaPatch`, `TrekDataQualityRow`, etc. | LOW — new schema file |
| `services/api/app/modules/plan/service.py` | `recommend_treks` now delegates season/budget scoring to `trek_intelligence/matching.py`; response shape unchanged (`PlanRecommendResponse` additive fields only) | LOW — `gitnexus_impact` upstream on `recommend_treks` = LOW, only called from `plan` routes |
| `services/api/app/schemas/plan.py` | `PlanRecommendResponse` — additive fields (budget/permit/themes) | LOW — additive |
| `services/api/app/api/routes/treks.py` | NEW `GET /treks/{slug}/profile`, `POST /treks/compare`, `POST /treks/{slug}/ask`, `GET /treks/{slug}/content`; NEW `FilterFacets` fields (`states`, `difficulties`, `seasons`, `suitabilities`) | LOW — additive routes/fields; static routes registered before `{slug}` dynamic routes per CLAUDE.md §16 |
| `services/api/app/api/routes/leads.py`, `app/schemas/leads.py`, `app/modules/leads/models.py` | NEW `POST /leads/operator-help` (`create_trek_plan_lead`, 422 without `consent`); `LeadSubmission.details_json` | LOW — additive route + nullable column |
| `services/api/app/api/routes/ai_log.py` (NEW) | `POST /ai/log` — fire-and-forget `log_ai_interaction`, never raises | LOW — new leaf route |
| `services/api/app/api/routes/admin_treks.py` (NEW) | Admin `GET /admin/treks/data-quality`, `PATCH /admin/treks/{slug}/meta`, `POST /admin/treks/{slug}/backfill`, `GET /admin/treks/ai-logs` — gated by existing `get_current_admin` | LOW — new admin module, static routes before `{slug}` |
| `services/api/app/api/router.py` | Registers `ai_log` + `admin_treks` routers | LOW — additive registration |
| `services/api/app/mcp_server.py` (NEW) | `FastMCP("TrekSage")` — 8 tools wrapping `trek_intelligence/service.py`; 3 gated by `X-MCP-Key`/`MCP_SHARED_SECRET` | LOW — new module |
| `services/api/app/main.py` | Mounts MCP sub-app at `/mcp` (Streamable HTTP), `lifespan` starts MCP session manager | LOW — additive sub-app mount, existing routes/middleware unaffected |
| `services/api/app/core/config.py` | NEW `mcp_shared_secret: str \| None = None` | LOW — additive Settings field |
| `services/api/app/worker/tasks/trek_intelligence_tasks.py` (NEW), `app/worker/celery_app.py` | NEW Celery task `trek_intelligence.backfill_trek_meta` registered in include list — **worker restart required** | LOW — additive task; restart required for pickup (no impact on existing tasks) |
| `services/api/pyproject.toml` | Added `mcp` SDK dependency | LOW — additive dependency |
| `services/api/tests/test_trek_intelligence.py` (NEW) | Full coverage: matching (unsafe/closed + avoid-month exclusion, budget scoring), compare (2/3/4 treks, invalid slug), ask (cached/cold/missing-data disclaimer), operator-help lead consent gate, ai-log, admin data-quality/meta-patch/backfill/ai-logs (TC-B17–B22) | — |
| `apps/web-next/components/trek/TrekAskAI.tsx` (NEW) | "Ask AI" card, 4 suggested prompts, "not verified yet" styling | LOW — new leaf component |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | Mounts `<TrekAskAI>`; surfaces new structured fields when present | LOW — `gitnexus_impact` upstream = LOW; affects existing `proc_108_trekdetailpage`/`proc_109_trekdetailpage` flows (step 1 only, consistent with prior steps touching this page) |
| `apps/web-next/app/(public)/compare/CompareClient.tsx` | Replaced frontend-only CMS fetch with `POST /treks/compare`; renders comparison table + cached AI summary | LOW — `gitnexus_impact` upstream = LOW |
| `apps/web-next/components/plan/RecommendationCard.tsx` | Surfaces budget/permit/themes when present | LOW — additive rendering |
| `apps/web-next/lib/api.ts` | NEW: `TrekProfile`, `fetchTrekProfile`, `askTrekQuestion`, `compareTreks`, `TrekDataQualityRow`, `fetchTrekDataQuality`, `TrekMetaPatch`, `updateTrekMeta`, `BackfillTriggerResponse`, `triggerTrekBackfill`, `AIInteractionLogEntry`, `fetchAiInteractionLogs` | LOW — additive exports |
| `apps/web-next/app/datacenter/` (NEW: `layout.tsx`, `page.tsx`, `trek-guide/[slug]/page.tsx`) | New route group — datacenter index + full `TrekProfile` definition-list view, `noindex` | LOW — new isolated route group |
| `apps/web-next/middleware.ts` | Host-based rewrite for `datacenter.trekyatra.co.in` → `/datacenter/*`; all other hosts unaffected | LOW — additive host check, early-return for non-datacenter hosts |
| `apps/web-next/app/(admin)/admin/trek-data/page.tsx` (NEW) | Admin data-quality dashboard, inline field editor, backfill trigger, AI log viewer | LOW — new admin leaf page |
| `apps/web-next/app/(admin)/admin/layout.tsx` | NEW "Trek Data" nav entry (System group) | LOW — additive nav array entry |
| `docs/URL_MAP.md` | NEW section "TrekSage MCP Server & Datacenter Subdomain (Step 72)" — documents `datacenter.trekyatra.co.in/trek-guide/[slug]`, `/mcp`, and new `/api/v1/treks/*`/`/leads/operator-help`/`/ai/log` routes | — |
| `apps/mobile/app/(tabs)/plan.tsx` | Replaced dead "coming in M08" stub with re-export of `(home)/plan-my-trek.tsx` | LOW — `gitnexus_impact` upstream = LOW, 0 impacted (file-based routing) |
| `apps/mobile/components/trek/TrekAskAI.tsx` (NEW) | GlassSurface "Ask TrekSage" card, mirrors web `TrekAskAI` | LOW — new leaf component |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Mounts `<TrekAskAI>` in guide tab | LOW — `gitnexus_impact` upstream = LOW |
| `apps/mobile/app/(tabs)/(home)/compare.tsx` | Full rewrite — `trekIntelligenceApi.compare()`, dynamic comparison table, AI summary card, `MAX_SELECTION` 2→3 | LOW — `gitnexus_impact` upstream = LOW |
| `apps/mobile/lib/mobileApi.ts` | NEW `trekIntelligenceApi` (`ask`, `compare`) + `TrekProfile`, `AskTrekQuestionResponse`, `CompareTreksResponse`, `TrekComparisonRow` types | LOW — additive exports |

`gitnexus_detect_changes(scope:"all")` after Commit 9: `risk_level: "high"` (cumulative across all 25 uncommitted Step 72 files / 57 symbols — expected given scope), 9 affected processes — all leaf screen-component traces (`CompareScreen → UseThemeContext`, `TrekDetailScreen → *`, `TrekDetailPage → ApiFetch`/`MergeImage`), consistent with per-commit LOW `gitnexus_impact` checks on every touched symbol; no new HIGH/CRITICAL beyond expected leaf-screen touches. `next build` ✅ zero errors (193+ pages incl. `/admin/trek-data` 6.04 kB, `/datacenter/*`). `npx tsc --noEmit` (mobile) ✅ zero errors. Backend: 665/665 pass, 1 skipped (2 pre-existing `test_refresh.py` failures, unrelated baseline).

---

### Step 73 — TrekSage Bugfix Pass blast radius — Done (2026-06-16)

All changes are additive to Step 72's module. New tables have no existing readers. Modified service functions (`backfill_trek_meta`, `ask_trek_question`, `_get_or_create_compare_summary`, `page_to_profile`) only add/extend params — existing callers unaffected.

| File | Purpose | Blast radius |
|------|---------|-------------|
| `services/api/app/modules/trek_intelligence/service.py` | Added `backfill_all_trek_meta`, extended `ask_trek_question` (history/section-grounding), richer `_get_or_create_compare_summary`, `page_to_profile` now populates `content_sections`/`faqs` | LOW — internal callers only, no cross-module callers |
| `services/api/app/modules/trek_intelligence/treksage_agent.py` (NEW) | Tool-calling chat agent, MAX_TOOL_ROUNDS=3, wraps existing service functions | LOW — new module |
| `services/api/app/modules/trek_intelligence/models.py` | Added `TreksageChatSession`, `TreksageChatMessage` ORM models | LOW — additive |
| `services/api/alembic/versions/20260616_0044_step73_treksage_chat.py` (NEW) | `treksage_chat_sessions`, `treksage_chat_messages` tables | LOW — new tables, no existing readers |
| `services/api/app/schemas/trek_intelligence.py` | Added `ChatTurn`, `BackfillAllTriggerResponse`, `content_sections`/`faqs` to `TrekProfile` | LOW — additive fields; existing consumers of `TrekProfile` unaffected |
| `services/api/app/api/routes/admin_treks.py` | Added `POST /admin/treks/backfill-all` (static, before `/{slug}/backfill`) | LOW — additive route |
| `services/api/app/api/routes/treksage.py` (NEW) | `POST /api/v1/treksage/chat`, `GET /api/v1/treksage/chat/{session_key}/history` | LOW — new routes |
| `services/api/app/worker/tasks/trek_intelligence_tasks.py` | Added `backfill_all_trek_meta_task` (name `trek_intelligence.backfill_all_trek_meta`) | LOW — additive task; **worker restart required** |
| `services/api/app/db/base.py` | Added `TreksageChatSession`, `TreksageChatMessage` to registry | LOW — additive imports |
| `services/api/app/api/router.py` | Registered `treksage_router` | LOW — additive include |
| `apps/web-next/lib/api.ts` | Added `ChatTurn`, `treksageChat`, `fetchTreksageChatHistory`, `triggerTrekBackfillAll`, `BackfillAllTriggerResponse`, `content_sections`/`faqs` to `TrekProfile` | LOW — additive |
| `apps/web-next/app/(public)/treksage/page.tsx` (NEW) | `/treksage` public AI chat page | LOW — new page |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` (NEW) | Myra-style chat UI component | LOW — new component |
| `apps/web-next/app/datacenter/page.tsx` | Rewritten as `?slug=` JSON viewer (formerly trek-list only) | LOW — isolated datacenter route |
| `apps/web-next/app/datacenter/trek-guide/[slug]/page.tsx` | 308 `permanentRedirect` to `/?slug=` | LOW — no callers |
| `apps/web-next/app/datacenter/trek-guide/[slug]/page.tsx` (extended) | Content-sections/faqs sections added | LOW — isolated datacenter route |
| `apps/web-next/app/(admin)/admin/trek-data/page.tsx` | Added `handleBackfillAll` + "Backfill All Treks" button | LOW — isolated admin page |
| `apps/web-next/components/trek/TrekAskAI.tsx` | History built from `exchanges` and sent with each request | LOW — leaf component |
| `apps/mobile/components/trek/TrekAskAI.tsx` | History built from `exchanges` and sent with each request | LOW — leaf component |
| `apps/mobile/lib/mobileApi.ts` | Added `MobileChatTurn`, updated `ask()` signature | LOW — additive param |
| `apps/web-next/app/sitemap.ts` | Added `/treksage` entry | LOW — additive |

### Step 75 — TrekSage Advanced Bot Fix + Complete UI Redesign blast radius — Done (2026-06-17)

**No new migrations. No new routes. No new Celery tasks.** All changes are to existing files.

| File | Purpose | Blast Radius |
|------|---------|-------------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | Loop fix (transition phrase detection, nudge, continue); system prompt hardened (guardrails, no tech exposure, safety rules); `max_altitude_ft` added to `_slim_profile`; `max_tokens` 800→1200 on final round | LOW — `gitnexus_impact(chat, upstream)` = 0 direct callers (only `routes/treksage.py` → leaf API handler) |
| `apps/web-next/components/trek/TrekAskAI.tsx` | `ReactMarkdown` + `mdComponents` wraps `ex.answer` | LOW — leaf component; 0 upstream callers per `gitnexus_impact` |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | Complete rewrite — light PRD palette (#FAF5EE/#1D3A2E/#E8702A), category tabs, trek cards with stats grid + CTA row, rotating loading messages, `remark-gfm` | LOW — leaf component; 0 upstream callers per `gitnexus_impact` |
| `apps/web-next/app/(public)/treksage/page.tsx` | Light #FAF5EE wrapper; dark heading removed | LOW — page wrapper only |
| `apps/web-next/lib/api.ts` | `TreksageChatResponse.trek_cards` extended with `season` + `max_altitude_ft` | LOW — additive fields; no existing consumers read these keys |
| `apps/web-next/package.json` | `remark-gfm@4.0.1` added | LOW — new dev/frontend dependency |
| `apps/mobile/app/(tabs)/browse/search.tsx` | `Constants.appOwnership === "expo"` Expo Go check + `Alert.alert` in `handleMicPress`; improved catch block | LOW — `gitnexus_impact(handleMicPress, upstream)` = 0 upstream callers |

### Step 76 — TrekSage V1 Completion + V2 Features blast radius — Done (2026-06-17)

Impact analysis ran on `get_ai_interaction_logs` (LOW, 0 callers), `SiteLayout` (LOW, 0 callers), `CustomTabBar` (LOW, 0 callers).

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/modules/trek_intelligence/service.py` | `list_ai_interaction_logs`: added `source`/`tool_name` filter params (backward-compatible defaults None) | LOW — only called from `admin_treks.py` |
| `services/api/app/api/routes/admin_treks.py` | `GET /api/v1/admin/treks/ai-logs` — added `source`/`tool_name` Query params, default limit 100 | LOW — admin-only endpoint, no frontend consumer broke (lib/api.ts updated in same step) |
| `apps/web-next/components/treksage/TrekSageWidget.tsx` (NEW) | Global floating chat widget — pine FAB + compact drawer, `treksage_widget_session` localStorage key | LOW — new leaf component added to SiteLayout |
| `apps/web-next/components/treksage/PlanWizard.tsx` (NEW) | 7-step guided planner modal, calls `onComplete(prompt)` callback | LOW — new component, no external callers |
| `apps/web-next/components/treksage/LeadCaptureModal.tsx` (NEW) | Lead capture form → `POST /api/v1/leads/operator-help` | LOW — new component, uses existing endpoint |
| `apps/web-next/components/layout/SiteLayout.tsx` | Added `<TrekSageWidget />` import + render | LOW — `gitnexus_impact(SiteLayout, upstream)` = 0 direct callers |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | Added `showWizard`/`showLeadModal` state, PlanWizard + LeadCaptureModal imports, Plan tab wizard CTA, "Get Expert Help" bar | LOW — leaf page component |
| `apps/web-next/lib/api.ts` | `fetchAiInteractionLogs`: added `source`/`toolName` params | LOW — additive; only consumer is new `/admin/treksage-logs/page.tsx` |
| `apps/web-next/app/(admin)/admin/treksage-logs/page.tsx` (NEW) | Admin AI logs dashboard — source/tool filter, KPI row, table | LOW — new admin page |
| `apps/web-next/app/(admin)/admin/layout.tsx` | Added `MessageSquare` import + "TrekSage Logs" nav item | LOW — additive sidebar entry |
| `apps/mobile/app/(tabs)/treksage.tsx` (NEW) | Mobile TrekSage chat screen — full conversational UI, AsyncStorage session | LOW — new screen |
| `apps/mobile/app/(tabs)/_layout.tsx` | Added `<Tabs.Screen name="treksage">` between browse and plan | LOW — additive tab registration |
| `apps/mobile/components/tabs/CustomTabBar.tsx` | `isCenter` → `treksage`; center icon `chatbubbles`; Plan icon `sparkles`/`sparkles-outline` | LOW — `gitnexus_impact(CustomTabBar, upstream)` = 0 upstream callers |
| `apps/mobile/lib/mobileApi.ts` | Added TrekSage interfaces + `treksageChatMobile()` + `fetchTreksageHistoryMobile()` | LOW — additive; no existing callers |

### TrekSage Hotfix Commits — Done (2026-06-17–18, commits 3a33716 / 88ddd49 / 387de83)

**Hotfix 1 (3a33716) — Hooks violation + scroll + token cost**
| File | Change | Blast radius |
|------|--------|-------------|
| `apps/web-next/components/layout/SiteLayout.tsx` | Replaced conditional `return null` (between hook declarations) with `usePathname()` check — fixes React error #418/#423 | LOW — `gitnexus_impact(SiteLayout, upstream)` = 0 callers |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | Container-scroll ref (`messagesContainerRef`) replaces `scrollIntoView` (was scrolling the page window) | LOW — leaf component |
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | `MAX_HISTORY_MESSAGES` cut from 20→6; widget-source logging guard added | LOW — 0 upstream callers per gitnexus_impact |

**Hotfix 2 (88ddd49) — Session key resilience**
| File | Change | Blast radius |
|------|--------|-------------|
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | `session_key` always written to `localStorage` even when agent returns an error reply (ensures session survives a failed turn) | LOW |

**Hotfix 3 (387de83) — UX overhaul (full TreksageChat rewrite)**
| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | `tool_choice={"type":"any"}` on round 0 (prevents model outputting transition phrases without fetching data); post-process fallback if `final_reply` ends with `:` and is < 100 chars; improved between-round nudge prompt | LOW — 0 upstream callers |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | FULL REWRITE: sessions sidebar (Today/Yesterday/Earlier, localStorage, `StoredSession[]`), `userSentRef` auto-scroll guard (no scroll on history restore), `messagesContainerRef` container-scroll, voice input (Web Speech API, pulsing animation popup), emoji fix (🏕→⛺, 🗓→📅), trek result cards in 2-col `sm:grid-cols-2` grid, `treksageSlideUp` message animation, `pushSessionToList`/`switchSession` helpers | LOW — leaf component, 0 upstream callers per gitnexus_impact |
| `apps/web-next/app/(public)/treksage/page.tsx` | `h-[calc(100vh-4rem)] overflow-hidden` (full-screen, header-subtracted); `max-w-2xl` removed | LOW |

### Step 77 — TrekSage UX Overhaul + Search Fix — Done (2026-06-18)

Impact analysis: `search_treks` (LOW, only called from `_call_tool` in `treksage_agent.py` and the MCP tool — no upstream BE consumers broke), `_MONTH_ORD` (LOW, only read inside `_season_score`/`_season_overlap`).

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/modules/trek_intelligence/service.py` | `search_treks`: keyword tokenization (stop-word filter, OR-match any token), extended haystack (month names from best_months int list via `_NUM_TO_MONTH_NAME`); `_SEARCH_STOP`, `_MONTH_NAME_TO_NUM`, `_NUM_TO_MONTH_NAME` constants added | LOW — only called from `treksage_agent._call_tool` and MCP server; no contract change |
| `services/api/app/modules/trek_intelligence/matching.py` | `_MONTH_ORD`: added full month names (January→1 … December→12) alongside existing abbreviations | LOW — only read by `_season_score`/`_season_overlap`; additive change |
| `services/api/tests/test_treksage.py` | TC-B41–B44: keyword search tests + month-name test; tests use unique `trek_state` UUID to avoid 200-row fetch limit in full suite | LOW — test-only |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | FULL REWRITE: Myra-inspired split-screen (chat 42% / canvas 58%); canvas slides in on first trek_cards response; trek name → `/trek/[slug]?ref=treksage` analytics link; "View Details" → `TrekDetailPanel` inline; "Add to Compare" → `compareSet` state; "Compare (N)" button → sends compare message; `ThinkingBubble` multi-stage cascade; send/stop icon morph; `CanvasTrekCard` with stagger-fade; mobile inline `ChatTrekCard` (canvas hidden); `canvasCards`/`detailCard`/`compareSet` state; canvas restored from last assistant message on session history restore | LOW — leaf page component, 0 upstream callers |
| `apps/web-next/app/(public)/treksage/TrekDetailPanel.tsx` (NEW) | Inline trek detail panel: hero image, key facts grid (6 cells), budget, "View Full Page" link (`?ref=treksage`), "Plan This Trek" link | LOW — new leaf component, only used by TreksageChat.tsx |

### Post-Step-77 TrekSage UX Hotfixes — Done (2026-06-18)

| File | Change | Blast Radius |
|------|--------|-------------|
| `apps/web-next/app/(public)/treksage/layout.tsx` (NEW) | Header-only layout (no Footer, no TrekSageWidget) for TrekSage route — eliminates footer extra space | LOW — new route-scoped layout |
| `apps/web-next/app/(public)/treksage/page.tsx` | Reads `searchParams.q`; passes `initialQuery` prop; `flex-1 min-h-0` height | LOW — isolated page |
| `apps/web-next/next.config.mjs` | Added `trekyatra.co.in` + `**.trekyatra.co.in` to `images.remotePatterns` | LOW — build config only |
| `apps/web-next/app/(public)/page.tsx` | Homepage TrekSage pills changed from `href="/treksage"` to `href="/treksage?q=<encoded>"` | LOW — static homepage section |
| `apps/web-next/app/(public)/treksage/TreksageChat.tsx` | `initialQuery` auto-send on mount; `onError` image fallback; canvasCards localStorage persistence per session; `openDetail()` fetches `TrekProfile`; `detailProfile` passed to `TrekDetailPanel` | LOW — leaf component, 0 upstream callers |
| `apps/web-next/app/(public)/treksage/TrekDetailPanel.tsx` | REWRITE — accepts `profile: TrekProfile \| null`; renders month guide, permit banner, themes, suitability badges, content_sections accordion, FAQs accordion; image `onError` fallback | LOW — leaf component, only called by TreksageChat |
| `apps/mobile/app/(tabs)/treksage.tsx` | REWRITE — `TrekCardItem` with stats row (duration/altitude/season), budget, "View Trek" → `router.push(/trek/slug)`, compare toggle; `compareSet` + compare bar; multi-stage `ThinkingBubble`; canvas cards persisted to AsyncStorage | LOW — mobile leaf screen, 0 upstream callers |

### Step M08 — Trek Comparison + Saved Comparisons — Done (2026-06-18)

| File | Change | Blast radius |
|------|--------|-------------|
| `apps/mobile/app/(tabs)/(home)/compare.tsx` | `getWinnerIdx()` winner badge logic; `handleSave()` with auth gate; `savedId` state | LOW — leaf screen |
| `apps/mobile/lib/mobileApi.ts` | `apiDelete()` helper; `SavedComparison` interface; `accountApi` (listComparisons/saveComparison/deleteComparison) | LOW — additive exports |
| `apps/mobile/hooks/useComparisons.ts` (NEW) | CRUD hook for saved comparisons | LOW — new leaf hook |
| `apps/mobile/app/(tabs)/saved.tsx` | DELETED — replaced by `saved/` stack | LOW — file routing only |
| `apps/mobile/app/(tabs)/saved/_layout.tsx` (NEW) | Stack navigator for saved tab | LOW |
| `apps/mobile/app/(tabs)/saved/index.tsx` (NEW) | Saved tab root | LOW |
| `apps/mobile/app/(tabs)/saved/comparisons.tsx` (NEW) | Saved comparisons list with delete + open | LOW |

### TrekSage Hotfix 5 — Double Nav + Blank Images + get_site_info — Done (2026-06-18, commit 75d029c)

Impact analysis: `_call_tool` (LOW — only callers are `chat()` in treksage_agent.py + 0 upstream); `treksage/layout.tsx` (LOW — route-scoped layout, only applies to `(treksage)` group).

| File | Change | Blast radius |
|------|--------|-------------|
| `apps/web-next/app/(public)/treksage/` (DELETED) | Route group moved — all 4 files removed from `(public)` | LOW — no other imports; git detects as rename |
| `apps/web-next/app/(treksage)/treksage/layout.tsx` (MOVED) | Now in `(treksage)` route group — no longer inherits `SiteLayout`; eliminates double Header + Footer/TrekSageWidget | LOW — route-scoped layout, 0 upstream callers |
| `apps/web-next/app/(treksage)/treksage/page.tsx` (MOVED) | Route group move only, no content change | LOW |
| `apps/web-next/app/(treksage)/treksage/TreksageChat.tsx` (MOVED + MODIFIED) | CanvasTrekCard + ChatTrekCard: gradient bg (`from-[#E8F4EE] to-[#D4EAD9]`), Mountain icon opacity `/15`→`/40`, "Trek photo" label added | LOW — leaf component, 0 upstream callers |
| `apps/web-next/app/(treksage)/treksage/TrekDetailPanel.tsx` (MOVED) | Route group move only, no content change | LOW |
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | `get_site_info` tool added to `_TOOLS`; `_SITE_INFO_MAP` (9 topics: about/contact/privacy/terms/affiliate/safety/gear/authors/methodology) + `_SITE_INFO_ALIASES` dicts; `_call_get_site_info()` fetches CMS page by slug or page_type; `page.is_published` → `page.status != "published"` fix; system prompt guardrails section added | LOW — `gitnexus_impact(chat, upstream)` = 0 callers outside treksage route |
| `services/api/tests/test_treksage.py` | TC-B45–B47: `test_get_site_info_slug_page`, `test_get_site_info_unknown_topic_returns_error`, `test_get_site_info_alias_resolution` | LOW — test-only |

### TrekSage Hotfix 6 — recommend_treks broken + FAQ HTML + images — Done (2026-06-18, commit 0b4f136)

Impact analysis: `_call_tool` (LOW — only called from `chat()` in treksage_agent.py); `_extract_faqs` (LOW — only caller is `page_to_profile`); `TreksageChat.tsx` / `TrekDetailPanel.tsx` (LOW — leaf components, 0 upstream callers).

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | CRITICAL: `recommend_treks` fixed — was iterating `PlanRecommendResponse` directly and accessing `r.trek` (non-existent); fixed to `response.recommendations` + `_slim_profile(r)`; `_slim_profile` uses `getattr` for all fields; system prompt: TOOL SELECTION + GET_SITE_INFO SPECIFICITY sections; post-processor: "couldn't find" only fires if tools returned no trek results | LOW |
| `services/api/app/modules/trek_intelligence/service.py` | `_extract_faqs`: added `re.sub` HTML stripping to answer field (same pattern as `_extract_content_sections`) | LOW — only `page_to_profile` caller |
| `apps/web-next/app/(treksage)/treksage/TreksageChat.tsx` | CanvasTrekCard + ChatTrekCard: `<Image fill>` → `<img>` — bypasses Next.js image optimization pipeline that caused blank images in production; removed unused `next/image` import | LOW — leaf component |
| `apps/web-next/app/(treksage)/treksage/TrekDetailPanel.tsx` | Hero image: `<Image fill>` → `<img>` same fix; gradient bg updated | LOW — leaf component |
| `services/api/tests/test_treksage.py` | TC-B48: `test_call_tool_recommend_treks_iterates_recommendations`; TC-B49: `test_slim_profile_on_trek_recommendation` | LOW — test-only |

### TrekSage Hotfix 7 — altitude blank + HTML sections + founder routing + methodology slug — Done (2026-06-18, commit 9514a38)

Impact analysis: `_extract_content_sections` (LOW — only `page_to_profile` caller); `TrekRecommendation` schema (LOW — additive field, no callers broken); `_to_rec` (LOW — internal to `recommend_treks`).

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/schemas/plan.py` | `TrekRecommendation`: added `max_altitude_ft: int \| None = None` — previously only had `altitude: str` (human-readable); canvas card reads `max_altitude_ft` (int) so was always "—" for recommend_treks results | LOW — additive field |
| `services/api/app/modules/trek_intelligence/matching.py` | `_to_rec`: added `max_altitude_ft=page.trek_max_altitude_ft` to `TrekRecommendation` constructor | LOW — internal to matching |
| `services/api/app/modules/trek_intelligence/service.py` | `_extract_content_sections`: removed `re.sub` HTML strip — keeps raw HTML (8000 char limit) so CMS tables/lists/bold render correctly in frontend; `_extract_faqs`: reverted HTML stripping (raw HTML for consistent rendering path) | LOW — only `page_to_profile` caller |
| `apps/web-next/app/(treksage)/treksage/TrekDetailPanel.tsx` | `SectionAccordion`: replaced `<p whitespace-pre-line>` with `dangerouslySetInnerHTML` div + Tailwind arbitrary selectors for `[&_table]`, `[&_th]`, `[&_td]`, `[&_ul]`, `[&_h2]`, `[&_h3]`, `[&_a]` | LOW — leaf component |
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | `_SITE_INFO_MAP["methodology"]`: slug `"editorial-methodology"` → `"methodology"`; `_SITE_INFO_ALIASES`: founder/founders/who_founded/who_built/who_made → "authors"; system prompt: authors topic description + "[content appears cut off]" guardrail | LOW |
| `services/api/tests/test_trek_intelligence.py` | TC-B32: inverted HTML assertion to expect HTML preserved in `content_sections` | LOW — test-only |

### TrekSage Hotfix 8 — @tailwindcss/typography registered + site-info context — Done (2026-06-18, commit 512be0d)

Impact analysis: `tailwind.config.ts` (MEDIUM — affects all pages using `prose` class; all informational CMS pages now render correctly).

| File | Change | Blast radius |
|------|--------|-------------|
| `apps/web-next/tailwind.config.ts` | Added `require("@tailwindcss/typography")` to plugins array; added `typography` theme extension mapping prose colors to CSS variables (`--foreground`, `--accent`, `--border`); plugin was installed (`^0.5.16`) but never registered — `prose prose-lg` generated zero CSS | MEDIUM — all pages using prose class now gain heading/list/table/link styles |
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | `_call_get_site_info` `strip_html` truncation 2000 → 4000 chars for longer pages (Privacy, About, Methodology) | LOW |

Pages fixed (all used `prose prose-lg max-w-none` with `dangerouslySetInnerHTML` but had no CSS output):
- `/about`, `/contact`, `/privacy`, `/terms`, `/methodology`, `/affiliate-disclosure`

### TrekSage Hotfix 9 — privacy/terms slug fixes + safety hardcoded response — Done (2026-06-18, commit e96b0f0)

Impact analysis: `_call_get_site_info` (LOW — only called from `_call_tool` in treksage_agent.py).

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | `_SITE_INFO_MAP["privacy"]`: `"privacy-policy"` → `"privacy"`; `_SITE_INFO_MAP["terms"]`: `"terms-of-service"` → `"terms"`; `_SITE_INFO_MAP["safety"]`: replaced broken slug `"safety-disclaimer"` (no CMS page exists for it) with `{"hardcoded": True}`; added `_SAFETY_DISCLAIMER` constant (5 key safety rules + URL); `_call_get_site_info`: new `hardcoded` branch returns constant without DB query | LOW |

### TrekSage Hotfix 10 — hard-route founder questions to authors — Done (2026-06-18, commit f5c1627)

Impact analysis: `_call_get_site_info` (LOW); system prompt change only affects model behaviour.

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | System prompt: SITE INFORMATION TOOL section replaced with explicit SITE INFORMATION ROUTING table (9 topic mappings); added CRITICAL rule against using topic="about" for founder/person questions; `_SITE_INFO_ALIASES`: `"who": "about"` → `"who": "authors"` — who-questions are about people not company mission | LOW |

### Step M09 — Plan My Trek Wizard — Done (2026-06-18)

| File | Change | Blast radius |
|------|--------|-------------|
| `apps/mobile/stores/planWizardStore.ts` (NEW) | Zustand store for 6-step wizard answers | LOW — new store |
| `apps/mobile/components/plan/` (NEW — 9 files) | WizardProgress, WizardStepLayout, IntentSelector, MonthSelector, DurationSelector, FitnessSliders, RegionSelector, LeadCaptureForm, PlanResultCard | LOW — new leaf components |
| `apps/mobile/app/(tabs)/plan/_layout.tsx` (NEW) | Stack navigator for plan wizard | LOW |
| `apps/mobile/app/(tabs)/plan/index.tsx` (NEW) | Intro screen | LOW |
| `apps/mobile/app/(tabs)/plan/step-1.tsx` through `step-5.tsx` (NEW) | Wizard steps | LOW |
| `apps/mobile/app/(tabs)/plan/step-6.tsx` (NEW) | Lead capture — POST /api/v1/leads/operator-help | LOW |
| `apps/mobile/app/(tabs)/plan/results.tsx` (NEW) | Results screen — POST /api/v1/plan/recommend | LOW |
| `apps/mobile/lib/mobileApi.ts` | `leadsApi.submitOperatorHelp()`, `OperatorHelpLeadPayload`, `LeadResponse` added | LOW — additive exports |
| `apps/mobile/app/(tabs)/(home)/_layout.tsx` | Removed stale `plan-my-trek` Stack.Screen | LOW |
| `apps/mobile/components/home/CategoryHubRow.tsx` | "Plan a trek" route updated to `/(tabs)/plan` | LOW |
| `apps/mobile/app/(tabs)/plan.tsx` | DELETED — replaced by `plan/` stack | LOW — file routing only |
| `apps/mobile/app/(tabs)/(home)/plan-my-trek.tsx` | DELETED — replaced by full wizard | LOW |

### Step M10 — User Account — Done (2026-06-19)

| File | Change | Blast radius |
|------|--------|-------------|
| `apps/mobile/app/(tabs)/account.tsx` | DELETED — placeholder replaced by `account/` Stack | LOW — routing only |
| `apps/mobile/app/(tabs)/account/_layout.tsx` (NEW) | Stack navigator for account sub-screens | LOW — new |
| `apps/mobile/app/(tabs)/account/index.tsx` (NEW) | Account dashboard screen | LOW — new leaf screen |
| `apps/mobile/app/(tabs)/account/saved.tsx` (NEW) | Saved treks list, calls `GET /api/v1/account/bookmarks` | LOW — new leaf screen |
| `apps/mobile/app/(tabs)/account/downloads.tsx` (NEW) | Digital product downloads, calls `GET /api/v1/account/downloads` | LOW — new leaf screen |
| `apps/mobile/app/(tabs)/account/enquiries.tsx` (NEW) | Lead enquiries, calls `GET /api/v1/auth/me/leads` | LOW — new leaf screen |
| `apps/mobile/app/(tabs)/account/premium.tsx` (NEW) | Premium placeholder screen | LOW — new leaf screen |
| `apps/mobile/app/(tabs)/account/settings.tsx` (NEW) | Settings: name/language/biometric/newsletter/legal | LOW — new leaf screen |
| `apps/mobile/app/(tabs)/account/notifications.tsx` (NEW) | Per-category notification toggles (AsyncStorage) | LOW — new leaf screen |
| `apps/mobile/app/(tabs)/account/privacy.tsx` (NEW) | DPDP data export + delete | LOW — new leaf screen |
| `apps/mobile/components/account/` (5 NEW files) | `ProfileHeader`, `AccountDashboard`, `SavedTrekCard`, `DownloadItem`, `EnquiryCard` | LOW — new leaf components |
| `apps/mobile/hooks/useAccount.ts` (NEW) | TanStack Query hooks for bookmarks, downloads, profile, newsletter | LOW — new hook |
| `apps/mobile/lib/mobileApi.ts` | Added `apiPatch`; new types + `accountApi` extensions + `newsletterApi` + `authMeApi` | MEDIUM — shared API client; existing callers unaffected (additive only) |

### Step M11 — Operators Marketplace — Done (2026-06-22)

| File | Change | Blast radius |
|------|--------|-------------|
| `apps/mobile/app/(tabs)/browse/operators.tsx` (NEW) | Operators listing screen | LOW — new leaf screen |
| `apps/mobile/app/(tabs)/browse/operators/[slug].tsx` (NEW) | Operator detail screen | LOW — new leaf screen |
| `apps/mobile/components/operators/OperatorCard.tsx` (NEW) | GlassSurface operator card | LOW — new leaf component |
| `apps/mobile/components/operators/OperatorInquirySheet.tsx` (NEW) | Modal inquiry form | LOW — new leaf component |
| `apps/mobile/components/operators/OperatorReviewsList.tsx` (NEW) | Review rows component | LOW — new leaf component |
| `apps/mobile/hooks/useOperators.ts` (NEW) | TanStack Query hooks for operators + inquiry | LOW — new hook |
| `apps/mobile/lib/mobileApi.ts` | Fixed `Operator.region: string[] \| null` (was `string \| null`); added `OperatorSpecialization`, `OperatorReview`, `InquiryPayload`, `InquiryResponse` types; added `operatorsApi` namespace | MEDIUM — shared API client; existing callers unaffected (additive + bug fix on unused field) |
| `apps/mobile/app/(tabs)/browse/_layout.tsx` | Added 2 Stack.Screen entries for `operators` + `operators/[slug]` | LOW — additive routing only |

### Step M12 — Digital Products — Done (2026-06-22)

| File | Change | Blast radius |
|------|--------|-------------|
| `apps/mobile/app/(tabs)/browse/products.tsx` (NEW) | Product catalog screen | LOW — new leaf screen |
| `apps/mobile/app/(tabs)/browse/products/[slug].tsx` (NEW) | Product detail + Razorpay purchase screen | LOW — new leaf screen |
| `apps/mobile/components/products/ProductCard.tsx` (NEW) | Product tile (price / owned badge) | LOW — new leaf component |
| `apps/mobile/hooks/useProducts.ts` (NEW) | TanStack Query hooks: list, detail, purchased set | LOW — new hook |
| `apps/mobile/hooks/usePurchase.ts` (NEW) | Purchase flow (order → Razorpay → verify → download) | LOW — new hook; requires EAS build |
| `apps/mobile/stores/drawerStore.ts` (NEW) | Zustand store: `isOpen`, `open()`, `close()` | LOW — new store; imported by CustomTabBar + AppDrawer |
| `apps/mobile/components/layout/AppDrawer.tsx` (NEW) | Right-slide drawer overlay; guest/auth state | LOW — new component; rendered in app `_layout.tsx` |
| `apps/mobile/lib/mobileApi.ts` | Added `Product`, `CheckoutOrderResponse`, `CheckoutVerifyResponse` types; `productsApi` + `checkoutApi` namespaces | MEDIUM — shared API client; additive only |
| `apps/mobile/app/(tabs)/browse/_layout.tsx` | Added `products` + `products/[slug]` Stack.Screen entries | LOW — additive routing |
| `apps/mobile/app.config.ts` | Added `expo-sharing` plugin | LOW — additive Expo plugin |
| `apps/mobile/.env.example` | Added `EXPO_PUBLIC_RAZORPAY_KEY_ID` entry | LOW — docs only |

### Step M13 — Premium Subscription — Done (2026-06-22)

| File | Change | Blast radius |
|------|--------|-------------|
| `apps/mobile/app/(tabs)/account/premium.tsx` | Replaced "coming soon" placeholder with full IAP screen (hero, plan selector, subscribe, restore, web fallback, active-premium state) | LOW — replaces leaf screen; no other screens import it |
| `apps/mobile/components/premium/PremiumFeatureList.tsx` (NEW) | Free vs premium feature comparison table | LOW — new component |
| `apps/mobile/components/premium/SubscribeButton.tsx` (NEW) | Status-aware IAP subscribe button | LOW — new component |
| `apps/mobile/components/premium/GatedContentOverlay.tsx` (NEW) | BlurView gating overlay for premium-locked content sections | LOW — new component; ready to apply to trek sections |
| `apps/mobile/hooks/usePremium.ts` (NEW) | IAP purchase + restore + status hook; test mode path when IAP unavailable | LOW — new hook |
| `apps/mobile/services/iapService.ts` (NEW) | react-native-iap v15 wrapper (fetchSubscriptionProducts, purchaseSubscription, getReceiptData) | LOW — new service |
| `apps/mobile/lib/mobileApi.ts` | Added `SubscriptionStatus`, `IAPVerifyPayload`, `IAPVerifyResponse`, `IAPRestoreResponse` types; `subscriptionApi` namespace (`getStatus`, `verifyIAP`, `restoreIAP`) | MEDIUM — shared API client; additive only |
| `apps/mobile/app.config.ts` | Added `react-native-iap` plugin | LOW — additive Expo plugin; requires native rebuild |
| `apps/mobile/package.json` | Added `react-native-iap@^15.3.2` + `react-native-nitro-modules@^0.35.9` | MEDIUM — new native modules; requires pod install + rebuild |
| `services/api/app/schemas/subscriptions.py` | Added `IAPVerifyRequest`, `IAPVerifyResponse`, `IAPRestoreRequest`, `IAPRestoreResponse` schemas | LOW — additive schemas |
| `services/api/app/modules/subscriptions/service.py` | Added `iap_verify_purchase()`, `iap_restore_purchases()`; test mode when IAP credentials unset | LOW — additive; existing service functions unchanged |
| `services/api/app/api/routes/subscriptions.py` | Added `POST /subscriptions/iap/verify` + `POST /subscriptions/iap/restore` | LOW — additive routes; existing routes unchanged |
| `services/api/app/core/config.py` | Added `apple_iap_shared_secret`, `google_play_service_account_json` settings fields | LOW — optional fields with `None` default |
| `services/api/.env.example` | Documented `APPLE_IAP_SHARED_SECRET` + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | LOW — docs only |
| `services/api/tests/test_subscriptions.py` | Added TC-B16–B21 (6 new tests for IAP verify/restore routes and service functions) | LOW — additive tests |

### Mobile UI Pass 2 — Hamburger menu + tab bar + plan wizard light mode (2026-06-22)

| File | Change | Blast radius |
|------|--------|-------------|
| `apps/mobile/components/layout/AppDrawer.tsx` (NEW) | Right-side drawer overlay; guest/auth display; Animated spring entry/exit | LOW — new component |
| `apps/mobile/stores/drawerStore.ts` (NEW) | Zustand `isOpen` store for drawer | LOW — new store |
| `apps/mobile/app/_layout.tsx` | Added `<AppDrawer />` overlay inside `<AuthGate>` | LOW — visual overlay; doesn't affect routing |
| `apps/mobile/app/(tabs)/_layout.tsx` | Set `href: null` on `saved` + `account` tabs | LOW — removes tabs from bar; screens still routable |
| `apps/mobile/components/tabs/CustomTabBar.tsx` | Filters out `account` + `saved` from route loop; adds hamburger `☰` button calling `drawerStore.open()` | MEDIUM — shared tab bar rendered on all tab screens |
| `apps/mobile/components/plan/WizardStepLayout.tsx` | Replaced hardcoded `rgba(255,255,255,*)` colors with `colors.textSecondary`/`textMuted`/`border`/`borderSubtle` | LOW — affects all 6 plan wizard step screens |
| `apps/mobile/components/plan/LeadCaptureForm.tsx` | `infoText` hardcoded white → `colors.textSecondary` | LOW — affects plan step-6 only |

### TrekSage Hotfix 11 — Enforce founder→authors routing in tool schema (2026-06-18, commit 6a8087f)

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | `get_site_info` tool description rewritten with explicit ROUTING RULES block + `enum` on topic param + CRITICAL note; `_call_get_site_info`: when canonical=="about", adds `founder_note` field naming Deepesh Kumar Gupta | LOW — same callers as before, additive field in response |

### TrekSage Hotfix 12 — Authors topic hardcoded (static React page) (2026-06-18, commit 44562d7)

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/modules/trek_intelligence/treksage_agent.py` | `_AUTHORS_INFO` constant added (founder bio, skills, contact); `_SITE_INFO_MAP["authors"]` changed from `{"page_type": "author"}` → `{"hardcoded": True}`; hardcoded handler covers both "authors" and "safety" topics | LOW — no new callers; replaces empty DB query with constant lookup |

### MCP HTTPS Endpoint Fix — ProxyHeadersMiddleware (2026-06-18, commit f9d0a68)

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/main.py` | Added `ProxyHeadersMiddleware(trusted_hosts="*")` (before CORS middleware); added `"https://claude.ai"`, `"https://chatgpt.com"`, `"https://chat.openai.com"` to `_CORS_ORIGINS` | MEDIUM — middleware wraps every request; incorrect trust config could expose internal headers, but `trusted_hosts="*"` is standard for Cloudflare+DO |

### OpenAPI Spec for ChatGPT Custom GPT (2026-06-18, commit 8f22959)

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/app/openapi_mcp.yaml` (NEW) | OpenAPI 3.1.0 spec with 7 endpoints and 3 schemas for ChatGPT Custom GPT Actions | LOW — static YAML file |
| `services/api/app/main.py` | Added `GET /openapi-mcp.json` route serving YAML as JSON with open CORS | LOW — new additive route |

### Rate Limiting + DDoS Protection (2026-06-18, commit 6b14854)

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/pyproject.toml` | Added `slowapi>=0.1.9,<1.0.0` dependency | LOW — additive |
| `services/api/app/main.py` | Wired `Limiter`, `SlowAPIMiddleware`, `_rate_limit_exceeded_handler`; limiter keyed by `get_remote_address` (X-Forwarded-For from Cloudflare) | MEDIUM — SlowAPIMiddleware wraps every request; incorrect key_func config could rate-limit all traffic to a single IP |
| `services/api/app/api/routes/treksage.py` | `@limiter.limit("20/minute")` on `POST /treksage/chat`; `request: Request` added as first param | LOW — additive decorator; no logic change |
| `services/api/app/api/routes/treks.py` | `@limiter.limit("15/minute")` on `POST /compare`; `@limiter.limit("20/minute")` on `POST /{slug}/ask`; `request: Request` added | LOW — additive decorators |
| `services/api/app/openapi_mcp.yaml` | Trimmed 4 descriptions exceeding ChatGPT's 300-char limit | LOW — documentation only |

---

### Mobile Bugfix Pass 2 — Cross-platform Personalization Sync + Explore UX (2026-06-23)

New `behavior_profile JSON` column on `users` table. New GET/PUT routes at `/api/v1/account/behavior-profile`. No new tables. All changes are additive.

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/alembic/versions/20260623_0045_add_behavior_profile_to_users.py` (NEW) | Adds `behavior_profile JSON NOT NULL DEFAULT '{}'` to `users` table | LOW — additive, nullable-equivalent (server_default) |
| `services/api/app/modules/auth/models.py` | Added `behavior_profile: Mapped[dict]` column | LOW — `gitnexus_impact(User, upstream)` = many callers but additive field, no existing reader touched |
| `services/api/app/schemas/account.py` | Added `TrekViewEntry`, `BehaviorProfilePayload`, `BehaviorProfileResponse` schemas | LOW — new schemas, no existing consumers |
| `services/api/app/modules/account/service.py` | Added `get_behavior_profile()`, `update_behavior_profile()` (caps views at 50) | LOW — new functions, 0 existing callers |
| `services/api/app/api/routes/account.py` | Added `GET /account/behavior-profile`, `PUT /account/behavior-profile` | LOW — new routes, no existing callers |
| `services/api/tests/test_account.py` | Added TC-B21–TC-B24 | LOW — test file only |
| `apps/mobile/lib/mobileApi.ts` | Added `apiPut<T>`, `BehaviorProfileData`/`BehaviorProfileEntry` types, `accountApi.getBehaviorProfile`/`putBehaviorProfile` | LOW — additive exports |
| `apps/mobile/lib/behaviorProfile.ts` | Rewrote: `recordTrekView` accepts `isAuthenticated` flag + fire-and-forget PUT; `pullAndMergeBehaviorProfile()` merge-on-login | MEDIUM — `recordTrekView` signature changed (optional 2nd param), all callers (1: `trek/[slug].tsx`) updated |
| `apps/mobile/hooks/useBehaviorProfile.ts` | Added `useAuth()` + `useRef(prevUserId)` login-transition trigger for pull-and-merge | LOW — hook result unchanged; 0 upstream callers affected |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Passes `!!user` as `isAuthenticated` to `recordTrekView` | LOW — behavioral addition only |
| `apps/web-next/lib/behavior-tracker.ts` | Added `syncBehaviorProfileToBackend()`, `pullAndMergeBehaviorProfileFromBackend()`; MAX_ENTRIES 25→50 | LOW — new exports; existing `recordTrekView`/`getBehaviorProfile`/`hasBehaviorData` unchanged |
| `apps/web-next/components/trek/TrekViewTracker.tsx` | Added `useAuth()` + `syncBehaviorProfileToBackend()` call when user logged in | LOW — invisible client component; 0 external callers |
| `apps/web-next/lib/auth-context.tsx` | Added `pullAndMergeBehaviorProfileFromBackend()` call in `login`/`signup`/`loginWithGoogle` | LOW — fire-and-forget; does not change return type or behavior for callers |
| `apps/mobile/components/layout/AppDrawer.tsx` | Added "Go Premium" saffron-accented row to INFO_MENU | LOW — leaf drawer component |
| `apps/mobile/components/browse/FilterChips.tsx` | Replaced inconsistent glass/saffron filter chips with unified prominent saffron pill | LOW — `gitnexus_impact(FilterChips, upstream)` = 1 caller (`browse/index.tsx`) |

---

### Step M14 — Push Notifications (2026-06-23)

New `mobile_push_log` table. New `notifications` module (backend). New push notification infrastructure (mobile). All additive.

| File | Change | Blast radius |
|------|--------|-------------|
| `services/api/alembic/versions/20260623_0046_push_log.py` (NEW) | Creates `mobile_push_log` table with FK → `mobile_devices` | LOW — new table, no existing code touches it |
| `services/api/app/modules/notifications/__init__.py` (NEW) | Module init | LOW — new module |
| `services/api/app/modules/notifications/models.py` (NEW) | `MobilePushLog` ORM model | LOW — new model, no existing callers |
| `services/api/app/modules/notifications/push_provider.py` (NEW) | `FCMProvider`, `APNsProvider` (test mode when creds absent), factory functions | LOW — new module, 0 existing callers |
| `services/api/app/modules/notifications/service.py` (NEW) | `send_push`, `send_batch_push`, `get_devices_for_users`, `get_push_logs`, `_log_push` | LOW — new functions, 0 existing callers |
| `services/api/app/db/base.py` | Added `MobilePushLog` import + `__all__` entry | LOW — additive only |
| `services/api/app/core/config.py` | Added `firebase_service_account_json`, `apns_key_id`, `apns_team_id`, `apns_key_p8`, `apns_bundle_id` settings | LOW — new optional fields with `None` defaults |
| `services/api/.env.example` | Added M14 `FIREBASE_SERVICE_ACCOUNT_JSON`/`APNS_*`/`APNS_BUNDLE_ID` vars | LOW — documentation |
| `services/api/app/worker/tasks/notifications.py` (NEW) | `notifications.send_permit_alerts` (daily), `notifications.send_seasonal_alerts` (weekly), `notifications.send_news_alerts` (event-triggered) | LOW — new tasks; require Celery worker restart to register |
| `services/api/app/worker/celery_app.py` | Added `app.worker.tasks.notifications` to include list; 2 beat schedule entries | MEDIUM — any syntax error here crashes all workers; tasks confirmed working in test mode |
| `services/api/app/api/routes/admin_push.py` (NEW) | `POST /api/v1/admin/push/send`, `GET /api/v1/admin/push/logs` | LOW — new admin-only routes, 0 existing callers |
| `services/api/app/api/router.py` | Added `admin_push_router` include | LOW — additive |
| `services/api/tests/test_notifications_m14.py` (NEW) | 5 tests TC-B-M14-01–05 | LOW — test file only |
| `apps/mobile/services/notificationService.ts` (NEW) | `incrementOpenCount`, `requestAndRegisterPushToken`, `saveToInbox`, `getInbox`, `markAllRead`, `getUnreadCount`; uses `Constants.executionEnvironment` (no `expo-device`); `shouldShowBanner`/`shouldShowList` handler (expo-notifications v56) | LOW — new module; callers: `_layout.tsx`, `useNotifications.ts` |
| `apps/mobile/hooks/useNotifications.ts` (NEW) | `useNotifications()` hook: inbox state, permission status, foreground listener, deeplink tap handler | LOW — new hook; callers: `app/notifications.tsx` |
| `apps/mobile/components/notifications/NotificationRow.tsx` (NEW) | Notification list item with category icon, unread dot, relative timestamp | LOW — leaf component |
| `apps/mobile/app/notifications.tsx` (NEW) | Notification inbox screen (modal presentation, `FlatList` + empty state + mark-all-read) | LOW — new route, registered as Stack.Screen modal |
| `apps/mobile/app/_layout.tsx` | Added `incrementOpenCount`/`requestAndRegisterPushToken`/`saveToInbox` imports + `Notifications` import; push setup `useEffect`; `notifications` Stack.Screen | MEDIUM — `_layout.tsx` is the root shell; changes lightly tested; additive only (new effect + new Screen, no logic removed) |
| `apps/mobile/components/layout/AppDrawer.tsx` | Added "Notifications" entry to EXPLORE section of drawer | LOW — leaf drawer component, 1 upstream caller (`_layout.tsx`) |

### Step M15 — Mobile CDP Analytics (2026-06-24)

Additive columns on existing CDP tables. New mobile analytics SDK (no existing code modified except `AuthProvider` + `_layout.tsx`).

| File | Change | Blast Radius |
|------|--------|-------------|
| `services/api/alembic/versions/20260623_0047_analytics_mobile_columns.py` (NEW) | `platform`+`app_version` columns on `analytics_events`/`analytics_sessions` | LOW — additive columns, server_default='web', no existing queries break |
| `services/api/app/modules/cdp/models.py` | `platform`/`app_version` mapped columns on `AnalyticsEvent`/`AnalyticsSession` | LOW — additive ORM fields |
| `services/api/app/schemas/cdp.py` | `platform`/`app_version` optional fields on `EventIn`; `BatchEventIn.events` max_length 20→50 | LOW — backwards compatible (optional fields, larger limit) |
| `services/api/app/modules/cdp/service.py` | `log_event` passes `platform`/`app_version` to ORM | LOW — additive |
| `services/api/tests/test_cdp.py` | `test_batch_ingest_exceeds_limit` updated to 51 events | LOW — test fix only |
| `services/api/tests/test_cdp_mobile_m15.py` (NEW) | 4 tests TC-B-M15-01–04 | LOW — test file only |
| `apps/mobile/lib/identity.ts` (NEW) | `getAnonymousId` (Crypto.randomUUID + SecureStore), `setUserId`/`getUserId` | LOW — new module; callers: `analytics.ts`, `AuthProvider.tsx` |
| `apps/mobile/lib/analyticsQueue.ts` (NEW) | SQLite offline queue `ty_analytics_queue.db`; `enqueueEventSync`/`flushQueueSync` | LOW — new module; callers: `analytics.ts` |
| `apps/mobile/lib/analytics.ts` (NEW) | `trackEvent`, `trackScreen`, `flushOfflineQueue`, 13 convenience helpers | LOW — new module; callers: `AnalyticsProvider.tsx`, `useAnalytics.ts`, `CheckinSheet.tsx` |
| `apps/mobile/providers/AnalyticsProvider.tsx` (NEW) | AppState session mgmt, 15-min background threshold, cold_start flag | LOW — new provider; single caller: `app/_layout.tsx` |
| `apps/mobile/hooks/useAnalytics.ts` (NEW) | Wraps analytics helpers with `useCallback` | LOW — new hook; used by `CheckinSheet.tsx` |
| `apps/mobile/app/_layout.tsx` | Wrapped app shell in `<AnalyticsProvider>` | MEDIUM — root layout; additive wrapping only |
| `apps/mobile/providers/AuthProvider.tsx` | `setUserId(user.id)` on sign-in/up/Google; `setUserId(null)` on sign-out | LOW — additive side-effect calls |

### CDP Mobile Full Parity — users/funnels/cohorts/segments/analytics (2026-06-24)

All 8 fixes in `services/api/app/modules/cdp/service.py` — no schema changes, no migration.

| Symbol changed | What changed | Blast radius |
|----------------|-------------|-------------|
| `_touch_user_trait` (NEW) | Lightweight UserTrait upsert — create row on first event, update last_seen_at | LOW — private helper; called by log_event + batch_log_events |
| `log_event` | Calls `_touch_user_trait` after event commit | MEDIUM — called on every analytics event; adds 1 SELECT + 1 INSERT/UPDATE per event |
| `batch_log_events` | Added `platform`/`app_version` to each row; calls `_touch_user_trait` per unique anon_id | LOW — additive fields; existing consumers unaffected |
| `FUNNEL_TEMPLATES` | `trek_view`→`trek_viewed` × 5; `trek_search`→`search_performed` | LOW — static data returned by `get_funnel_templates`; no callers break |
| `get_cohort_heatmap` | SQL rewritten: `analytics_sessions` → `analytics_events` as cohort base | LOW — same output shape; broader data coverage |
| `SEGMENTS` | "Mobile-First Users" split into "App Users" + "Mobile Browser Users"; 10→11 segments | LOW — `get_segments` callers; test assertions updated |
| `get_segments` | Added `platform_in` filter branch | LOW — additive handler; existing filter types unchanged |
| `get_user_activity` | Added `platform`/`app_version` to per-event dicts | LOW — additive fields in API response |
| `get_trek_analytics` | `count_ev("trek_viewed")` as primary; URL-based as fallback | LOW — same output shape; better mobile coverage |
| `get_content_pages_analytics` | Added `count_mobile_trek_event("trek_viewed")` for trek pages | LOW — additive counter; view totals now include mobile |
| `test_cdp.py`, `test_cdp_step65.py` | Segment count assertions updated 10→11 | NONE — test-only |

### CDP Analytics Parity Fix — event names + platform filter (2026-06-24)

Gap 1 — Mobile event name alignment with web CDP taxonomy. Gap 2 — platform filter in backend + admin UI.

| File | Change | Blast Radius |
|------|--------|-------------|
| `apps/mobile/lib/analytics.ts` | `trek_view`→`trek_viewed`, `search_query`→`search_performed`; added `trackUserSignedIn`, `trackUserSignedUp`, `trackTrekShared`, `trackNewsArticleViewed` | LOW — function names unchanged; only the event string literals changed; all callers use wrapper functions |
| `apps/mobile/hooks/useAnalytics.ts` | Exports 4 new analytics helpers | LOW — additive |
| `apps/mobile/providers/AuthProvider.tsx` | `trackUserSignedIn`/`trackUserSignedUp` fire-and-forget calls added to signIn/signUp/signInWithGoogle | LOW — additive; `.catch(()=>{})` guards mean zero error impact |
| `services/api/app/modules/cdp/service.py` | `get_events_explorer`: added `platform` filter param + `platform`/`app_version` fields in response dict; `get_events_export_csv`: added `platform` filter + column in CSV header/rows | LOW — fully additive params with `None` defaults |
| `services/api/app/api/routes/cdp.py` | `GET /events` + `GET /events/export`: added `platform: Optional[str] = Query(None)` | LOW — backward-compatible; no callers break |
| `apps/web-next/app/(admin)/admin/cdp/events/page.tsx` | `EventItem` interface extended; `platform` state + dropdown filter; Platform column in table header + rows; colSpan 6→7; buildQuery/export/resetFilters updated | LOW — self-contained admin page |

### Step M16 — Trek Check-ins & History (2026-06-24)

New `user_trek_history` table + checkin API routes + history screen. Trek detail screen gains "I did this trek" CTA.

| File | Change | Blast Radius |
|------|--------|-------------|
| `services/api/alembic/versions/20260623_0048_user_trek_history.py` (NEW) | `user_trek_history` table (user_id FK → users, trek_slug, completion_date, rating, etc.) + 3 indexes | LOW — new table |
| `services/api/app/modules/mobile/models.py` | `UserTrekHistory` ORM model added | LOW — additive |
| `services/api/app/db/base.py` | `UserTrekHistory` imported and registered | LOW — additive import |
| `services/api/app/schemas/mobile.py` | `CheckinIn`/`CheckinOut`/`TrekHistoryStatsOut` schemas added | LOW — additive |
| `services/api/app/modules/mobile/service.py` | `create_checkin`, `get_user_history`, `has_user_done_trek`, `get_history_stats` + badge rules | LOW — new functions; no existing functions modified |
| `services/api/app/api/routes/mobile.py` | 4 new checkin routes: `POST/GET /mobile/checkin`, `GET /mobile/checkin/stats`, `GET /mobile/checkin/done/{slug}` | LOW — additive routes |
| `services/api/tests/test_checkin_m16.py` (NEW) | 8 tests TC-B-M16-01–08 | LOW — test file only |
| `apps/mobile/hooks/useCheckin.ts` (NEW) | `createCheckin`, `getHistory`, `getStats`, `isDone` | LOW — new hook |
| `apps/mobile/components/account/TrekHistoryCard.tsx` (NEW) | Trek history list item with rating/chips | LOW — leaf component |
| `apps/mobile/components/account/CheckinSheet.tsx` (NEW) | Modal bottom sheet for check-in confirmation | LOW — new component |
| `apps/mobile/app/(tabs)/account/history.tsx` (NEW) | History screen with stats, badges, FlatList | LOW — new route |
| `apps/mobile/app/(tabs)/account/_layout.tsx` | `history` Stack.Screen added | LOW — additive Screen |
| `apps/mobile/components/account/AccountDashboard.tsx` | "Trek History" menu row added | LOW — additive row |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | `useCheckin.isDone` on mount; CTA + banner + `CheckinSheet` | MEDIUM — trek detail screen is critical; changes are purely additive (new state, new conditional UI elements) |

### Step 78 — Trip Reports + Trail Conditions (shared backend + web surfaces) [DONE — 2026-06-24]

New `trip_reports` + `trek_media` tables, moderation queue, public reports API, web UI with photo gallery, admin moderation page.

| File | Change | Blast Radius |
|------|--------|-------------|
| `services/api/alembic/versions/20260624_0049_trip_reports.py` (NEW) | `trip_reports` + `trek_media` tables; 3 indexes each | LOW — new tables |
| `services/api/app/modules/reports/models.py` (NEW) | `TripReport`/`TrekMedia` ORM models | LOW — new module |
| `services/api/app/db/base.py` | `TripReport`/`TrekMedia` imported + registered | LOW — additive imports |
| `services/api/app/modules/reports/schemas.py` (NEW) | `ReportIn`, `ReportOut`, `MediaOut`, `ConditionSummary`, `ReportPageOut`, `MediaUploadOut`, `ModerationIn` | LOW — new schemas |
| `services/api/app/modules/reports/service.py` (NEW) | `upload_media`, `create_report`, `get_reports_for_trek`, `moderate_report`, `delete_report`, `get_moderation_queue`, `get_condition_summary` | LOW — new service, no existing functions modified |
| `services/api/app/api/routes/reports.py` (NEW) | `public_router`, `auth_router`, `admin_router` — 5 new endpoints | LOW — additive routes |
| `services/api/app/api/router.py` | 3 new router imports + registrations | LOW — additive |
| `services/api/pyproject.toml` | `Pillow>=10.0.0,<11.0.0` added | LOW — new library, no conflicts |
| `services/api/tests/test_reports_m17.py` (NEW) | 8 tests TC-B-M17-01–08 | LOW — test file only |
| `apps/web-next/lib/reports.ts` (NEW) | TypeScript interfaces + API client functions | LOW — new module |
| `apps/web-next/components/trek/ConditionSummaryBanner.tsx` (NEW) | Condition % bars | LOW — leaf component |
| `apps/web-next/components/trek/PhotoGallery.tsx` (NEW) | Full-screen photo overlay | LOW — leaf component |
| `apps/web-next/components/trek/TripReportCard.tsx` (NEW) | Report card with photo thumbnails | LOW — leaf component |
| `apps/web-next/components/trek/AddReportForm.tsx` (NEW) | Report submission form | LOW — leaf component |
| `apps/web-next/components/trek/TrekReportsSection.tsx` (NEW) | Reports section orchestrator | LOW — new section; wired into trek detail page |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | `<TrekReportsSection slug>` added before `<StickyMobileCTA>` | LOW — additive section; no existing layout changed |
| `apps/web-next/app/(admin)/admin/reports/page.tsx` (NEW) | Admin moderation queue | LOW — new admin page |
| `apps/web-next/app/(admin)/admin/layout.tsx` | "Community" nav group + Trip Reports link | LOW — additive nav group |

### Step 79 — Trek Buddy Matching (shared backend + web) [DONE — 2026-06-25]

`buddy_signals`, `buddy_requests`, `buddy_chat_messages` tables; public trekker profile (signal_id scoped); 10 auth + 2 public API routes; web BuddySection + chat panel + buddy requests page; Celery beat expire task.

| File | Change | Blast Radius |
|------|--------|-------------|
| `alembic/versions/20260625_0050_buddy_matching.py` (NEW) | 3 new tables + `bio`/`avatar_url` on `user_profiles` | MEDIUM — extends existing `user_profiles` table |
| `app/modules/buddies/models.py` (NEW) | `BuddySignal`, `BuddyRequest`, `BuddyChatMessage` ORM | LOW — new module |
| `app/modules/buddies/schemas.py` (NEW) | Pydantic request/response schemas | LOW — new module |
| `app/modules/buddies/service.py` (NEW) | Business logic: upsert signal, chat access guard, privacy masking | LOW — new module |
| `app/api/routes/buddies.py` (NEW) | `public_router` + `auth_router` (10 routes, static before dynamic) | LOW — additive routes |
| `app/api/router.py` | Buddy router registrations | LOW — additive |
| `app/worker/tasks/buddies.py` (NEW) | `buddies.expire_signals` Celery task | LOW — new task |
| `app/worker/celery_app.py` | New task module + beat schedule entry | LOW — additive |
| `app/db/base.py` | 3 new ORM imports | LOW — additive |
| `tests/test_buddies_m18.py` (NEW) | 12 tests TC-B-M18-01–12 | LOW — test file only |
| `apps/web-next/lib/buddies.ts` (NEW) | TypeScript interfaces + API client | LOW — new module |
| `apps/web-next/components/trek/BuddySignalCard.tsx` (NEW) | Signal card + inline connect | LOW — leaf component |
| `apps/web-next/components/trek/BuddySignalForm.tsx` (NEW) | Signal creation form | LOW — leaf component |
| `apps/web-next/components/trek/BuddySection.tsx` (NEW) | Trek detail buddy section | LOW — new section |
| `apps/web-next/components/trek/BuddyChatPanel.tsx` (NEW) | 10s-polling chat panel | LOW — leaf component |
| `apps/web-next/app/(public)/account/buddy-requests/page.tsx` (NEW) | Buddy requests dashboard | LOW — new page |
| `apps/web-next/app/(public)/trekker/[signalId]/page.tsx` (NEW) | Public trekker profile | LOW — new dynamic page |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | `<BuddySection>` added | LOW — additive section |
| `apps/web-next/app/(public)/account/layout.tsx` | "Buddy Requests" nav item | LOW — additive nav |

### Step 80 — Live Trek Conditions (backend + web) [DONE — 2026-06-26]

New `trek_conditions` module: Open-Meteo weather fetch, trail/permit status derivation, 6-hour Celery beat refresh, public conditions API, web widget.

| File | Change | Blast Radius |
|------|--------|-------------|
| `alembic/versions/20260626_0051_trek_conditions_and_coords.py` (NEW) | `trek_base_lat`/`trek_base_lng` on `cms_pages`; `trek_conditions` table | LOW — additive columns + new table |
| `app/modules/cms/models.py` | `trek_base_lat`/`trek_base_lng` Mapped columns | LOW — additive columns; no existing callers read them |
| `app/modules/conditions/__init__.py` (NEW) | Package marker | LOW — new module |
| `app/modules/conditions/models.py` (NEW) | `TrekCondition` ORM | LOW — new model |
| `app/modules/conditions/schemas.py` (NEW) | `WeatherOut`/`ForecastDayOut`/`ConditionOut`/`SeedCoordinatesOut` Pydantic v2 | LOW — new schemas |
| `app/modules/conditions/service.py` (NEW) | `TREK_COORDS`, `fetch_weather` (async httpx Open-Meteo), `derive_trail_status`, `derive_permit_status`, `refresh_trek_conditions`, `get_trek_conditions`, `refresh_all_trek_conditions`, `seed_trek_coordinates` | LOW — new service; reads `cms_pages` and `trip_reports` read-only |
| `app/db/base.py` | `TrekCondition` import + `__all__` registration | LOW — additive |
| `app/api/routes/conditions.py` (NEW) | `public_router` + `admin_router` (3 routes) | LOW — new routes; no route ordering conflict |
| `app/api/router.py` | `conditions_public_router` + `conditions_admin_router` registered | LOW — additive include |
| `app/worker/tasks/conditions.py` (NEW) | `conditions.refresh_all` Celery task | LOW — new task |
| `app/worker/celery_app.py` | `app.worker.tasks.conditions` include + beat schedule (21600s) | LOW — additive entry; worker restart required after deploy |
| `tests/test_conditions_m19.py` (NEW) | 9 tests TC-B-M19-01–09 | LOW — test file only |
| `apps/web-next/lib/conditions.ts` (NEW) | TypeScript interfaces + `fetchConditions` (ISR revalidate:3600) | LOW — new lib module |
| `apps/web-next/components/trek/LiveConditionsWidget.tsx` (NEW) | Current weather + 3-day forecast + status pills widget | LOW — leaf component |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | `<LiveConditionsWidget>` wired above trail-conditions section | MEDIUM — critical public page; change is purely additive |

### Step M19 — Live Trek Conditions (mobile) [DONE — 2026-06-26]

Mobile conditions hook + inline widget + full-screen overlay, consuming STEP-80 backend.

| File | Change | Blast Radius |
|------|--------|-------------|
| `apps/mobile/hooks/useConditions.ts` (NEW) | `useConditions` hook with AsyncStorage 6h TTL cache, offline fallback, 404→null | LOW — new hook |
| `apps/mobile/components/trek/ConditionsWidget.tsx` (NEW) | Inline compact widget: weather, forecast, trail/permit badges | LOW — leaf component |
| `apps/mobile/components/conditions/LiveConditionsScreen.tsx` (NEW) | Full-screen overlay: weather card, forecast, trail + permit + summary cards, pull-to-refresh | LOW — leaf component |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | `conditionsDetailVisible` state + `<ConditionsWidget>` + `<LiveConditionsScreen>` overlay | MEDIUM — critical screen; all changes additive |

### Step M18 — Trek Buddy Matching (mobile surfaces) [DONE — 2026-06-25]

Mobile buddy matching UI consuming STEP-79 backend.

| File | Change | Blast Radius |
|------|--------|-------------|
| `apps/mobile/hooks/useBuddies.ts` (NEW) | `buddyApi` + `useTrekBuddies` + `useBuddyRequests` | LOW — new module |
| `apps/mobile/components/buddy/BuddySignalSheet.tsx` (NEW) | Signal creation sheet | LOW — leaf component |
| `apps/mobile/components/buddy/BuddyListCard.tsx` (NEW) | Signal card with connect | LOW — leaf component |
| `apps/mobile/components/buddy/BuddyRequestSheet.tsx` (NEW) | Requests modal | LOW — leaf component |
| `apps/mobile/components/buddy/BuddyChatScreen.tsx` (NEW) | Full chat modal | LOW — leaf component |
| `apps/mobile/components/buddy/TrekkerProfileModal.tsx` (NEW) | Public profile modal | LOW — leaf component |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Buddy section + 3 new modals | MEDIUM — critical screen; all changes additive |
| `apps/mobile/app/(tabs)/account/index.tsx` | "Trek Buddy Requests" row + 2 modals | LOW — additive UI |

### Step M17 — Trip Reports + Photo Gallery (mobile surfaces) [DONE — 2026-06-24]

5th "Trail" tab on TrekDetailScreen, mobile reports components, photo picker with resize.

| File | Change | Blast Radius |
|------|--------|-------------|
| `apps/mobile/components/trek/TrekTabBar.tsx` | `TrekTab` type: added `"reports"`; TABS: added `{ key: "reports", label: "Trail" }` | MEDIUM — `TrekTab` type used by trek detail screen; updated `TAB_SECTION_KEYS` to include `reports: null` in [slug].tsx |
| `apps/mobile/lib/mobileApi.ts` | `apiUploadFile<T>` export added | LOW — additive export |
| `apps/mobile/hooks/useReports.ts` (NEW) | `useReports` hook | LOW — new hook |
| `apps/mobile/components/reports/ConditionSummaryBanner.tsx` (NEW) | Condition bars | LOW — leaf component |
| `apps/mobile/components/reports/TripReportCard.tsx` (NEW) | Report card + gallery trigger | LOW — leaf component |
| `apps/mobile/components/reports/PhotoGallery.tsx` (NEW) | Modal full-screen FlatList viewer | LOW — leaf component |
| `apps/mobile/components/reports/PhotoPicker.tsx` (NEW) | expo-image-picker + resize + upload | LOW — leaf component |
| `apps/mobile/components/reports/AddReportSheet.tsx` (NEW) | Slide-up form Modal | LOW — leaf component |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | New imports; `addReportVisible` state; `useReports`; "Trail" tab render; `AddReportSheet` | MEDIUM — critical screen; all changes additive (new tab branch in existing if/else) |
| `apps/mobile/package.json` | `expo-image-picker@~56.0.18` + `expo-image-manipulator@~56.0.19` added | LOW — new libraries; no API conflicts |

## Conditions Enhancement Pass (2026-06-29)

| File | Change | Blast Radius |
|------|--------|--------------|
| `services/api/app/worker/tasks/conditions.py` | NEW: `reseed_coordinates_task` (daily beat task, safe re-seed from TREK_COORDS dict) | LOW — new task; does not overwrite non-null coords |
| `services/api/app/worker/celery_app.py` | `daily-reseed-trek-coordinates` added to beat_schedule | LOW — additive beat schedule entry |
| `services/api/app/api/routes/sitemap_data.py` | NEW: `GET /public/sitemap-treks?state=` endpoint + `TrekSitemapEntry` schema; imports `TrekCondition` | LOW — new additive endpoint; does not modify existing routes |
| `apps/web-next/lib/state-sitemap.ts` | `fetchTrekPagesByState` replaced with `fetchTrekSitemapByState` (calls new `/public/sitemap-treks`); lastmod = GREATEST(updated_at, trek_conditions.last_updated_at) | LOW — only used by state-specific XML sitemap route handlers |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | TOC extended with 3 entries; conditions/reports/buddy sections moved from bottom into article column; `trekSchema` spread with `amenityFeature` | MEDIUM — core public page; changes are additive (sections already existed) |
| `services/api/app/schemas/trek_intelligence.py` | `AIInteractionLogResponse` + 3 fields: `user_email`, `user_name`, `is_anonymous` | LOW — additive schema fields; existing consumers unaffected |
| `services/api/app/modules/trek_intelligence/service.py` | `list_ai_interaction_logs` rewritten: LEFT JOIN TreksageChatSession + User; returns list[dict] | LOW — only called from `admin_treks.py` |
| `services/api/app/api/routes/admin_treks.py` | `get_ai_interaction_logs` route simplified to use new dict response | LOW — admin-only route |
| `apps/web-next/app/(admin)/admin/treksage-logs/page.tsx` | "User" column added; KPI row extended with Known/Anon counts; `UserX` icon import | LOW — admin-only page |
| `apps/web-next/lib/api.ts` | `AIInteractionLogEntry`: `user_email`, `user_name`, `is_anonymous` fields added | LOW — additive; typed interface only |

## Step 70 — MonetizationSlot (Z02) + GatedContent (Z03) Wiring (2026-06-29)

| File | Change | Blast Radius |
|------|--------|--------------|
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | (1) Removed `AffiliateRail` + `AffiliateCardItem` imports + hardcoded `gearItems` array; replaced with `<Suspense><MonetizationSlot slug={slug} sourcePage={pageUrl} /></Suspense>` — dynamic CTA based on `fetchIntent`; (2) Added `isPremiumGated = cmsPage?.is_premium === true`; wrapped entire article body (why-this-trek → trek-buddy) in ternary — premium pages show `GatedContent` blur overlay, free pages render normally | MEDIUM — core public page; blast radius bounded to this one page |
| `apps/web-next/components/monetization/MonetizationSlot.tsx` | No change — now used in trek detail page (was orphaned) | — |
| `apps/web-next/components/subscription/GatedContent.tsx` | No change — now used in trek detail page (was orphaned) | — |

## Mobile GatedContentOverlay Wiring + M20 Nearby Treks GPS (2026-06-29)

| File | Change | Blast Radius |
|------|--------|--------------|
| `apps/mobile/lib/mobileApi.ts` | `CMSPage.is_premium` made optional (`?: boolean`); `NearbyTrekOut`/`NearbyTreksOut` interfaces added | LOW — additive; optional field change does not break existing consumers |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Imports `GatedContentOverlay` + `usePremium`; `isPremiumGated` gate in content ternary; `NearbyTreksStrip` import (via home screen wiring) | MEDIUM — critical screen; changes additive (new ternary branch) |
| `services/api/app/modules/treks/service.py` | Added `_haversine_km` + `get_nearby_treks`; imports `TREK_COORDS` from `conditions/service.py` | LOW — additive functions; `list_treks`/`get_trek_by_slug` untouched |
| `services/api/app/schemas/mobile.py` | `NearbyTrekOut` + `NearbyTreksOut` schemas added | LOW — additive |
| `services/api/app/api/routes/mobile.py` | `GET /api/v1/mobile/nearby` endpoint added; imports `get_nearby_treks`, `CMSPage as CMSPageModel` | LOW — additive endpoint; no existing routes modified |
| `services/api/tests/test_nearby_m20.py` (NEW) | 5 tests for nearby endpoint (Rishikesh, sorted, radius, invalid lat, far location) | LOW — new test file |
| `apps/mobile/lib/location.ts` (NEW) | `getUserLocation` + `clearLocationCache`; expo-location foreground + AsyncStorage 30-min TTL | LOW — new library module |
| `apps/mobile/hooks/useNearbyTreks.ts` (NEW) | `useNearbyTreks` React Query hook; `locationGranted` state | LOW — new hook |
| `apps/mobile/components/home/NearbyTreksStrip.tsx` (NEW) | Horizontal nearby strip; permission-denied banner; skeleton; distance badge | LOW — new component; wired into home + browse |
| `apps/mobile/app/(tabs)/(home)/index.tsx` | Import + render `NearbyTreksStrip` after `HomeTrendingSection` | LOW — additive; no existing logic changed |
| `apps/mobile/app/(tabs)/browse/index.tsx` | Import + render `NearbyTreksStrip` in header before "All Treks" | LOW — additive |
| `apps/mobile/app.config.ts` | `NSLocationWhenInUseUsageDescription` added to iOS infoPlist; `expo-location` plugin added | LOW — config-only change |
| `apps/web-next/components/trek/NearbyTreksSection.tsx` (NEW) | Client component: `navigator.geolocation` → `/api/v1/mobile/nearby` → horizontal trek strip | LOW — new component |
| `apps/web-next/app/(public)/explore/page.tsx` | Import + render `NearbyTreksSection` between trek grid and PersonalisedFeed | LOW — additive |

### Trek page effective updated date + conditional conditions schema (2026-06-29) blast radius
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — UPDATED: 3 parallel server-side fetches added at render time (`/conditions`, `/reports`, `/buddy-count`, all best-effort via `Promise.allSettled`); `effectiveUpdatedAt = GREATEST(cmsPage.updated_at, conditions.last_updated_at)` replaces bare `cmsPage.updated_at` in `articleSchema`, `baseTrekSchema`, and hero badge; `additionalProperty` entries for Live Trail Conditions / Community Trail Reports / Trek Buddy Matching now conditional (only emitted when real data exists) and carry real values; blast radius: LOW (leaf page — no external importers)

### Route image field (2026-06-30) blast radius
- `services/api/alembic/versions/20260630_0052_cms_route_image_url.py` — NEW migration: `route_image_url VARCHAR(512) NULLABLE` on `cms_pages`; blast radius: LOW (additive DDL)
- `services/api/app/modules/cms/models.py` — `route_image_url` mapped column added to `CMSPage`; blast radius: LOW (additive)
- `services/api/app/schemas/cms.py` — `route_image_url` added to `CMSPagePatch` + `CMSPageResponse`; blast radius: LOW (additive optional field)
- `apps/web-next/lib/api.ts` — `route_image_url` added to `CMSPage` interface + `CMSPagePayload`; blast radius: LOW (additive)
- `apps/web-next/lib/schema.ts` — `buildTrekSchema` accepts `routeImageUrl?`; `image` field becomes array when both hero + route images present; blast radius: LOW (1 caller: TrekDetailPage)
- `apps/web-next/components/admin/CMSPageForm.tsx` — Route image card added (trek_guide only): URL input + upload + preview; `route_image_url` included in `buildPayload()`; blast radius: LOW (1 caller: admin edit page)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — route image displayed below Route Overview text; `routeImageUrl` passed to `buildTrekSchema`; blast radius: LOW (leaf page)

### Step 81 — Comparison pages + publish-triggered comparison agent (2026-07-14) blast radius
- `services/api/app/modules/comparison/service.py` — NEW: deterministic comparison generation (`pair_slug`, `trek_summary`, `build_verdict`, `build_comparison_content`, `generate_comparison_page` idempotent upsert, `_same_state_peers` null-state-guarded, `generate_comparisons_for_trek` same-state top-3, `backfill_all_comparisons`, `list_comparison_pages`). Reads `CMSPage` first-class trek columns + `content_json.trek_facts`; writes `page_type="comparison"` rows. Blast radius: LOW (new module, no external importers)
- `services/api/app/worker/tasks/comparison.py` — NEW: `comparison.generate_for_trek` + `comparison.backfill_all` Celery tasks; registered in `worker/celery_app.py` include list. Blast radius: LOW (additive)
- `services/api/app/api/routes/comparison.py` — NEW: admin `POST /admin/comparisons/backfill` + `/generate/{slug}` (`get_current_admin`); registered in `api/router.py`. Blast radius: LOW (additive routes; distinct prefix from existing `/account/comparisons`)
- `services/api/app/api/routes/cms.py` — `patch_cms_page` UPDATED: after commit, dispatches `generate_for_trek.delay(slug)` when a trek_guide is published (try/except-guarded so a down broker never fails publish). Blast radius: MEDIUM (hot publish path — guarded, additive side-effect only)
- `apps/web-next/app/(public)/compare/[pair]/page.tsx` — NEW: server-rendered comparison page; reads comparison CMS row via `fetchCMSPage`, `generateStaticParams` via `fetchCMSPages({page_type:"comparison"})`, breadcrumb + Article JSON-LD. Blast radius: LOW (new leaf route; sitemap already maps `comparison`→`/compare` via FE `PAGE_PREFIX`)
- Sitemap: NO code change — `app/sitemap.ts` `PAGE_PREFIX["comparison"]="/compare"` already routes published comparison pages into the sitemap.

### Step 81 gap-closure — editorial/compare/stub/app-tab (2026-07-14) blast radius
- `services/api/app/modules/treks/data.py` — DELETED (12 hardcoded stub treks). No importers besides service.py (verified). Blast radius: was the source of `/trek/{clean-slug}` stub pages.
- `services/api/app/modules/treks/service.py` — REWRITTEN CMS-backed: `list_treks(db,...)`/`get_trek_by_slug(db, slug)` now query published trek_guide CMSPages (non-null trek_state, newest first); `_cms_to_trek` maps incl. real `image`; `get_nearby_treks`/`_haversine_km` unchanged. Blast radius: MEDIUM — `GET /api/v1/treks` + `/api/v1/treks/{slug}` (web `fetchTreks`/`fetchTrekBySlug`, 39 usages). Mobile unaffected (never calls these).
- `services/api/app/schemas/treks.py` — `TrekSummary.image: str | None` added. Blast radius: LOW (additive optional field; web-only consumer).
- `services/api/app/api/routes/treks.py` — `get_treks`/`get_trek` now inject `db`; build responses from dicts. Blast radius: LOW.
- `apps/web-next/lib/trekApi.ts` — `mergeImage` uses real API `image` (falls back to default). Blast radius: LOW.
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — legacy-slug redirect generalized (fires for any unresolved slug via CMS slug-prefix / slugified trek_name); `permanentRedirect()` moved OUTSIDE try/catch (bugfix: NEXT_REDIRECT was being swallowed). Blast radius: LOW (leaf page).
- `apps/web-next/app/(public)/page.tsx` — PT2 editorial block now real-trek-backed; PT3 replaces the hardcoded compare CTA with `<HomeComparisonsSection>` + server-built `comparisonCards`/`comparisonFallback`; added a 6th parallel fetch (`comparison` pages). Blast radius: LOW (home leaf).
- `apps/web-next/components/home/HomeComparisonsSection.tsx` — NEW client component: ranks clean `/compare/[pair]` links by trending + `getBehaviorProfile()` difficulty/region. Blast radius: LOW (1 caller: home).
- `apps/mobile/components/trek/TrekTabBar.tsx` — reports-tab label → "Trail Conditions"; label `numberOfLines={2}` + centered. Blast radius: LOW (leaf).
- Tests: `test_treks.py` rewritten (self-contained CMS-backed), `test_treks_seasonal.py` slug-route test de-hardcoded.

### Step 81 comparison rebuild — pair table, no CMS pages (2026-07-14) blast radius
- `services/api/alembic/versions/20260714_0054_trek_comparisons.py` — NEW migration: `trek_comparisons` table (pair_slug unique + slug_a/slug_b/state + 4 indexes). Blast radius: LOW (additive DDL).
- `services/api/app/modules/comparison/models.py` — NEW `TrekComparison` ORM + `db/base.py` registration. Blast radius: LOW.
- `services/api/app/modules/comparison/service.py` — REWRITTEN: pair-based (`upsert_pair`, `generate_comparisons_for_trek`, `backfill_all_comparisons`, `list_comparison_pairs`) + live compute (`compute_comparison`, `get_comparison_for_pair`); removed `generate_comparison_page`/`build_comparison_content`/`list_comparison_pages` (CMS-page approach). Blast radius: MEDIUM — consumers = comparison routes + Celery task + publish trigger (all updated).
- `services/api/app/api/routes/comparison.py` — REWRITTEN: added `public_router` (`GET /public/comparisons`, `GET /public/comparisons/{pair}`); admin routes now upsert pairs. Registered in `api/router.py`. Blast radius: LOW (additive public routes).
- `services/api/app/worker/tasks/comparison.py` — return key `comparison_pages`→`comparison_pairs`; still calls pair-based service. Blast radius: LOW.
- `apps/web-next/lib/api.ts` — NEW `fetchComparisonPairs`/`fetchComparisonPair` + `ComparisonPair`/`ComparisonDetail`/`ComparisonSide` types. Blast radius: LOW (additive).
- `apps/web-next/app/(public)/compare/[pair]/page.tsx` — REWRITTEN: renders from `GET /public/comparisons/{pair}` (live), `generateStaticParams` from `GET /public/comparisons`; no CMS page read. Blast radius: LOW (leaf).
- `apps/web-next/app/(public)/page.tsx` — home comparison cards built from `fetchComparisonPairs` (was `fetchCMSPages({page_type:"comparison"})`). Blast radius: LOW (home leaf).
- `apps/web-next/app/sitemap.ts` — emits `/compare/{pair}` from `/public/comparisons`; dropped `comparison` PAGE_PREFIX mapping. Blast radius: LOW.
- Tests: `test_comparison.py` rewritten for pair table + live compute + routes.
- REMOVED behavior: agent no longer creates `page_type="comparison"` CMS pages (per user requirement). Existing such pages (if any) are orphaned/ignorable; dev copies were deleted.

### Prod 500 fix + ISR caching restore (2026-07-14) blast radius
- `apps/web-next/lib/api.ts` — `fetchCMSPage` cache: `no-store` → `next:{revalidate:60, tags:["cms:{slug}","cms:all"]}`; removed `AbortSignal.timeout` (a signal opts a fetch OUT of Next's Data Cache). Blast radius: **CRITICAL per impact analysis (44 impacted / 36 direct / 18 public pages: trek, guides, permits, packing, costs, regions, seasons, trek-types, compare/[pair], contact/about/privacy/terms/methodology/affiliate, hi/*)** — all verified 200 + 0 static-to-dynamic errors in prod-mode `next start`.
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — reverted emergency `force-dynamic` → `dynamicParams=true` + `revalidate=60` (ISR); removed `generateStaticParams` (on-demand + ISR, no build prerender-explosion). Blast radius: LOW (leaf).
- `apps/web-next/app/(public)/hi/{trek,guides,packing}/[slug]/page.tsx` — `force-dynamic` → `dynamicParams=true` + `revalidate=3600`. Blast radius: LOW.
- `apps/web-next/app/api/revalidate/route.ts` — added `revalidateTag`: single slug → `revalidateTag("cms:{slug}")` + `revalidatePath("/trek/{slug}")`; bulk → `revalidateTag("cms:all")` + `revalidatePath("/","layout")`. Busts the CMS **fetch data cache** (not just route HTML) so cache-clear/publish edits are instant. Callers unchanged: admin `invalidateCache` (admin/cms/page.tsx) + publish flow (CMSPageForm.tsx) already POST both `/api/v1/cms/cache/invalidate` (Redis) and `/api/revalidate` (Next). Blast radius: LOW.
- Backend `cms/service.py cache_invalidate` (Redis DB2) + `/cms/cache/invalidate` route: UNCHANGED (pre-existing layer).
- Caveat recorded: trek pages still render dynamically (pre-existing `apiFetch` timeout-signal on trek profile/related/news); page-HTML caching served by Cloudflare `s-maxage=300`. Full-page ISR would require making `apiFetch` cacheable (separate, high-blast-radius change — deferred).
- Lesson: static↔dynamic errors surface only under `next start` (prod), never `next build` — any change to `generateStaticParams`/`revalidate`/fetch-cache must be prod-mode smoke-tested before push.

### Home comparisons cross-device personalization (2026-07-14) blast radius
- `apps/web-next/lib/behavior-tracker.ts` — NEW export `BEHAVIOR_UPDATED_EVENT` + `broadcastBehaviorUpdated()`; fired at end of `pullAndMergeBehaviorProfileFromBackend` (server merge) and in `recordTrekView`. Blast radius: LOW (impact = AuthProvider only; additive — no contract change).
- `apps/web-next/components/home/HomeComparisonsSection.tsx` — reads behavior profile on mount + subscribes to `BEHAVIOR_UPDATED_EVENT` (re-reads when the async cross-device merge lands). Blast radius: LOW (1 caller: home page).
- Flow (unchanged wiring, now observable): login/session-restore → `auth-context.pullAndMergeBehaviorProfileFromBackend()` → `GET /api/v1/account/behavior-profile` (server `User.behavior_profile`) → merge into localStorage → fire event → compare cards re-rank by cross-device difficulty/region.
- `PersonalisedFeed` unchanged (already server-driven via `fetchPersonalisedRecommendations`).

### CMS bugfixes — auto-brief gate + news duplicate-URL (2026-07-21) blast radius
- `services/api/app/core/config.py` — NEW `enable_daily_discovery: bool = False`. Blast radius: LOW (additive setting).
- `services/api/app/modules/pipeline/tasks.py` — `daily_discovery_task` early-returns when `enable_daily_discovery` is false. Blast radius: LOW (guards a beat task; needs worker restart on prod).
- `services/api/.env.example` — documented `ENABLE_DAILY_DISCOVERY`.
- `services/api/app/modules/linking/service.py` — added `news_article` to `_EXCLUDED_FROM_LINKING` → `sync_pages_from_cms` now excludes + purges news from the linking `Page` table. Blast radius: MEDIUM — affects "In this cluster" suggestions (news no longer appears) + `get_related_pages`. Intended.
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — (B) route guard: non-`trek_guide` CMS page never renders as a trek page — **`news_article` → `notFound()` (404: the `/trek/{news-slug}` pattern is deleted; news lives only at `/news/{slug}`, direct 200, no redirect)**; other content types → `permanentRedirect` to canonical prefix; (C) "In this cluster" URL builder uses a page_type→prefix map. Blast radius: LOW (leaf; trek_guide pages unaffected — verified prod-mode: `/trek/{trek}`=200, `/trek/{news-slug}`=404, `/news/{slug}`=200, 0 errors).
- `services/api/scripts/purge_news_from_linking.py` — NEW one-off: deletes news_article rows from the linking `pages` table (mirrors sync_pages_from_cms Step-1 delete, scoped to news_article; `--dry-run`; idempotent). Blast radius: LOW (maintenance script; no CMS pages touched).
- Root cause was a cross-step integration gap: Step 56 news agent (`agents/news/agent.py`, `page_type="news_article"`) never wired into Step 44/50 linking `_page_type_from_cms` (defaults unknown→trek_guide). Sitemap (`sitemap.ts`) was already correct (`news_article→/news`).
- Tests: `test_pipeline.py::test_daily_discovery_disabled_by_default`, `test_linking.py::test_news_article_excluded_from_linking_graph`.

### "In this cluster" reconciliation — trek links + news, robust (2026-07-21) blast radius
- `services/api/app/modules/linking/service.py` — `get_related_pages` now JOINs `Page → cms_pages` and filters by the **REAL CMS `page_type`** (in safe_types) + published, instead of the linking-graph `page_type`. Robust against `_page_type_from_cms` defaulting unknown types (news_article) to trek_guide → mis-typed news can't leak into a trek's related list even before a re-sync/purge. Blast radius: MEDIUM — consumers = `/links/suggestions/{slug}` → web trek "In this cluster" (`trek/[slug]/page.tsx`) + web `RelatedContent.tsx` + mobile `RelatedPagesSection.tsx`. Net effect everywhere: mis-typed news removed (improvement); allowed content types unchanged.
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — "In this cluster" section rewritten: `clusterPages.filter(page_type==="trek_guide")` (trek links only) + `trekNewsArticles` (from `fetchNewsByTrek`) rendered as `/news/{slug}`. news_article route guard = `notFound()` (404, no redirect). Blast radius: LOW (leaf).
- Mobile `apps/mobile/components/trek/RelatedPagesSection.tsx` — UNCHANGED (user deferred). Still routes trek_guide→/trek, others→/guide. Now receives a news-free cluster from the shared endpoint. Desktop/mobile diverge intentionally (tracked for follow-up).
- Tests: `test_linking.py::test_get_related_pages_excludes_mistyped_news` (creates a mis-typed-news-in-cluster scenario, asserts exclusion + real sibling retained).

### Home page — news out of trek sections + Recent News section (2026-07-21) blast radius
- `apps/web-next/components/home/RecentlyViewedSection.tsx` — views filtered to real treks (slug ∈ trekList or cmsImageMap) before mapping to chips; excludes stale news slugs. Blast radius: LOW (home leaf).
- `apps/web-next/components/content/PersonalisedFeed.tsx` — items filtered to `page_type==="trek_guide"` (fetch `limit*3`); `FeedCard` href always `/trek/{slug}` (was `/guides/` for non-trek). Used on home + `/explore`. Blast radius: LOW (both should be trek-only — consistent). Recommendations backend UNCHANGED (shared with native app — deliberately not restricted).
- `apps/web-next/components/home/RecentNewsSection.tsx` — NEW client component: groups `GET /public/news` articles into per-trek tabs (trek_slug → name map), ≤5/tab, newest-first, "View all" → `/news`. Blast radius: LOW (new, home only).
- `apps/web-next/app/(public)/page.tsx` — added `fetchNewsArticles(60)` to the parallel fetch + `trekNameMap` (trek_slug→name from trekList) + `<RecentNewsSection>` after `<PersonalisedFeed>`. Blast radius: LOW (home leaf).
- No backend changes. Existing endpoints reused: `GET /public/news` (list newest-first, has `content_json.trek_slug`), `/recommendations`.
- Impact analysis: gitnexus MCP disconnected → manual (all leaf home components; no shared-symbol/backend change).

### Sitemap — separate news + compare child sitemaps (2026-07-21) blast radius
- `apps/web-next/app/compare-sitemap.xml/route.ts` — NEW leaf route: fetches `GET /public/comparisons?limit=1000`, emits `<url>` per `/compare/{pair}`. force-dynamic. Blast radius: LOW (new leaf; referenced from core sitemap).
- `apps/web-next/app/sitemap.ts` — `PAGE_PREFIX.news_article` → `undefined` (news URLs no longer emitted in core; live only in `/news-sitemap.xml`); removed the direct compare-pairs loop + `fetchComparisonPairsForSitemap` helper; added `url("/compare-sitemap.xml")` reference. Blast radius: LOW code (leaf, no importers) but SEO-critical → verified: core has 0 direct `/news/` + 0 direct `/compare/` `<loc>` entries, references both child sitemaps.
- `app/news-sitemap.xml/route.ts` — UNCHANGED (already lists all `/news/{slug}` via `GET /public/news?limit=200`).
- Impact analysis: gitnexus MCP disconnected → manual (leaf routes; no backend/shared-symbol change).
