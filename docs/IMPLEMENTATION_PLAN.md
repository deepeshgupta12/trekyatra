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

### Step 54 — Explore + Home Page Completeness [DONE — 2026-05-21]
- migration 0035: is_featured BOOLEAN DEFAULT FALSE on cms_pages
- cms/models.py: is_featured Mapped column
- schemas/cms.py: CMSPagePatch + CMSPageResponse include is_featured
- cms.py routes: GET /cms/pages/trending — ranks by page_views×0.5 + bookmarks×0.3 + recency×0.2, featured first
- lib/api.ts: fetchAllCMSTreks() + fetchTrendingTreks() + is_featured in CMSPage + CMSPagePayload
- explore/page.tsx: fetchAllCMSTreks() as baseList (all CMS treks, not just 12 static); "Featured" sort puts is_featured=true first; PAGE_SIZE=12 pagination with "Load more"; empty state "No treks match your filters"; removed 3 hardcoded stub sections
- page.tsx (home): fetchTrendingTreks(4) as trending section source (popularity-ranked)
- SeasonalTreksSection.tsx: accepts cmsPages prop; improved seasonStringToMonths() handles "Dec – Apr" range notation; cmsToTrek() converts CMSPage to Trek; CMS treks preferred over static
- CMSPageForm.tsx: isFeatured state + Featured checkbox in Trek metadata panel + is_featured in buildPayload
- Step doc: docs/steps/STEP-54-explore-home-completeness.md

### Step 53 — UX Bug Fixes: Home + Regions + Explore [DONE — 2026-05-20]
- lib/api.ts: CMSTrekCard interface + fetchCMSTreksByState() — fetches CMS trek_guide pages by trek_state; CMSTrekOverride extended; FilterFacets + fetchFilterFacets() + STATIC_FILTER_FACETS fallback
- regions/[slug]/page.tsx: fetchCMSTreksByState() merges CMS treks + static treks (de-duped by slug, most-recent 6 shown); season chart replaced with per-trek season summary list
- explore/page.tsx: sidebar scroll fix (max-h-[calc(100vh-7rem)] overflow-y-auto on sticky div)
- page.tsx (home): trending section applies cmsOverrides server-side for correct images/entities
- DifficultyTabsSection.tsx: cmsToTrek uses trek_difficulty column + trek_state; cmsMatchesDifficulty checks trek_difficulty column
- Step doc: docs/steps/STEP-53-ux-bugs-home-regions.md

### Step 52 — Dynamic Explore Filters [DONE — 2026-05-20]
- New backend: GET /api/v1/treks/filter-facets — DISTINCT trek_state/difficulty/season/suitability/duration from published cms_pages
- lib/api.ts: FilterFacets interface + fetchFilterFacets()
- explore/page.tsx: dynamic filterGroups from API, wired filter logic (AND across groups, OR within group), URL state for all filters
- Duration bucket matching (1-3/4-6/7-9/10+ days), Season month-overlap matching, Suitability partial match, State exact match
- Step doc: docs/steps/STEP-52-dynamic-explore-filters.md
- Dependencies: Step 51 trek_* columns ✅
- treks.py route: GET /api/v1/treks/filter-facets — DISTINCT trek_state/difficulty/season/suitability/duration with bucket grouping
- explore/page.tsx: filterGroups now built from FilterFacets state; applyFilters() AND-across/OR-within; fetchFilterFacets() + STATIC_FILTER_FACETS fallback

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

