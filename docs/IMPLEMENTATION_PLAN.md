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

### Step 12 — LangGraph agent framework + agent tracking
- Install LangGraph, Anthropic SDK, langchain-anthropic
- `agent_runs` table and Alembic migration
- Base agent state interface and orchestrator
- Agent run service (start/update/complete/fail)
- Admin API: GET /admin/agent-runs

### Step 13 — Trend Discovery Agent + Keyword Cluster Agent
- TrendDiscoveryAgent (topic/trend intake, scoring, urgency flag)
- KeywordClusterAgent (group terms into clusters, pillar/support mapping)
- Admin APIs: trigger discover-trends and cluster-keywords
- Admin frontend: trigger + view results

### Step 14 — Content Brief Agent + brief approval workflow
- ContentBriefAgent (SEO+AEO structured brief from cluster/topic)
- Brief template engine (heading structure, FAQ stubs, keywords, schema hints)
- Brief approval API: PATCH /admin/briefs/{id}/status (review/approved/rejected)
- Brief versioning
- Admin UI: brief review queue wired to real API

### Step 15 — Content Writing Agent + SEO/AEO Optimization Agent
- ContentWritingAgent: brief → full structured article draft (Claude API)
- SEOAEOAgent: snippet optimization, FAQ blocks, answer boxes, entity coverage
- Fact-check flag system: uncertain claim markers
- Draft review flow with content preview in admin UI

### Step 16 — WordPress CMS full integration
- Custom post types registered and mapped (trek guide, packing list, comparison, etc.)
- Custom fields / ACF-style meta mapped from backend schemas
- Category/tag taxonomy management from backend
- WordPressClient extended: full meta + taxonomy push
- Pull sync: GET /api/v1/wordpress/posts
- Frontend: consume WP REST API for article/content pages

### Step 17 — Full publish orchestration pipeline
- Celery chain: Trend → Cluster → Brief → Write → SEO → Publish
- Approval gate checkpoints (brief approval, draft approval)
- Manual trigger: POST /admin/pipeline/run
- Pipeline status tracking
- Admin UI: pipeline monitor page

### Step 18 — Public frontend content page templates
- Trek guide page template (real WordPress data)
- Packing list page template
- Best-time / seasonal page template
- Comparison page template
- Permit guide page template
- Beginner roundup page template
- Region / category listing template

### Step 19 — SEO and schema infrastructure (frontend)
- Next.js metadata API for all page types (title, description, OG)
- JSON-LD schema injection (Article, FAQPage, BreadcrumbList, Organization)
- Canonical tags per page
- XML sitemap route (/sitemap.xml)
- robots.txt
- Structured data smoke testing for top page types

### Step 20 — Monetization frontend components
- InArticleAdSlot, SidebarAdSlot components
- AffiliateCard, AffiliateRail components
- LeadForm component with backend submission
- NewsletterCapture component
- DisclosureBlock, TrustSignals components
- StickyMobileCTA component

### Step 21 — RBAC enforcement
- RequireRole FastAPI dependency
- Admin endpoint protection (all /admin/* routes)
- Role seeding script (Super Admin, Editor, Reviewer)
- Assign roles API: POST /admin/users/{id}/roles
- Next.js middleware: admin access check via session role
- Role-protected route tests

### Step 22 — Internal linking engine (basic)
- `pages` table (id, slug, title, cluster_id, page_type)
- `page_links` table (from_page_id, to_page_id, anchor_text)
- Related page suggestion service
- Orphan page detection service
- API: GET /api/v1/links/suggestions/{page_id}
- API: GET /api/v1/links/orphans

### Step 23 — Content refresh engine (basic)
- Freshness interval field on pages/drafts
- Stale content detection service
- Refresh queue (Celery Beat daily task)
- Refresh trigger API: POST /admin/refresh/trigger
- Refresh logs table
- Admin UI: refresh queue page

### Step 24 — Analytics ingestion + admin panel full wiring
- GA4 / analytics event setup (page_view, lead_submit, affiliate_click)
- `affiliate_clicks` table and click-tracking endpoint
- `lead_submissions` table and submission API
- Revenue summary API improvements
- Admin analytics dashboard wired to real data
- All remaining admin pages wired (topics, clusters, briefs, agent status)
- V1 full end-to-end smoke test and validation

---

## V2 — Smarter Automation and Business Depth (Steps 25–32)

### Step 25 — Advanced fact validation system
- Claim → evidence mapping engine
- Confidence scoring per claim
- Mandatory human-review flags for safety/YMYL content
- Fact-check inspector in admin UI

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
- Language-specific WordPress post types

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
Current next step: **Step 12 — LangGraph agent framework + agent tracking**
