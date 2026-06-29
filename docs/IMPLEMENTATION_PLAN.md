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
- ~~MonetizationSlot + GatedContent wiring on trek detail pages~~ [DONE — Step 70, 2026-06-29]
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
Step 70 complete. Next steps: Step 71–79 and remaining production hardening items.

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

### Step M-DS5 — Splash Screen Rebuild (Static Background + Logo Card) [DONE — 2026-06-12]

Spec: Replace `AnimatedSplash.tsx`'s cinematic SVG/Reanimated "Trail Comes Alive" sequence with a static composition, using a user-provided background image. Tiny, self-contained polish step (M-DS1–M-DS5 family).

- **NEW** `apps/mobile/assets/splash-background.jpg` (864×1821, user-provided) — full-bleed splash background photo.
- `apps/mobile/components/ui/AnimatedSplash.tsx` — rewritten as a static composition: full-bleed background image (`resizeMode="cover"`) + centered white rounded-corner card (140×140, `borderRadius: 24`) containing `logo.png` (100×100); `onFinish()` fires via `setTimeout(1800ms)` — same prop contract, so `app/_layout.tsx` is unchanged. Removed `react-native-svg`/`react-native-reanimated` usage from this component (both remain used elsewhere in the app).
- **tsc --noEmit: 0 errors** | `gitnexus_impact("AnimatedSplash", upstream)` → LOW, 0 impacted (leaf component, unchanged prop contract) | `gitnexus_detect_changes(scope:"all")` → low risk, 5 changed / 0 affected / 1 changed file | No web-next changes — zero blast radius on production website

### Step M-DS6 — Splash→Onboarding Transition Animation + Onboarding Skip CTA [DONE — 2026-06-12]

Spec: Add a launch animation (logo scale/fade-in with overshoot, slightly larger logo) to `AnimatedSplash.tsx` and a smooth crossfade transition into onboarding; add a "Skip" CTA on the onboarding carousel that jumps directly to Sign up. Tiny, self-contained polish step (M-DS1–M-DS6 family).

- `apps/mobile/components/ui/AnimatedSplash.tsx` — re-added `react-native-reanimated` (`useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSequence`, `withDelay`, `runOnJS`, `Easing`): logo fades in and scales `0.85 → 1.08 → 1.0` on mount; card enlarged 140×140 → 152×152, logo 100×100 → 110×110; container opacity fades 1 → 0 over 350ms before `onFinish()` fires via `runOnJS` — crossfades into the onboarding screen mounted underneath (same `{ onFinish: () => void }` contract, `app/_layout.tsx` unchanged).
- `apps/mobile/app/(auth)/welcome.tsx` — new `handleSkip()` (calls `markDone()` + `router.replace("/(auth)/sign-up")`) and a top-right "Skip" pill button shown on onboarding slides 1-3 (hidden on the last slide, which already has direct Sign up/Sign in CTAs). Distinct from the M-DS2 "Skip — continue as guest" buttons on sign-in/sign-up (unchanged).
- **tsc --noEmit: 0 errors** | `gitnexus_impact` upstream on `AnimatedSplash` and `WelcomeScreen` → both LOW, 0 impacted | `gitnexus_detect_changes(scope:"all")` → low risk, 14 changed / 0 affected / 2 changed files | No web-next changes — zero blast radius on production website

### Step M-DS7 — QA Bugfix Pass: Tab Bar, Back Button, Trek Content Rendering, Home Hero [DONE — 2026-06-12]

Spec: QA on M-DS6 surfaced 4 bugs on Trek Detail + Home screens. Tiny, self-contained polish step (M-DS1–M-DS7 family).

- `apps/mobile/components/tabs/CustomTabBar.tsx` — added `if (route.name === "downloads") return null;` to remove the ghost 6th tab.
- `apps/mobile/app/(tabs)/(home)/_layout.tsx` — added `headerBackButtonDisplayMode: "minimal"` to Stack `screenOptions` (icon-only back chevron, removes "< index" label).
- **NEW dependency** `react-native-render-html` + **NEW** `apps/mobile/components/cms/HtmlContentRenderer.tsx` (theme-token styled `RenderHTML` wrapper).
- `apps/mobile/lib/mobileApi.ts` — `CMSPage` gains `content_html: string` + `content_json: {sections?: Record<string,string>} | null` (additive).
- `apps/mobile/hooks/useTrekDetail.ts` — `mapDbToPage` sets `content_html: ""`/`content_json: null` for offline-cached pages.
- `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` — removed dead 404-causing `${slug}-packing/-permits/-costs` sub-page fetches; Guide tab renders `body_json` else `content_html`; Packing/Permits/Costs tabs render `content_json.sections.{packing,permits,cost_estimate}` via `HtmlContentRenderer`.
- **NEW** `apps/mobile/components/home/HomeHero.tsx` + **NEW** `apps/mobile/components/home/HomeSearchBar.tsx`; wired into `apps/mobile/app/(tabs)/(home)/index.tsx`, replacing the old plain-text `HomeHeader`.
- **tsc --noEmit: 0 errors** | `gitnexus_impact` upstream on `CustomTabBar`, `CMSContentRenderer`, `useTrekDetail` → all LOW | `gitnexus_detect_changes(scope:"all")` → 11 changed / 10 affected / 9 changed files, all expected | No web-next changes — zero blast radius on production website

### Step M07a — Browse Tab (grid, filters, regions/seasons, basic search) [DONE — 2026-06-12]

Spec: first sub-step of M07 "Explore & Search", split into M07a (this step — grid/filters/regions/seasons/basic search), M07b (advanced search: semantic/voice/recent/trending — deferred), M07c (polish pass — deferred), per user-approved plan.

- `services/api/app/api/routes/cms.py` `list_cms_pages` (`GET /api/v1/cms/pages`) — new optional query params `trek_state`, `trek_difficulty`, `trek_season`, `trek_duration_min`, `trek_duration_max` (all `None` by default, fully backward compatible).
- `services/api/app/modules/cms/service.py` `list_pages()` — matching filter clauses; `trek_duration` (free text e.g. "6 Days") filtered via `regexp_replace` + `cast(..., Integer)` extraction of the leading day count, guarded by `trek_duration.op("~")(r"^[0-9]")`.
- **NEW** `apps/mobile/stores/exploreStore.ts` — Zustand filter state (`trekState`/`trekDifficulty`/`trekSeason`/`durationBucket`) + `DURATION_BUCKETS` constant.
- **NEW** `apps/mobile/hooks/useFilterFacets.ts` (GET `/api/v1/treks/filter-facets`) and `apps/mobile/hooks/useExplore.ts` (`useInfiniteQuery` over `GET /api/v1/cms/pages?page_type=trek_guide&status=published&...`).
- `apps/mobile/lib/mobileApi.ts` — new `FilterFacets`, `SearchSuggestion`, `ExploreFilters` types + `contentApi.getFilterFacets`/`exploreTreks`/`getSearchSuggestions`.
- **NEW** `apps/mobile/components/browse/SearchBar.tsx` (+ `SearchBarWrapper`), `TrekGrid.tsx`, `FilterChips.tsx`, `FilterSheet.tsx`; `HomeSearchBar.tsx` refactored to wrap the shared `SearchBar`.
- Converted `apps/mobile/app/(tabs)/browse.tsx` placeholder into a stack: **NEW** `browse/_layout.tsx`, `browse/index.tsx` (rebuilt Browse screen), `browse/regions/[state].tsx`, `browse/seasons/[season].tsx`, `browse/search.tsx` (basic search only — recent/trending/semantic/voice deferred to M07b).
- **4 new backend tests** in `test_cms.py` for the new filter query params.
- **tsc --noEmit: 0 errors** | Backend: 7/7 relevant `test_cms.py` tests pass; full suite 643 pass, 2 pre-existing unrelated `test_refresh.py` failures (test-ordering issue, confirmed via `git stash`, reported separately) | `gitnexus_detect_changes(scope:"all")` → risk "low", 36 changed / 0 affected / 5 changed files | No web-next changes — zero blast radius on production website