### Step 63 — Hindi CMS translation fix + SEO [DONE]
- `translation/agent.py`: translate_page() extended — seo_title, seo_description, faqs now translated; max_tokens 12000; fallback returns all fields
- `routes/translation.py`: passes SEO + FAQ fields to agent; status="published" (auto-publish, was draft); stores translated seo_title, seo_description, content_json; response includes `/hi/trek/{slug}` link
- `routes/sitemap_data.py`: sitemap_pages() filters `language='en'` only; new `GET /public/sitemap-pages/hindi` endpoint with source_slug join
- `tests/test_translation.py`: TC-B08 updated (published status), TC-B15 (seo fields translated), TC-B16 (faqs translated); 16/16 pass; suite 520/522
- `hi/trek/[slug]/page.tsx`, `hi/guides/[slug]/page.tsx`, `hi/packing/[slug]/page.tsx`: robots index=true, x-default hreflang, og:locale hi_IN, JSON-LD Article + FAQPage schemas
- NEW `app/hi-trek-sitemap.xml/route.ts`: Hindi trek sitemap with xhtml:link hreflang alternates (hi, en, x-default)
- `app/sitemap.ts`: /hi-trek-sitemap.xml entry added
- `app/robots.ts`: sitemap now array including hi-trek-sitemap.xml
- `admin/cms/page.tsx`: full translation progress modal (elapsed timer, progress bar, success/error with "View Hindi page →" link); HI-translated pages show green Languages icon; translate button hidden if HI already exists
- next build clean; 520/522 backend tests pass

### Step 62 — Plan My Trek auth gate modal [DONE]
- `middleware.ts`: `/plan` removed from PROTECTED_PREFIXES and config.matcher — /plan is now freely accessible; gate moved to in-page modal
- NEW `components/plan/AuthGateModal.tsx`: Radix Dialog modal with full sign-in + sign-up flows (Google OAuth + email/password), matching site auth UI; `onSuccess` callback fires after any auth method
- `app/(public)/plan/page.tsx`: `useAuth()` added; `handleSubmit()` checks `user` — if not logged in, shows `AuthGateModal` and stores pending payload in a ref; `handleAuthSuccess()` closes modal and fires the API call immediately; step 6 hint shown when logged out
- No backend changes — `POST /api/v1/plan/recommend` auth enforcement unchanged
- `next build` clean (180 pages, 0 errors)

### Step 61 — Plan My Trek auth gate [DONE]
- `middleware.ts`: `/plan` and `/plan/:path*` added to `config.matcher` — PROTECTED_PREFIXES already correct but matcher was missing, so guard never fired
- `sign-in/page.tsx`: "Create account" link passes `?next=` through to sign-up
- `sign-up/page.tsx`: Suspense + useSearchParams; Google login respects `?next=`; email signup still goes to onboarding
- All entry points covered: homepage "Plan My Trek" card, direct URL, /plan/results — all redirect to /auth/sign-in?next=/plan for guests

### Step 60 — CMS translation UX + search quality fixes [DONE]
- `translation.py`: null guard for `content_html=None` on manually-created CMS pages
- `admin/cms/page.tsx`: per-row translation loading state (Loader2 spinner, disabled button, real error message, 8s feedback timeout)
- `RecommendedContent.tsx`: `excludeSlugs` prop; over-fetches + filters so displayed count is always correct after dedup
- `trek/[slug]/page.tsx`: passes cluster page slugs as `excludeSlugs` to RecommendedContent (cluster sidebar and "Similar treks" guaranteed non-overlapping)
- `search/service.py`: trending query threshold 2→1; `_CURATED_TRENDING` fallback list supplements when real data sparse
- `routes/search.py`: season_months intent filter applied in semantic_search (graceful skip if no trek_season data)
- `search/page.tsx`: SEASON_BUCKETS winter fixed (April removed); exact/fuzzy split by Fuse score (< 0.05); semantic section moved above fuzzy; "Ranked by…" subtitle removed; user-friendly section headers
- 518/520 backend tests pass (2 pre-existing flaky test_refresh isolation issues); next build clean (180 pages)

