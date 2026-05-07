# TrekYatra

**AI-powered trekking content platform.** Discovers high-opportunity topics, generates SEO/AEO-optimised trek guides, publishes through a custom headless CMS, and monetises via affiliate, leads, and digital products — fully automated with human oversight gates.

---

## What Is This?

TrekYatra is a **headless, SEO-first, AEO-ready content operating system** for the Indian trekking niche. It is not a basic blog — it is an autonomous publishing engine backed by a multi-agent AI pipeline, a custom CMS, and a modern Next.js frontend.

The platform:
- **Discovers** high-ROI trek topics using trend and keyword cluster agents
- **Generates** structured, factually-grounded long-form guides via Claude (Anthropic)
- **Validates** content with a compliance guard, claim extractor, and YMYL safety reviewer
- **Publishes** via a 6-stage orchestrated pipeline with human checkpoint approval gates
- **Serves** content through a custom Next.js 14 frontend with JSON-LD, canonical tags, and XML sitemap
- **Monetises** through AdSense, affiliate cards, lead forms, digital product checkout (Razorpay), and intent-aware module selection
- **Refreshes** stale content automatically via a Celery beat scheduler
- **Personalises** with pgvector-powered semantic recommendations and user bookmarks

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.x, Pydantic v2 |
| Database | PostgreSQL 16 + pgvector (1536-dim embeddings) |
| Cache | Redis (session cache + CMS cache + Celery broker) |
| Task Queue | Celery + Celery Beat |
| AI Agents | LangGraph + Anthropic Claude (Haiku / Sonnet / Opus) |
| Embeddings | OpenAI text-embedding-3-small (1536-dim) |
| Payments | Razorpay (test mode without keys) |
| Email | SMTP (welcome + nurture sequences), Mailchimp/Brevo (optional) |
| Auth | JWT HttpOnly cookies + Google OAuth |
| Migrations | Alembic (26 migrations) |
| Code Intelligence | GitNexus (7,966+ symbols, 13,674+ relationships) |

---

## Monorepo Structure

```
trekyatra/
├── apps/
│   └── web-next/            # Next.js 14 App Router frontend
│       ├── app/
│       │   ├── (public)/    # Public-facing pages (trek guides, search, account, products)
│       │   ├── (admin)/     # CMS admin panel (/admin/*)
│       │   └── (auth)/      # Auth flows (/auth/*)
│       ├── components/       # Shared React components
│       │   ├── content/     # RecommendedContent, FAQAccordion, TableOfContents, etc.
│       │   ├── monetization/# MonetizationSlot, AffiliateCard, LeadForm, etc.
│       │   ├── account/     # BookmarkButton
│       │   └── trek/        # TrekCard, TrekGrid, etc.
│       ├── lib/             # API client (api.ts), auth context, utilities
│       └── data/            # Static trek data (fallback when CMS has no page)
├── services/
│   └── api/                 # FastAPI backend
│       ├── app/
│       │   ├── modules/     # Domain modules (cms, auth, agents, monetization, ...)
│       │   ├── api/         # Route registrations (router.py + routes/*)
│       │   ├── schemas/     # Pydantic request/response contracts
│       │   ├── worker/      # Celery app + beat schedule + tasks
│       │   └── core/        # Config, DB session, middleware
│       ├── alembic/         # Database migrations (versions/)
│       └── tests/           # pytest test suite (413 tests, all passing)
├── docs/                    # Implementation plan, tracker, step docs, process guardrails
└── scripts/                 # Setup and validation helpers
```

---

## AI Agent Pipeline

| Agent | Purpose | Model |
|-------|---------|-------|
| TrendDiscoveryAgent | Identifies high-opportunity trek topics from signals | Claude Haiku |
| KeywordClusterAgent | Groups terms into pillar/support clusters | Claude Haiku |
| ContentBriefAgent | Generates SEO+AEO structured brief per cluster | Claude Sonnet |
| ContentWritingAgent | Produces full long-form article draft | Claude Sonnet |
| SEOAEOAgent | Snippet optimisation, FAQ blocks, entity coverage | Claude Haiku |
| ClaimExtractionAgent | Extracts claims, confidence scores, YMYL tagging | Claude Sonnet |
| ComplianceGuardAgent | Checks disclosures, risky wording, safety disclaimers | Claude Haiku |
| CannibalizationAgent | Detects keyword overlap; merges duplicate pages | Claude Sonnet |
| NewsletterAgent | Weekly digest + social snippet generation | Claude Haiku |
| IntentClassifierAgent | Classifies visitor intent for monetisation routing | Claude Haiku |
| ExecutiveSummaryAgent | Weekly revenue + performance digest for admin | Claude Sonnet |
| SeasonalContentAgent | Regenerates seasonal hub landing pages quarterly | Claude Sonnet |

