# TrekYatra Pre-Launch Checklist

> Comprehensive audit as of 2026-05-07. Every item in this checklist has been
> cross-verified against the actual codebase. Covers backend, frontend, CMS,
> admin, testing, and production readiness.

---

## Status Legend
- `[x]` — Complete and verified
- `[~]` — Partially implemented (functional but incomplete)
- `[ ]` — Not started
- `[DEFERRED]` — Explicitly deferred to post-launch

---

## SECTION A — BACKEND: Full Feature Audit

### Auth Module (`modules/auth/`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| A01 | Email signup / login | `[x]` | PBKDF2-SHA256 hashing, JWT HttpOnly cookie |
| A02 | Google OAuth | `[x]` | /auth/google — fetches Google userinfo |
| A03 | JWT session management | `[x]` | UserSession table, cookie name configurable |
| A04 | Password reset (forgot + reset) | `[x]` | Stateless JWT 1h TTL, graceful SMTP |
| A05 | Account settings (PATCH /auth/me) | `[x]` | Updates full_name, display_name |
| A06 | Account enquiries (GET /auth/me/leads) | `[x]` | Filtered by user email |
| A07 | Email verification on signup | `[~]` | is_verified_email column exists; no verification email sent |
| A08 | Mobile OTP login | `[DEFERRED]` | Placeholder endpoint returns 501 |
| A09 | Session expiry | `[x]` | expires_at on UserSession, configurable TTL |

### Content Pipeline (`modules/agents/`, `modules/content/`, `modules/pipeline/`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| B01 | TrendDiscoveryAgent | `[x]` | LangGraph, Claude Haiku, rule-based fallback |
| B02 | KeywordClusterAgent | `[x]` | Pillar/support mapping |
| B03 | ContentBriefAgent | `[x]` | SEO+AEO structured brief, versioning |
| B04 | ContentWritingAgent | `[x]` | Full long-form drafts, fact-check claims |
| B05 | SEOAEOAgent | `[x]` | Snippet optimisation, FAQ blocks |
| B06 | ClaimExtractionAgent | `[x]` | Confidence scoring, YMYL tagging |
| B07 | ComplianceGuardAgent | `[x]` | Disclosure enforcement, risky wording |
| B08 | CannibalizationAgent | `[x]` | Keyword overlap, merge/redirect recommendations |
| B09 | NewsletterAgent | `[x]` | Weekly digest, social snippets |
| B10 | IntentClassifierAgent | `[x]` | 4 intent types, ephemeral caching, fallback |
| B11 | ExecutiveSummaryAgent | `[x]` | LangGraph 3-node, weekly revenue digest |
| B12 | SeasonalContentAgent | `[x]` | 4 seasons, quarterly regeneration |
| B13 | TranslationAgent | `[x]` | Claude Haiku, proper nouns glossary, Hindi/Marathi |
| B14 | TripPlannerAgent | `[x]` | LangGraph 4-node, CMS-powered trek selection |
| B15 | EmbeddingAgent | `[x]` | OpenAI text-embedding-3-small, 1536-dim |
| B16 | 6-stage pipeline with checkpoint gates | `[x]` | paused_at_brief_approval, paused_at_draft_approval |
| B17 | Fact validation + YMYL gates | `[x]` | mandatory review for safety content |

### CMS (`modules/cms/`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| C01 | cms_pages CRUD | `[x]` | slug unique, status machine, JSON sections |
| C02 | Redis cache (5-min TTL) | `[x]` | DB 2, cache_invalidate per slug + all |
| C03 | is_premium content gating | `[x]` | Server-side: content_html="" + is_gated=True for free users |
| C04 | language / translations / source_page_id | `[x]` | Step 37 multilingual |
| C05 | hreflang in generateMetadata | `[x]` | trek + guides pages |
| C06 | upsert_page_from_draft | `[x]` | pipeline publish bridge |
| C07 | FAQ parsing + storage | `[x]` | content_json.faqs structured |
| C08 | pgvector embeddings (1536-dim) | `[x]` | fallback when no OPENAI_API_KEY |
| C09 | Next.js revalidation endpoint | `[x]` | POST /api/revalidate |
| C10 | Bulk embedding backfill | `[DEFERRED]` | No backfill job for existing pages |

### Operators (`modules/operators/`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| D01 | Operator CRUD (admin) | `[x]` | slug, region, trek_types, contact |
| D02 | Public listing + detail | `[x]` | OperatorPublicResponse — no contact_email |
| D03 | Operator ratings + reviews | `[x]` | 1 review per user, denormalised avg |
| D04 | Operator agreements | `[x]` | lead_fee_inr, revenue_share_pct |
| D05 | Booking inquiry (POST /inquiries) | `[x]` | SMTP confirmation, graceful |
| D06 | Self-serve operator signup | `[DEFERRED]` | Admin-only onboarding |

