# TrekYatra Stepwise Implementation Plan

## V0 — Foundations (Complete)

### Step 00 — Repo bootstrap and governance docs [DONE]
- Monorepo scaffold, docs, tracker, and GitNexus setup

### Step 01 — Backend foundation and local infra scaffold [DONE]
- FastAPI scaffold, Docker Compose (Postgres + Redis), health endpoints

### Step 02 — Database, config, and auth data model foundation [DONE]
- SQLAlchemy + Alembic, user/session/role/permission models, initial migrations

### Step 03 — Auth APIs foundation [DONE]
- Email signup/login/logout, JWT HttpOnly cookie, Google/OTP placeholders

### Step 04 — Frontend audit and Next.js migration blueprint [DONE]
- Static frontend audited, full migration to Next.js 14 App Router decided

### Step 05 — WordPress integration foundation [DONE]
- WP config model, REST client skeleton, health/connectivity endpoints

### Step 06 — Content domain foundation [DONE]
- Topic, cluster, brief, draft ORM + APIs + migration; local WP compose setup

### Step 07 — Internal admin foundation [DONE]
- Admin summary APIs (dashboard, topics, clusters, briefs, drafts, system)

### Step 08 — Public frontend data integration + full Next.js migration [DONE]
- All 85 pages migrated to Next.js 14 App Router; public trek APIs added

### Step 09 — User account foundation on frontend [DONE]
- AuthContext, route guards, sign-in/sign-up wiring, Google OAuth

### Step 10 — Publish, tracking, and validation workflows [DONE]
- Draft status machine, WP push endpoint, publish logs, smoke tests, admin drafts page live

---

## V1 — Practical Launchable Product (Steps 11–24)

### Step 11 — Worker and task queue infrastructure [DONE]
- Celery app + Redis broker setup
- Base Task class with retry and dead-letter
- Celery Beat scheduler
- Worker service in docker-compose.yml
- Worker health endpoint
- Worker integration tests

### Step 12 — LangGraph agent framework + agent tracking [DONE]
- Install LangGraph, Anthropic SDK, langchain-anthropic
- `agent_runs` table and Alembic migration
- Base agent state interface and orchestrator
- Agent run service (start/update/complete/fail)
- Admin API: GET /admin/agent-runs

### Step 13 — Trend Discovery Agent + Keyword Cluster Agent [DONE]
- TrendDiscoveryAgent (topic/trend intake, scoring, urgency flag)
- KeywordClusterAgent (group terms into clusters, pillar/support mapping)
- Admin APIs: trigger discover-trends and cluster-keywords
- Admin frontend: trigger + view results

### Step 14 — Content Brief Agent + brief approval workflow [DONE]
- ContentBriefAgent (SEO+AEO structured brief from cluster/topic)
- Brief template engine (heading structure, FAQ stubs, keywords, schema hints)
- Brief approval API: PATCH /admin/briefs/{id}/status (review/approved/rejected)
- Brief versioning (brief_versions table + create_brief_version service)
- Admin UI: brief review queue fully wired to real API with approve/reject actions

### Step 15B — Admin CMS Enhancements [DONE]
- CopyableId and AgentRunsPanel shared components
- Topics/Clusters pages wired to real API with live agent run status
- Briefs page: structured brief content viewer, UUID copy, cross-nav links
- Drafts page: requires_review badge, per-card dispatch feedback fix
- Pipeline View page: Topic→Cluster→Brief→Draft→Published table view
- Admin layout: Pipeline View nav entry

### Step 15 — Content Writing Agent + SEO/AEO Optimization Agent [DONE]
- ContentWritingAgent: brief → full structured article draft (Claude API)
- SEOAEOAgent: snippet optimization, FAQ blocks, answer boxes, entity coverage
- Fact-check flag system: uncertain claim markers
- Draft review flow with content preview in admin UI