**Pipeline stages (orchestrated by PipelineOrchestrator):**
`trend_discovery → keyword_cluster → content_brief → content_writing → seo_aeo → publish`

**Checkpoint gates:**
- `paused_at_brief_approval` — human must approve brief before writing begins
- `paused_at_draft_approval` — human must approve draft if flagged claims detected

---

## Feature Matrix

### Content Pipeline
| Feature | Status |
|---------|--------|
| Trend discovery + topic intake | Done |
| Keyword clustering + pillar mapping | Done |
| AI brief generation (SEO+AEO structured) | Done |
| Brief versioning + approval workflow | Done |
| AI article writing (full long-form) | Done |
| SEO/AEO optimisation pass | Done |
| Fact validation + YMYL claim tagging | Done |
| Compliance guard (disclosures, safety) | Done |
| Cannibalization detection + consolidation | Done |
| 6-stage orchestrated pipeline with gates | Done |
| Content refresh engine (staleness detection) | Done |
| Seasonal content hub regeneration | Done |

### CMS & Publishing
| Feature | Status |
|---------|--------|
| Custom headless CMS (cms_pages table) | Done |
| Draft status machine (draft→review→approved→published) | Done |
| CMS Redis cache with invalidation | Done |
| Internal linking engine + orphan detection | Done |
| Sitemap.xml + robots.txt | Done |
| JSON-LD schema injection (Article, FAQ, Breadcrumb) | Done |
| Canonical tags + OG metadata | Done |

### Frontend
| Feature | Status |
|---------|--------|
| Next.js 14 App Router (139 static pages) | Done |
| Trek guide pages (CMS-powered + static fallback) | Done |
| Packing, permits, guides page templates | Done |
| Seasonal hub landing pages | Done |
| Cluster hub landing pages | Done |
| Explore / search pages | Done |
| Semantic search (>3-word queries, pgvector) | Done |
| Personalised recommendations (logged-in + anonymous) | Done |
| FAQ accordion + table of contents (scroll spy) | Done |

### User Accounts
| Feature | Status |
|---------|--------|
| Email signup / login | Done |
| Google OAuth | Done |
| JWT HttpOnly session | Done |
| Trek bookmarks (by slug or CMS page) | Done |
| Trek alerts (subscription) | Done |
| User onboarding / profile | Done |
| Download dashboard | Done |

### Monetisation
| Feature | Status |
|---------|--------|
| AdSense slot components | Done |
| Affiliate card + comparison components | Done |
| Lead capture form (POST /leads) | Done |
| Newsletter capture | Done |
| Digital product catalog | Done |
| Razorpay checkout (test + live mode) | Done |
| HMAC download token delivery | Done |
| Intent-aware monetisation module selection | Done |
| A/B test (intent-based vs static) | Done |
| Personalised affiliate recommendations | Done |

### Operator Marketplace
| Feature | Status |
|---------|--------|
| Public operator listing (`/operators`) | Done |
| Public operator detail + reviews (`/operators/[slug]`) | Done |
| Booking inquiry form (POST /inquiries) | Done |
| Operator ratings and reviews (1-review-per-user, denormalised avg) | Done |
| Operator agreements / lead-fee tracking | Done |
| SMTP inquiry confirmation + operator notification (graceful) | Done |

### Premium Subscription
| Feature | Status |
|---------|--------|
| Stripe recurring billing (monthly + annual, test-mode without keys) | Done |
| `subscriptions` table + Subscription ORM | Done |
| `is_premium` column on `cms_pages` | Done |
| Server-side content gating (content_html="" + is_gated=True for free users) | Done |
| Stripe webhook handler (sync/cancel/payment_failed events) | Done |
| `subscription_plan` on users (fast read) | Done |
| GatedContent component (blur overlay + Upgrade CTA) | Done |
| PricingTable (monthly/annual toggle, Free vs Premium tiers) | Done |
| `/premium` marketing page | Done |
| `/account/premium` dashboard (status + cancel/upgrade) | Done |
| Admin CMS is_premium toggle per page | Done |

