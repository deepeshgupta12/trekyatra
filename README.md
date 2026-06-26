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
| Migrations | Alembic (40 migrations) |
| Code Intelligence | GitNexus (11,923+ symbols, 16,427+ relationships, 122 flows) |

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
│       ├── components/analytics/ # AnalyticsProvider, ConsentBanner, ScrollDepthTracker
│       └── data/            # Static trek data (fallback when CMS has no page)
├── services/
│   └── api/                 # FastAPI backend
│       ├── app/
│       │   ├── modules/     # Domain modules (cms, auth, agents, monetization, cdp, ...)
│       │   ├── api/         # Route registrations (router.py + routes/*)
│       │   ├── schemas/     # Pydantic request/response contracts
│       │   ├── worker/      # Celery app + beat schedule + tasks
│       │   └── core/        # Config, DB session, middleware
│       ├── alembic/         # Database migrations (versions/)
│       └── tests/           # pytest test suite (581 tests, all passing)
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
| Weekly news agent (Google News RSS → CMS news_article pages) | Done |
| /news hub + /news/[slug] article pages with NewsArticle JSON-LD | Done |
| Google News sitemap (/news-sitemap.xml) with `<news:news>` elements | Done |
| SiteNavigation schema on trek detail pages (all interlinks + news) | Done |

### Frontend
| Feature | Status |
|---------|--------|
| Next.js 14 App Router (178 static pages) | Done |
| Trek guide pages (CMS-powered + static fallback) | Done |
| Packing, permits, guides page templates | Done |
| Seasonal hub landing pages | Done |
| Cluster hub landing pages | Done |
| Explore / search pages | Done |
| Semantic search (>3-word queries, pgvector) + intent filters (season/difficulty/region/duration) | Done |
| Exact vs fuzzy result segregation (Fuse score < 0.05 = exact match, ranked above fuzzy) | Done |
| Trending queries (real search_events data + curated fallback) | Done |
| Personalised recommendations (logged-in + anonymous) | Done |
| FAQ accordion + table of contents (scroll spy) | Done |
| Trek news section on trek detail pages (cards with thumbnail, title, href links) | Done |
| Admin CMS: Generate News button per trek_guide row (queues weekly news Celery task) | Done |
| Core Web Vitals optimisation: next/font (self-hosted), AVIF/WebP image pipeline, hero fetchPriority, favicon 814B, dynamic imports, .browserslistrc | Done |

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
| Password reset (forgot-password + reset-password, HMAC JWT, graceful SMTP) | Done |
| Email verification (send-verification + verify-email, 24h JWT, graceful SMTP skip) | Done |
| Email verification auto-sent on signup (immediately on email+password registration) | Done |
| Email address standardised to explore@trekyatra.co.in across all pages and transactional emails | Done |
| Compare page — CMS data source (100+ treks vs 12 static), generateMetadata, 8 compare fields, AuthGateModal save, share feedback | Done |
| Account dashboard "Compare Lists" tile shows real saved comparison count | Done |
| Search page compare suggestion card (similar trek pair from top exact result) | Done |
| Trek alert email digest (daily Celery task, graceful SMTP skip) | Done |
| Account settings page (update full_name, display_name via PATCH /auth/me) | Done |
| Account enquiries page (user leads history via GET /auth/me/leads) | Done |

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
| Translation loading state (per-row spinner, disabled button, real error feedback) | Done |
| Plan My Trek auth gate — /plan and /plan/results require login (middleware matcher fix) | Done |
| Sign-in/sign-up ?next= pass-through for Plan My Trek redirect-back after auth | Done |
| Plan My Trek auth gate modal — inline sign-in/sign-up popup at wizard step 6 submit | Done |
| Non-overlapping cluster sidebar + "Similar treks" sections on trek detail page | Done |
| Hindi translation auto-publish (was draft → now published on creation) | Done |
| TranslationAgent: seo_title, seo_description, FAQs translated + stored | Done |
| Hindi pages: JSON-LD Article + FAQPage schemas, og:locale hi_IN, x-default hreflang | Done |
| Translation progress modal: elapsed timer, progress bar, success/error state with View link | Done |
| /hi-trek-sitemap.xml: dedicated Hindi trek sitemap with xhtml:link hreflang alternates | Done |
| GET /public/sitemap-pages/hindi: source_slug join for correct /hi/trek/{slug} URLs | Done |
| Main sitemap: Hindi pages (language=hi) excluded — no more sitemap contamination | Done |

### Pre-Launch Polish
| Feature | Status |
|---------|--------|
| Dynamic trek comparison (`/compare` — any two treks, live table) | Done |
| `/itineraries`, `/costs`, `/gear`, `/beginner`, `/safety` — CMS hub + static fallback | Done |
| CMSPageHub reusable component for content hub pages | Done |
| Playwright E2E setup (homepage, auth, search, plan wizard — 18 specs) | Done |
| Admin operators detail page (`/admin/operators/[id]` — agreement + review moderation) | Done |
| Hero section — brand slogan pill, reduced padding, `overflow-hidden` fix | Done |
| TrekCard difficulty tags — solid coloured backgrounds (visible on all images) | Done |
| Footer — newsletter card backdrop fix, Gurgaon location, heart icon | Done |
| Trust pages — full proper content: /about, /about/authors, /contact, /privacy, /terms, /affiliate-disclosure, /safety-disclaimer, /methodology | Done |
| DB cleared (non-user tables — clean state for content pipeline run) | Done |
| Logo — SVG badge redesigned; tagline corrected to "Explore. Dream. Discover." (matches new logo) | Done |
| Hero height reduced — `min-h-[85vh] md:min-h-[78vh]`; tighter padding; font 64px | Done |
| Footer newsletter card — visible `bg-white/[0.07]`; `pt-36` separates from mountain SVG | Done |
| Search — Fuse.js 7.3.0 fuzzy matching + autocomplete dropdown + semantic AI for long queries | Done |
| Comprehensive pre-launch audit — 80+ item checklist across BE/FE/Admin/Gaps/Prod/Integrations | Done |
| Header nav — compact Logo (no tagline in header), functional search bar (click + ⌘K), tighter nav | Done |
| Compare section — fully responsive (text-2xl→md:text-4xl heading, p-3 cards, text-sm md:text-base) | Done |

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