### Step 16 — Master CMS Foundation [DONE]
- WordPress removed entirely (all modules, routes, schemas, tests, docker-compose, PHP plugin)
- `cms_pages` table: slug, page_type, title, content_html, content_json, status, seo fields, brief_id FK, cluster_id FK, published_at
- CMS service layer: CRUD + `upsert_page_from_draft` (agent pipeline → CMS bridge) + cache invalidation (Redis DB 2, 5-min TTL)
- New routes: GET/POST /cms/pages, GET/PATCH/DELETE /cms/pages/{slug}, POST /cms/cache/invalidate
- publish_to_cms replaces push_draft_to_wordpress; content_drafts.wordpress_post_id → cms_page_id
- 18 new tests in test_cms.py; test_publish.py rewritten for CMS flow (117/117 total pass)
- Frontend: CMSPage type + fetchCMSPage/fetchCMSPages in lib/api.ts
- Trek detail page: reads from CMS API with static fallback
- Next.js revalidation endpoint: POST /api/revalidate (slug | scope: "all")
- Admin CMS page: pages table, KPI cards, per-page + global cache clear

### Step 17 — Full publish orchestration pipeline [DONE]
- `pipeline_runs` + `pipeline_stages` tables; Alembic migration 20260423_0009
- PipelineOrchestrator service: 6-stage chain (trend_discovery → keyword_cluster → content_brief → content_writing → seo_aeo → publish)
- Checkpoint gates: paused_at_brief_approval (after content_brief), paused_at_draft_approval (after content_writing if draft has flagged claims)
- Celery tasks: run_pipeline_task, resume_pipeline_task, daily_discovery_task (beat schedule)
- Admin APIs: POST /admin/pipeline/run, GET /admin/pipeline/runs, GET /runs/{id}, POST /runs/{id}/resume, POST /runs/{id}/cancel
- 20 new tests in test_pipeline.py; 137/137 total pass; next build clean
- Frontend: PipelineRun/Stage types + triggerPipeline/resumePipelineRun/cancelPipelineRun in lib/api.ts
- /admin/pipeline/page.tsx rewritten as orchestration monitor with RunCard, StageTrack, TriggerForm

### Step 18 — Public frontend content page templates [DONE]
- Backend: FAQ parsing (_extract_faq_section_raw, _parse_faqs_from_section) + permits/base regex fixes; content_json.faqs structured [{q,a}] storage
- Shared components: FAQAccordion (client, accordion), TableOfContents (client, IntersectionObserver scroll spy), Breadcrumb, RelatedContent, AuthorBlock, UpdatedBadge, SafetyDisclaimer, AffiliateDisclosure
- Trek guide page: uses TableOfContents + FAQAccordion + Breadcrumb + AuthorBlock; Quick Facts body block anchored; generic cost/permits fallbacks; difficulty badge from tf.difficulty
- CMSPageForm: FAQ section replaced with Q&A pair editor (add/remove pairs); faqs included in payload
- New page templates: packing/[slug], permits/[slug], guides/[slug] — all CMS-powered with static fallbacks
- lib/api.ts: FAQItem type added; CMSPage.content_json.faqs typed; CMSPagePayload extended

### Step 19 — SEO and schema infrastructure (frontend) [DONE]
- Next.js metadata API for all page types (title, description, OG)
- JSON-LD schema injection (Article, FAQPage, BreadcrumbList, Organization)
- Canonical tags per page
- XML sitemap route (/sitemap.xml)
- robots.txt
- Structured data smoke testing for top page types

### Step 20 — Monetization frontend components [DONE]
- InArticleAdSlot, SidebarAdSlot, FooterAdSlot ad slot components (placeholder in dev, real AdSense when NEXT_PUBLIC_ADSENSE_ID set)
- AffiliateCard, AffiliateRail, ComparisonTable, GearRecommendation affiliate components
- LeadForm (POST /api/v1/leads), OperatorCard, ConsultationCTA lead generation components
- NewsletterCapture, LeadMagnetCapture, InlineNewsletterBlock newsletter components
- DisclosureBlock, TrustSignals, StickyMobileCTA trust components
- Backend: lead_submissions + newsletter_subscribers tables, migration, ORM, schemas, services, routes, 8 tests
- Trek page + packing page wired with ad slots, affiliate rail, trust signals, newsletter capture
- AdSense script conditionally injected in root layout via NEXT_PUBLIC_ADSENSE_ID env var