### Trip Planning Assistant
| Feature | Status |
|---------|--------|
| TripPlannerAgent (LangGraph 4-node, CMS-powered trek selection) | Done |
| 4-step "which trek for me" wizard (`/plan`) | Done |
| Day-by-day AI itinerary builder (claude-haiku, fallback without key) | Done |
| Gear essentials parsed from CMS packing section | Done |
| Lead capture on plan generation | Done |
| Email plan (SMTP, graceful) | Done |
| Print-to-PDF via window.print() | Done |
| Operator inquiry CTA on plan result | Done |

### Multilingual Content
| Feature | Status |
|---------|--------|
| language / translations / source_page_id on cms_pages | Done |
| TranslationAgent (Claude Haiku, proper nouns glossary, rule-based fallback) | Done |
| POST /admin/cms/{slug}/translate | Done |
| GET /cms/pages/{slug}?lang=hi (fallback to English) | Done |
| Hindi public routes (/hi/trek, /hi/guides, /hi/packing) | Done |
| hreflang alternates on trek + guides pages | Done |
| Admin CMS language badge + translate button | Done |

### Admin CMS
| Feature | Status |
|---------|--------|
| Admin auth (separate from public auth) | Done |
| Topics / Clusters / Briefs / Drafts pages | Done |
| Pipeline orchestration monitor | Done |
| Agent run status viewer | Done |
| CMS pages manager + cache control | Done |
| Fact-check inspector | Done |
| Cannibalization report | Done |
| Internal linking + orphan detector | Done |
| Lead management (status workflow) | Done |
| Newsletter + email sequences admin | Done |
| Operator management (CRUD + agreement + review moderation via API) | Done |
| Digital products + orders | Done |
| Revenue attribution dashboard | Done |
| Monetisation stats + affiliate catalog | Done |
| Refresh queue | Done |
| Seasonal hub manager | Done |

---

## Local Development Setup

### Prerequisites
- Python 3.12
- Node.js 20+
- Docker + Docker Compose

### 1. Clone and install

```bash
git clone <repo-url>
cd trekyatra
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e services/api
cd apps/web-next && npm install && cd ../..
```

### 2. Start infrastructure

```bash
docker compose up -d    # Postgres (pgvector/pgvector:pg16) + Redis
```

### 3. Run migrations

```bash
make db-upgrade
# Or: cd services/api && ../../.venv/bin/alembic upgrade head
```

### 4. Configure environment

```bash
cp services/api/.env.example services/api/.env
# Edit services/api/.env — at minimum: DATABASE_URL, REDIS_URL, SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD

cp apps/web-next/.env.local.example apps/web-next/.env.local
# Edit apps/web-next/.env.local — at minimum: NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Start services

```bash
# Terminal 1 — Backend API (port 8000)
make api

# Terminal 2 — Frontend dev server (port 3000)
cd apps/web-next && npm run dev

# Terminal 3 — Celery worker (required for agent pipeline)
make worker

# Terminal 4 — Celery beat scheduler (required for scheduled tasks)
make beat
```

### 6. Admin access

Navigate to http://localhost:3000/admin/sign-in and log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` set in `services/api/.env`. This is entirely separate from the public user auth.

### 7. Run tests

```bash
# All backend tests (413 tests)
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v

# Frontend build check (must pass before every commit)
cd apps/web-next && npm run build
```

---

## Environment Variables

### Backend (`services/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `SECRET_KEY` | Yes | JWT signing secret (min 32 chars) |
| `ADMIN_EMAIL` | Yes | CMS admin login email |
| `ADMIN_PASSWORD` | Yes | CMS admin login password |
| `ANTHROPIC_API_KEY` | Optional | Claude API key — rule-based fallback without it |
| `OPENAI_API_KEY` | Optional | OpenAI embeddings — similarity fallback without it |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `RAZORPAY_KEY_ID` | Optional | Razorpay key — test mode without it |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay secret |
| `SMTP_HOST` | Optional | SMTP server — email skipped gracefully without it |
| `NEWSLETTER_PLATFORM` | Optional | `mailchimp` or `brevo` — skipped if unset |
| `MONETIZATION_AB_TEST` | Optional | `true` to enable 50/50 intent A/B test |
| `PRODUCT_FILES_DIR` | Optional | Directory for downloadable product files |

### Frontend (`apps/web-next/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_ADSENSE_ID` | Optional | Google AdSense publisher ID |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional | Razorpay public key for checkout |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics 4 measurement ID |

---

## Key API Surfaces