### Step 56 — Weekly News Agent + /news/[slug] Pages [DONE]
- `modules/agents/news/agent.py`: LangGraph 3-node agent (fetch_news → filter_relevant → write_and_store_articles); **per-item** design: one CMS page per RSS article; `_slug_from_title` (headline → SEO slug + YYYY-MM), `_clean_title`; Google News RSS; Claude Haiku; `|||` HTML/JSON separator; content_json `{trek_slug, news_item, faqs}`
- `worker/tasks/news.py`: `news.generate_for_trek` Celery task + `news.weekly_all_treks` cron (604800s)
- `api/routes/news.py`: GET /public/news, GET /public/news/by-trek/{trek_slug} (JSON filter), GET /public/news/{slug}, POST /admin/news/generate/{trek_slug}
- `lib/trek-utils.ts`: shared `cmsPageToTrek()` (DifficultyTabsSection + SeasonalTreksSection both import this)
- `app/(public)/news/page.tsx`: news hub grouped by trek
- `app/(public)/news/[slug]/page.tsx`: improved hero (trek badge, source byline), TableOfContents from h2 IDs, sidebar TOC+trek links+source attribution; uses `content_json.news_item`
- `app/news-sitemap.xml/route.ts`: Google News sitemap with `<news:news>` elements
- `trek/[slug]/page.tsx`: related news cards; heading fixed (`{trek.name} — Latest News`, no double Trek)
- `admin/cms/page.tsx`: tabs (All/Trek Guides/News/Other), status+language filters, Generate News popup modal
- 19/19 backend tests pass; next build clean

### Deferred to Production Sprint
- Step 41 (B2B / API extensions)
- Production hosting, CI/CD, CDN, secrets manager
- Real API keys (Anthropic, Stripe, Razorpay, SMTP, Google OAuth)
- Content pipeline run + 20+ CMS pages published
- MonetizationSlot + GatedContent wiring on trek detail pages
- Load testing, cross-browser testing

### Step 65 — CDP Analytics Enhancement [DONE — 2026-05-27]
- Dynamic funnel builder: GET /admin/cdp/events/catalog, POST /admin/cdp/funnels/dynamic (2–8 steps, event/category filters, date range, count type)
- Cohort retention heatmap: replaced 3-column table with full N×M (9-week) color-coded heatmap
- Expanded segments: 10 segments (up from 5), human-readable criteria_label, improved descriptions
- User activity timeline: GET /admin/cdp/users/activity (email lookup → paginated event timeline), new /admin/cdp/activity page
- Plan My Trek stepwise tracking: trackPlanWizardStep(1–5) + trackPlanWizardCompleted wired into plan/page.tsx
- New analytics helper: trackPlanWizardStep() in analytics.ts
- Static /users/activity registered before dynamic /users/{user_id} to prevent path shadowing
- 13 new backend tests in test_cdp_step65.py; 2 tests in test_cdp.py updated for new schemas
- next build clean; 594 tests pass (2 pre-existing flaky refresh tests pass in isolation)

### Step 64 — CDP Analytics Layer [DONE — 2026-05-27]
- 5 DB migrations: analytics_events (0036), analytics_sessions (0037), user_traits (0038), attribution_touchpoints (0039), gsc_performance (0040)
- CDP module: models.py, service.py (log_event, batch_log_events, start/end_session, stitch_identity, list_users, get_user_profile, funnels, cohorts, segments, GSC)
- 12 backend API endpoints: POST /analytics/event, POST /analytics/events/batch, POST /analytics/session/start|end, POST /analytics/consent, GET /admin/cdp/users|users/{id}|funnels/{name}|cohorts|events/stream|segments|gsc
- DPDP endpoints: GET /auth/me/data-export, DELETE /auth/me/data
- 3 Celery beat tasks: nightly trait refresh, nightly GSC import, weekly cleanup
- CDP client SDK: lib/analytics.ts (batch flush, UTM capture, session mgmt, consent, GA4 mirror)
- 3 analytics components: AnalyticsProvider, ConsentBanner, ScrollDepthTracker
- 8 admin CDP pages: /admin/cdp + 7 sub-pages
- Admin layout CDP nav group
- 24 backend tests, all passing; next build clean
- Step doc: docs/steps/STEP-64-cdp-analytics-layer.md

### Step 66 — Homepage Section Logic by User State [DONE — 2026-05-29]
- HomeWelcomeBanner client component: States A+B (logged-in) greeting with last-viewed trek chips
- HomeTrendingHeader client component: personalized section heading (4 states) over SSR TrekCards
- RecentlyViewedSection client component: State D (repeat logged-out) compact horizontal scroll row
- PersonalisedFeed revamp: 4-state logic with per-state labels, fetchers, and visibility rules
- DifficultyTabsSection: useEffect on mount pre-selects preferred difficulty from getBehaviorProfile()
- Homepage page.tsx layout updated to include new components in correct order
- No backend changes required — all logic is client-side via useAuth() + behavior-tracker