### Step M07b — Advanced Search (semantic, voice, recent, trending) [DONE — 2026-06-14]

Spec: second sub-step of M07 "Explore & Search", per user-approved plan. All four deferred features (semantic search, voice search, recent searches, trending searches) included per explicit user decision. M07c (polish pass) remains deferred.

- Backend: no changes — `POST /api/v1/search/semantic`, `GET /api/v1/search/trending`, `POST /api/v1/search/log` already existed and fully functional.
- New dependency `expo-speech-recognition@^56.0.1`, added to `apps/mobile/app.config.ts` `plugins` (microphone/speech-recognition usage strings, Android speech service package); requires `expo-dev-client` (already present), hidden gracefully on Expo Go/web via `isRecognitionAvailable()` guard.
- `apps/mobile/lib/mobileApi.ts` — new `SemanticSearchResult` type + `contentApi.semanticSearch`/`getTrendingSearches`/`logSearch`.
- **NEW** `apps/mobile/hooks/useRecentSearches.ts` (AsyncStorage `ty_recent_searches`, max 8), `useTrendingSearches.ts`, `useSemanticSearch.ts` (800ms debounce, >3-word threshold).
- `apps/mobile/app/(tabs)/browse/search.tsx` rewritten — Recent/Trending chip sections on empty query, mic-based voice input, "Suggested for you" semantic results section with "Smart match" badge, recent-search + search-log tracking on result selection.
- **tsc --noEmit: 0 errors** | `gitnexus_detect_changes(scope:"all")` → risk "low", 9 changed / 0 affected / 6 changed files | Backend unchanged — full suite baseline re-confirmed | No web-next changes — zero blast radius on production website

### bugfix (2026-06-14) — Home difficulty tabs showing empty Easy/Moderate sections [DONE — 2026-06-14]