### CDP Analytics Layer (Steps 64–67)
| Feature | Status |
|---------|--------|
| First-party event tracking SDK (batch ingest, consent gate) | Done |
| Anonymous identity + session management with UTM attribution | Done |
| Identity stitching (anonymous → user_id on sign-up) | Done |
| DPDP Act 2023 compliance (consent banner, data export, right-to-delete) | Done |
| Dynamic funnel builder (event catalog dropdowns, date range, Unique/Total toggle, drop-off visualization) | Done |
| 6 preset funnel templates (Discovery→Plan, Search→Trek, Trek→Save, Trek→Lead, New User Activation, Content Engagement) | Done |
| Full N×M retention cohort heatmap (9-week, color-coded by retention %) | Done |
| Configurable cohort builder (user_signed_up / trek_view / plan_wizard_started / trek_search) | Done |
| 10 audience segments with human-readable filter criteria | Done |
| Dynamic segment builder UI (rule conditions: event_count / event_property / trait / inactivity) | Done |
| Segment preview (estimated user count, evaluated in ms) | Done |
| User activity timeline (email lookup → chronological event history with pagination) | Done |
| Plan My Trek stepwise event tracking (6 wizard steps instrumented) | Done |
| Google Search Console performance data import | Done |
| Event Explorer (7 filters, paginated, CSV export, expandable property rows) | Done |
| Per-page content analytics (views 7d/30d, scroll depth, leads, sortable) | Done |
| Trek-level funnel analytics (views, plan CTAs, completions, conversion rate — sorted) | Done |
| Campaign trigger webhook rules CRUD (create/list/delete outbound HTTP hooks per event) | Done |
| Suppression list management (opt-out users excluded from segment exports) | Done |
| Event taxonomy governance (event_definitions table, 35 canonical events seeded) | Done |
| Internal traffic separation (is_internal flag: localhost / NEXT_PUBLIC_IS_INTERNAL) | Done |
| 18 new typed trackEvent wrappers in analytics.ts SDK | Done |
| Executive dashboard — 8 KPI tiles with SVG sparklines, deltas, alert rail, real-time feed | Done |
| Paginated user list with profile view (sessions, events, touchpoints) | Done |
| CDP admin suite (`/admin/cdp/*` — 13 pages) | Done |
| AnalyticsProvider + ConsentBanner + ScrollDepthTracker components | Done |
| Nightly trait refresh + GSC import + weekly event cleanup Celery tasks | Done |

### Trek Intelligence + "TrekSage" MCP Server (Step 72)
| Feature | Status |
|---------|--------|
| 16 new structured trek fields on `cms_pages` (region, altitude, duration days, best/open/avoid months, permits, budget, themes, crowd level, beginner/solo/family-friendly, operator_available, is_unsafe_closed, data_confidence, last_verified_at) | Done |
| Deterministic matching refinements (real budget scoring, month-based season scoring, hard exclusion of unsafe/closed + avoid-month treks) | Done |
| Trek Detail "Ask AI" Q&A widget (web + mobile, Claude Haiku, DB-cached, "not verified yet" disclaimer for unverified fields) | Done |
| Compare page backend-wired to `/treks/compare` + cached AI trade-off summary (web + mobile, 2-4 treks) | Done |
| "TrekSage" MCP server — 8 tools (search/get/recommend/compare/content/ask/lead/translate) mounted at `/mcp`, 3 gated by `X-MCP-Key` | Done |
| `datacenter.trekyatra.co.in/trek-guide/[slug]` — full structured `TrekProfile`, human + AI readable, `noindex` | Done |
| Admin trek data-quality dashboard (`/admin/trek-data`) — coverage KPIs, inline field editor, AI backfill trigger, AI interaction log viewer | Done |
| AI interaction logging (`ai_interaction_logs` — web/mobile/chatgpt/claude sources) | Done |
| Mobile Plan tab wired to Plan My Trek wizard (was dead placeholder) | Done |
| Operator-help fallback lead capture (`POST /leads/operator-help`) | Done |

### TrekSage Bugfix Pass + Conversational AI (Step 73)
| Feature | Status |
|---------|--------|
| Bulk trek data backfill — `backfill_all_trek_meta` + Celery task + admin "Backfill All Treks" button (fixes 0 verified / 805 missing fields across 51 trek guides) | Done |
| Compare summary richer prompt — permit/themes/solo/suitability/best+avoid months in facts, `_SUMMARY_PROMPT_VERSION="v2"` cache-bust | Done |
| CMS section grounding for Ask AI — `_QA_SECTION_KEYWORDS` maps packing/itinerary/safety/faq questions → `content_json.sections` keys | Done |
| Conversational follow-ups — `ChatTurn` history param on `AskTrekQuestionRequest`, last 6 turns in Haiku prompt, cache skipped for history requests | Done |
| Web + mobile `TrekAskAI` send last 3 exchanges as history for contextual follow-ups | Done |
| `TrekProfile` expanded to include `content_sections: dict` + `faqs: list` — full per-trek "bible" for MCP consumption | Done |
| `_compact_profile` strips `content_sections`/`faqs` from search/list/recommend tools (token budget) | Done |
| `treksage_chat_sessions` + `treksage_chat_messages` tables — persistent anonymous/user session transcript | Done |
| `treksage_agent.py` — Haiku + tool-calling agent (5 MCP-equivalent tools, MAX_TOOL_ROUNDS=3, session history) | Done |
| `POST /api/v1/treksage/chat` + `GET /api/v1/treksage/chat/{session_key}/history` | Done |
| `/treksage` — TrekSage AI public chat page with session persistence (`localStorage` session_key) | Done |
| `datacenter.trekyatra.co.in?slug=<slug>` — full `TrekProfile` JSON viewer; `/trek-guide/[slug]` → 308 redirect | Done |