### Step 67 — CDP Analytics Full Revamp [DONE — 2026-05-29]
- Phase 0: event_definitions table + seed (35 events), is_internal flag on analytics_events, custom_segments + cdp_webhook_rules tables, Alembic migration 0041
- Phase 1: Executive dashboard (8 KPI tiles with deltas/sparklines, real-time feed, alert rail), User 360 profile (full timeline, session list, trait badges, source attribution), Event Explorer (paginated + filters + CSV export)
- Phase 2: 6 saved funnel templates, configurable cohort builder (4 cohort types), dynamic segment builder UI with rule conditions
- Phase 3: Per-page content analytics, trek funnel analytics, enhanced GSC panel (query clusters, CTR decay, position opportunities)
- Phase 4: Segment export CSV, campaign trigger webhook rules, suppression rules
- Phase 5: AI insight cards (deferred to future step)
- 13+ new admin frontend pages/rewrites; ~20 new backend tests

---

## Execution Rule
Do not start the next step without user confirmation.
### Step 68 — Email Infrastructure, SMTP + Email Verification (Z04) + Trek Alert Delivery (Z05) [DONE]

**Part A — Email Address Standardisation:**
- All `hello@trekyatra.in` and `noreply@trekyatra.com` occurrences replaced with `explore@trekyatra.co.in` across 8 frontend pages + seed script + config defaults

**Part B — GoDaddy SMTP Configuration:**
- `config.py`: `smtp_from_email` defaulted to `explore@trekyatra.co.in`; `admin_email` defaulted to `explore@trekyatra.co.in`; `frontend_url: str = "https://trekyatra.co.in"` added
- `.env.example`: SMTP section updated with GoDaddy defaults (`smtpout.secureserver.net:587`, username = `explore@trekyatra.co.in`)

**Part C — Email Verification Flow (Z04):**
- `security.py`: `create_email_verification_token(user_id)` + `parse_email_verification_token(token)` (24h JWT, `typ=email_verification`)
- `modules/auth/service.py`: `mark_email_verified(db, user_id)`
- `schemas/auth.py`: `VerifyEmailRequest` schema added
- `api/routes/auth.py`: `POST /auth/send-verification` (requires auth, graceful SMTP skip, returns 400 if already verified) + `POST /auth/verify-email` (validates token + marks verified)
- `app/(auth)/auth/verify-email/page.tsx`: full rewrite — 4 states (idle/verifying/success/error), auto-verifies on `?token=` in URL, resend button, refresh() on success
- `app/(public)/account/page.tsx`: email verification banner shown when `user && !user.is_verified_email`

**Part D — Trek Alert Delivery (Z05):**
- NEW `modules/account/tasks.py`: `send_trek_alerts_task` Celery task (name: `account.send_trek_alerts`, max_retries=3); graceful SMTP skip; groups TrekAlert by user_id and sends digest email
- `worker/celery_app.py`: `app.modules.account.tasks` added to include list; `daily-trek-alert-digest` beat schedule (86400s)

**Tests:** 8 new tests (TC-B01–TC-B08) — all PASSED; full suite 618 passed, 2 pre-existing failures (test_refresh.py), 1 skipped

**Build:** `next build` ✅ zero TypeScript errors

**GitNexus:** Re-indexed — 13,341 nodes | 18,236 edges | 490 clusters | 139 flows

---

## Execution Rule
Do not start the next step without user confirmation.
### Step 69 — Compare Feature SEO/AEO Revamp [DONE]

- `compare/CompareClient.tsx` — NEW: "use client" client component; `CompareTrek` interface (8 fields incl. altitude/permits/base/suitability); dropdown selectors; URL param sync (`?slugs=`); AuthGateModal for logged-out save; success banner after save; "Link copied!" share feedback
- `compare/page.tsx` — FULL REWRITE to Server Component: `generateMetadata()` (title, description, canonical, OG); fetches `fetchCMSPages(trek_guide, published, 200)` server-side; altitude from `content_json.trek_facts.altitude`; static fallback; no JSON-LD (dirty URL); `revalidate=3600`
- `TrekCTAs.tsx` — bug fix: `/compare?a=` → `/compare?slugs=` (URL param was mismatched with compare page)
- Post-production fixes (2026-06-03): altitude bug fixed, FAQ removed, JSON-LD removed, AuthGateModal wired, share feedback added, 8 compare fields
- No backend changes. Sitemap already had `/compare` at priority 0.7.
- `next build` ✅ 193+ pages, 0 errors
- GitNexus: 13,370 nodes | 18,267 edges | 493 clusters | 140 flows

