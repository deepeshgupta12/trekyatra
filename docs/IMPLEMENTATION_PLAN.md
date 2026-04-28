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

### Step 26 — Cannibalization detection + consolidation agent
- Keyword overlap detection across pages
- Merge / redirect / canonical recommendation engine
- Admin cannibalization report

### Step 27 — Newsletter automation + repurposing agent
- NewsletterAgent: weekly digest from published content
- Social snippet generation (captions, Pinterest pin copy)
- Email marketing integration (Mailchimp / ConvertKit / equivalent)
- Newsletter subscriber management

### Step 28 — Compliance guard agent
- Trust & Compliance Guard Agent
- Disclosure presence enforcement
- Risky-wording detection
- Safety disclaimer enforcement on sensitive pages
- Human-review escalation rules

### Step 29 — Operator listing + lead marketplace basics
- Operator model (name, region, trek types, contact)
- Lead routing by category/region/operator
- Operator admin management
- Lead lifecycle tracking (new → contacted → converted)

### Step 30 — Dynamic destination hubs
- Programmatic destination hub pages
- Auto-generated regional cluster landing pages
- Seasonal landing pages (automated seasonal content refresh)

### Step 31 — Email automation and audience workflows
- Automated welcome email on signup
- Season-based nurture sequences
- Trek interest tagging on subscribers
- Digest opt-in/opt-out management

### Step 32 — Deeper dashboards and revenue attribution
- Cluster-level revenue attribution
- Page-type RPM and EPC dashboards
- Affiliate performance by product category
- Content decay dashboard
- Weekly automated executive summary

---

## V3 — Platform Expansion (Steps 33–37)

### Step 33 — Premium user accounts + bookmarks
- Saved treks and saved pages feature
- Download history for digital products
- Custom trek alert subscriptions
- Onboarding form data persisted to backend

### Step 34 — Digital product checkout and file delivery
- Digital product catalog (planners, checklists, guides)
- Payment integration (Stripe / Razorpay)
- File delivery flow post-purchase
- Download dashboard on user account

### Step 35 — Advanced recommendation engine
- pgvector content embeddings
- Personalized "next best read" suggestions
- Trek similarity search
- Cluster-aware recommendation module

### Step 36 — User-intent aware monetization
- Intent classification per page visit
- Dynamic monetization module selection
- Personalized affiliate recommendations

### Step 37 — Multilingual content workflows
- Language model selection per content piece
- Alternate language draft generation pipeline
- hreflang setup in SEO layer
- Language fields on cms_pages (no WordPress dependency)

---

## V4 — Ecosystem Scale (Steps 38–41)

### Step 38 — Operator marketplace layer
- Operator listing and comparison pages
- Booking inquiry flow direct to operators
- Operator ratings and reviews (basic)
- Revenue share / lead fee structure

### Step 39 — Trip planning assistant
- Conversational trek planning interface
- Itinerary builder from content graph
- Custom route suggestion engine
- AI-backed "which trek for me" wizard

### Step 40 — Premium subscription layer
- Premium content gating
- Subscription tiers and billing
- Premium user dashboard
- Exclusive content types (detailed route compendiums, expert guides)

### Step 41 — B2B content / API extensions
- API access layer for partner integrations
- White-label content feeds
- Travel industry data products

---

## Execution Rule
Do not start the next step without user confirmation.
Current next step: **Step 14 — Content Brief Agent + brief approval workflow**