### Step 21 — RBAC enforcement + separate CMS auth [DONE]
- RequireRole FastAPI dependency (retained) + get_current_admin (new, validates trekyatra_admin_token)
- All admin routes now use get_current_admin (credential-based, no shared user DB)
- Admin login at /admin/sign-in — separate from public /auth/sign-in
- ADMIN_EMAIL + ADMIN_PASSWORD in env; no DB table for CMS admin
- Role seeding script + assign_admin.py (for public user roles, not CMS access)
- Next.js middleware checks trekyatra_admin_token for /admin/*
- Next.js middleware: /admin/:path* requires auth cookie
- conftest.py RBAC bypass for existing tests; 14 new RBAC tests; 199/199 pass

### Step 22 — Internal linking engine + lead pipeline + newsletter platform [DONE]
**A. Internal Linking Engine**
- `pages` + `page_links` tables (migration 0012); sync from cms_pages on publish
- Related page suggestion service (cluster-based + page_type fallback)
- Orphan page detection (daily Celery Beat task)
- Anchor text suggestions service
- APIs: POST /admin/links/sync, GET /links/suggestions/{slug}, GET /admin/links/orphans, GET /admin/links/anchors/{slug}
- RelatedContent component wired to real API (pageSlug prop)
- Admin /admin/linking page rewritten with real orphan data + sync trigger + anchor expand
**B. Lead Pipeline**
- lead_submissions.status column (new/contacted/converted/archived)
- GET /admin/leads + PATCH /admin/leads/{id} endpoints
- Admin lead email notification via SMTP (graceful skip if unconfigured)
- /admin/leads frontend page (KPI row, status filter, mark-as-contacted action)
**C. Newsletter Platform Wiring**
- Mailchimp/Brevo sync (Celery task per subscriber + /newsletter/sync admin endpoint)
- NEWSLETTER_PLATFORM env var (graceful degradation if unset)
- 12 new tests; 214/214 backend tests pass; next build clean; GitNexus 4,771 nodes | 8,189 edges | 172 flows

### Step 23 — Content refresh engine (basic) [DONE]
- Freshness interval field on pages/drafts
- Stale content detection service
- Refresh queue (Celery Beat daily task)
- Refresh trigger API: POST /admin/refresh/trigger
- Refresh logs table
- Admin UI: refresh queue page

### Step 24 — Analytics ingestion + admin panel full wiring [DONE]
- GA4 / analytics event setup (page_view, lead_submit, affiliate_click)
- `affiliate_clicks` table and click-tracking endpoint
- `lead_submissions` table and submission API
- Revenue summary API improvements
- Admin analytics dashboard wired to real data
- All remaining admin pages wired (topics, clusters, briefs, agent status)
- V1 full end-to-end smoke test and validation

---

## V2 — Smarter Automation and Business Depth (Steps 25–32)

### Step 25 — Advanced fact validation system [DONE]
- Claim → evidence mapping engine (ClaimExtractionAgent with LangGraph)
- Confidence scoring per claim (0.0–1.0 float)
- YMYL tagging: altitude, safety_advisory, permit_requirement, emergency_contact, medical_advisory
- Mandatory human-review flags for safety/YMYL content (flagged_for_review gate)
- `evidence_url` + `ymyl_flag` columns added to draft_claims (Alembic migration)
- POST /api/v1/admin/drafts/{id}/fact-check endpoint (triggers ClaimExtractionAgent)
- Fact-check inspector in admin UI: claims grouped by draft, per-draft re-run, YMYL badge, confidence bar

### Step 26 — Cannibalization detection + consolidation agent [DONE]
- Keyword overlap detection across pages (string-match on primary_keyword + supporting_keywords)
- CannibalizationIssue table with severity (low/medium/high) + recommendation (merge/redirect/differentiate)
- ConsolidationAgent: merges two pages into a new ContentDraft via Claude; requires human approval
- Admin UI: scan trigger, severity/status filters, merge/dismiss/resolve actions per issue
- Merge / redirect / canonical recommendation engine
- Admin cannibalization report

### Step 27 — Newsletter automation + repurposing agent [DONE]
- NewsletterAgent: weekly digest from published content
- Social snippet generation (captions, Pinterest pin copy)
- Email marketing integration (Mailchimp / ConvertKit / equivalent)
- Newsletter subscriber management

### Step 28 — Compliance guard agent [DONE]
- Trust & Compliance Guard Agent
- Disclosure presence enforcement
- Risky-wording detection
- Safety disclaimer enforcement on sensitive pages
- Human-review escalation rules

### Step 29 — Operator listing + lead marketplace basics [DONE]
- Operator model (name, region, trek types, contact)
- Lead routing by category/region/operator
- Operator admin management
- Lead lifecycle tracking (new → contacted → converted)

### Step 30 — Dynamic destination hubs [DONE]
- Programmatic destination hub pages
- Auto-generated regional cluster landing pages
- Seasonal landing pages (automated seasonal content refresh)

### Step 31 — Email automation and audience workflows [DONE]
- Automated welcome email on signup
- Season-based nurture sequences
- Trek interest tagging on subscribers
- Digest opt-in/opt-out management

### Step 32 — Deeper dashboards and revenue attribution [DONE]
- revenue_attributions, revenue_config, executive_summaries tables; daily aggregation + weekly beat tasks
- GET /admin/revenue/by-cluster, /by-page-type, /decaying-pages, /config, /summaries endpoints
- ExecutiveSummaryAgent (LangGraph 3-node: gather → generate → store)
- /admin/revenue page: cluster table, page-type table, decay list, config editor, summary history

---

## V3 — Platform Expansion (Steps 33–37)

### Step 33 — Premium user accounts + bookmarks [DONE]
- user_bookmarks, user_downloads, trek_alerts, user_profiles tables + migration 0022
- Full account CRUD APIs (bookmarks, downloads, alerts, profile) via get_current_user auth
- BookmarkButton client component (components/account/BookmarkButton.tsx)
- account/saved + account/downloads pages rewritten to call real API
- Onboarding form wired to PATCH /account/profile (trek_experience, preferred_regions)

### Step 34 — Digital product checkout and file delivery [DONE]
- Digital product catalog (planners, checklists, guides)
- Payment integration (Razorpay; test mode when keys unset)
- File delivery flow post-purchase (HMAC-signed download token, 24h TTL)
- Download dashboard on user account
- Admin: product CRUD + orders list with status filter

### Step 35 — Advanced recommendation engine [DONE]
- pgvector content embeddings (OpenAI text-embedding-3-small, 1536-dim)
- Personalized "next best read" suggestions (centroid of bookmarked pages → vector search)
- Trek similarity search (cosine distance, cluster/page_type fallback)
- Cluster-aware recommendation module (DISTINCT ON cluster_id for anonymous feed)
- Semantic search on /search page for queries >3 words

### Step 36 — User-intent aware monetization [DONE]
- Intent classification per page visit
- Dynamic monetization module selection
- Personalized affiliate recommendations

### Step 37 — Multilingual content workflows [DONE]
- language/translations/source_page_id fields on cms_pages (migration 20260506_0027)
- TranslationAgent (claude-haiku, ephemeral caching, rule-based fallback, proper nouns glossary)
- POST /admin/cms/{slug}/translate — creates translated CMSPage draft
- GET /cms/pages/{slug}?lang=hi — serves translated page with English fallback
- /hi/trek/[slug], /hi/guides/[slug], /hi/packing/[slug] public routes
- hreflang alternates on trek and guides generateMetadata
- Admin CMS page: language badge (EN/HI), HI ✓ indicator, translate button

---

## V4 — Ecosystem Scale (Steps 38–41)

### Step 38 — Operator marketplace layer [DONE]
- Public operator listing + detail pages (`/operators`, `/operators/[slug]`)
- Booking inquiry flow direct to operators (operator_id on lead_submissions)
- `operator_reviews` table; ratings + moderation
- `operator_agreements` table; revenue share / lead-fee tracking
- Step doc: `docs/steps/STEP-38-operator-marketplace.md`

### Step 39 — Trip planning assistant [DONE]
- TripPlannerAgent (LangGraph 4-node): constraints → trek selection → itinerary → package
- `trip_plans` table; `POST /plan/generate`, `GET /plan/{id}`, `POST /plan/{id}/email`
- `/plan` page rewritten as multi-step "which trek for me" wizard
- Day-by-day itinerary builder; print-to-PDF; operator lead capture
- Step doc: `docs/steps/STEP-39-trip-planning-assistant.md`

### Step 40 — Premium subscription layer [DONE]
- `subscriptions` table; Stripe recurring billing (monthly + annual)
- `is_premium` column on `cms_pages`; server-side content gating
- `GatedContent` component; `/premium` marketing page; `/account/premium` dashboard
- `premium_compendium` + `expert_guide` page types
- Step doc: `docs/steps/STEP-40-premium-subscription.md`

### Step 41 — B2B content / API extensions [pending]
- `partners` + `api_keys` + `api_usage_logs` tables
- Partner API: `GET /api/partner/v1/pages`, `/treks`, `/clusters`, `/feed`; key-scoped access
- Lead write API (`POST /api/partner/v1/leads`); rate limiting via Redis
- Admin partner + key management; usage analytics
- Step doc: `docs/steps/STEP-41-b2b-api-extensions.md`

### Step 42 — CMS-driven static pages [DONE — commit b4924d6]
- All public content pages (about, contact, legal, methodology) become CMS-editable
- Static JSX retained as fallback — no regression risk
- Owner can update any page via `/admin/cms` without a code deploy
- Step doc: `docs/steps/STEP-42-cms-driven-static-pages.md`

### Step 43 — Slug deduplication — CMS as canonical source [DONE (frontend) — commit b4924d6]
- No URL can be served by both static data and CMS simultaneously
- CMS always wins when a published page exists for a slug
- Slug conflict detection in CMS service + admin UI warning
- Migration path: static treks in `data/treks.ts` → CMS pages
- Step doc: `docs/steps/STEP-43-slug-deduplication.md`

### Step 44 — Discovery engine improvements [DONE — commits 6e3dd9d + 2026-05-19]

### Step 46 — Trek CMS Unification + Pipeline Quality Fixes [DONE — 2026-05-19, post-ship fixes 2026-05-19]
- Migration 0034: trek_state, trek_name, trek_difficulty, trek_duration, trek_season, trek_suitability on cms_pages
- _slugify_trek(): strips "Trek", "Complete Guide" etc. so "Kedarkantha Trek" → slug "kedarkantha"
- _strip_flagged_markers(): extended to match "flagged for review" and all LLM variants
- _state_from_base() + _suitability_from_difficulty() helpers for trek metadata extraction
- upsert_page_from_draft() populates all 6 trek columns at publish time
- Image agent moved to post-content-writing (not post-publish)
- Search page: TC-F02 (recent searches on X clear), TC-F03 (did-you-mean threshold fix), removed "fuzzy matched" text
- Trek guide breadcrumb: Home → trek_state → trek_name (from CMS columns)
- CMSPage interface + Pydantic schema include trek metadata fields
- 22 new tests; 520 passed / 1 skipped total
- Step doc: docs/steps/STEP-46-trek-cms-unification.md
- Post-ship fix (commit 4fa074a): didYouMeanFuse name-only instance; force_page_type pipeline param; force_page_type admin UI dropdown
- Post-ship fix (2026-05-19): _apply_trek_meta() savepoint — publish HTTP 500 when migration 0034 not on production DB

### Step 47 — Trek Guide Quality Fixes [DONE — 2026-05-19]
- linking/service.py: _EXCLUDED_FROM_LINKING frozenset; editorial/hub pages excluded from sync_pages_from_cms + get_related_pages; In this cluster sidebar now only shows trek-relevant pages
- cms/service.py: _FACT_TABLE base pattern accepts Nearest Base, Base Village, Base Camp headers; _FACT_KV base accepts plain "base:" without village suffix; permits value capture 80→150 chars; season table optional "Best" prefix
- CMSPageForm.tsx: read-only trek metadata panel (trek_name, trek_state, trek_difficulty, trek_duration, trek_season, trek_suitability) shown for trek_guide pages
- trek/[slug]/page.tsx: Quick Utilities links to /trek/[slug]/packing, /permits, /costs
- trek/[slug]/packing/page.tsx, permits/page.tsx, costs/page.tsx: NEW pages — find CMS page by candidate slugs, 404 if absent, breadcrumb Home → Trek → Guide Type
- URL_MAP.md: /trek/[slug]/packing, /trek/[slug]/permits, /trek/[slug]/costs added
- Step doc: docs/steps/STEP-47-trek-guide-quality-fixes.md

### Step 48 — Critical Pipeline + CMS Fixes [DONE — 2026-05-19]
- content/service.py: upsert_topic() — returns existing topic on slug conflict, never returns empty topic_ids
- trend_discovery/agent.py: uses upsert_topic() instead of create_topic()
- cms/service.py: reparse_sections_from_draft rewritten — partial success (updates trek_facts/FAQs even when H2 sections absent), triggers _apply_trek_meta on reparse, clear error messages
- schemas/cms.py: CMSPagePatch now has all 6 trek_* fields (trek_name, trek_state, trek_difficulty, trek_duration, trek_season, trek_suitability)
- lib/api.ts: CMSPagePayload has all 6 trek_* fields
- CMSPageForm.tsx: trek metadata editable inputs with trekMeta state; buildPayload includes trek_* in PATCH
- test_cms.py, test_pipeline.py: updated assertions to match new behaviour
- Step doc: docs/steps/STEP-48-pipeline-cms-critical-fixes.md

### Step 49 — Breadcrumb State Fix + Dropdowns [DONE — 2026-05-19]
- cms/service.py: _STATE_ALIASES dict + _normalize_state() — maps "Uttrakhand" → "Uttarakhand", "HP" → "Himachal Pradesh" etc.; _state_from_base() now normalizes extracted state before storing
- trek/[slug]/page.tsx: STATE_TO_REGION_SLUG mapping for breadcrumb — even if trek_state has a variant spelling, the /regions/[correct-slug] URL is generated; breadcrumb no longer falls through to Himachal Pradesh fallback
- CMSPageForm.tsx: trek_state → state dropdown (Uttarakhand, Himachal Pradesh, J&K, Ladakh, etc.); trek_difficulty → difficulty dropdown (Easy–Expert Only); trek_season → season dropdown (Dec–Apr, Jun–Sep, etc.); trek_suitability → suitability dropdown; trek_name/duration remain free-text

### Step 50 — Trek Page Quality Fixes [DONE — 2026-05-20]
- trek/[slug]/page.tsx generateMetadata: strips trailing '| TrekYatra' from seo_title — prevents 'TrekYatra | TrekYatra' duplication
- linking/service.py sync_pages_from_cms: DELETEs existing Page rows for excluded types before upsert — clears stale editorial pages on next admin sync
- lib/api.ts: fetchTrekCMSOverrides() — slug→{image,title} map from published trek_guide CMS pages
- explore/page.tsx: useEffect merges CMS image overrides into static trek list
- regions/[slug]/page.tsx: server-side CMS override merge into stateTreks before TrekCard render

### Step 45 — Image Gathering Agent [DONE — commit 6e3dd9d]
- Automated agent to find, validate, and assign hero images to pipeline-published trek pages
- Sources: Unsplash API (UNSPLASH_ACCESS_KEY) → Pixabay API (PIXABAY_API_KEY) → Wikimedia Commons (no key)
- LangGraph: select_source → search_images → validate → store_image_url
- Integrates after pipeline publish stage; graceful failure (never blocks pipeline)
- DO Spaces upload for permanent image storage
- Step doc: `docs/steps/STEP-45-image-gathering-agent.md`
- Search: covers all CMS page types, click tracking, "did you mean?", recent searches
- Internal linking: anchor text quality scoring, editorial overrides
- Recommendations: popularity signals, collaborative filtering lite, recently viewed
- Compare: 3-trek support, extended attributes, saved comparisons on `/account/compare`
- Step doc: `docs/steps/STEP-44-discovery-engine-improvements.md`

---

## V5 — Mobile App Roadmap [pending — post-V4]
- React Native + Expo, same FastAPI backend
- Phase 1: offline trek guides, push notifications, trip planning
- Phase 2: community (check-ins, trip reports, buddy matching)
- Phase 3: in-app monetisation (IAP, subscriptions)
- Phase 4: contextual intelligence (weather, GPS, permit alerts)
- Full spec: `docs/versions/V5-MOBILE-APP.md`
- Kickoff: only after V4 complete + 3 months production traffic

---

## Pre-Launch Sprint (Steps 38–40 complete; pre-launch polish)

### Auth Gaps [DONE]
- `POST /auth/forgot-password` — HMAC JWT reset token, graceful SMTP
- `POST /auth/reset-password` — verifies token, sets new password
- `PATCH /auth/me` — update full_name, display_name
- `GET /auth/me/leads` — enquiries for current user's email
- Frontend: `/auth/forgot-password` and `/auth/reset-password` wired
- Frontend: `/account/settings` wired to PATCH /auth/me
- Frontend: `/account/enquiries` wired to GET /auth/me/leads

### Frontend Stubs Fixed [DONE]
- `/compare` — dynamic trek selector (dropdowns, live comparison table)
- `/itineraries`, `/costs`, `/gear`, `/beginner`, `/safety` — CMS hub + static fallback
- `CMSPageHub` component for all content hub pages
- Home page: search bar wired, dead buttons fixed, PersonalisedFeed + Operators CTA added

### Infrastructure [DONE]
- DB cleared (non-user tables) — fresh state for content pipeline
- Sitemap.xml — expanded to cover all CMS page_type values
- Admin operators detail page (`/admin/operators/[id]`) — agreement + review moderation
- Playwright E2E setup — homepage, auth, search, plan wizard specs
- `docs/PRELAUNCH_CHECKLIST.md` created — comprehensive go-live checklist

### UI Polish + Trust Pages [DONE]
- Hero section: "Explore · Experience · Escape" brand slogan pill; overflow:hidden moved to image container; pt-32→pt-24; font 88px→72px
- TrekCard difficulty tags: solid backgrounds (emerald/amber/orange/red + white text + shadow) replacing invisible 15% opacity versions
- Footer: newsletter card backdrop-blur-sm removed (was bleeding through mountain SVG); "Bengaluru" → "Gurgaon"; heart icon in copyright
- Planning resources: real trek images + PDF-type badge overlays replace plain gradient divs
- Trust pages — full content written: /about, /about/authors, /contact, /privacy, /terms, /affiliate-disclosure, /safety-disclaimer, /methodology

### Logo + Hero Layout + Footer Newsletter [DONE]
- Logo.tsx: SVG circular badge (LogoMark) — orange/green gradient, mountain silhouette, trekker; tagline "Explore · Experience · Escape" replaces "India · Trails · Trust"
- Hero: `flex items-end` → `flex flex-col justify-center`; heading now centred in viewport on page load; trust stats at natural bottom via `mt-auto`
- Footer: newsletter card `bg-foreground/40` (invisible on dark) → `bg-white/[0.07] border border-white/20`; pt-28 → pt-36 for visual separation from mountain SVG

### Logo Redesign + Search Fuzzy + Hero Height + Comprehensive Audit [DONE]
- Logo.tsx: complete redesign — navy outer ring, orange-amber sky gradient badge, mountain/snow/forest/trekker/sun/birds; tagline corrected to "Explore. Dream. Discover." (matching actual new logo image); navy Trek text, orange yatra
- Hero: min-h-screen → min-h-[85vh] md:min-h-[78vh]; pt-20 pb-16; font 64px; pill text corrected to "Explore. Dream. Discover."
- Search: Fuse.js 7.3.0 fuzzy matching (threshold 0.35) for treks + guides; autocomplete dropdown (7 suggestions max); outside-click/Escape close; no-results quick suggestions; semantic search still fires for >3-word queries
- PRELAUNCH_CHECKLIST.md: complete rewrite — 8-section comprehensive audit of every backend module, every frontend page, every admin page, 16 known gaps, production checklist, integrations, manual seeding, testing

### Header Nav + Compare Section Responsive [DONE]
- Logo: `compact` prop added; Header uses `<Logo compact />` to hide tagline and reduce logo block width
- Header: search button `onClick → router.push("/search")` (was decorative); ⌘K/Ctrl+K keyboard shortcut via useEffect; mobile drawer search also navigates; nav px-3→px-2.5, gap-6→gap-4
- Compare section: heading text-2xl sm:text-3xl md:text-4xl (prevents mobile overflow); card p-3 md:p-4; text-sm md:text-base; gap-2 md:gap-3; a/b as separate divs (no text wrapping overflow)

### Deferred to Production Sprint
- Step 41 (B2B / API extensions)
- Production hosting, CI/CD, CDN, secrets manager
- Real API keys (Anthropic, Stripe, Razorpay, SMTP, Google OAuth)
- Content pipeline run + 20+ CMS pages published
- MonetizationSlot + GatedContent wiring on trek detail pages
- Load testing, cross-browser testing

## Execution Rule
Do not start the next step without user confirmation.
Current next step: **Step 41 — B2B Content / API Extensions**