---

### Step 69C — Post-Production Fixes #2 (Compare Count, Search Compare CTA, Email Verification on Signup) [DONE]

- `account/page.tsx` — added `fetchComparisons()` to `Promise.all` in `loadData`; added `compareCount` state; "Compare Lists" tile now shows real API count (was `"0"`)
- `search/page.tsx` — added `allLoadedTreks` state tracking full merged CMS trek list; added `compareMatch` useMemo (similarity: difficulty+state → difficulty → second result → fuzzy fallback); added compare suggestion UI card between exact + semantic results
- `auth.py` — `signup_email` now calls `_send_verification_email_helper` immediately after welcome email dispatch; wrapped in try/except so SMTP failure never breaks 201 signup response
- `test_email_step68.py` — TC-B09 added: patches `_send_verification_email_helper`, asserts called once with correct email on signup
- Backend: 608 pass, 1 skipped; `next build` ✅ zero errors

---

### Step 69D — Post-Production Fixes #3 (Compare Save, Resend Verification Auth) [DONE]

- `compare/CompareClient.tsx` — `doSave` generates `name = selected.map(t => t.name).join(" vs ")` and includes it in POST body; fixes 422 from `ComparisonCreate.name: str` required
- `account/page.tsx` — amber banner "Resend" changed from `<Link href="/auth/verify-email">` to inline button that calls `POST /api/v1/auth/send-verification` directly (user is definitely authed on the dashboard); shows spinner/success state inline
- `verify-email/page.tsx` — idle state resend button guarded: `authLoading` → spinner; `user && !verified` → resend button; `!user` → "Sign in to resend" redirect; prevents unauthenticated 401
- Frontend-only changes. 608 backend tests pass; `next build` ✅ zero errors

---

## Execution Rule
Do not start the next step without user confirmation.
Current next step: **Step 70** — Component wiring MonetizationSlot + GatedContent

---

### Step 71 — Core Web Vitals Optimisation [DONE]

Spec: `docs/steps/STEP-71-page-vitals-optimisation.md`

Baseline (2026-06-03): Mobile 56, Desktop 52. LCP 10.8 s mobile / 8.0 s desktop.

Implemented (2026-06-03):
- `globals.css`: removed render-blocking Google Fonts `@import`
- `layout.tsx`: `next/font/google` self-hosted Fraunces + Inter + JetBrains Mono (CSS variables); `lazyOnload` for GA4 + AdSense; preconnect for DO Spaces + Unsplash; favicon → 16px/32px optimised PNGs
- `tailwind.config.ts`: fontFamily updated to CSS variable references
- `next.config.mjs`: removed `unoptimized:true`; AVIF/WebP formats; remotePatterns for DO Spaces, Unsplash, Pixabay
- `app/(public)/page.tsx`: hero `<Image priority fill>`; `RecentlyViewedSection` + `PersonalisedFeed` → dynamic(ssr:false); region/editorial images → .webp
- `app/(public)/trek/[slug]/page.tsx`: `fetchPriority="high"` on hero
- `.browserslistrc`: modern browser targets → −11 KB legacy polyfills
- 8 static JPEGs → WebP via cwebp; favicon-16.png (814B) + favicon-32.png (2.2KB)
- Accessibility: `aria-label` on footer social icons, explore sort select, compare select
- `next build` ✅ 193 pages, zero errors

Files to modify: `globals.css`, `layout.tsx`, `tailwind.config.ts`, `next.config.mjs`, `app/(public)/page.tsx`, `app/(public)/trek/[slug]/page.tsx`

Expected after: Mobile 82–88, Desktop 88–92; LCP < 2.5 s; FCP < 1.8 s mobile