| Domain | Base Path | Auth |
|--------|-----------|------|
| Auth | `/api/v1/auth/*` | Public |
| CMS pages | `/api/v1/cms/*` | Public (read), Admin (write) |
| Recommendations | `/api/v1/recommendations/*`, `/api/v1/pages/{slug}/similar` | Public + optional user auth |
| Semantic search | `/api/v1/search?q=` | Public |
| Intent & monetisation | `/api/v1/intent/*`, `/api/v1/affiliate-products` | Public + optional user auth |
| User account | `/api/v1/account/*` | User auth required |
| Products & checkout | `/api/v1/products/*`, `/api/v1/checkout/*` | Public (read), User (purchase) |
| Operators (public) | `/api/v1/operators/*`, `/api/v1/inquiries` | Public + optional user auth (reviews require user auth) |
| Trip planning | `/api/v1/plan/generate`, `/api/v1/plan/{id}`, `/api/v1/plan/{id}/email` | Public + optional user auth |
| Subscriptions | `/api/v1/subscriptions/create-checkout`, `/status`, `/cancel`, `/webhook` | User auth (webhook: no auth) |
| Translation | `/api/v1/admin/cms/{slug}/translate` | Admin auth required |
| Admin pipeline | `/api/v1/admin/pipeline/*` | Admin auth required |
| Admin agents | `/api/v1/admin/agent-runs` | Admin auth required |
| Admin content | `/api/v1/admin/topics`, `/briefs`, `/drafts`, `/clusters` | Admin auth required |
| Revenue | `/api/v1/admin/revenue/*` | Admin auth required |
| Hubs | `/api/v1/admin/hubs/*` | Admin auth required |
| Linking | `/api/v1/admin/links/*` | Admin auth required |

Full API docs available at http://localhost:8000/docs when the backend is running.

---

## Database Overview

**26 Alembic migrations applied.** Key table groups:

| Domain | Tables |
|--------|--------|
| Auth | `users`, `sessions`, `roles`, `permissions`, `role_permissions` |
| Content pipeline | `topics`, `keyword_clusters`, `content_briefs`, `brief_versions`, `content_drafts`, `draft_claims` |
| Pipeline tracking | `agent_runs`, `pipeline_runs`, `pipeline_stages` |
| CMS | `cms_pages` (with `embedding vector(1536)`), `pages`, `page_links` |
| User accounts | `user_bookmarks`, `user_downloads`, `trek_alerts`, `user_profiles` |
| Products | `digital_products`, `user_orders` |
| Monetisation | `affiliate_products`, `page_intent_sessions`, `lead_submissions`, `affiliate_clicks` |
| Revenue | `revenue_attributions`, `revenue_config`, `executive_summaries` |
| Email | `newsletter_subscribers`, `subscriber_tags`, `email_sequences`, `email_sequence_steps`, `subscriber_sequence_enrollments` |
| Operators | `operators` (+ logo_url, description_long, rating_avg, review_count), `operator_specializations`, `operator_reviews`, `operator_agreements`, `operator_leads` |
| Trip planning | `trip_plans` |
| Subscriptions | `subscriptions` |
| Content QA | `cannibalization_issues`, `compliance_issues`, `refresh_logs` |

---

## Roadmap Status

| Version | Steps | Status |
|---------|-------|--------|
| V0 — Foundations | Steps 00–10 | Complete |
| V1 — Launchable Product | Steps 11–24 | Complete |
| V2 — Smarter Automation | Steps 25–32 | Complete |
| V3 — Platform Expansion | Steps 33–37 | Complete |
| V4 — Ecosystem Scale | Steps 38–41 | In Progress (Steps 38–40 done) |

---

## Code Intelligence

This project is indexed by **GitNexus** as `trekyatra`.

```bash
npx gitnexus analyze --force    # Re-index after file changes
```

The GitNexus MCP integration in Claude Code provides impact analysis, call-graph tracing, and execution flow exploration. All code changes in this project require impact analysis before editing any symbol. See `CLAUDE.md` for the full protocol.

---

## Process & Governance

| Document | Purpose |
|----------|---------|
| `docs/IMPLEMENTATION_PLAN.md` | Step-by-step roadmap with completion status |
| `docs/MASTER_TRACKER.md` | Detailed progress log per step |
| `docs/DEPENDENCY_MAP.md` | File-level dependency graph and blast radius notes |
| `docs/PROCESS_GUARDRAILS.md` | Non-negotiable process rules |
| `docs/steps/STEP-XX-*.md` | Per-step scope contract, files created/modified, notes |
| `docs/TRAVEL_BLOG.md` | Master product scope document |
| `CLAUDE.md` | Full execution protocol for Claude Code sessions |