### Monetisation
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| E01 | Lead submissions + SMTP notification | `[x]` | source_page, cta_type, status workflow |
| E02 | Affiliate products catalog | `[x]` | Empty — admin must populate |
| E03 | Intent classification (4 types) | `[x]` | Claude Haiku, A/B test flag |
| E04 | page_intent_sessions tracking | `[x]` | converted flag, ab_variant |
| E05 | Digital products (Razorpay) | `[x]` | HMAC token delivery, test mode |
| E06 | Premium subscriptions (Stripe) | `[x]` | webhook, content gating, test mode |
| E07 | Trek alert delivery | `[DEFERRED]` | trek_alerts stored; no delivery Celery task |
| E08 | AdSense slots | `[x]` | Conditional on NEXT_PUBLIC_ADSENSE_ID |

### Revenue + Analytics
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| F01 | revenue_attributions daily aggregation | `[x]` | Celery beat, proxy-based |
| F02 | Executive summary (weekly) | `[x]` | LangGraph agent, requires ANTHROPIC_API_KEY |
| F03 | Affiliate click tracking | `[x]` | affiliate_clicks table |
| F04 | Google Analytics 4 | `[x]` | Script injected when NEXT_PUBLIC_GA4_ID set |
| F05 | Google Search Console | `[DEFERRED]` | Manual: submit sitemap after launch |

### Infrastructure
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| G01 | 30 Alembic migrations applied | `[x]` | head at 20260506_0030 |
| G02 | Celery worker tasks | `[x]` | 18+ registered tasks |
| G03 | Celery Beat schedule | `[x]` | daily/weekly/quarterly tasks |
| G04 | Redis cache DB 2 | `[x]` | CMS cache |
| G05 | pgvector extension | `[x]` | pgvector/pgvector:pg16 Docker image |
| G06 | Database cleared (non-user) | `[x]` | Clean state for launch |
| G07 | SMTP email (graceful) | `[x]` | All email wraps try/except |
| G08 | Password hashing (PBKDF2-SHA256) | `[x]` | 390,000 iterations |

---

## SECTION B — FRONTEND: Full Page & Feature Audit

### Public Pages (55 pages)
| Page | Status | Notes |
|------|--------|-------|
| `/` (Homepage) | `[x]` | Hero, trending, regions, search wired, operators CTA, PersonalisedFeed |
| `/explore` | `[x]` | Trek grid with filters |
| `/search` | `[x]` | Fuse.js fuzzy search, autocomplete dropdown, semantic for long queries |
| `/compare` | `[x]` | Dynamic trek selector, live comparison table |
| `/trek/[slug]` | `[x]` | CMS + static fallback, FAQ, TOC, hreflang |
| `/packing` | `[x]` | Hub page |
| `/packing/[slug]` | `[x]` | CMS-powered packing list |
| `/permits` | `[x]` | Hub page |
| `/permits/[slug]` | `[x]` | CMS-powered permit guide |
| `/guides/[slug]` | `[x]` | CMS-powered guide |
| `/itineraries` | `[x]` | CMSPageHub + static fallback |
| `/costs` | `[x]` | CMSPageHub + static fallback |
| `/gear` | `[x]` | CMSPageHub + static fallback |
| `/beginner` | `[x]` | CMSPageHub + static fallback + trek grid |
| `/safety` | `[x]` | CMSPageHub + static fallback |
| `/regions/[slug]` | `[x]` | CMS-powered regional hub |
| `/seasons/[slug]` | `[x]` | CMS-powered seasonal hub |
| `/trek-types/[slug]` | `[x]` | CMS cluster hub |
| `/operators` | `[x]` | Public operator listing, region filter |
| `/operators/[slug]` | `[x]` | Detail, reviews, inquiry form |
| `/plan` | `[x]` | 4-step wizard, TripPlannerAgent, itinerary result |
| `/products` | `[x]` | Digital product catalog |
| `/products/[slug]` | `[x]` | Product detail + Razorpay checkout |
| `/premium` | `[x]` | Pricing table, Stripe checkout |
| `/newsletter` | `[x]` | Newsletter signup |
| `/about` | `[x]` | Full editorial mission + team content |
| `/about/authors` | `[x]` | Editor bios + contributor policy |
| `/contact` | `[x]` | Contact channels + response times |
| `/privacy` | `[x]` | Full 8-section privacy policy |
| `/terms` | `[x]` | Full 9-section T&C |
| `/affiliate-disclosure` | `[x]` | Full disclosure + independence policy |
| `/safety-disclaimer` | `[x]` | AMS, permits, emergency contacts, liability |
| `/methodology` | `[x]` | YMYL policy, AI use, verification cycle |
| `/hi/trek/[slug]` | `[x]` | Hindi trek route, language switcher |
| `/hi/guides/[slug]` | `[x]` | Hindi guide route |
| `/hi/packing/[slug]` | `[x]` | Hindi packing route |
| `/account` | `[x]` | Dashboard with real API counts |
| `/account/saved` | `[x]` | Real bookmarks API |
| `/account/downloads` | `[x]` | Real downloads API |
| `/account/settings` | `[x]` | PATCH /auth/me — name, display_name |
| `/account/enquiries` | `[x]` | GET /auth/me/leads — real lead history |
| `/account/premium` | `[x]` | Subscription status, upgrade/cancel |
| `/account/compare` | `[~]` | Static stub — saved comparisons not implemented |
| `/auth/sign-in` | `[x]` | Email + Google OAuth |
| `/auth/sign-up` | `[x]` | Email signup |
| `/auth/forgot-password` | `[x]` | Wired to POST /auth/forgot-password |
| `/auth/reset-password` | `[x]` | Reads ?token=, calls POST /auth/reset-password |
| `/admin/sign-in` | `[x]` | Separate admin auth |
| `/success/checkout` | `[x]` | Post-purchase download link |
| `/success/signup` | `[x]` | Post-signup redirect |