---

### Mobile Crosscheck Bugfix Pass (Steps M-DS1–M06) [DONE — 2026-06-11]

Spec: ad-hoc bugfix pass requested after manual QA of M-DS1–M06 surfaced 4 issues (splash/animations, broken login/onboarding UI, broken home + bottom nav, "(home)" trek-state pill linking to a "coming in M03" placeholder).

- `services/api/app/api/routes/treks.py` + `services/api/app/modules/cms/service.py` — NEW `GET /api/v1/treks/seasonal?month=&limit=` endpoint (mirrors web seasonal-trek logic); 7 new tests in `services/api/tests/test_treks_seasonal.py`, all pass; full suite 637 passed / 1 skipped (2 pre-existing unrelated failures in `test_refresh.py`, confirmed via stash)
- `apps/mobile/lib/mobileApi.ts` — rewired `contentApi` to real backend endpoints + added response-shape mappers (`mapCmsPageToTrekListItem`, `mapRecommendationToTrekListItem`): trending → `/cms/pages/trending`, seasonal → `/treks/seasonal`, anonymous recs → `/recommendations`, personalised recs → `/account/recommendations`, save → `/account/bookmarks/by-slug`
- `apps/mobile/hooks/useHomeData.ts` — `getAnonymousRecommendations()` no longer passed unsupported params
- `apps/mobile/components/tabs/CustomTabBar.tsx` — fixed `getIconName`/`getLabelText` switch cases from `"index"` → `"(home)"` (Home tab icon/label were broken since M05's route-group rename); added `options.href === null` filter so the `downloads` tab (hidden via `_layout.tsx`) no longer renders as a 6th broken tab
- `apps/mobile/app/(tabs)/browse.tsx` — placeholder text corrected "coming in M03" → "coming in M07" (M03 was already implemented)
- `apps/mobile/app/_layout.tsx` — added missing `PlayfairDisplay_700Bold`/`PlayfairDisplay_600SemiBold` to `useFonts()` (was silently falling back to system font on Home header + section headings); fixed post-login redirect `router.replace("/(tabs)")` → `router.replace("/(tabs)/(home)")` (invalid route since M05's `(home)` rename — root cause of "login does nothing" bug)
- `.claude/skills/mobile-design-system/SKILL.md` (NEW) — design-system skill doc covering theme tokens, font-loading checklist, tab-bar route-name conventions, API contract discipline; referenced from root `CLAUDE.md` Pre-Step Checklist (item 9) and CLI table
- **tsc --noEmit: 0 errors** | Backend: 637 passed, 1 skipped (2 pre-existing unrelated failures) | No web-next changes — zero blast radius on production website

---

### Step M-DS2 — Splash, Onboarding & Auth Polish [DONE — 2026-06-11]

Spec: ad-hoc combined polish pass requested after manual QA (with screenshots) of M-DS1–M06 surfaced 6 issues (splash had no animation and showed a redundant text label, onboarding background/contrast/back-nav/USP-coverage issues, no guest "Skip" path, missing Google/Apple sign-in icons, sign-in spinner could hang forever, splash needed a "WOW" cinematic feel). Numbered `M-DS2` (not `M07`, which is reserved for "Explore & Search").

- **NEW** `apps/mobile/components/ui/AnimatedSplash.tsx` — code-based "Trail Comes Alive" splash sequence using `react-native-svg` (mountain silhouette, animated trail `Path` via `strokeDashoffset`, `RadialGradient` sunrise glow) + `react-native-reanimated` (fade/scale/spring sequencing) + `Ionicons` waypoint icons; ~4.1s, fades into the app. New dependency: `react-native-svg`.
- `apps/mobile/app/_layout.tsx` — renders `AnimatedSplash` as an overlay until fonts ready + animation done; `AuthGate` relaxed — anonymous users can browse `(tabs)` (no forced redirect to sign-in); `useRequireAuth` still gates `account.tsx`/`saved.tsx`.
- `apps/mobile/app.config.ts` — `splash.backgroundColor` `#1D3A2E` → `#0c0e14`.
- `apps/mobile/app/(auth)/welcome.tsx` — `Dimensions.get("screen")` for full-bleed; white-on-`rgba(13,20,16,0.55)` icon badges + top gradient for contrast in light/dark; back-chevron navigation; slides 3 & 4 rewritten to cover AI trip planner + personalised recs, and offline maps + operator/community booking.
- `apps/mobile/app/(auth)/sign-in.tsx` + `sign-up.tsx` — "Skip" button → anonymous Home; `onApple={handleAppleComingSoon}` wired into sign-in.
- `apps/mobile/components/auth/SocialSignInButtons.tsx` + `apps/mobile/components/ui/Button.tsx` — Google icon, always-rendered Apple button (UI-only "coming soon"), optional `Button` leading `icon` prop.
- `apps/mobile/lib/authApi.ts` — `apiPost`/`apiGet` now use `fetchWithTimeout` (15s `AbortController` timeout) so the sign-in spinner can never hang indefinitely.
- **tsc --noEmit: 0 errors** | Backend: 637 passed, 1 skipped (same 2 pre-existing unrelated `test_refresh.py` failures) | No web-next changes — zero blast radius on production website

---

### Step M-DS3 — Home Screen Web-Parity + Content Hub Screens [DONE — 2026-06-12]

Spec: QA on the M-DS1–M06 mobile app found the Home screen was missing most sections/content hubs present on the production web home page. User decision: build full content-hub parity now (Packing/Permits/Costs/Safety/Plan/Beginner/Compare/Resources/Operators screens), and bundle the recommendation-tags backend fix (difficulty/state/duration/season were hardcoded `null` on recommendation-sourced trek cards).

- **Backend** — `services/api/app/schemas/recommendations.py`: `RecommendationItem` gains `trek_difficulty`, `trek_state`, `trek_duration`, `trek_season` (all optional, additive). `services/api/app/modules/recommendations/service.py`: `_page_to_dict`, `find_similar_pages`, `find_similar_to_query`, `get_anonymous_recommendations`, `_row_to_dict` extended to populate the 4 new fields.
- `apps/mobile/lib/mobileApi.ts` — `RecommendationItem` interface + `mapRecommendationToTrekListItem` now map the 4 tag fields through (previously hardcoded `null`); new `Product`/`Operator`/`PlanRecommendRequest`/`TrekRecommendation`/`PlanRecommendResponse` types; new `contentApi.getCmsPagesByType()`, `contentApi.getProducts()`, `contentApi.getOperators()`, `planApi.recommend()`.
- **NEW** `apps/mobile/components/cms/CMSHubScreen.tsx` — shared CMS-page-list hub UI (used by permits/costs/safety/beginner).
- **NEW content-hub screens** (all under `apps/mobile/app/(tabs)/(home)/`): `guide/[slug].tsx` (generic CMS page detail via `CMSContentRenderer`), `packing.tsx` (static checklist), `permits.tsx`/`costs.tsx`/`safety.tsx`/`beginner.tsx` (CMS hub lists via `CMSHubScreen`, page types `permit_guide`/`cost_guide`/`safety_guide`/`beginner_guide`), `plan-my-trek.tsx` (condensed wizard form → `POST /api/v1/plan/recommend`, auth-gated), `compare.tsx` (lightweight 2-trek attribute comparison — full M08 attribute-table/saved-comparisons feature remains a future step), `products.tsx` (`/api/v1/products`), `operators.tsx` (`/api/v1/operators`).
- **NEW Home section components** (`apps/mobile/components/home/`): `CategoryHubRow.tsx`, `DifficultyTabsSection.tsx`, `EditorialFeatureCard.tsx`, `ComparisonCTACard.tsx`, `ResourcesRow.tsx`, `OperatorsCTACard.tsx`.
- `apps/mobile/app/(tabs)/(home)/index.tsx` — new section order: WelcomeBanner → Trending → CategoryHubRow → Regions → DifficultyTabs → EditorialFeature → SeasonalPicks → RecentlyViewed (D) → PersonalisedFeed (A/B/D) → ComparisonCTA → Resources → OperatorsCTA. All new sections render for all 4 home states, matching web.
- `apps/mobile/app/(tabs)/(home)/_layout.tsx` — registered Stack screens + titles for all new routes.
- **tsc --noEmit: 0 errors** | Backend: 639 passed, 1 skipped (same 2 pre-existing unrelated `test_refresh.py` failures) | No web-next changes — zero blast radius on production website

### Step M-DS4 — Trek Detail Screen Web-Parity [DONE — 2026-06-12]

Spec: QA on the mobile trek detail screen (STEP-M05) found it missing several web-parity sections. User picked: Trust signals, Trek News, "In this cluster" related pages, Table of Contents (re-scoped to a native "Contents" bottom-sheet per user feedback — web's sticky-sidebar scroll-spy is not a mobile pattern), and a "Compare this trek" CTA. Excluded (flagged, not silently skipped): Breadcrumb (web-only concept), in-article ad slot (AdSense not native-app-appropriate, revisit with AdMob if ever needed), mobile news detail screen (News cards deep-link externally to `trekyatra.co.in/news/{slug}`).

- **No backend changes** — `GET /api/v1/cms/pages/{slug}` already returns `published_at`/`updated_at`; `/api/v1/public/news/by-trek/{trek_slug}` and `/api/v1/links/suggestions/{slug}` already exist and are public.
- `apps/mobile/lib/mobileApi.ts` — `CMSPage` gains `published_at`/`updated_at` (additive); new `NewsArticle`/`RelatedPage` interfaces; new `contentApi.getNewsByTrek(slug, limit)`/`contentApi.getRelatedPages(slug, limit)`.
- `apps/mobile/hooks/useTrekDetail.ts` — `mapDbToPage` sets `published_at: null, updated_at: null` for the offline SQLite fallback to satisfy the extended `CMSPage` type.
- **NEW** `apps/mobile/components/trek/TrustSignals.tsx` — "Updated/Published {date}" + author + fact-checked badge row, rendered under `TrekMetaStrip`.
- **NEW** `apps/mobile/components/trek/TrekNewsSection.tsx` — horizontal news-article card row (fetches `getNewsByTrek`, hidden if empty, taps open `https://trekyatra.co.in/news/{slug}` externally).
- **NEW** `apps/mobile/components/trek/RelatedPagesSection.tsx` — "In this cluster" vertical list (fetches `getRelatedPages`, hidden if empty; routes `trek_guide` → `/trek/{slug}`, others → `/guide/{slug}`).
- **NEW** `apps/mobile/components/trek/TrekContentsSheet.tsx` — native "Contents" bottom-sheet modal (Wikipedia/Medium/Notion pattern) listing headings indented by level; tap scrolls to section + dismisses.
- `apps/mobile/components/cms/blocks/HeadingBlock.tsx` + `CMSContentRenderer.tsx` — additive `onLayout`/`onHeadingLayout?: (id, y) => void` plumbing so anchored headings report their y-offset.
- `apps/mobile/components/trek/TrekStickyBar.tsx` — 3rd icon button ("Compare", Ionicons `git-compare-outline`, same 48×48 style as Save) → `/compare?slug={slug}`.
- `apps/mobile/app/(tabs)/(home)/compare.tsx` — reads `useLocalSearchParams<{slug?:string}>()`, pre-selects that trek on mount if present in the trending-treks list.
- `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` — wires everything together: `TrustSignals` under meta strip; "☰ Contents" pill (Guide tab, ≥2 anchored headings) opens `TrekContentsSheet`; `scrollViewRef` + `tabBodyOffset`/`headingOffsets` refs for scroll-to-section; `TrekNewsSection` + `RelatedPagesSection` after "You might also like" (Guide tab only).
- **tsc --noEmit: 0 errors** | `gitnexus_impact` upstream on all 7 target symbols — LOW (0 impacted) except `CMSPage` mobile interface (HIGH/54, pure file-import fan-out from 18 files; additive fields confirmed non-breaking via clean `tsc`) | `gitnexus_detect_changes(scope:"all")` → medium risk, 14 changed / 5 affected / 8 changed files, all expected | Backend: 639 passed, 1 skipped (same 2 pre-existing unrelated `test_refresh.py` failures, no backend files touched) | No web-next changes — zero blast radius on production website