### Post-73 Bug Fixes + Mobile/TrekSage UI Revamp (Step 74)
| Feature | Status |
|---------|--------|
| TrekSage AI renamed throughout (Myra removed from system prompt, UI, metadata) | Done |
| Bot-stopping fix — `tool_choice={"type":"none"}` on final tool round prevents truncated "Let me try..." replies | Done |
| `react-markdown` rendering in TrekSage chat — bold, italic, lists, headings rendered correctly | Done |
| Trek cards below assistant replies — up to 5 trek mini-cards (image, name, meta, budget) after search/recommend tool calls | Done |
| TrekSage AI home page banner — between TRENDING and CATEGORY HUB with 3 sample prompts linking to `/treksage` | Done |
| Voice search crash fix — `NSSpeechRecognitionUsageDescription` in `app.config.ts` iOS infoPlist (dev-client rebuild required) | Done |
| Mobile Plan My Trek revamp — emoji option chips, hint labels, hero image on result cards, coloured match badge | Done |
| Mobile Compare revamp — 2-col trek tile grid with images, debounced search input, selected-trek pill strip, trek image header in comparison table, styled "✨ TrekSage says" summary card | Done |
| `contentApi.searchTreks()` — semantic search for trek selection in mobile compare screen | Done |

### TrekSage Advanced Bot + UI Redesign (Step 75)
| Feature | Status |
|---------|--------|
| Bot-stopping root fix — transition phrases (ends with ":" + < 60 chars) detected on non-final rounds; nudge injected; loop continues | Done |
| System prompt hardened — no tech exposure (Claude/Haiku/FastAPI/tool names), safety-first (AMS risk, permit disclaimers), structured "Why it matches:" format | Done |
| `max_altitude_ft` in trek cards — Altitude stat row in `/treksage` chat now shows real summit data | Done |
| `TrekAskAI.tsx` markdown fix — `ReactMarkdown` wraps `ex.answer` on trek detail "Ask TrekSage" widget | Done |
| `/treksage` complete PRD redesign — light warm palette (#FAF5EE bg, #1D3A2E pine, #E8702A saffron); Discover/Compare/Plan tabs; prompt suggestions with tags; trek cards with hero image, match% pill, stats grid, CTAs; rotating loading messages; remark-gfm table support | Done |
| Mobile voice search graceful degradation — Expo Go detection + `Alert.alert` in `handleMicPress` (app no longer crashes; shows friendly message) | Done |

### TrekSage V1 Completion + V2 Features (Step 76)
| Feature | Status |
|---------|--------|
| **Global floating TrekSageWidget** — pine FAB (bottom-right) on all public pages; compact 380×480 chat drawer; separate widget session; hides on `/treksage` itself | Done |
| **7-step Plan Wizard** — guided chip-selection (Region → Duration → Difficulty → Budget → Month → Group → Preferences) → natural-language prompt → TrekSage chat; triggered via "Use Guided Planner" in Plan tab | Done |
| **Lead Capture Modal** — name/email/phone/trek-interest/month form → `POST /api/v1/leads/operator-help`; "Get Expert Help" CTA bar after any conversation | Done |
| **Admin TrekSage Logs** — `/admin/treksage-logs` dashboard; source (web/mobile/chatgpt/claude) + tool_name filter dropdowns; KPI row; paginated table | Done |
| **Mobile TrekSage chat tab** — center FAB (chatbubbles icon, saffron); DISCOVER/COMPARE/PLAN prompt chips; message bubbles with trek card chips; AsyncStorage session persistence; Plan tab moves to regular sparkles icon | Done |
| `GET /api/v1/admin/treks/ai-logs` — added `source` + `tool_name` filter query params; default limit 50→100 | Done |

### Community — Trip Reports + Trail Conditions (Step 78 + M17)
| Feature | Status |
|---------|--------|
| User-submitted trail condition reports (open/caution/closed/unknown) with title, body, trek date | Done |
| Photo upload to DO Spaces (Pillow resize→1920px, max 3 photos per report, max 5 MB each) | Done |
| Admin moderation queue — pending/approved/rejected tabs, approve/reject with reason | Done |
| Condition summary banner on trek detail page (% open/caution/closed bars, last report date) | Done |
| Photo gallery on web (full-screen overlay, keyboard ←→Esc navigation) | Done |
| Trail Conditions tab on mobile trek detail screen (5th "Trail" tab) | Done |
| Mobile photo gallery (FlatList pagingEnabled full-screen viewer, expo-image) | Done |
| Mobile photo picker (expo-image-picker + expo-image-manipulator resize, 3-photo limit) | Done |
| Mobile AddReportSheet — slide-up form Modal with condition radio, body with char counter | Done |

### Community — Trek Buddy Matching (Step 79 + M18)
| Feature | Status |
|---------|--------|
| Privacy-first "I'm planning this trek" signal (month, group size, experience, notes) | Done |
| Signal list with masked display names ("FirstName L.") — no contact details exposed | Done |
| Public trekker profile page via signal UUID (no email/user_id) — viewable before mutual accept | Done |
| Buddy request with optional connection message; 400 for own signal, 409 for duplicate | Done |
| Accept/reject buddy request; email/contact only shared after mutual accept | Done |
| In-app chat for accepted buddy pairs — 10s polling, text-only, both web + mobile | Done |
| Buddy section on trek detail page (web) — count badge, month breakdown chips, signal list | Done |
| `/account/buddy-requests` dashboard — received/sent tabs, pending count badge, inline chat | Done |
| Mobile BuddySignalSheet — pageSheet modal with month picker, group-size/experience chips | Done |
| Mobile BuddyListCard — privacy-safe signal card with inline connect flow | Done |
| Mobile TrekkerProfileModal — formSheet with avatar initials, bio, stats, privacy notice | Done |
| Mobile BuddyRequestSheet — received/sent tabs, accept/decline, Open Chat CTA | Done |
| Mobile BuddyChatScreen — pageSheet FlatList chat, 10s polling, KeyboardAvoidingView | Done |
| Celery beat task `buddies.expire_signals` — daily auto-expiry of past-month signals | Done |

### Live Trek Conditions (Step 80 + M19)
| Feature | Status |
|---------|--------|
| Open-Meteo weather integration — free, no API key, 10k/day; temp, feels-like, humidity, wind, WMO code | Done |
| `trek_conditions` table + `trek_base_lat`/`trek_base_lng` on `cms_pages` | Done |
| `TREK_COORDS` hardcoded dict for 40 Himalayan treks — fallback when DB columns null | Done |
| Trail status derivation from last 5 approved trip reports (majority vote + `trek_is_unsafe_closed` hard override) | Done |
| Permit status from `trek_permit_required` + current month vs `trek_open_months` | Done |
| LLM-free condition summary (templated, zero extra cost) | Done |
| `GET /api/v1/public/treks/{slug}/conditions` — public endpoint, 404 when no coords | Done |
| `POST /api/v1/admin/conditions/{slug}/refresh` — admin force-refresh | Done |
| `POST /api/v1/admin/conditions/seed-coordinates` — bulk seed 40 trek lat/lng | Done |
| Celery beat task `conditions.refresh_all` — every 6 hours (21600s) | Done |
| Web `LiveConditionsWidget` — current weather, 3-day forecast, trail + permit pills, summary | Done |
| Mobile `ConditionsWidget` — inline compact widget in guide tab | Done |
| Mobile `LiveConditionsScreen` — full-screen overlay with pull-to-refresh | Done |
| Mobile `AsyncStorage` 6h TTL cache + offline fallback | Done |

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
# All backend tests (568 tests)
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
| `GA4_MEASUREMENT_ID` | Optional | GA4 measurement ID — CDP mirrors events to GA4 if set |
| `GA4_API_SECRET` | Optional | GA4 Measurement Protocol API secret |
| `GSC_SERVICE_ACCOUNT_JSON` | Optional | Google Search Console service account JSON — GSC import skipped gracefully if unset |

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
| Auth (extended) | `POST /auth/forgot-password`, `POST /auth/reset-password`, `PATCH /auth/me`, `GET /auth/me/leads` | Public (reset), User auth (settings/leads) |
| Email verification | `POST /auth/send-verification`, `POST /auth/verify-email` | User auth (send), Public (verify) |
| Trek alert digest | Celery: `account.send_trek_alerts` (daily beat, 08:00 IST) | Scheduled — no HTTP route |
| Operators (public) | `/api/v1/operators/*`, `/api/v1/inquiries` | Public + optional user auth (reviews require user auth) |
| Trip planning | `/api/v1/plan/generate`, `/api/v1/plan/recommend`, `/api/v1/plan/{id}`, `/api/v1/plan/{id}/email` | Public + optional user auth (recommend: user auth required, rate-limited 2/24h) |
| Seasonal treks (mobile Home) | `GET /api/v1/treks/seasonal?month=&limit=` | Public |
| Subscriptions | `/api/v1/subscriptions/create-checkout`, `/status`, `/cancel`, `/webhook` | User auth (webhook: no auth) |
| Translation | `/api/v1/admin/cms/{slug}/translate` | Admin auth required |
| Hindi sitemap data | `GET /api/v1/public/sitemap-pages/hindi` | Public |
| Admin pipeline | `/api/v1/admin/pipeline/*` | Admin auth required |
| Admin agents | `/api/v1/admin/agent-runs` | Admin auth required |
| Admin content | `/api/v1/admin/topics`, `/briefs`, `/drafts`, `/clusters` | Admin auth required |
| Revenue | `/api/v1/admin/revenue/*` | Admin auth required |
| Hubs | `/api/v1/admin/hubs/*` | Admin auth required |
| Linking | `/api/v1/admin/links/*` | Admin auth required |
| Search analytics | `POST /api/v1/search/log`, `GET /api/v1/search/suggestions`, `GET /api/v1/search/trending` | Public |
| Semantic search (mobile advanced search, M07b) | `POST /api/v1/search/semantic` — pgvector + text hybrid search, intent detection | Public |
| Page view tracking | `POST /api/v1/track/page-view` | Public (fire-and-forget) |
| Saved comparisons | `GET/POST /api/v1/account/comparisons`, `DELETE /api/v1/account/comparisons/{id}` | User auth required |
| Cross-platform behavior sync | `GET /api/v1/account/behavior-profile`, `PUT /api/v1/account/behavior-profile` — sync trek-view personalization between web and mobile | User auth required |
| News (public) | `GET /api/v1/public/news`, `GET /api/v1/public/news/{slug}`, `GET /api/v1/public/news/by-trek/{trek_slug}` | Public |
| CMS pages list (mobile Browse) | `GET /api/v1/cms/pages` — optional filters `trek_state`, `trek_difficulty`, `trek_season`, `trek_duration_min`, `trek_duration_max` (M07a, additive) | Public |
| News (admin) | `POST /api/v1/admin/news/generate/{trek_slug}` | Admin auth required |
| CDP event ingest | `POST /api/v1/analytics/event`, `POST /api/v1/analytics/events/batch` | Public (consent-gated) |
| CDP session | `POST /api/v1/analytics/session/start`, `POST /api/v1/analytics/session/end` | Public |
| CDP consent | `POST /api/v1/analytics/consent` | Public |
| CDP admin — users | `GET /api/v1/admin/cdp/users`, `GET /api/v1/admin/cdp/users/{user_id}` | Admin auth |
| CDP admin — dashboard | `GET /api/v1/admin/cdp/kpis`, `/realtime-feed`, `/alerts` | Admin auth |
| CDP admin — events | `GET /api/v1/admin/cdp/events`, `/events/export`, `/events/definitions`, `/events/stream` | Admin auth |
| CDP admin — funnels | `POST /api/v1/admin/cdp/funnels/dynamic`, `GET /funnels/templates` | Admin auth |
| CDP admin — cohorts | `GET /api/v1/admin/cdp/cohorts`, `POST /cohorts/custom` | Admin auth |
| CDP admin — segments | `GET/POST /api/v1/admin/cdp/segments/custom`, `POST /segments/preview`, `GET /segments/{id}/export` | Admin auth |
| CDP admin — content | `GET /api/v1/admin/cdp/content/pages`, `/content/treks` | Admin auth |
| CDP admin — webhooks | `GET/POST /api/v1/admin/cdp/webhooks`, `DELETE /webhooks/{id}` | Admin auth |
| CDP admin — users | `GET /api/v1/admin/cdp/users`, `GET /users/{user_id}`, `GET /users/activity` | Admin auth |
| CDP admin — gsc | `GET /api/v1/admin/cdp/gsc` | Admin auth |
| CDP admin — suppressions | `GET /api/v1/admin/cdp/suppressions` | Admin auth |
| DPDP compliance | `GET /api/v1/auth/me/data-export`, `DELETE /api/v1/auth/me/data` | User auth required |
| Trek intelligence | `GET /api/v1/treks/{slug}/profile`, `POST /api/v1/treks/compare`, `POST /api/v1/treks/{slug}/ask`, `GET /api/v1/treks/{slug}/content` | Public |
| Operator-help lead | `POST /api/v1/leads/operator-help` | Public |
| AI interaction logging | `POST /api/v1/ai/log` | Public (fire-and-forget) |
| Admin trek data | `GET /api/v1/admin/treks/data-quality`, `PATCH /api/v1/admin/treks/{slug}/meta`, `POST /api/v1/admin/treks/{slug}/backfill`, `POST /api/v1/admin/treks/backfill-all`, `GET /api/v1/admin/treks/ai-logs` | Admin auth required |
| "TrekSage" MCP server | `https://api.trekyatra.co.in/mcp` (Streamable HTTP, 8 tools) | Read-only tools open; `create_trek_plan_lead`/`translate_trek_content` require `X-MCP-Key` |
| TrekSage conversational AI | `POST /api/v1/treksage/chat`, `GET /api/v1/treksage/chat/{session_key}/history` | Public (anonymous session auto-created; user auth optional for linked history) |
| Trip Reports (public) | `GET /api/v1/public/treks/{slug}/reports` — paginated approved reports + condition_summary | Public |
| Trip Reports (auth) | `POST /api/v1/reports`, `POST /api/v1/reports/media/upload`, `DELETE /api/v1/reports/{id}` | User auth required |
| Trip Reports (admin) | `GET /api/v1/admin/reports`, `PATCH /api/v1/admin/reports/{id}/moderate` | Admin auth required |

Full API docs available at http://localhost:8000/docs when the backend is running.

---

## Database Overview

**45 Alembic migrations applied.** Key table groups:

| Domain | Tables |
|--------|--------|
| Auth | `users` (+`behavior_profile JSON` for cross-platform personalization sync), `sessions`, `roles`, `permissions`, `role_permissions` |
| Content pipeline | `topics`, `keyword_clusters`, `content_briefs`, `brief_versions`, `content_drafts`, `draft_claims` |
| Pipeline tracking | `agent_runs`, `pipeline_runs`, `pipeline_stages` |
| CMS | `cms_pages` (with `embedding vector(1536)`), `pages`, `page_links` |
| User accounts | `user_bookmarks`, `user_downloads`, `trek_alerts`, `user_profiles`, `account_comparisons` |
| Products | `digital_products`, `user_orders` |
| Monetisation | `affiliate_products`, `page_intent_sessions`, `lead_submissions`, `affiliate_clicks` |
| Revenue | `revenue_attributions`, `revenue_config`, `executive_summaries` |
| Email | `newsletter_subscribers`, `subscriber_tags`, `email_sequences`, `email_sequence_steps`, `subscriber_sequence_enrollments` |
| Operators | `operators` (+ logo_url, description_long, rating_avg, review_count), `operator_specializations`, `operator_reviews`, `operator_agreements`, `operator_leads` |
| Trip planning | `trip_plans` |
| Subscriptions | `subscriptions` |
| Content QA | `cannibalization_issues`, `compliance_issues`, `refresh_logs` |
| Analytics | `search_events`, `page_views` |
| Trek metadata (on cms_pages) | `trek_state`, `trek_name`, `trek_difficulty`, `trek_duration`, `trek_season`, `trek_suitability` |
| Trek intelligence (Step 72, on cms_pages) | `trek_region`, `trek_max_altitude_ft`, `trek_duration_days_min/max`, `trek_best/open/avoid_months`, `trek_permit_required/notes`, `trek_budget_min/max`, `trek_themes`, `trek_crowd_level`, `trek_beginner/solo/family_friendly`, `trek_operator_available`, `trek_is_unsafe_closed`, `trek_data_confidence`, `trek_last_verified_at` |
| AI logging + Q&A cache (Step 72) | `ai_interaction_logs`, `trek_qa_cache`; `lead_submissions.details_json` (operator-help fields) |
| TrekSage chat (Step 73) | `treksage_chat_sessions` (id, user_id nullable FK, session_key unique, created_at, last_active_at), `treksage_chat_messages` (id, session_id FK cascade, role, content, tool_calls_json, created_at) |
| Community / Trip Reports (Step 78) | `trip_reports` (id, user_id FK, trek_slug, title, body, condition, trek_date, status pending/approved/rejected, moderated_by nullable, moderated_at, created_at), `trek_media` (id, report_id FK, user_id, trek_slug, url, s3_key, width, height, file_size, uploaded_at) |
| Community / Buddy Matching (Step 79) | `buddy_signals` (id uuid, user_id FK, trek_slug, month_year, group_size, experience, notes, active, expires_at, created_at; UNIQUE user_id+trek_slug+month_year), `buddy_requests` (id, sender_id FK, signal_id FK, message, status pending/accepted/rejected, responded_at; UNIQUE sender_id+signal_id), `buddy_chat_messages` (id, request_id FK, sender_id FK, content, is_read, created_at); `bio`+`avatar_url` added to `user_profiles` |
| Coordinates + conditions (Step 80) | `trek_base_lat`/`trek_base_lng` Float nullable added to `cms_pages`; `trek_conditions` (id uuid pk, slug unique+index, weather_json JSONB, trail_status, permit_status, permit_notes, condition_summary, weather_updated_at, trail_updated_at, last_updated_at, created_at, updated_at) |
| CDP (Step 64) | `analytics_events`, `analytics_sessions`, `user_traits`, `attribution_touchpoints`, `gsc_performance` |

---

### Mobile App (V5)
| Feature | Status |
|---------|--------|
| Expo SDK 56 monorepo workspace (`apps/mobile/`) | Done (M01) |
| Expo Router v56 — 5-tab navigation (Home/Browse/Plan/Saved/Account) | Done (M01) |
| NativeWind v4 design system — matches web palette | Done (M01) |
| UI components: Button, Badge, Card, Typography, SkeletonLoader, SafeArea | Done (M01) |
| TanStack Query v5 + Zustand v5 auth store | Done (M01) |
| `packages/types/` — shared Trek, CMSPage, User TypeScript types | Done (M01) |
| expo-secure-store token persistence | Done (M01) |
| Sentry v8 error tracking init | Done (M01) |
| Mobile Auth — sign-in/up screens, JWT (Google OAuth docs ready) | Done (M02) |
| Backend mobile extensions (bearer auth, mobile-shaped endpoints) | Done (M03) |
| Offline sync (expo-sqlite, CMS content cache) | Done (M04) |
| Mobile design system overhaul (Pine/Saffron palette, theming, FAB tab bar) | Done (M-DS1) |
| Trek detail screen (hero, meta, tabs, related, sticky CTA) | Done (M05) |
| Home screen — 4-state personalisation, trending/seasonal/recommendations | Done (M06) |
| Cinematic animated splash, onboarding polish, guest Skip, Google/Apple sign-in icons | Done (M-DS2) |
| Home screen web-parity — Category Hub, Difficulty Tabs, Editorial Feature, Comparison/Resources/Operators CTAs, 9 new content-hub screens (Packing/Permits/Costs/Safety/Beginner/Plan-My-Trek/Compare/Products/Operators), recommendation trek tags fix | Done (M-DS3) |
| Trek detail screen web-parity — Trust signals (fact-checked + updated/published date), Trek News row, "In this cluster" related pages, native Contents bottom-sheet TOC, Compare CTA on sticky bar | Done (M-DS4) |
| Splash screen rebuild — static full-bleed background photo + centered white logo card, replacing cinematic SVG/Reanimated sequence | Done (M-DS5) |
| Splash→onboarding transition animation (logo scale/fade + crossfade) and onboarding "Skip" CTA → direct to Sign up | Done (M-DS6) |
| QA bugfix pass — tab bar ghost-tab fix, icon-only back button, trek detail Guide/Packing/Permits/Costs content via `content_html`/`content_json.sections` + `react-native-render-html`, Home hero + search bar | Done (M-DS7) |
| Explore & Search — Browse tab (grid, filters, regions/seasons hubs, basic search) | Done (M07a) |
| Explore & Search — advanced search (semantic/voice/recent/trending) | Done (M07b) |
| Home — Region tabs (5 trek cards per region + View all) and difficulty tabs fuzzy-matching fix | Done (M07c) |
| Glass UI overhaul — `GlassSurface` primitive (Liquid Glass on iOS 26+, expo-blur frosted elsewhere), app-wide pass: tab bar/sticky bars, home/browse/trek-detail surfaces, auth screens | Done (M-DS8) |
| Trek planning wizard (full multi-step UI) | Done (M09) |
| User account (profile, saved, downloads, settings) | Done (M10) |
| Operators marketplace (listing, detail, inquiry) | Done (M11) |
| Digital products (catalog, Razorpay payment, file download) | Done (M12) |
| Premium subscription (IAP screen, usePremium hook, GatedContentOverlay, backend verify/restore) | Done (M13) |
| Cross-platform personalization sync (behavior_profile on users, GET/PUT API, mobile pull-on-login, web sync-on-view) | Done (Bugfix Pass 2) |
| Explore filter prominence + Go Premium drawer entry | Done (Bugfix Pass 2) |
| Push notifications (FCM/APNs, test mode, permit/seasonal/news Celery tasks, notification inbox screen, badge count, 2nd-open permission prompt) | Done (M14) |
| Live trek conditions — `useConditions` hook (AsyncStorage 6h cache + offline), `ConditionsWidget` (inline: WMO emoji/temp/forecast/badges), `LiveConditionsScreen` (full overlay: weather + forecast + trail/permit + summary cards, pull-to-refresh) | Done (M19) |

---

## Roadmap Status

| Version | Steps | Status |
|---------|-------|--------|
| V0 — Foundations | Steps 00–10 | Complete |
| V1 — Launchable Product | Steps 11–24 | Complete |
| V2 — Smarter Automation | Steps 25–32 | Complete |
| V3 — Platform Expansion | Steps 33–37 | Complete |
| V4 — Ecosystem Scale | Steps 38–41 | In Progress (Steps 38–40 done; Step 41 pending) |
| Pre-Launch Sprint | Auth, stubs, E2E, UI polish | Complete — see PRELAUNCH_CHECKLIST.md for remaining manual items |
| **Production Deploy** | DigitalOcean BLR1 | All components HEALTHY — DNS configuration next |
| **Step 64 — CDP Analytics Layer** | First-party tracking, funnel/cohort/segment analysis, GSC, DPDP | Done — 2026-05-27 |
| **Step 65 — CDP Analytics Enhancement** | Dynamic funnels, N×M cohort heatmap, 10 segments, user activity timeline, Plan wizard tracking | Done — 2026-05-27 |
| **Step 66 — Homepage Section Logic by User State** | 4-state personalisation (New/Repeat × LoggedIn/LoggedOut): welcome banner, personalized trending header, recently-viewed section, 4-state PersonalisedFeed, preferred-difficulty pre-select | Done — 2026-05-29 |
| **Step 71 — Core Web Vitals Optimisation** | next/font self-hosted fonts (−3–5 s FCP), Next.js image optimisation + AVIF/WebP (−6 s LCP), hero `<Image priority>`, favicon 301KB→3KB, preconnect hints, dynamic imports, .browserslistrc modern targets (−11KB polyfills), GA4 lazyOnload, 8 static images converted to WebP, accessibility aria-labels | Done — 2026-06-03 |
| **Step M01 — Expo Mobile Bootstrap** | `apps/mobile/` workspace (Expo SDK 56, RN 0.85.3, React 19); Expo Router v56 5-tab nav; NativeWind v4 design system; Button/Badge/Card/Typography/SkeletonLoader; TanStack Query v5 + Zustand v5 auth store; `packages/types/` shared types; tsc 0 errors + expo export ✓ | Done — 2026-06-03 |
| **Step M-DS1 — Mobile Design System Overhaul** | Pine/Saffron/Sky/Earth/Mist/Paper palette, ThemeProvider + useTheme, FAB-style CustomTabBar, photo-carousel onboarding | Done — 2026-06-10 |
| **Step M05 — Trek Detail Screen** | Hero/meta/tab bar/related/sticky CTA, offline-first via SQLite, behavior tracking | Done — 2026-06-10 |
| **Step M06 — Home Screen + 4-State Personalisation** | 4-state Home (A/B/C/D), trending/seasonal/recommendations rows, skeleton loader | Done — 2026-06-10 |
| **Mobile Crosscheck Bugfix Pass (M-DS1–M06)** | Fixed splash/font loading, login redirect (`/(tabs)` → `/(tabs)/(home)`), broken Home/bottom-nav (route-name + downloads-tab + API contract fixes), browse.tsx M03→M07 copy; new `GET /api/v1/treks/seasonal` endpoint + 7 tests; new mobile-design-system skill doc | Done — 2026-06-11 |
| **Step M-DS2 — Splash, Onboarding & Auth Polish** | Cinematic SVG/Reanimated "Trail Comes Alive" splash; onboarding full-bleed/contrast/back-nav + 6-USP slide rewrite; guest "Skip" → anonymous browsing (AuthGate relaxed); Google/Apple sign-in icons (Apple UI-only, backend deferred); 15s request timeout fixes sign-in spinner hang | Done — 2026-06-11 |
| **Step M-DS7 — QA Bugfix Pass** | Tab bar ghost-tab fix, icon-only back button, Trek detail Guide/Packing/Permits/Costs render real `content_html`/`content_json.sections` via new `react-native-render-html`-based `HtmlContentRenderer`, Home hero + tappable search bar | Done — 2026-06-12 |
| **Step M07a — Browse Tab** | `GET /api/v1/cms/pages` gains optional `trek_state`/`trek_difficulty`/`trek_season`/`trek_duration_min`/`trek_duration_max` filters; new `exploreStore`/`useFilterFacets`/`useExplore`; Browse tab rebuilt as a stack — grid (`TrekGrid`), `FilterChips`/`FilterSheet`, Regions/Seasons hub screens, basic search screen (`/browse/search`) | Done — 2026-06-12 |
| **Step M07b — Advanced Search** | `/browse/search` gains Recent Searches (AsyncStorage) + Trending Searches chips, semantic search "Suggested for you" section via existing `POST /api/v1/search/semantic`, and voice search via new `expo-speech-recognition` dependency; new `useRecentSearches`/`useTrendingSearches`/`useSemanticSearch` hooks; `mobileApi.ts` gains `semanticSearch`/`getTrendingSearches`/`logSearch` | Done — 2026-06-14 |
| **bugfix — Home difficulty tabs** | `DifficultyTabsSection` "Moderate" tab showed empty due to exact-match filter against a tiny trending/seasonal subset; new `useDifficultyTreks` hook queries `exploreTreks` with a fuzzy per-tab value list (mirrors web's substring matching) and merges/dedupes | Done — 2026-06-14 |
| **Step M07c — Region Tabs with Trek Cards** | Home "Explore by Region" chips become selectable tabs (first region default), showing 5 `TrekCard`s for the active region via new `useRegionTreks` hook + "View all →" link to `/(tabs)/browse?region=<state>` (existing param handling) | Done — 2026-06-14 |
| **bugfix — Voice search crash on mic tap** | `handleMicPress` in `/browse/search` wrapped in `try/catch` — native errors from `expo-speech-recognition` (M07b) no longer crash the app; if voice still doesn't start, dev-client needs a rebuild to compile in the M07b native module | Done — 2026-06-15 |
| **Step M-DS8 — Glass UI Overhaul** | New `GlassSurface` primitive (`expo-glass-effect` Liquid Glass on iOS 26+, `expo-blur` frosted elsewhere) + `glassTint`/`glassBorder`/`glassOverlay` theme tokens; app-wide pass across tab bar/sticky bars, home/browse/trek-detail surfaces, and auth screens; both new native modules require a dev-client rebuild | Done — 2026-06-15 |
| **Step 72 — "TrekSage" MCP Server + Trek Intelligence Data Layer + Datacenter Subdomain** | 16 new `cms_pages.trek_*` structured fields, refined deterministic matching (real budget/season scoring, hard exclusion of unsafe/closed + avoid-month treks), Trek Detail Ask AI Q&A (web + mobile, Haiku, DB-cached), Compare page backend wiring + AI trade-off summary, "TrekSage" MCP server (8 tools at `/mcp`), `datacenter.trekyatra.co.in/trek-guide/[slug]`, admin trek data-quality dashboard, AI interaction logging, mobile Plan tab wiring, operator-help fallback lead | Done — 2026-06-15 |
| **Step 73 — TrekSage Bugfix Pass + Conversational AI** | Bulk trek data backfill (fixes 0 verified / 805 missing fields, compare "—" rows, plan card empty badges); CMS-section grounding for Ask AI (packing/itinerary/safety/faq questions answered from real `content_json.sections`); conversational follow-ups via `history` param (web + mobile); richer compare AI summary (`_SUMMARY_PROMPT_VERSION="v2"` cache-bust); `TrekProfile` expanded with `content_sections`+`faqs`; new `treksage_chat_sessions`/`treksage_chat_messages` tables; `treksage_agent.py` (Haiku + tool-calling, 5 tools, MAX_TOOL_ROUNDS=3); `/treksage` Myra-style chat page; datacenter rewritten as `?slug=` JSON viewer with 308 redirect from `/trek-guide/[slug]`; 18 new tests (683/685 pass) | Done — 2026-06-16 |
| **Step 74 — Post-73 Bug Fixes + Mobile/TrekSage UI Revamp** | TrekSage renamed (Myra removed); bot-stopping fix (`tool_choice={"type":"none"}` on final tool round); `react-markdown` for bot replies; trek card visuals in chat; TrekSage AI home page banner; voice-crash fix (`NSSpeechRecognitionUsageDescription` in `app.config.ts`, dev-client rebuild required); mobile Plan My Trek revamped (emoji chips, hero images, match badge); mobile Compare revamped (tile grid, search input, trek image header, styled AI summary); `searchTreks()` added to mobile API; 683/685 backend pass, `next build` ✅, `tsc --noEmit` ✅ | Done — 2026-06-16 |
| **Step 77 — TrekSage UX Overhaul + Search Fix** | `search_treks` keyword tokenization (OR-match, stop-word filter, extended haystack with structured month names); `_MONTH_ORD` full month names (December etc.); 4 new BE tests (TC-B41–B44, 676/676 pass); Myra-inspired `/treksage` split-screen (42% chat / 58% canvas); canvas slides in on first trek_cards; trek name → `/trek/[slug]?ref=treksage` analytics; "View Details" → `TrekDetailPanel` inline; "Add to Compare" → compare set → "Compare (N)" button; multi-stage thinking bubble; send/stop morph; stagger-fade cards; `TrekDetailPanel.tsx` created; `next build` ✅ 21 kB | Done — 2026-06-18 |
| **Step 79 + M18 — Trek Buddy Matching** | Migration 20260625_0050: `buddy_signals`+`buddy_requests`+`buddy_chat_messages` tables + `bio`/`avatar_url` on `user_profiles`; `buddies` module (models, schemas, service, 10 routes); static routes before dynamic (§16); `buddies.expire_signals` Celery beat task; 12 tests (TC-B-M18-01–12, 739/741 pass); web: `lib/buddies.ts`, BuddySection+BuddySignalCard+BuddySignalForm+BuddyChatPanel components, `/account/buddy-requests` page, `/trekker/[signalId]` page; mobile: `useBuddies` hook, BuddySignalSheet+BuddyListCard+TrekkerProfileModal+BuddyRequestSheet+BuddyChatScreen components; buddy block in trek detail + account tab; upsert signal semantics; privacy: display_name="FirstName L.", profile URL via signal UUID | Done — 2026-06-25 |
| **Step 80 + M19 — Live Trek Conditions** | Migration 20260626_0051: `trek_base_lat`/`trek_base_lng` nullable on `cms_pages`; `trek_conditions` table (slug unique+index, weather_json JSONB, trail_status, permit_status, permit_notes, condition_summary, weather_updated_at, trail_updated_at, last_updated_at); `conditions` module (models/schemas/service); `TREK_COORDS` dict (40 Himalayan treks); Open-Meteo `fetch_weather` (async httpx, no API key); `derive_trail_status` (last-5-reports majority vote + `trek_is_unsafe_closed` override); `derive_permit_status` (permit_required + month); `conditions.refresh_all` Celery beat (21600s); 3 routes (`GET /api/v1/public/treks/{slug}/conditions`, admin refresh + seed-coordinates); 9 tests (TC-B-M19-01–09, 748/750 pass); web: `lib/conditions.ts`, `LiveConditionsWidget` (temp/WMO icon/3-day forecast/trail+permit pills/summary); mobile: `useConditions` (AsyncStorage 6h TTL cache + offline), `ConditionsWidget` (inline), `LiveConditionsScreen` (full-screen overlay); `trek/[slug]/page.tsx` + `trek/[slug].tsx` wired | Done — 2026-06-26 |

## Production Infrastructure

| Service | Provider | Region | Status |
|---------|----------|--------|--------|
| Frontend (Next.js) — `web` | DO App Platform | BLR1 Bangalore | ✅ HEALTHY (2% CPU, 10% RAM) |
| Backend API (FastAPI) — `api` | DO App Platform | BLR1 Bangalore | ✅ HEALTHY (3% CPU, 20% RAM) |
| Celery Worker — `celery-worker` | DO App Platform | BLR1 Bangalore | ✅ HEALTHY (3% CPU, 35% RAM) |
| Celery Beat — `celery-beat` | DO App Platform | BLR1 Bangalore | ✅ HEALTHY (2% CPU, 14% RAM) |
| PostgreSQL 16 + pgvector | DO Managed DB | BLR1 Bangalore | ✅ Ready — 34 migrations applied |
| Valkey 8 (Redis) | DO Managed DB | BLR1 Bangalore | ✅ Ready — SSL + auth configured |
| `www.trekyatra.co.in` | GoDaddy → DO | BLR1 | ✅ LIVE — homepage rendering in production |
| `api.trekyatra.co.in` | GoDaddy → DO | BLR1 | ✅ LIVE — health check confirmed in production |
| `trekyatra.co.in` (root) | GoDaddy → DO | BLR1 | ✅ LIVE — SSL active |

**Live URL (www):** `https://www.trekyatra.co.in`
**Live API:** `https://api.trekyatra.co.in`
**Monthly cost:** $48/month (+ $30.15 DBs = **~$78/month total**)

Full setup log: `docs/PRODUCTION_SETUP.md`

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