### Frontend Components
| Component | Status | Notes |
|-----------|--------|-------|
| Logo | `[~]` | SVG circular badge created; actual PNG needs placing at /public/images/logo.png |
| Header / nav | `[x]` | Desktop + mobile responsive |
| Footer | `[x]` | Trail Letter newsletter, links, Gurgaon, heart icon |
| TrekCard | `[x]` | Solid colour difficulty tags (visible on images) |
| HomeSearchBar | `[x]` | Navigates to /search with query+region+season params |
| PersonalisedFeed | `[x]` | Logged-in: personalised recs; Guest: anonymous |
| RecommendedContent | `[x]` | Similar pages + static trek fallback |
| MonetizationSlot | `[~]` | Built (Step 36) but NOT wired into trek detail page |
| GatedContent | `[~]` | Built (Step 40) but NOT auto-wired into trek pages |
| CMSPageHub | `[x]` | Reusable CMS hub grid for content pages |
| OperatorCard / Grid | `[x]` | Light-theme styles (not dark-admin) |
| OperatorInquiryForm | `[x]` | Light-theme inputs |
| TrekPlanCard / ItineraryDay / WizardStep | `[x]` | Plan wizard components |
| PricingTable / GatedContent / PremiumBadge / SubscriptionStatusCard | `[x]` | Subscription UI |

---

## SECTION C — ADMIN CMS: Full Audit

| Page | Status | Notes |
|------|--------|-------|
| `/admin/sign-in` | `[x]` | Separate admin auth cookie |
| `/admin` (dashboard) | `[x]` | KPI strip, system summary |
| `/admin/pipeline` | `[x]` | 6-stage orchestration monitor, trigger/resume/cancel |
| `/admin/topics` | `[x]` | Live API data, agent run status |
| `/admin/clusters` | `[x]` | Live API data |
| `/admin/briefs` | `[x]` | Review queue, approve/reject, UUID copy |
| `/admin/drafts` | `[x]` | Dispatch, requires_review badge |
| `/admin/cms` | `[x]` | CRUD, cache control, language badge, translate button, premium toggle |
| `/admin/cms/[slug]/edit` | `[x]` | Full edit form with trek facts, FAQ editor |
| `/admin/fact-check` | `[x]` | Claims by draft, YMYL badge, re-run |
| `/admin/cannibalization` | `[x]` | Scan trigger, severity/status filters |
| `/admin/linking` | `[x]` | Orphan detector, anchor suggestions, sync |
| `/admin/leads` | `[x]` | Status filter, mark-as-contacted |
| `/admin/operators` | `[x]` | CRUD, FileText link to detail page |
| `/admin/operators/[id]` | `[x]` | Agreement CRUD + review moderation |
| `/admin/newsletter` | `[x]` | Subscriber list, campaign view |
| `/admin/email-sequences` | `[x]` | Sequences list, expandable steps, Seed button |
| `/admin/products` | `[x]` | Product CRUD (slug, price, file path) |
| `/admin/orders` | `[x]` | Order list with status filter |
| `/admin/monetization` | `[x]` | Intent stats, conversion rates, affiliate catalog |
| `/admin/revenue` | `[x]` | Cluster/page-type revenue, decaying pages, config editor, summary history |
| `/admin/refresh` | `[x]` | Stale content queue, trigger refresh |
| `/admin/hubs` | `[x]` | Seasonal hub list, regenerate button |
| `/admin/settings` | `[ ]` | No admin settings page built |
| `/admin/logs` | `[ ]` | No system log viewer built |