- Root cause: exact-equality difficulty filter against a tiny trending/seasonal subset; DB has no `"Easy"`/`"Challenging"` exactly, and `"Moderate-Difficult"` != `"Moderate"`.
- Fix: new `apps/mobile/hooks/useDifficultyTreks.ts` queries `contentApi.exploreTreks({trekDifficulty: value}, 10, 0)` per a fuzzy value list per tab (mirrors web's substring matching), merged + deduped. `DifficultyTabsSection.tsx` uses it directly (dropped `treks` prop); `app/(tabs)/(home)/index.tsx` drops the now-unused `dedupedTreks`.
- **tsc --noEmit: 0 errors** | No backend or web-next changes.

### Step M07c — Region Tabs with Trek Cards [DONE — 2026-06-14]

Redefines the previously-unscoped "Browse/Search Polish Pass" placeholder. User-requested: "Explore by Region" home section becomes tab-like (tap a chip → 5 trek cards for that state + "View all →" to `/(tabs)/browse?region=<state>`, which the Browse screen already handles).

- `apps/mobile/components/home/RegionsRow.tsx` — chips are now selectable tabs (first region default-selected), styled like `DifficultyTabsSection`'s tabs; new "View all →" header link.
- New `apps/mobile/hooks/useRegionTreks.ts` — `useQuery` over `contentApi.exploreTreks({trekState: region}, 5, 0)`.
- Only 2/8 regions (Himachal Pradesh, Uttarakhand) currently have published CMS data; the other 6 show a "No treks for \<region\> yet." empty state (data gap, not a bug).
- **tsc --noEmit: 0 errors** | No backend or web-next changes.

### bugfix (2026-06-15) — Voice search crash on mic tap [DONE — 2026-06-15]

`apps/mobile/app/(tabs)/browse/search.tsx` — `handleMicPress` wrapped in `try/catch`; any native-module error from `expo-speech-recognition` (added M07b) is caught and logged instead of crashing the app. If voice search still doesn't trigger after this fix, the dev-client binary needs a rebuild to pick up the native module added in M07b. **tsc --noEmit: 0 errors** | No backend or web-next changes.

### Step M08 — Trek Comparison (full attribute table + saved comparisons) [DONE — 2026-06-18]

Spec: `docs/mobile/steps/STEP-M08-trek-comparison.md`. Enhanced the existing `(home)/compare.tsx` (lightweight from M06) with winner badges + save flow; converted the placeholder `saved.tsx` into a proper stack with Saved Comparisons screen.

- `apps/mobile/app/(tabs)/(home)/compare.tsx` — `getWinnerIdx()` function determines green winner badge per attribute row (budget_min/max → lower wins; permit_required → false wins; beginner/solo/family_friendly → true wins; crowd_level → low wins); `handleSave()` with auth gate (Alert prompts unauthenticated users); `savedId` state turns save button green on success
- `apps/mobile/lib/mobileApi.ts` — `apiDelete()` helper; `SavedComparison` interface; `accountApi` object (`listComparisons` → GET /api/v1/account/comparisons, `saveComparison` → POST, `deleteComparison` → DELETE)
- `apps/mobile/hooks/useComparisons.ts` — NEW hook: loads comparisons on mount (when `enabled=true`), exposes `save`, `remove`, `reload`
- `apps/mobile/app/(tabs)/saved.tsx` — DELETED (replaced by directory stack)
- `apps/mobile/app/(tabs)/saved/_layout.tsx` — NEW Stack navigator (index + comparisons screens)
- `apps/mobile/app/(tabs)/saved/index.tsx` — NEW Saved tab root with entry card navigating to comparisons
- `apps/mobile/app/(tabs)/saved/comparisons.tsx` — NEW FlatList of saved comparisons; delete with confirmation Alert; Open navigates to compare screen with preselectSlug
- **tsc --noEmit: 0 errors** | No backend changes (endpoints already existed from Step 44/72) | No web-next changes

---

### Step M09 — Plan My Trek Wizard [DONE — 2026-06-18]

Spec: `docs/mobile/steps/STEP-M09-plan-my-trek-wizard.md`. Replaced the single-scroll `plan-my-trek.tsx` with a full 6-step paginated wizard. State managed in Zustand. Lead capture in step 6 posts to `/api/v1/leads/operator-help`. Results require auth.

- `apps/mobile/stores/planWizardStore.ts` — NEW Zustand store (intent, months, durationMin/Max, fitnessLevel, experienceLevel, region, reset)
- `apps/mobile/components/plan/` — NEW directory: `WizardProgress.tsx`, `WizardStepLayout.tsx`, `IntentSelector.tsx`, `MonthSelector.tsx`, `DurationSelector.tsx`, `FitnessSliders.tsx`, `RegionSelector.tsx`, `LeadCaptureForm.tsx`, `PlanResultCard.tsx`
- `apps/mobile/app/(tabs)/plan/_layout.tsx` — NEW Stack navigator (index + step-1..step-6 + results)
- `apps/mobile/app/(tabs)/plan/index.tsx` — NEW intro screen (hero + 6-step preview + Start Planning CTA)
- `apps/mobile/app/(tabs)/plan/step-1.tsx` through `step-5.tsx` — NEW wizard steps (intent/month/duration/fitness+experience/region)
- `apps/mobile/app/(tabs)/plan/step-6.tsx` — NEW lead capture screen (skippable; submits to `POST /api/v1/leads/operator-help`)
- `apps/mobile/app/(tabs)/plan/results.tsx` — NEW results screen (auth-gate, ranked PlanResultCards, operator CTA)
- `apps/mobile/lib/mobileApi.ts` — `leadsApi.submitOperatorHelp()`, `OperatorHelpLeadPayload`, `LeadResponse` added
- `apps/mobile/app/(tabs)/(home)/_layout.tsx` — stale `plan-my-trek` Stack.Screen removed
- `apps/mobile/components/home/CategoryHubRow.tsx` — "Plan a trek" route fixed to `/(tabs)/plan`
- `apps/mobile/app/(tabs)/plan.tsx` — DELETED (replaced by plan/ stack)
- `apps/mobile/app/(tabs)/(home)/plan-my-trek.tsx` — DELETED (replaced by wizard)
- **tsc --noEmit: 0 errors** | No backend changes (plan/recommend + leads/operator-help already existed) | No web-next changes

---

### Step M10 — User Account [DONE — 2026-06-19]

Spec: `docs/mobile/steps/STEP-M10-user-account.md`. Full account management tab: dashboard with profile header and menu, saved treks (bookmarks), purchased digital product downloads, enquiries, premium placeholder, settings (name/language/biometric/newsletter/legal), per-category notification toggles, and DPDP privacy screen.

- `apps/mobile/app/(tabs)/account/_layout.tsx` (NEW) — Stack navigator; placeholder `account.tsx` deleted
- `apps/mobile/app/(tabs)/account/index.tsx` (NEW) — Dashboard: ProfileHeader + AccountDashboard (stats + menu rows) + sign-out
- `apps/mobile/app/(tabs)/account/saved.tsx` (NEW) — `GET /api/v1/account/bookmarks`; Alert-confirm remove
- `apps/mobile/app/(tabs)/account/downloads.tsx` (NEW) — `GET /api/v1/account/downloads`; download URL via `Linking.openURL`
- `apps/mobile/app/(tabs)/account/enquiries.tsx` (NEW) — `GET /api/v1/auth/me/leads`
- `apps/mobile/app/(tabs)/account/premium.tsx` (NEW) — Feature list + "coming soon" placeholder
- `apps/mobile/app/(tabs)/account/settings.tsx` (NEW) — Name edit (`PATCH /api/v1/auth/me`), EN/हिंदी language toggle (AsyncStorage), biometric toggle (AsyncStorage), notifications link, Trail Letter newsletter (`POST /api/v1/newsletter/subscribe`), legal links (Linking.openURL), sign-out
- `apps/mobile/app/(tabs)/account/notifications.tsx` (NEW) — 6 per-category notification toggles stored in AsyncStorage `notification_prefs`
- `apps/mobile/app/(tabs)/account/privacy.tsx` (NEW) — DPDP data export (Linking to `/api/v1/auth/me/data-export`) + `DELETE /api/v1/auth/me/data` with Alert confirm
- `apps/mobile/components/account/ProfileHeader.tsx` (NEW) — Avatar initials + name + email + Edit→settings
- `apps/mobile/components/account/AccountDashboard.tsx` (NEW) — Stats strip + 6 menu rows with Ionicons
- `apps/mobile/components/account/SavedTrekCard.tsx` (NEW) — Trek card with thumbnail + remove bookmark button
- `apps/mobile/components/account/DownloadItem.tsx` (NEW) — Digital product row with Download button
- `apps/mobile/components/account/EnquiryCard.tsx` (NEW) — Lead enquiry row with status badge
- `apps/mobile/hooks/useAccount.ts` (NEW) — `useSavedTreks`, `useDownloads`, `useAccountMe`, `useNewsletter` hooks
- `apps/mobile/lib/mobileApi.ts` — Added `apiPatch`, new types (`BookmarkResponse`, `DownloadResponse`, `UserMeResponse`, `NewsletterSubscribeResponse`), extended `accountApi`, added `newsletterApi` and `authMeApi`
- **tsc --noEmit: 0 errors** | No backend changes (all endpoints existed from Steps 13, 33, 34, 68)

---

### Step M11 — Operators Marketplace [DONE — 2026-06-22]

Spec: `docs/mobile/steps/STEP-M11-operators-marketplace.md`. Operators listing + detail + inquiry form inside the Browse stack.

- `apps/mobile/app/(tabs)/browse/operators.tsx` (NEW) — Listing: search TextInput, 6 region chips (`GET /api/v1/operators?region=`), `OperatorCard` list, empty/error states
- `apps/mobile/app/(tabs)/browse/operators/[slug].tsx` (NEW) — Detail: hero with initials avatar, about, trek portfolio chips (→ trek detail), trek_types tags, reviews, fixed CTA bar (Call + Send inquiry)
- `apps/mobile/components/operators/OperatorCard.tsx` (NEW) — GlassSurface card: initials, name, rating, region, speciality slugs, Inquire pill
- `apps/mobile/components/operators/OperatorInquirySheet.tsx` (NEW) — Modal bottom sheet: name/email/phone/trek_interest/message → `POST /api/v1/inquiries`; success state with confirmation copy
- `apps/mobile/components/operators/OperatorReviewsList.tsx` (NEW) — Star rows + body + date; empty state copy
- `apps/mobile/hooks/useOperators.ts` (NEW) — `useOperators(region?)`, `useOperatorDetail(slug)`, `useOperatorReviews(slug)`, `useSubmitInquiry()` TanStack Query hooks
- `apps/mobile/lib/mobileApi.ts` — Fixed `Operator.region: string[] | null` (bug: was `string | null`); added `OperatorSpecialization`, `OperatorReview`, `InquiryPayload`, `InquiryResponse` types; added `operatorsApi` namespace; `contentApi.getOperators` delegates to `operatorsApi.list`
- `apps/mobile/app/(tabs)/browse/_layout.tsx` — Added `Stack.Screen name="operators"` + `name="operators/[slug]"` (both `headerShown: false`)
- **tsc --noEmit: 0 errors** | No backend changes (all endpoints pre-existed) | WhatsApp button omitted (no `whatsapp` field in `OperatorPublicResponse`)

---

### TrekSage Hotfix 11 — Enforce founder→authors routing in tool schema [DONE — 2026-06-18, commit 6a8087f]

Root cause: despite `_SITE_INFO_ALIASES` mapping founder terms → "authors", the Haiku LLM was ignoring the Python-layer alias resolution and generating `topic="about"` at the tool-call level based on the English word meaning of "about" ≈ "about the founder". Fix: moved routing rules into the schema itself (where the model reads them at call time) rather than relying on system prompt hints.

- `services/api/app/modules/trek_intelligence/treksage_agent.py` — `get_site_info` tool description rewritten with explicit ROUTING RULES block listing 9 topic→trigger-phrase mappings; `topic` parameter: added `enum` of all 9 valid values + CRITICAL sentence "Use 'authors' for any question about the founder, team member, or who built TrekYatra"; `_call_get_site_info`: when `canonical=="about"`, response now includes a `founder_note` field explicitly naming Deepesh Kumar Gupta.
- **16/16 TrekSage tests pass** | No web-next or mobile changes

---

### TrekSage Hotfix 12 — Authors topic hardcoded (static React page, not CMS) [DONE — 2026-06-18, commit 44562d7]

Root cause confirmed: `/about/authors` is 100% static React (hardcodes Deepesh Kumar Gupta's profile in JSX). No CMS page with `page_type="author"` exists in the database. `list_pages(page_type="author")` always returned an empty list. Same pattern as the safety disclaimer fix (hotfix 9).

- `services/api/app/modules/trek_intelligence/treksage_agent.py` — Added `_AUTHORS_INFO` constant containing full founder bio (name, title, skills, contact, URL); changed `_SITE_INFO_MAP["authors"]` from `{"page_type": "author"}` → `{"hardcoded": True}`; `_call_get_site_info` hardcoded branch now handles both "authors" and "safety" — returns constant without any DB query.
- **16/16 TrekSage tests pass** | No web-next or mobile changes

---

### MCP HTTPS Endpoint Fix — ProxyHeadersMiddleware [DONE — 2026-06-18, commit f9d0a68]

Root cause: FastAPI behind Cloudflare + DigitalOcean proxy was generating HTTP redirect URLs for `/mcp` → `/mcp/` (trailing slash), because it couldn't read the original `X-Forwarded-Proto: https` header from the proxy chain. MCP clients received a 307 redirect to `http://` and rejected the connection.

- `services/api/app/main.py` — Added `ProxyHeadersMiddleware(trusted_hosts="*")` from `uvicorn.middleware.proxy_headers` (before CORS middleware); trusts X-Forwarded-Proto/Host from Cloudflare + DO so FastAPI generates correct HTTPS redirect URLs. Added `"https://claude.ai"`, `"https://chatgpt.com"`, `"https://chat.openai.com"` to `_CORS_ORIGINS`.
- **MCP endpoint** now returns 200 directly at `https://api.trekyatra.co.in/mcp/` without 307 redirect.

---

### OpenAPI Spec for ChatGPT Custom GPT [DONE — 2026-06-18, commit 8f22959]

- `services/api/app/openapi_mcp.yaml` (NEW) — OpenAPI 3.1.0 spec with 7 endpoints (listTreks, compareTreks, getTrekProfile, askTrekQuestion, recommendTreks, treksageChat, getTreksageHistory) and 3 schemas (TrekSummary, TrekProfile, TrekRecommendation); server: `https://api.trekyatra.co.in/api/v1`.
- `services/api/app/main.py` — Added `GET /openapi-mcp.json` route serving the YAML file as JSON with `Access-Control-Allow-Origin: *` (required for ChatGPT to fetch the spec).
- ChatGPT Custom GPT published: `https://chatgpt.com/g/g-6a3501669eb88191a43b39b3afa4cac7-treksage-india-s-trek-planner`; privacy policy: `https://www.trekyatra.co.in/privacy`.

---

### Rate Limiting + DDoS Protection [DONE — 2026-06-18, commit 6b14854]

- `services/api/pyproject.toml` — Added `"slowapi>=0.1.9,<1.0.0"` to dependencies.
- `services/api/app/main.py` — Wired `Limiter`, `SlowAPIMiddleware`, `_rate_limit_exceeded_handler` from `slowapi`; limiter keyed by `get_remote_address` (reads X-Forwarded-For set by Cloudflare).
- `services/api/app/api/routes/treksage.py` — `@limiter.limit("20/minute")` on `POST /treksage/chat`; added `request: Request` as first parameter.
- `services/api/app/api/routes/treks.py` — `@limiter.limit("15/minute")` on `POST /treks/compare`; `@limiter.limit("20/minute")` on `POST /treks/{slug}/ask`.
- `services/api/app/openapi_mcp.yaml` — Trimmed 4 descriptions exceeding ChatGPT's 300-char limit: getTrekProfile (340→<300), askTrekQuestion (348→<300), recommendTreks (343→<300), treksageChat (387→<300).
- 429 Too Many Requests returned on violation; safe in local/test (rate limit keyed per real IP).

---

### Step M-DS8 — Glass UI Overhaul (platform-adaptive glassmorphism) [DONE — 2026-06-15]

Spec: user-requested app-wide "Glass UI" restyle, without hampering existing UX/IA. User decisions: iOS → Apple "Liquid Glass" (`expo-glass-effect`); Android/web → `expo-blur` frosted; full app-wide pass in one step (not phased).

- New `apps/mobile/components/ui/GlassSurface.tsx` — single reusable glass primitive (iOS 26+ `GlassView` via `expo-glass-effect`, `BlurView` fallback via `expo-blur`); new `glassTint`/`glassBorder`/`glassOverlay` tokens in `constants/theme.ts`.
- Commit 2: `CustomTabBar.tsx`, `TrekStickyBar.tsx`, `TrekTabBar.tsx` → `GlassSurface` backgrounds. Stack header glass (`headerTransparent`) attempted, reverted as too high blast-radius; deferred.
- Commit 3: Home surfaces (`HomeWelcomeBanner`, `CategoryHubRow`, `EditorialFeatureCard`, `ComparisonCTACard`, `OperatorsCTACard`, `ResourcesRow`, `SearchBar`/`HomeSearchBar`) → `GlassSurface`. Active tabs/chips stay solid saffron.
- Commit 4: `FilterSheet`, `TrekContentsSheet`, `TrekMetaStrip`, `TrekCard` info footer, `RecentlyViewedRow`, `FilterChips` (inactive state) → `GlassSurface`.
- Commit 5: Auth screens — `welcome.tsx` chrome elements, `sign-in.tsx`/`sign-up.tsx`/`forgot-password.tsx`/`reset-password.tsx` form `TextInput`s → `GlassSurface`. `otp.tsx`/`SocialSignInButtons.tsx` unchanged.
- New deps: `expo-glass-effect`, `expo-blur` (both native modules — require dev-client rebuild, cumulative with M07b's `expo-speech-recognition`).
- **tsc --noEmit: 0 errors** after every commit | `gitnexus_impact` upstream on all touched shared components → all LOW | `gitnexus_detect_changes(scope:"all")` → low/medium per commit, scope as expected | No backend or web-next changes.

---

### Step 72 — "TrekSage" MCP Server + Trek Intelligence Data Layer + Datacenter Subdomain [DONE — 2026-06-15]

Spec: `docs/steps/STEP-72-trekyatra-mcp-server.md`. PRD-driven: expose trek data/planning/comparison/Q&A to website, mobile app, ChatGPT and Claude via a new MCP server "TrekSage", with a new `datacenter.trekyatra.co.in/trek-guide/{slug}` subdomain serving the canonical structured `TrekProfile`. Token-minimization is binding: all ranking/matching/comparison stays deterministic Python (zero LLM); LLM (Claude Haiku, tight `max_tokens`, DB-cached) used only for Trek Detail Q&A, Compare trade-off summary, admin backfill drafts, and existing Hindi translation.

10 commits, all done:
1. Alembic `20260615_0043_step72_trek_intelligence.py` — 16 new `cms_pages.trek_*` structured fields + `ai_interaction_logs` + `trek_qa_cache` tables + `lead_submissions.details_json`.
2. New `services/api/app/modules/trek_intelligence/` — `models.py` (`AIInteractionLog`, `TrekQACache`), `matching.py` (real budget/season scoring, hard exclusion of unsafe/closed + avoid-month treks), `service.py` (8 PRD tools + admin helpers `list_trek_data_quality`/`update_trek_meta`/`list_ai_interaction_logs`), `app/schemas/trek_intelligence.py`.
3. REST routes: `GET /treks/{slug}/profile`, `POST /treks/compare`, `POST /treks/{slug}/ask`, `GET /treks/{slug}/content`, `POST /leads/operator-help`, `POST /ai/log` (`app/api/routes/treks.py`, `leads.py`, new `ai_log.py`); `services/api/tests/test_trek_intelligence.py`.
4. MCP server "TrekSage" (`services/api/app/mcp_server.py`, `mcp` SDK) — 8 tools mounted at `/mcp` via `app/main.py` sub-app; 3 gated by `X-MCP-Key`/`MCP_SHARED_SECRET` (new `app/core/config.py` field + `.env.example`); new Celery task `trek_intelligence.backfill_trek_meta` (`app/worker/tasks/trek_intelligence_tasks.py`, registered in `celery_app.py` — **worker restart required**).
5. Web Trek Detail — new `components/trek/TrekAskAI.tsx` "Ask AI" card (4 suggested prompts, "not verified yet" disclaimer styling); new structured fields surfaced in quick-facts/permits/cost blocks.
6. Web Compare — `CompareClient.tsx` backend-wired to `/treks/compare` (comparison table + cached AI trade-off summary); `RecommendationCard.tsx`/`schemas/plan.py` surface budget/permit/themes.
7. New `apps/web-next/app/datacenter/` route group (`layout.tsx`, `page.tsx` index, `trek-guide/[slug]/page.tsx`) + host-based rewrite in `middleware.ts` for `datacenter.trekyatra.co.in`; `docs/URL_MAP.md` updated.
8. New admin `/admin/trek-data` dashboard (`apps/web-next/app/(admin)/admin/trek-data/page.tsx`) — data-quality KPIs, per-trek inline field editor (`TrekEditForm`, 16 fields + unsafe/closed toggle), "Backfill draft" trigger, AI interaction log table; backend `app/api/routes/admin_treks.py`; nav entry in `admin/layout.tsx`.
9. Mobile: `app/(tabs)/plan.tsx` now renders `plan-my-trek.tsx` wizard (was dead M08 stub); new `components/trek/TrekAskAI.tsx` GlassSurface card mounted on trek detail guide tab; `app/(tabs)/(home)/compare.tsx` rewritten to call `trekIntelligenceApi.compare()` (now 2-3 treks + AI summary card); `lib/mobileApi.ts` gains `trekIntelligenceApi`.
10. This doc + `MASTER_TRACKER.md`, `DEPENDENCY_MAP.md`, `README.md`, `.env.example` (`MCP_SHARED_SECRET`) updated.

**Verification:** 665/665 backend pass, 1 skipped (2 pre-existing `test_refresh.py` failures, unrelated baseline) | `next build` ✅ zero errors | `npx tsc --noEmit` (mobile) ✅ zero errors | `gitnexus_detect_changes(scope:"all")` reviewed, no new HIGH/CRITICAL beyond expected leaf-screen touches.

**Manual/infra follow-ups (user-performed, documented in step doc):** DO domain + GoDaddy CNAME for `datacenter.trekyatra.co.in`; `MCP_SHARED_SECRET` set in DO env; Celery worker restart; ChatGPT/Claude custom connector registration at `https://api.trekyatra.co.in/mcp`.

---

### Step 73 — TrekSage Bugfix Pass [DONE — 2026-06-16]

Spec: `docs/steps/STEP-73-treksage-bugfix-pass.md`. Fixes 7 production bugs identified after Step 72 shipped + adds 2 new surfaces (/treksage AI chat, datacenter JSON viewer).

Root causes fixed:
- **#1/#5/#6** (compare "—", 0 verified fields, plan card badges): structured trek fields not bulk-populated — new `backfill_all_trek_meta(db)` + Celery task + admin "Backfill All Treks" button.
- **#2** (shallow compare summary): `_get_or_create_compare_summary` now includes permit/themes/solo/suitability/months in prompt + `_SUMMARY_PROMPT_VERSION = "v2"` cache-bust.
- **#3** (Ask AI always "not verified"): `ask_trek_question` now grounds answers in `content_json.sections` via `_QA_SECTION_KEYWORDS` map — packing/itinerary/safety/faq questions answered from real CMS HTML.
- **#4** (no conversational follow-ups): `ChatTurn` + `history` param on `AskTrekQuestionRequest` / `ask_trek_question`; cache skipped for history-bearing requests; web + mobile `TrekAskAI` send last 3 exchange turns.

New surfaces:
- **Commit 5**: `TrekProfile.content_sections`/`faqs` — full per-trek JSON bible; `_compact_profile` strips for token-light search tools.
- **Commit 6**: `treksage_chat_sessions`/`treksage_chat_messages` tables; `treksage_agent.py` (Haiku + tool-calling, MAX_TOOL_ROUNDS=3); `POST /api/v1/treksage/chat` + `GET /api/v1/treksage/chat/{session_key}/history`.
- **Commit 7**: `/treksage` public Myra-style chat page + `sitemap.ts` entry.
- **Commit 8**: `datacenter/page.tsx` rewritten as `?slug=` JSON viewer; `/trek-guide/[slug]` → 308 `permanentRedirect`.
- **Commit 9**: Mobile history parity — `MobileChatTurn` + updated `trekIntelligenceApi.ask()`.

**Verification:** 683/685 backend pass (2 pre-existing `test_refresh.py` failures, unrelated) | 18 new tests TC-B23–B40 | `next build` ✅ zero errors (`/treksage` 3.94 kB) | `npx tsc --noEmit` (mobile) ✅ zero errors.

**Manual/infra follow-ups:** `alembic upgrade head` for `20260616_0044`; Celery worker restart; admin clicks "Backfill All Treks" once.

---

### Step 76 — TrekSage V1 Completion + V2 Features [DONE — 2026-06-17]

Delivers all remaining V1 and V2 TrekSage MCP features.

Backend:
- **`service.py`**: `list_ai_interaction_logs` — added `source` and `tool_name` optional filter params.
- **`admin_treks.py`**: `GET /api/v1/admin/treks/ai-logs` — added `source` and `tool_name` Query params; default limit 50→100.

Web frontend:
- **`TrekSageWidget.tsx`** (new): Global floating pine FAB (bottom-right, all public pages); compact 380×480 chat drawer with separate `treksage_widget_session` key; hides on `/treksage`.
- **`PlanWizard.tsx`** (new): 7-step chip-selection wizard (Region → Duration → Difficulty → Budget → Month → Group → Preferences) → constructs natural language prompt → calls `send()` in parent.
- **`LeadCaptureModal.tsx`** (new): Lead capture form (name/email/phone/trek interest/month) → `POST /api/v1/leads/operator-help`. Shown via "Get Expert Help" CTA after any conversation.
- **`SiteLayout.tsx`**: Added `<TrekSageWidget />`.
- **`TreksageChat.tsx`**: Added `showWizard` + `showLeadModal` state; Plan tab "Use Guided Planner (7-step)" button; "Get Expert Help" bar after messages.
- **`/admin/treksage-logs/page.tsx`** (new): Admin AI interaction logs dashboard — source/tool_name filter dropdowns, KPI row, paginated table.
- **`layout.tsx`** (admin): Added "TrekSage Logs" nav item + `MessageSquare` import.

Mobile:
- **`treksage.tsx`** (new): Full TrekSage chat screen — DISCOVER/COMPARE/PLAN tabs, message bubbles with trek card chips, AsyncStorage session, pine/saffron design.
- **`_layout.tsx`**: Added `<Tabs.Screen name="treksage">` between browse and plan.
- **`CustomTabBar.tsx`**: `isCenter` → `treksage` (was `plan`); center FAB icon `chatbubbles`; Plan tab uses `sparkles` icon.
- **`mobileApi.ts`**: `TreksageMobileTrekCard`, `TreksageMobileChatResponse`, `TreksageMobileMessage` interfaces; `treksageChatMobile()`, `fetchTreksageHistoryMobile()` functions.

**Verification:** 40/40 trek intelligence + treksage backend tests | `next build` ✅ Compiled successfully, 197 pages | `npx tsc --noEmit` (mobile) ✅ zero errors.

### Step 77 — TrekSage UX Overhaul + Search Fix [DONE — 2026-06-18]

Backend:
- **`service.py`** (`search_treks`): Keyword tokenization — query split into tokens, stop words filtered, OR-match any token against extended haystack (name + title + seo_description + season + state + region + themes + structured month names from best_months int list).
- **`matching.py`** (`_MONTH_ORD`): Added full month names (January…December) alongside abbreviations so `recommend_treks(months=["December"])` scores correctly.
- **`tests/test_treksage.py`** (TC-B41–B44): Keyword search tests use unique `trek_state` UUID + `state=` filter to avoid 200-row fetch limit issue in full suite; TC-B44 verifies `_MONTH_ORD` full name resolution.

Frontend:
- **`TreksageChat.tsx`** (FULL REWRITE): Myra-inspired split-screen layout (42% chat / 58% canvas); canvas slides in on first trek_cards response; trek name → `/trek/[slug]?ref=treksage` analytics link (new tab); "View Details" → `TrekDetailPanel` inline canvas; "Add to Compare" + `compareSet` (Set<string>); "Compare (N)" button sends compare message; `ThinkingBubble` multi-stage cascade (4 stages, check icons); send/stop icon morph; `CanvasTrekCard` with stagger-fade animation; inline `ChatTrekCard` on mobile (canvas hidden on sm); canvas state restored from last assistant trek_cards on session history reload.
- **`TrekDetailPanel.tsx`** (NEW): Inline trek detail panel in canvas — hero image + gradient overlay, 6-cell key facts grid, "View Full Trek Page" (`?ref=treksage`) + "Plan This Trek" CTA.

**Verification:** 676/676 BE tests pass | `next build` ✅ compiled, `/treksage` 21 kB.

### Post-Step-77 TrekSage UX Hotfixes [DONE — 2026-06-18]

- **`apps/web-next/app/(public)/treksage/layout.tsx`** (NEW): Standalone layout (Header only, no Footer, no TrekSageWidget) — eliminates extra footer space below chat.
- **`apps/web-next/app/(public)/treksage/page.tsx`**: Reads `searchParams.q`, passes as `initialQuery` prop to TreksageChat; page height changed to `flex-1 min-h-0`.
- **`apps/web-next/next.config.mjs`**: Added `trekyatra.co.in` + `**.trekyatra.co.in` to `remotePatterns` (covers WordPress/CMS image subdomains).
- **`apps/web-next/app/(public)/page.tsx`**: Homepage TrekSage pills now link to `/treksage?q=<encoded prompt>`.
- **`TreksageChat.tsx`**: `initialQuery` prop auto-sends on mount (after history load); `onError` fallback on all Image components; canvasCards persisted to localStorage per sessionKey (`treksage_canvas_<key>`), restored on history load and session switch; `openDetail()` fetches full TrekProfile async (loading spinner shown while fetching); `detailProfile` state passed to TrekDetailPanel.
- **`TrekDetailPanel.tsx`** (REWRITE): Now accepts `profile: TrekProfile | null` — renders SEO description, full key-facts grid (7 cells incl. crowd level), month guide (best/open/avoid), permit block (amber/green banner), themes chips, suitability badges (beginner/solo/family), content_sections as accordion, FAQs as accordion; image `onError` fallback.
- **`apps/mobile/app/(tabs)/treksage.tsx`** (REWRITE): Richer TrekCardItem (stats row: duration/altitude/season, budget text, "View Trek" → `router.push(/trek/slug)`, "Compare" toggle); `compareSet` + compare bar ("Compare (N)" sends compare message); multi-stage ThinkingBubble; canvas cards persisted to AsyncStorage per session.

**Verification:** `next build` ✅ compiled, `/treksage` 22.7 kB | `npx tsc --noEmit` (mobile) ✅ zero errors.

---

### Step 78 — Trip Reports + Trail Conditions (shared backend + web surfaces) [DONE — 2026-06-24]

Backend (shared with STEP-M17 mobile):
- **`alembic/versions/20260624_0049_trip_reports.py`** (NEW): `trip_reports` + `trek_media` tables; 3 indexes each.
- **`modules/reports/models.py`** (NEW): `TripReport` + `TrekMedia` ORM models.
- **`modules/reports/schemas.py`** (NEW): `ReportIn`, `ReportOut`, `MediaOut`, `ConditionSummary`, `ReportPageOut`, `MediaUploadOut`, `ModerationIn`.
- **`modules/reports/service.py`** (NEW): `upload_media` (Pillow resize→1920px, boto3 DO Spaces), `create_report`, `get_reports_for_trek`, `_compute_condition_summary`, `moderate_report`, `delete_report`, `get_moderation_queue`, `get_condition_summary`.
- **`api/routes/reports.py`** (NEW): `public_router` (`GET /public/treks/{slug}/reports`), `auth_router` (`POST /reports`, `POST /reports/media/upload`, `DELETE /reports/{id}`), `admin_router` (`GET /admin/reports`, `PATCH /admin/reports/{id}/moderate`).
- **`pyproject.toml`**: `Pillow>=10.0.0,<11.0.0` added.
- **`tests/test_reports_m17.py`** (NEW): 8 tests TC-B-M17-01–08; 727/729 pass (2 pre-existing).

Web frontend:
- **`apps/web-next/lib/reports.ts`** (NEW): TypeScript interfaces + `fetchReports`, `submitReport`, `uploadPhoto`, `deleteReport`, `fetchModerationQueue`, `moderateReport`.
- **`components/trek/ConditionSummaryBanner.tsx`** (NEW): Condition % bars + report count + last date.
- **`components/trek/PhotoGallery.tsx`** (NEW): Full-screen overlay, keyboard nav (←→ Esc).
- **`components/trek/TripReportCard.tsx`** (NEW): Condition badge, date, title, body, photo thumbnails → gallery.
- **`components/trek/AddReportForm.tsx`** (NEW): Controlled form, live char counter, immediate photo upload, max 3 photos.
- **`components/trek/TrekReportsSection.tsx`** (NEW): Load-more, auth-gate, post-submit success banner.
- **`app/(public)/trek/[slug]/page.tsx`**: `<TrekReportsSection>` added before `<StickyMobileCTA>`.
- **`app/(admin)/admin/reports/page.tsx`** (NEW): Moderation queue — pending/approved/rejected tabs, approve/reject with optional reason, photo thumbnails.
- **`app/(admin)/admin/layout.tsx`**: "Community" nav group with "Trip Reports" link added.

**Verification:** 727/729 BE tests pass (2 pre-existing) | `next build` ✅ zero errors.

### Step 80 — Live Trek Conditions (backend + web) [DONE — 2026-06-26]

- **`alembic/versions/20260626_0051_trek_conditions_and_coords.py`** (NEW): `trek_base_lat`/`trek_base_lng` Float nullable on `cms_pages`; `trek_conditions` table (id/slug/weather_json JSONB/trail_status/permit_status/permit_notes/condition_summary/weather_updated_at/trail_updated_at/last_updated_at/created_at/updated_at + unique+index on slug).
- **`modules/cms/models.py`**: `trek_base_lat`/`trek_base_lng` `Mapped[float | None]` columns added.
- **`modules/conditions/__init__.py`** (NEW): Empty package marker.
- **`modules/conditions/models.py`** (NEW): `TrekCondition` ORM.
- **`modules/conditions/schemas.py`** (NEW): `WeatherOut`, `ForecastDayOut`, `ConditionOut`, `SeedCoordinatesOut` (Pydantic v2 ConfigDict).
- **`modules/conditions/service.py`** (NEW): `TREK_COORDS` (40 Himalayan treks), `WMO_LABELS`, `fetch_weather` (async httpx Open-Meteo), `_parse_weather`, `derive_trail_status` (5-report majority vote + `trek_is_unsafe_closed` override), `derive_permit_status` (trek_permit_required + month), `build_condition_summary`, `refresh_trek_conditions` (async upsert), `get_trek_conditions`, `refresh_all_trek_conditions`, `seed_trek_coordinates`.
- **`db/base.py`**: `TrekCondition` import + `__all__` registration.
- **`api/routes/conditions.py`** (NEW): `public_router` (`GET /api/v1/public/treks/{slug}/conditions`); `admin_router` (`POST /api/v1/admin/conditions/{slug}/refresh`, `POST /api/v1/admin/conditions/seed-coordinates`).
- **`api/router.py`**: `conditions_public_router` + `conditions_admin_router` registered.
- **`worker/tasks/conditions.py`** (NEW): `conditions.refresh_all` Celery task (asyncio.run wrapper).
- **`worker/celery_app.py`**: `app.worker.tasks.conditions` include + `6h-refresh-trek-conditions` beat schedule (21600s).
- **`tests/test_conditions_m19.py`** (NEW): 9 tests TC-B-M19-01–09; 748/750 pass (2 pre-existing).
- **`apps/web-next/lib/conditions.ts`** (NEW): `WeatherOut`/`ForecastDayOut`/`ConditionOut` TypeScript interfaces + `fetchConditions` (ISR `revalidate:3600`).
- **`apps/web-next/components/trek/LiveConditionsWidget.tsx`** (NEW): Current weather (temp/label/humidity/wind/feels-like), WMO icons, 3-day forecast cards, trail/permit status pills, condition summary, last-updated timestamp; null-returns when no data.
- **`apps/web-next/app/(public)/trek/[slug]/page.tsx`**: `<LiveConditionsWidget>` wired above trail-conditions section.

**Verification:** 748/750 BE tests pass (2 pre-existing) | `next build` ✅ zero errors.

### Step M19 — Live Trek Conditions (mobile) [DONE — 2026-06-26]

- **`apps/mobile/hooks/useConditions.ts`** (NEW): `ConditionOut`/`WeatherOut`/`ForecastDayOut` interfaces; `useConditions` hook with `AsyncStorage` 6h TTL cache, 404→null graceful handling, offline fallback.
- **`apps/mobile/components/trek/ConditionsWidget.tsx`** (NEW): Inline compact widget — WMO emoji, current temp, humidity/wind details, 3-day forecast horizontal ScrollView, trail/permit badges, "Details →" link; hidden when no data.
- **`apps/mobile/components/conditions/LiveConditionsScreen.tsx`** (NEW): Full-screen overlay — current weather card, 3-day forecast cards, trail status card (colour + description), permit card (notes), condition summary card, pull-to-refresh `RefreshControl`, offline banner, last-updated.
- **`apps/mobile/app/(tabs)/(home)/trek/[slug].tsx`**: `conditionsDetailVisible` state; `<ConditionsWidget>` in guide tab (between TrekAskAI and Buddy section); `<LiveConditionsScreen>` as `StyleSheet.absoluteFill` overlay.

**Verification:** `npx tsc --noEmit` ✅ zero errors. Shared backend: STEP-80.

### Step 79 — Trek Buddy Matching (shared backend + web surfaces) [DONE — 2026-06-25]

Backend (shared with STEP-M18 mobile):
- **`alembic/versions/20260625_0050_buddy_matching.py`** (NEW): `bio`+`avatar_url` on `user_profiles`; `buddy_signals`, `buddy_requests`, `buddy_chat_messages` tables; 6 indexes; 2 unique constraints.
- **`modules/buddies/models.py`** (NEW): `BuddySignal`, `BuddyRequest`, `BuddyChatMessage` ORM models.
- **`modules/buddies/schemas.py`** (NEW): `SignalIn/Out`, `BuddyCountOut`, `BuddyRequestIn/Out`, `BuddyResponseIn`, `ChatMessageIn/Out`, `TrekkerProfileOut`, `MonthCount`.
- **`modules/buddies/service.py`** (NEW): `_display_name` (privacy masking), `get_buddy_count`, `get_trekker_profile`, `list_signals_for_trek`, `create_or_replace_signal` (upsert), `deactivate_signal`, `expire_signals`, `send_request`, `respond_to_request`, `get_chat_messages` (auto-mark-read), `send_chat_message`, `mark_messages_read`.
- **`api/routes/buddies.py`** (NEW): `public_router` (buddy count + trekker profile), `auth_router` (10 routes: signals CRUD + requests received/sent/respond + chat read/list/post; static paths before dynamic).
- **`api/router.py`**: `buddies_public_router` + `buddies_auth_router` registered.
- **`worker/tasks/buddies.py`** (NEW): `buddies.expire_signals` Celery task.
- **`worker/celery_app.py`**: `app.worker.tasks.buddies` + daily beat schedule entry.
- **`tests/test_buddies_m18.py`** (NEW): 12 tests TC-B-M18-01–12; 739/741 pass (2 pre-existing).

Web frontend:
- **`apps/web-next/lib/buddies.ts`** (NEW): TypeScript interfaces + all buddy API functions.
- **`components/trek/BuddySignalCard.tsx`** (NEW): Privacy-safe card + inline connect composer.
- **`components/trek/BuddySignalForm.tsx`** (NEW): Controlled form (month/group-size/experience/notes).
- **`components/trek/BuddySection.tsx`** (NEW): `useAuth`-gated section, count display, month breakdown.
- **`components/trek/BuddyChatPanel.tsx`** (NEW): 10s polling chat panel for accepted pairs.
- **`app/(public)/account/buddy-requests/page.tsx`** (NEW): Received/sent tabs, accept/decline, inline chat.
- **`app/(public)/trekker/[signalId]/page.tsx`** (NEW): Public trekker profile (no email/user_id).
- **`app/(public)/trek/[slug]/page.tsx`**: `<BuddySection>` wired after TrekReportsSection.
- **`app/(public)/account/layout.tsx`**: "Buddy Requests" nav item + Users icon added.

**Verification:** 739/741 BE tests pass (2 pre-existing) | `next build` ✅ zero errors (199 pages) | `npx tsc --noEmit` ✅ zero errors.

### Step M18 — Trek Buddy Matching (mobile surfaces) [DONE — 2026-06-25]

- **`apps/mobile/hooks/useBuddies.ts`** (NEW): `buddyApi` namespace, `useTrekBuddies` + `useBuddyRequests` hooks, full TypeScript interfaces.
- **`apps/mobile/components/buddy/BuddySignalSheet.tsx`** (NEW): pageSheet modal — month picker, group-size chips, experience toggle, notes.
- **`apps/mobile/components/buddy/BuddyListCard.tsx`** (NEW): Privacy-safe signal card with inline connect flow.
- **`apps/mobile/components/buddy/BuddyRequestSheet.tsx`** (NEW): Pending count badge, accept/decline, Open Chat CTA.
- **`apps/mobile/components/buddy/BuddyChatScreen.tsx`** (NEW): pageSheet Modal, FlatList bubbles, 10s poll, KeyboardAvoidingView.
- **`apps/mobile/components/buddy/TrekkerProfileModal.tsx`** (NEW): formSheet modal — avatar/name/bio/stats/planning context/privacy notice/connect CTA.
- **`apps/mobile/app/(tabs)/(home)/trek/[slug].tsx`**: buddy count block + signal sheet + profile modal + chat screen wired in guide tab.
- **`apps/mobile/app/(tabs)/account/index.tsx`**: "Trek Buddy Requests" nav row → BuddyRequestSheet + BuddyChatScreen.

**Verification:** `npx tsc --noEmit` ✅ zero errors. Shared backend: STEP-79.

### Step M17 — Trip Reports + Photo Gallery (mobile surfaces) [DONE — 2026-06-24]

- **`apps/mobile/components/trek/TrekTabBar.tsx`**: `TrekTab` type extended with `"reports"`; TABS array gains `{ key: "reports", label: "Trail" }`.
- **`apps/mobile/lib/mobileApi.ts`**: `apiUploadFile<T>` export added (multipart FormData, no Content-Type override).
- **`apps/mobile/hooks/useReports.ts`** (NEW): `useReports` hook — `fetchReports` paginated, `submitReport`, `uploadPhoto` (multipart via `apiUploadFile`), `deleteReport`, `reload`.
- **`apps/mobile/components/reports/ConditionSummaryBanner.tsx`** (NEW): Condition bars, report count, last-report date.
- **`apps/mobile/components/reports/TripReportCard.tsx`** (NEW): Condition badge, date, title, body, photo thumbnails → `PhotoGallery`.
- **`apps/mobile/components/reports/PhotoGallery.tsx`** (NEW): Modal + FlatList pagingEnabled + expo-image full-screen viewer.
- **`apps/mobile/components/reports/PhotoPicker.tsx`** (NEW): expo-image-picker + expo-image-manipulator resize→1920px, 3-photo limit.
- **`apps/mobile/components/reports/AddReportSheet.tsx`** (NEW): Slide-up Modal form — trek date, condition radio, title, body with char counter, PhotoPicker, submit.
- **`apps/mobile/app/(tabs)/(home)/trek/[slug].tsx`**: New imports; `addReportVisible` state; `useReports(slug)` hook; "Trail" tab renders ConditionSummaryBanner + TripReportCard list + load-more + AddReportSheet; auth-gated CTA.
- **`apps/mobile/package.json`**: `expo-image-picker@~56.0.18` + `expo-image-manipulator@~56.0.19` installed.

**Verification:** `npx tsc --noEmit` ✅ zero errors.

---

### Post-Step-76 TrekSage Hotfixes [DONE — 2026-06-17/18, commits 3a33716 / 88ddd49 / 387de83]

Three follow-up fixes applied after Step 76 to address production issues found during user testing:

- **Hotfix 1 (3a33716):** Hooks violation in `SiteLayout.tsx` (early return between hooks → React #418/#423/#300); page scroll on send (replaced `scrollIntoView` with container-ref scroll); token cost cut (`MAX_HISTORY_MESSAGES` 20→6).
- **Hotfix 2 (88ddd49):** Session key always saved to `localStorage` even on error reply.
- **Hotfix 3 (387de83):** Full `TreksageChat.tsx` rewrite — stuck chat fixed (`tool_choice={"type":"any"}` round 0), sessions sidebar (Today/Yesterday/Earlier, localStorage), voice input (Web Speech API + animated popup), emoji fix (🏕→⛺, 🗓→📅), trek cards 2-col grid, message slide-up animation; `page.tsx` full-screen layout; `treksage_agent.py` post-process transition phrase fallback.

---

### Step 75 — TrekSage Advanced Bot Fix + Complete UI Redesign [DONE — 2026-06-17]

Addresses 4 user-reported issues from Step 74 testing, plus a full /treksage page redesign based on the TrekSage PRD documentation.

Backend:
- **`treksage_agent.py`**: loop fix (transition phrases detected by `:` + length < 60, nudge injected, continue); system prompt hardened (no tech exposure, safety guardrails, structured format); `max_altitude_ft` in `_slim_profile`; final-round `max_tokens` 800→1200.

Web frontend:
- **`TrekAskAI.tsx`**: `ReactMarkdown` + `mdComponents` wraps `ex.answer` (markdown was rendering raw).
- **`TreksageChat.tsx`**: complete redesign — light PRD palette (#FAF5EE, #1D3A2E, #E8702A); tabs (Discover/Compare/Plan) + prompt suggestions; trek cards with hero image, match% pill, stats grid, CTAs; rotating loading messages; `remark-gfm` for table support.
- **`treksage/page.tsx`**: light #FAF5EE wrapper, metadata updated.
- **`lib/api.ts`**: `trek_cards` type extended with `season` + `max_altitude_ft`.
- **`remark-gfm@4.0.1`** installed.

Mobile:
- **`search.tsx`**: `Constants.appOwnership === "expo"` Expo Go detection in `handleMicPress`; `Alert.alert` on voice unavailable / permission denied instead of silent failure.

**Verification:** 683/685 backend pass (2 pre-existing) | `next build` ✅ 196/196 pages | `npx tsc --noEmit` (mobile) ✅ zero errors.

---

### Step 74 — Post-73 Bug Fixes + Mobile/TrekSage UI Revamp [DONE — 2026-06-16]

Addresses 10 bugs and enhancement requests identified during user testing of Step 73. No new backend migrations or Celery tasks.

Backend fixes:
- **`treksage_agent.py`**: system prompt "Myra" → "TrekSage"; `tool_choice={"type":"none"}` on final round (fixes bot stopping mid-reply); `hero_image_url` added to `_slim_profile`; `trek_cards` extracted from last search/recommend result and returned with `chat()`.
- **`routes/treksage.py`**: `TreksageChatResponse` extended with `trek_cards: list[dict] = []`.

Web frontend fixes:
- **`TreksageChat.tsx`**: "Myra" removed from header; `react-markdown` added for bot message rendering; `TrekCardsList` component renders trek cards (image + meta) below each assistant reply.
- **`treksage/page.tsx`**: all "Myra" text replaced with "TrekSage".
- **`lib/api.ts`**: `TreksageChatResponse.trek_cards` field typed.
- **`page.tsx` (home)**: TrekSage AI promotional banner section added between TRENDING and CATEGORY HUB.

Mobile fixes:
- **`app.config.ts`**: `ios.infoPlist.NSSpeechRecognitionUsageDescription` + `NSMicrophoneUsageDescription` explicitly set (voice crash fix — dev client rebuild required).
- **`mobileApi.ts`**: `hero_image_url` on `TrekRecommendation`; `contentApi.searchTreks()` via semantic search endpoint.
- **`plan-my-trek.tsx`**: emoji intent chips; hint labels; hero image header on result cards; coloured match badge; improved result card layout.
- **`compare.tsx`**: 2-column tile grid with trek images + checkmark overlay; selected-trek pill strip with thumbnails; debounced search input; trek image header row in comparison table; styled TrekSage AI summary card.

**Verification:** 683/685 backend pass (2 pre-existing `test_refresh.py` failures, unrelated) | 0 new backend tests (no backend logic changes) | `next build` ✅ Compiled successfully | `npx tsc --noEmit` (mobile) ✅ zero errors.

**User infra follow-ups:** (1) Rebuild iOS dev client for voice fix; (2) Add `datacenter.trekyatra.co.in` CNAME in DO + GoDaddy (TC-F18/F19/F20).