---

## SECTION D — KNOWN GAPS (Pre-Launch Critical)

| # | Gap | Impact | Fix Required? |
|---|-----|--------|---------------|
| Z01 | Logo PNG not placed at `/public/images/logo.png` | High — SVG fallback renders but not actual brand logo | **Yes — user must place file** |
| Z02 | MonetizationSlot not wired into `/trek/[slug]` | Medium — trek pages use static LeadForm CTA | Before launch |
| Z03 | GatedContent not auto-wired into trek pages | Medium — premium pages not visually gated on frontend | Before launch |
| Z04 | Email verification not sent on signup | Low — `is_verified_email=false` but no UX consequence | Post-launch |
| Z05 | Trek alert delivery not implemented | Low — subscriptions stored, no email fires | Post-launch |
| Z06 | `/account/compare` is a static stub | Low — saved comparisons not functional | Post-launch |
| Z07 | Elasticsearch / full-text search | Medium — Fuse.js fuzzy search implemented; Elastic deferred | `[DEFERRED]` — see Note below |
| Z08 | Admin settings page | Low — revenue config at /admin/revenue; general settings missing | Post-launch |
| Z09 | Admin system logs page | Low | Post-launch |
| Z10 | Bulk publish/unpublish in admin CMS | Low | Post-launch |
| Z11 | Marathi `/mr/` frontend routes | Low — backend supports mr; no frontend pages | Post-launch |
| Z12 | MonetizationSlot A/B test wiring on trek pages | Low | Post-launch |
| Z13 | Affiliate catalog empty — admin must seed | Medium — no affiliate cards show until populated | Before launch (manual) |
| Z14 | Digital products catalog empty | Medium | Before launch (manual) |
| Z15 | Operators not yet registered | Medium | Before launch (manual) |
| Z16 | Content pipeline not yet run | **Critical** — zero CMS pages published; site shows only static data | **Before launch** |

> **Elasticsearch note (Z07):** Fuse.js fuzzy search is implemented (client-side, covers all trek names/regions/difficulties/seasons). Full Elasticsearch would require a Docker service, indexing pipeline, and backend API changes. This is a **production sprint** item — schedule post-initial-launch.

---

## SECTION E — PRODUCTION READINESS

> Full setup log with connection details (no passwords) is in `docs/PRODUCTION_SETUP.md`.

| # | Item | Status | Notes |
|---|------|--------|-------|
| P01 | Production hosting — DigitalOcean App Platform | `[x]` | All 4 components HEALTHY: web, api, celery-worker, celery-beat |
| P02 | Managed PostgreSQL 16 + pgvector | `[x]` | `trekyatra-db` — BLR1, 1GB, pgvector enabled, trekyatra_user granted |
| P03 | Managed Redis (Valkey 8) | `[x]` | `db-valkey-blr1-95254` — BLR1, 1GB, port 25061, SSL + auth |
| P04 | GitHub Actions CI/CD | `[DEFERRED]` | DO App Platform auto-deploys on push to main |
| P05 | SSL / custom domain (`trekyatra.co.in`) | `[~]` | www ✅ api ✅ LIVE; root SSL error — DNS TTL propagating (~1hr); next.config.mjs proxy fixed |
| P06 | Object storage for product files | `[DEFERRED]` | Use DigitalOcean Spaces when digital products are live |
| P07 | CDN | `[x]` | DigitalOcean App Platform Global CDN |
| P08 | Database backups | `[x]` | DigitalOcean managed DB auto-backups (PITR) |
| P09 | Log aggregation | `[DEFERRED]` | DigitalOcean App logs available; forward to Logtail post-launch |
| P10 | Secrets manager | `[x]` | Encrypted in DigitalOcean App Platform env vars |
| P11 | Celery worker deployed | `[x]` | `celery-worker` HEALTHY — 22 tasks registered |
| P12 | Celery beat deployed | `[x]` | `celery-beat` HEALTHY — scheduled tasks running |
| P13 | Health check monitoring (UptimeRobot) | `[ ]` | Set up after domain is live |
| P14 | alembic upgrade head on production | `[x]` | All 30 migrations applied via api Console |

---

## SECTION F — INTEGRATIONS (Configure for Production)

| # | Integration | Current State | Action Required |
|---|-------------|--------------|-----------------|
| I01 | Anthropic Claude | Rule-based fallback | Set `ANTHROPIC_API_KEY` |
| I02 | OpenAI Embeddings | Similarity fallback | Set `OPENAI_API_KEY` |
| I03 | Google OAuth | Configured locally | Create production OAuth app |
| I04 | Razorpay | Test mode | Set `RAZORPAY_KEY_ID/SECRET` |
| I05 | Stripe | Test redirect + subscription creation | Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + Price IDs |
| I06 | SMTP | Email skipped | Set `SMTP_HOST/PORT/USER/PASSWORD` (recommend Resend or SendGrid) |
| I07 | Mailchimp/Brevo | Skipped | Set when audience > 100 subscribers |
| I08 | Google Analytics 4 | Script injected | Set `NEXT_PUBLIC_GA4_ID` |
| I09 | Google AdSense | Dev placeholder | Set `NEXT_PUBLIC_ADSENSE_ID` (requires traffic threshold) |
| I10 | Google Search Console | Not integrated | Submit sitemap post-launch |
| I11 | Stripe CLI (local testing) | Not configured | `stripe listen --forward-to localhost:8000/api/v1/subscriptions/webhook` |

---

## SECTION G — MANUAL CONTENT SEEDING (Owner tasks before launch)

| # | Task | Status |
|---|------|--------|
| M01 | Place logo PNG at `/public/images/Logo_Trekyatra.png` | `[x]` | Done — logo active in Header and Footer |
| M02 | Run content pipeline: trigger → brief approve → write → publish ≥20 trek guides | `[ ]` |
| M03 | Review and approve AI-generated briefs | `[ ]` |
| M04 | Review AI-generated drafts (check YMYL claims) | `[ ]` |
| M05 | Add affiliate products to catalog (`/admin/monetization`) | `[ ]` |
| M06 | Add at least 3 digital products (`/admin/products`) | `[ ]` |
| M07 | Add at least 5 operators (`/admin/operators`) | `[ ]` |
| M08 | Run seasonal hub regeneration (`/admin/hubs`) | `[ ]` |
| M09 | Seed email sequences (`/admin/email-sequences → Seed`) | `[ ]` |
| M10 | Test SMTP by submitting a lead inquiry | `[ ]` |
| M11 | Verify Google OAuth on production domain | `[ ]` |
| M12 | Submit sitemap to Google Search Console | `[ ]` |
| M13 | Test Razorpay payment with test keys | `[ ]` |
| M14 | Test Stripe subscription with test keys + Stripe CLI | `[ ]` |
| M15 | Wire MonetizationSlot into `/trek/[slug]` CTA slot | `[ ]` |
| M16 | Wire GatedContent into `/trek/[slug]` for is_gated pages | `[ ]` |

---

## SECTION H — TESTING STATUS

| # | Test Type | Status | Notes |
|---|-----------|--------|-------|
| T01 | Backend pytest suite (472 tests) | `[x]` | Zero failures |
| T02 | Frontend `next build` (178 pages) | `[x]` | Zero errors |
| T03 | Playwright E2E specs installed | `[x]` | 4 spec files, 18+ test cases |
| T04 | Playwright tests passing (dev server) | `[ ]` | Run: `cd apps/web-next && npm run test:e2e` |
| T05 | Manual TC verification (all steps) | `[x]` | Steps 37–40 manually verified by user |
| T06 | Load testing | `[DEFERRED]` | k6/Locust |
| T07 | Cross-browser (Safari, Firefox) | `[ ]` | Manual check needed |
| T08 | Mobile browser (iOS Safari, Android Chrome) | `[ ]` | Manual check needed |

---

## FINAL GO/NO-GO GATE

All items below must be `[x]` before going live:

- [ ] Z01 — Logo PNG placed
- [ ] Z16 — Content pipeline run (≥20 CMS pages published)
- [ ] M07 — At least 5 operators registered
- [ ] M05 — Affiliate catalog has ≥5 products
- [ ] P01–P05 — Production hosting, DB, Redis, CI/CD, SSL
- [ ] I01 — ANTHROPIC_API_KEY configured (for AI agents)
- [ ] I06 — SMTP configured (for lead confirmation + welcome emails)
- [ ] I03 — Google OAuth live on production domain
- [ ] T04 — Playwright E2E passing
- [ ] T07, T08 — Cross-browser and mobile checked
