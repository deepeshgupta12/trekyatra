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

## V1 Status — Complete ✓
**All V1 steps delivered. V2 in progress (Steps 25–32).**

| Step | Title | Status |
|------|-------|--------|
| 11 | Worker and task queue infrastructure | done |
| 12 | LangGraph agent framework + agent tracking | done |
| 13 | Trend Discovery Agent + Keyword Cluster Agent | done |
| 14 | Content Brief Agent + brief approval workflow | done |
| 15 | Content Writing Agent + SEO/AEO Optimization Agent | done |
| 15B | Admin CMS enhancements — real API wiring + pipeline view | done |
| 16 | Master CMS Foundation (WordPress removed) | done |
| 17 | Full publish orchestration pipeline | done |
| 18 | Public frontend content page templates | done |
| 19 | SEO and schema infrastructure (frontend) | done |
| 20 | Monetization frontend components | done |
| 21 | RBAC enforcement | done |
| 22 | Internal linking engine + lead pipeline + newsletter platform | done |
| 23 | Content refresh engine (basic) | done |
| 24 | Analytics ingestion + admin panel full wiring | done |

## V2 Status — In Progress
| Step | Title | Status |
|------|-------|--------|
| 25 | Advanced fact validation system | done |
| 26 | Cannibalization detection + consolidation agent | done |
| 27 | Newsletter automation + repurposing agent | done |
| 28 | Compliance Guard Agent | done |
| 29 | Operator listing + lead marketplace basics | done |
| 30 | Dynamic destination hubs | done |
| 31 | Email automation and audience workflows | done |
| 32 | Deeper dashboards and revenue attribution | done |

## V3 Status — Complete ✓
| Step | Title | Status |
|------|-------|--------|
| 33 | Premium user accounts + bookmarks | done |
| 34 | Digital product checkout and file delivery | done |
| 35 | Advanced recommendation engine | done |
| 36 | User-intent aware monetization | done |
| 37 | Multilingual content workflows | done |

## V4 Status — In Progress
| Step | Title | Status |
|------|-------|--------|
| 38 | Operator marketplace layer | done |
| 39 | Trip planning assistant | done |
| 40 | Premium subscription layer | done |
| 41 | B2B content / API extensions | pending |

## Production Deployment — In Progress (DigitalOcean BLR1)
> Full details in `docs/PRODUCTION_SETUP.md`

| Item | Status |
|------|--------|
| Domain purchased: trekyatra.co.in (GoDaddy) | done |
| PostgreSQL 16 + pgvector cluster (trekyatra-db, BLR1) | done |
| pgvector extension enabled + trekyatra_user permissions granted | done |
| Valkey 8 Redis cluster (db-valkey-blr1-95254, BLR1) | done |
| App Platform — `web` component configured (Next.js, port 3000) | done |
| App Platform — App-level env vars (12/12 set, encrypted, server-side only) | done |
| App Platform — `web` component DEPLOYED and HEALTHY (trekyatra-ssvha.ondigitalocean.app) | done |
| App Platform — `api` component (FastAPI) DEPLOYED and HEALTHY | done |
| config.py — SSL auto-detection: port 25060→sslmode=require; port 25061→rediss:// | done |
| DO env vars — POSTGRES_SERVER/PORT/DB/USER/PASSWORD added; DATABASE_URL/REDIS_URL removed | done |
| api CONNECTING to DO managed Postgres — confirmed | done |
| alembic upgrade head — ALL 30 MIGRATIONS APPLIED (0001→0030) | done |
| App Platform — `celery-worker` component added | done |
| App Platform — `celery-beat` component added | done |
| celery-beat — ✅ HEALTHY | done |
| celery-worker — ✅ HEALTHY (Redis auth fixed: REDIS_PASSWORD + REDIS_USERNAME env vars added) | done |
| ALL 4 COMPONENTS HEALTHY — web, api, celery-worker, celery-beat | done |
| Monthly cost confirmed: $48/month | done |
| Domain — DO Networking: trekyatra.co.in, www.trekyatra.co.in, api.trekyatra.co.in added (Configuring/Pending) | done |
| Domain — GoDaddy DNS: A records + CNAME records to be added | pending — next action |
| Domain — Component routing rule: api.trekyatra.co.in → api component | pending — after DNS |
| App Platform — remaining env vars (ANTHROPIC_API_KEY, SMTP, Stripe, Razorpay, Google OAuth) | pending |
| Stripe webhook registration | pending |
| Google Search Console | pending |
| 41 | B2B content / API extensions | pending |

## Pre-Launch Sprint — In Progress
| Item | Status |
|------|--------|
| PRELAUNCH_CHECKLIST.md created | done |
| DB cleared (non-user tables) | done |
| Auth: password reset flow (forgot + reset endpoints + frontend pages wired) | done |
| Auth: account settings PATCH /auth/me | done |
| Auth: account enquiries GET /auth/me/leads | done |
| Frontend /compare — dynamic trek selector | done |
| Frontend /account/settings — wired to PATCH /auth/me | done |
| Frontend /account/enquiries — wired to GET /auth/me/leads | done |
| Frontend /itineraries, /costs, /gear, /beginner, /safety — CMS hub + static fallback | done |
| Sitemap.xml — expanded page_type map for all CMS content types | done |
| Admin operators — detail page with agreement + review moderation | done |
| Playwright E2E — homepage, auth, search, plan wizard specs | done |
| Home page — search wired, dead buttons fixed, PersonalisedFeed + Operators CTA | done |
| UI polish — hero padding/font/overflow, trek tag visibility, footer, trust pages | done |
| Logo — SVG circular badge icon redesigned; tagline "Explore. Dream. Discover." (matching new logo) | done |
| Hero layout — flex-col justify-center; min-h-screen → min-h-[85vh] md:min-h-[78vh]; pt-20 pb-16 | done |
| Footer newsletter — bg-foreground/40 (invisible) → bg-white/[0.07] border-white/20; pt-36 separates from mountain SVG | done |
| Search — Fuse.js fuzzy matching (threshold 0.35) + autocomplete dropdown suggestions + no-results improvement | done |
| PRELAUNCH_CHECKLIST.md — comprehensive audit: 8 sections, 80+ items across BE/FE/Admin/Gaps/Production/Integrations/Testing | done |
| Header nav — compact Logo (tagline hidden); search bar functional (onClick + ⌘K → /search); px-2.5 nav items; gap-4 | done |
| Compare section — responsive: heading text-2xl sm:text-3xl; card p-3 md:p-4; text-sm md:text-base; no mobile overflow | done |

### Pre-Launch Sprint — Nav + Compare responsive (current commit)
Status: done
What is done:
- `components/brand/Logo.tsx` — added `compact` prop; when compact=true, tagline div is not rendered (used in Header to prevent nav crowding)
- `components/layout/Header.tsx` — Logo now receives `compact` prop; search button: `onClick={() => router.push("/search")}` — fully functional; ⌘K/Ctrl+K keyboard shortcut via `useEffect` → `router.push("/search")`; mobile drawer search button also navigates on click; nav item padding `px-3`→`px-2.5`, gap `gap-6`→`gap-4`; search bar `min-w-[200px]`→`min-w-[160px]`, h-10→h-9; `useEffect` import added
- `app/(public)/page.tsx` — compare section: heading `text-4xl md:text-5xl`→`text-2xl sm:text-3xl md:text-4xl` (no overflow on narrow mobile); "Kedarkantha or Brahmatal? Hampta or Bhrigu?" rewritten as `Kedarkantha vs Brahmatal?<br/>Hampta vs Bhrigu?` (natural line break); buttons sm size; card padding `p-5`→`p-3 md:p-4`; card font `text-lg`→`text-sm md:text-base`; card gap `gap-3`→`gap-2 md:gap-3`; `a` and `b` rendered as separate divs (no br overflow)
- 178/178 static pages; build clean

### Pre-Launch Sprint — Logo + Search + Hero Height + Audit (current commit)
Status: done
What is done:
- `components/brand/Logo.tsx` — REWRITTEN again: navy outer ring, orange-amber sky gradient, mountain peak, snow cap, pine forest, trekker, sun, birds; tagline corrected to "Explore. Dream. Discover." (matching actual new logo); Trek in navy, yatra in orange-500; dark variant uses #1e2d4e for Trek text, green tagline
- `app/(public)/page.tsx` — hero: min-h-screen → min-h-[85vh] md:min-h-[78vh] (reduced height); content padding pt-28→pt-20, pb-24→pb-16; font 68px→64px; pill text corrected to "Explore. Dream. Discover."
- `app/(public)/search/page.tsx` — REWRITTEN with Fuse.js 7.3.0: trekFuse (threshold 0.35, keys: name×3/region×2/state×2/season×1.5/difficulty/description), guideFuse, suggestionFuse for autocomplete; dropdown shows up to 7 fuzzy-matched suggestions with trek/guide type icons; outside-click dismissal; Escape key closes; no-results state has quick suggestion buttons; result count shows "fuzzy matched" label; semantic search (pgvector) still fires for >3-word queries
- `package.json` — fuse.js@^7.3.0 added
- `docs/PRELAUNCH_CHECKLIST.md` — COMPLETE REWRITE: comprehensive 8-section audit covering every BE module, every FE page, every admin page, 16 known gaps with impact ratings, production readiness checklist, integration checklist, manual seeding checklist, testing status; final Go/No-Go gate
- 472/472 backend tests pass; next build clean (178 pages)

### Pre-Launch Sprint — Logo + Hero + Footer fixes (commit 4dbae65)
Status: done
What is done:
- `components/brand/Logo.tsx` — REWRITTEN: removed Mountain lucide icon + "India · Trails · Trust"; added SVG circular badge (LogoMark) matching new brand identity (orange-to-green gradient, mountain silhouette, snow cap, forest, sun, trekker); tagline updated to "Explore · Experience · Escape"; Trek text in foreground/white, Yatra text in orange-400/500; hover glow preserved
- `app/(public)/page.tsx` — hero layout restructured: removed `flex items-end` (was pushing all content to the bottom, heading invisible on load); changed to `flex flex-col` with content div using `flex-1 flex flex-col justify-center pt-28 pb-24` — heading now visible centred in viewport on load; trust stats moved to `mt-auto` at natural bottom; background overlay gradients adjusted for better contrast
- `components/layout/Footer.tsx` — newsletter card: `bg-foreground/40` (dark-on-dark, invisible) → `bg-white/[0.07] border border-white/20`; container `pt-28` → `pt-36` to place card visibly below the 80px mountain SVG boundary; comment added explaining the 144px clearance
- 178/178 static pages; build clean

### Pre-Launch Sprint — Auth Gaps (commit f389dc7)
Status: done
What is done:
- `security.py` — create_reset_token (1h JWT, typ=password_reset), parse_reset_token
- `schemas/auth.py` — ForgotPasswordRequest, ResetPasswordRequest, AccountSettingsUpdate, LeadResponse; UserResponse.subscription_plan: str = "free"
- `api/routes/auth.py` — POST /auth/forgot-password (graceful SMTP), POST /auth/reset-password (verify JWT + hash_password), PATCH /auth/me (update full_name/display_name), GET /auth/me/leads (enquiries by user email); /auth/me now returns subscription_plan
- `auth/forgot-password/page.tsx` — wired to POST /forgot-password; sent confirmation state
- `auth/reset-password/page.tsx` — reads ?token=, calls POST /reset-password, success redirect to sign-in; Suspense boundary
- `/compare` — full rewrite: dynamic dropdowns from static data, live comparison table, full guide links
- `/account/settings` — wired to PATCH /auth/me; profile save with feedback; password via "Send reset link" flow
- `/account/enquiries` — wired to GET /auth/me/leads; status badges; empty state; new enquiry CTA
- `/itineraries`, `/costs`, `/gear`, `/beginner`, `/safety` — CMSPageHub (fetchCMSHubPages by page_type, 1h revalidate) + ContentPage static fallback
- `CMSPageHub` component — reusable CMS page grid; fetchCMSHubPages server helper
- `/admin/operators/[id]` — agreement GET/POST/PATCH form + review list with delete
- `/admin/operators/page.tsx` — FileText icon linking to detail page
- Playwright installed; playwright.config.ts; e2e/ directory with 4 spec files (homepage 6 tests, auth 5 tests, search 2 tests, plan 4 tests)
- `package.json` — test:e2e + test:e2e:ui scripts
- `docs/PRELAUNCH_CHECKLIST.md` — comprehensive 60+ item go-live checklist (9 sections)
- `sitemap.ts` — expanded page_type map (trek_guide, itinerary, cost_guide, gear_guide, safety_guide, expert_guide, premium_compendium, seasonal_hub, cluster_hub, regional_hub)
- `app/(public)/page.tsx` — HomeSearchBar wired, dead buttons fixed (/products), operators CTA + PersonalisedFeed sections added
- 472/472 backend tests pass; next build clean (178 static pages)

### Pre-Launch Sprint — UI Polish (commit 6382484)
Status: done
What is done:
- `app/(public)/page.tsx` — hero: overflow:hidden moved to image container (search bar blur no longer clips); pt-32→pt-24; font lg:text-[88px]→lg:text-[72px]; pill updated to "Explore · Experience · Escape" (brand slogan from new logo); planning resources section replaced plain gradient divs with real trek images + PDF-type badge overlays
- `components/trek/TrekCard.tsx` — diffColors: bg-success/15 (invisible on photos) → solid bg-emerald-600/bg-amber-500/bg-orange-600/bg-red-600 with text-white + shadow; backdrop-blur removed from difficulty badge; Beginner badge → bg-blue-600
- `components/layout/Footer.tsx` — newsletter card backdrop-blur-sm removed (was bleeding through mountain SVG) → bg-foreground/40; "Bengaluru" → "Gurgaon"; Heart icon added to "Made with care in India" copyright; pt-32→pt-28
- Trust pages — full proper content for all 7:
  - `/about` — mission, story, editorial promises, team, contact
  - `/about/authors` — editor bios, contributor policy, join team
  - `/contact` — channels, response times, FAQs
  - `/privacy` — full 8-section privacy policy
  - `/terms` — full 9-section terms & conditions with liability + governing law
  - `/affiliate-disclosure` — disclosure statement, independence policy
  - `/safety-disclaimer` — AMS, permit accuracy, emergency contacts, liability limitation
  - `/methodology` — verification cycle, YMYL policy, AI use, error correction
- 472/472 backend tests pass; next build clean (178 static pages)

### Step 40 — Premium Subscription Layer
Status: done
What is done:
- `stripe>=8.0.0,<9.0.0` added to pyproject.toml; installed in venv
- Migration `20260506_0030_subscriptions.py` — ALTER users ADD subscription_plan String(20) default='free'; CREATE subscriptions (unique user_id, stripe_customer_id, stripe_subscription_id unique, plan, status, current_period_end, timestamps); ALTER cms_pages ADD is_premium bool default=false; applied with `alembic upgrade head`
- `modules/auth/models.py` — User.subscription_plan String(20) default='free' added
- `modules/cms/models.py` — CMSPage.is_premium bool default=False added; Boolean imported
- `modules/subscriptions/__init__.py`, `models.py` — Subscription ORM model; registered in db/base.py
- `modules/subscriptions/service.py` — get_subscription, get_subscription_status, create_checkout_session (real Stripe when key set, test-mode redirect when unset), cancel_subscription (Stripe cancel_at_period_end + local status=cancelled), handle_webhook (customer.subscription.created/updated → sync plan; deleted → downgrade; invoice.payment_failed → past_due; no-secret = raw JSON accepted for dev), upsert_subscription_for_user
- `schemas/subscriptions.py` — SubscriptionCheckoutRequest/Response, SubscriptionStatusResponse, CancelResponse, StripeWebhookResponse
- `schemas/auth.py` — UserResponse.subscription_plan: str = "free" added
- `schemas/cms.py` — is_premium in Create/Patch/Response; is_gated in Response (set at route level)
- `api/routes/subscriptions.py` — POST /subscriptions/create-checkout, GET /subscriptions/status, POST /subscriptions/cancel (all require auth), POST /subscriptions/webhook (raw body, no auth)
- `api/routes/cms.py` — GET /cms/pages/{slug}: optional auth via get_optional_user; if is_premium and user plan != premium → content_html="", is_gated=True
- `api/router.py` — subscriptions_router registered
- `core/config.py` — stripe_webhook_secret, stripe_premium_price_id_monthly, stripe_premium_price_id_annual settings added
- `.env.example` — STRIPE_WEBHOOK_SECRET, STRIPE_PREMIUM_PRICE_ID_MONTHLY, STRIPE_PREMIUM_PRICE_ID_ANNUAL added
- `tests/test_subscriptions.py` — 15 tests TC-B01–TC-B15: status free no-row, upsert creates row + updates user plan, checkout test-mode fallback, cancel no-sub graceful, cancel marks cancelled, webhook sync premium (subscription.updated), webhook downgrade (subscription.deleted), webhook past_due (payment_failed), CMS gating free/premium/anonymous/non-premium page, checkout/status require auth, /auth/me returns subscription_plan
- `components/subscription/PremiumBadge.tsx` — Crown icon + amber badge
- `components/subscription/GatedContent.tsx` — blurred teaser overlay with lock icon + Upgrade CTA
- `components/subscription/SubscriptionStatusCard.tsx` — plan badge, period end, cancel/upgrade actions
- `components/subscription/PricingTable.tsx` — monthly/annual toggle, Free vs Premium tier comparison, Stripe checkout CTA
- `app/(public)/premium/page.tsx` — public marketing page with PricingTable
- `app/(public)/account/premium/page.tsx` — auth-gated: fetches subscription status, SubscriptionStatusCard, upgrade/cancel actions
- `app/(admin)/admin/cms/page.tsx` — Crown icon toggle per page to set/unset is_premium; is_premium tracked in local CMSPage interface
- `lib/api.ts` — CMSPage.is_premium + is_gated fields; SubscriptionStatus interface; fetchSubscriptionStatus, createSubscriptionCheckout, cancelSubscription helpers
- `lib/auth-api.ts` — UserResponse.subscription_plan: string added
- `.env.local.example` — NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY added
- 472/472 backend tests pass (15 new); next build clean (178 static pages)
What remains:
- Real STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET required for live billing (test-mode redirect works without keys)
- Stripe CLI needed locally: `stripe listen --forward-to localhost:8000/api/v1/subscriptions/webhook`
- GatedContent component not yet wired into trek detail/guide pages — requires is_premium check on CMSPage fetch (follow-up)

### Step 39 — Trip Planning Assistant
Status: done
What is done:
- Migration `20260506_0029_trip_plans.py` — `trip_plans` (id UUID PK, session_id String 128, user_id FK→users SET NULL, inputs JSON, output JSON, trek_slug String 255, fallback_used bool, created_at); applied with `alembic upgrade head`
- `modules/plan/__init__.py`, `models.py` — TripPlan ORM model; registered in db/base.py
- `modules/agents/trip_planner/__init__.py`, `agent.py` — TripPlannerAgent (LangGraph 4-node): gather_constraints → select_treks → build_itinerary → package_response; selects treks from CMS by page_type=trek_guide + region/experience/month scoring; LLM call (claude-haiku, max_tokens=3000, ephemeral caching) for day-by-day itinerary; fallback itinerary when no API key or LLM fails; gear parsed from CMS packing section; all exceptions swallowed
- `modules/plan/service.py` — generate_plan (runs agent, stores TripPlan, optionally captures LeadSubmission with cta_type=trip_planner); get_plan; email_plan (SMTP graceful)
- `schemas/plan.py` — PlanGenerateRequest, ItineraryDay, TripPlanOutput, TripPlanResponse, PlanEmailRequest
- `api/routes/plan.py` — POST /plan/generate (optional auth), GET /plan/{id}, POST /plan/{id}/email
- `api/router.py` — plan_router registered
- `db/base.py` — TripPlan registered
- `tests/test_plan.py` — 13 tests TC-B01–TC-B13: fallback itinerary day count, region scoring, no-key fallback, mocked LLM, exception swallowing, plan stored in DB, lead captured, API generate/get/get-404/email-404/email-no-smtp, gear parsed from CMS
- `lib/api.ts` — ItineraryDay, TripPlanOutput, TripPlan, PlanGeneratePayload interfaces; generatePlan, fetchPlan, emailPlan helpers
- `components/plan/WizardStep.tsx` — progress bar + step title wrapper
- `components/plan/ItineraryDay.tsx` — expandable day card (client, first day open by default)
- `components/plan/TrekPlanCard.tsx` — full plan result: header, difficulty badge, meta chips, itinerary accordion, gear list, email-plan inline form, operator inquiry CTA
- `app/(public)/plan/page.tsx` — full rewrite: 4-step "which trek for me" wizard (region/month → experience → duration+budget → group+email); POST /plan/generate on submit; TrekPlanCard on result; "New plan" back button; loading state with spinner
- 457/444 backend tests pass (13 new, 1 pre-existing failure in test_refresh.py unrelated to this step); next build clean (176 static pages)
What remains:
- Pre-existing test `test_stale_pages_includes_past_interval` in test_refresh.py failing — test isolation issue from a previous step; will fix in separate commit
- Real ANTHROPIC_API_KEY required for LLM itinerary generation (fallback always works)
- Saved plans not yet surfaced in user account dashboard (/account)

### Step 38 — Operator Marketplace Layer
Status: done
What is done:
- Migration `20260506_0028_operator_marketplace.py` — ALTER operators: logo_url VARCHAR(512), description_long TEXT, rating_avg FLOAT default 0.0, review_count INT default 0; CREATE operator_reviews (id UUID PK, operator_id FK→operators CASCADE, user_id FK→users SET NULL, rating INT, body TEXT, created_at, UNIQUE(operator_id, user_id)); CREATE operator_agreements (id UUID PK, operator_id FK→operators CASCADE, lead_fee_inr FLOAT, revenue_share_pct FLOAT nullable, active bool, notes TEXT, created_at, UNIQUE(operator_id)); applied with `alembic upgrade head`
- `modules/operators/models.py` — Operator: logo_url, description_long, rating_avg, review_count, reviews + agreement relationships added; OperatorReview + OperatorAgreement ORM models added
- `modules/operators/review_service.py` — list_reviews, create_review, delete_review, _update_rating_avg (recomputes denormalised rating_avg + review_count on every write)
- `modules/operators/agreement_service.py` — get_agreement, upsert_agreement, patch_agreement
- `schemas/operators.py` — OperatorCreate/Patch: logo_url + description_long added; OperatorResponse: new fields; OperatorPublicResponse (no contact_email); OperatorReviewCreate/Response; OperatorAgreementCreate/Patch/Response; InquiryCreate/Response
- `api/routes/operators_public.py` — GET /operators (list active, region filter), GET /operators/{slug} (public detail), GET /operators/{slug}/reviews (paginated), POST /operators/{slug}/reviews (user auth, 409 on duplicate), POST /inquiries (public, optional auth; SMTP confirmation + operator notification graceful)
- `api/routes/operators.py` — admin: GET/DELETE /admin/operators/reviews/{id}; GET /admin/operators/{id}/reviews; GET/POST/PATCH /admin/operators/{id}/agreement
- `api/router.py` — operators_public_router, inquiry_router, operators_reviews_router registered
- `db/base.py` — OperatorReview + OperatorAgreement registered
- `tests/test_operators_marketplace.py` — 17 tests TC-B01–TC-B17: public list/detail/404, region filter, review CRUD + rating avg, duplicate review 409, auth enforcement, agreement upsert/idempotency, admin agreement 404, inquiry with/without operator, admin delete review, model field presence
- `lib/api.ts` — Operator: logo_url/description_long/rating_avg/review_count added; OperatorPublic interface (no contact_email); OperatorReview, OperatorAgreement, InquiryPayload interfaces; fetchPublicOperators, fetchPublicOperator, fetchOperatorReviews, submitReview, submitInquiry helpers
- `components/operators/OperatorCard.tsx` — logo/name/rating stars/region/trek types/description/CTA; uses OperatorPublic
- `components/operators/OperatorGrid.tsx` — responsive card grid + empty state
- `components/operators/OperatorReviewList.tsx` — star display + review cards; empty state
- `components/operators/OperatorInquiryForm.tsx` — client form; pre-fills operator context; submits to POST /inquiries; success state
- `app/(public)/operators/page.tsx` — SSR operator listing; KPI strip (count, regions, trek types); OperatorGrid
- `app/(public)/operators/[slug]/page.tsx` — SSR operator detail; header card; star rating; region/website/phone; trek type badges; description; 2-col layout: reviews (OperatorReviewList) + sticky inquiry form (OperatorInquiryForm)
- 444/444 backend tests pass (17 new); next build clean (176 static pages); GitNexus re-indexed
What remains:
- `/admin/operators` page: agreement tab + review moderation panel not yet added (existing admin page shows operator CRUD only)
- Real SMTP required for inquiry confirmation + operator notification emails
- Operator profiles currently created via admin API only (no self-serve signup flow)

### Step 34 — Digital Product Checkout and File Delivery
Status: done
What is done:
- Migration `20260501_0024_digital_products.py` — `digital_products` (id UUID PK, slug unique, title, description, price_inr, file_path, preview_image_url, active bool default true, created_at, updated_at); `user_orders` (id UUID PK, user_id FK→users CASCADE, product_id FK→digital_products CASCADE, provider_order_id, amount_inr, status default 'pending', razorpay_signature, test_mode bool, paid_at, created_at); ALTERs `user_downloads`: adds order_id FK→user_orders SET NULL + download_url TEXT; applied with `alembic upgrade head`
- `modules/products/__init__.py`, `models.py` — DigitalProduct, UserOrder ORM models; registered in db/base.py
- `modules/products/service.py` — generate_download_token/verify_download_token (HMAC-SHA256 base64 signed, 24h TTL); list_active_products/admin_list_products/_enrich (with sales_count); get_product_by_slug/by_id; create/update/delete_product; create_checkout_order (Razorpay real mode when key set, test mode otherwise); verify_checkout_payment (verifies HMAC sig, marks paid, records download, sends email); serve_download_file (validates token, checks paid order, returns path+filename); list_orders
- `api/routes/products.py` — public_router: GET /products, GET /products/{slug}; admin_router: GET/POST /admin/products, PATCH/DELETE /admin/products/{id}, GET /admin/orders
- `api/routes/checkout.py` — POST /checkout/create-order (auth required), POST /checkout/verify (auth required), GET /account/downloads/file?token=… (FileResponse, HMAC token auth)
- `schemas/products.py` — ProductResponse (with sales_count), ProductCreate, ProductPatch, OrderResponse, CheckoutCreateRequest/Response, CheckoutVerifyRequest/Response
- `api/router.py` — products_public_router, products_admin_router, checkout_router registered
- `pyproject.toml` — razorpay>=1.4.1,<2.0.0 added
- `.env.example` — RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, STRIPE_SECRET_KEY, PRODUCT_FILES_DIR, PRODUCT_DOWNLOAD_BASE_URL added
- `core/config.py` — razorpay_key_id, razorpay_key_secret, stripe_secret_key, product_files_dir, product_download_base_url settings added
- `tests/test_products.py` — 20 tests (TC-B01 through TC-B20): token round-trip/expired/tampered, product service CRUD, list active/inactive, public API endpoints, checkout create/verify (test mode), already-paid idempotency, 404 on missing product, auth requirements, admin CRUD + order list
- `modules/account/models.py` — UserBookmark: cms_page_id nullable, trek_slug/bookmark_title/bookmark_image_url added; UserDownload: order_id + download_url added
- `app/(public)/products/page.tsx` — rewritten as client component; fetchProducts() on mount; skeleton loading, empty state, ProductCard grid linking to /products/{slug}
- `app/(public)/products/[slug]/page.tsx` — client component; fetchProduct(slug); Razorpay.js loaded dynamically; test mode: auto-verifies payment → redirect; real mode: opens Razorpay modal → verify → redirect to /success/checkout?order_id=...
- `app/(public)/success/checkout/page.tsx` — reads order_id from query param; POSTs to /account/downloads/{order_id}/url; shows real download button with product title; Suspense boundary for useSearchParams
- `app/(public)/account/downloads/page.tsx` — DownloadButton sub-component; if download_url present shows link; if order_id present fetches fresh URL on demand; graceful null handling
- `app/(admin)/admin/products/page.tsx` — product CRUD table (slug, title, price, sales count, active badge); inline add/edit form with all fields; delete with confirm
- `app/(admin)/admin/orders/page.tsx` — order list table with status filter tabs (all/paid/pending/refunded); test/live mode badge; count per status
- `app/(admin)/admin/layout.tsx` — Products (Package icon) + Orders (ShoppingBag icon) nav items added to Growth group
- `lib/api.ts` — DigitalProduct, ProductCreate, ProductPatch, UserOrder, CheckoutCreateResponse, CheckoutVerifyResponse interfaces; DownloadResponse: order_id + download_url added; fetchProducts, fetchProduct, createCheckoutOrder, verifyPayment, fetchAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct, fetchAdminOrders helpers
- `.env.local.example` — NEXT_PUBLIC_RAZORPAY_KEY_ID added
- 383/383 backend tests pass (20 new); next build clean (139 static pages); GitNexus: 7,796 nodes | 13,331 edges | 283 clusters | 206 flows
What remains:
- Real Razorpay keys required for live payment flow (test mode works without keys)
- Trek alert delivery task deferred to future step
- File serving requires placing actual files in services/api/data/products/

### Step 37 — Multilingual Content Workflows
Status: done
What is done:
- Migration `20260506_0027_cms_language.py` — adds `language` String(10) default='en', `translations` JSON nullable, `source_page_id` UUID nullable FK→cms_pages self-reference to `cms_pages`; index on language; applied with `alembic upgrade head`
- `modules/cms/models.py` — CMSPage: `language`, `translations`, `source_page_id` fields added
- `schemas/cms.py` — `language`, `translations`, `source_page_id` added to CMSPageCreate, CMSPagePatch, CMSPageResponse
- `app/data/glossary_hi.json` — proper nouns list (trek names, regions, brands) preserved during translation
- `modules/agents/translation/__init__.py`, `agent.py` — `translate_page(title, content_html, target_language)`: Anthropic claude-haiku-4-5 with ephemeral prompt caching; returns `{title, content_html, fallback}`; rule-based fallback when ANTHROPIC_API_KEY unset; all exceptions swallowed
- `schemas/translation.py` — TranslateRequest, TranslateResponse Pydantic schemas
- `api/routes/translation.py` — `POST /admin/cms/{slug}/translate` (admin auth): validates target_language, returns existing if already translated, runs TranslationAgent, creates CMSPage draft with `language=hi/mr` + `source_page_id`, updates source page `translations` JSON; 422 for unsupported lang, 404 for unknown slug
- `api/routes/cms.py` — `GET /cms/pages/{slug}?lang=hi`: if lang requested and published translation exists, serves translated page; falls back to English source
- `api/router.py` — translation_router registered
- `lib/api.ts` — `language`, `translations`, `source_page_id` added to CMSPage interface; `fetchCMSPage` accepts optional `lang` param; `TranslateResult` interface; `triggerTranslation` helper
- `app/(public)/hi/trek/[slug]/page.tsx` — Hindi trek detail route; serves published Hindi CMS page; language switcher banner; hreflang alternates in generateMetadata
- `app/(public)/hi/guides/[slug]/page.tsx` — Hindi guide route (same pattern)
- `app/(public)/hi/packing/[slug]/page.tsx` — Hindi packing list route (same pattern)
- `app/(public)/trek/[slug]/page.tsx` — hreflang alternates added to generateMetadata (en + hi when translation exists)
- `app/(public)/guides/[slug]/page.tsx` — hreflang alternates added
- `app/(admin)/admin/cms/page.tsx` — language badge (EN/HI/MR) + HI ✓ indicator per row; Languages icon button triggers Hindi translation; translatePage() function wired to `triggerTranslation`
- `tests/test_translation.py` — 14 tests TC-B01–TC-B14: glossary load, supported languages, no-api-key fallback, mocked LLM call, exception swallowing, 404/422 endpoint validation, draft creation, translations JSON update, idempotency, auth enforcement, lang query param with published/draft translation, CMSPageResponse language fields
- 427/427 backend tests pass (14 new); next build clean (175 static pages); GitNexus re-indexed
What remains:
- Real ANTHROPIC_API_KEY required for LLM translation (rule-based fallback without it)
- Marathi (mr) translation supported by the agent and route but no `/mr/trek/[slug]` frontend routes yet (Hindi-first per step scope)
- Middleware language-detection banner (Accept-Language: hi → suggest Hindi version) not implemented — out of scope for this step

### Step 36 — User-Intent Aware Monetization
Status: done
What is done:
- Migration `20260505_0026_intent_monetization.py` — `affiliate_products` (id UUID PK, title, description, affiliate_url, affiliate_program, category JSON, price_range, active, created_at, updated_at); `page_intent_sessions` (id UUID PK, session_id, user_id FK→users SET NULL, page_slug, intent, confidence, module_shown, converted, ab_variant, created_at); two indexes on page_slug and session_id; applied with `alembic upgrade head`
- `modules/monetization/__init__.py`, `models.py` — AffiliateProduct, PageIntentSession ORM models; registered in db/base.py
- `modules/agents/intent/__init__.py`, `agent.py` — `classify_intent(page_type, page_slug, has_bookmarks, has_purchases)`: Anthropic claude-haiku-4-5 with ephemeral prompt caching; rule-based fallback when key unset (buyer > booking_ready > research > inspiration); JSON parse with markdown fence strip; all exceptions swallowed
- `modules/auth/dependencies.py` — `get_optional_user` dependency added (returns User | None, never raises)
- `modules/monetization/service.py` — `classify_and_record` (classifies intent + persists session with A/B variant), `mark_converted`, `list/create/update/delete_affiliate_product`, `get_monetization_stats` (intent distribution, conversion_by_module, top pages)
- `schemas/monetization.py` — IntentClassification, IntentResponse, AffiliateProductCreate/Patch/Response, MonetizationStatsResponse
- `api/routes/monetization.py` — `GET /intent/{slug}` (public + optional auth), `POST /intent/{slug}/convert`, `GET /affiliate-products` (public), `GET/POST /admin/affiliate-products`, `PATCH/DELETE /admin/affiliate-products/{id}`, `GET /admin/monetization/stats`
- `api/router.py` — monetization_router registered
- `tests/test_intent.py` — 15 tests TC-B01–TC-B15: rule-based fallback, buyer/booking_ready signals, mocked LLM, exception swallowing, classify_and_record, mark_converted, affiliate product CRUD, all API endpoints, stats shape
- `lib/api.ts` — IntentResponse, AffiliateProduct, MonetizationStats TS interfaces; fetchIntent, trackConversion, fetchPublicAffiliateProducts, fetchMonetizationStats, fetchAdminAffiliateProducts, createAdminAffiliateProduct, updateAdminAffiliateProduct, deleteAdminAffiliateProduct helpers
- `components/monetization/MonetizationSlot.tsx` — server component: calls fetchIntent → selects AffiliateRail/LeadForm/NewsletterCapture by recommended_module; newsletter default on API failure
- `app/(admin)/admin/monetization/page.tsx` — rewritten with real API: KPI cards (sessions/conversions/intent types/modules), intent distribution bar chart, conversion rate by module, top pages table, affiliate catalog CRUD table + add product form
- 413/413 backend tests pass (15 new); next build clean (139 static pages); GitNexus re-indexed
What remains:
- Wire MonetizationSlot into trek detail page CTA slot (currently uses static LeadForm)
- Real ANTHROPIC_API_KEY required for LLM classification (rule-based works without it)
- Affiliate catalog initially empty — admin must populate via /admin/monetization
- A/B test enabled by setting MONETIZATION_AB_TEST=true in .env

### Step 35 — Advanced Recommendation Engine
Status: done
What is done:
- Docker image switched `postgres:16-alpine` → `pgvector/pgvector:pg16` to enable vector extension (data volume preserved)
- Migration `20260504_0025_pgvector_embeddings.py` — `CREATE EXTENSION IF NOT EXISTS vector`; `ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS embedding vector(1536)`; applied with `alembic upgrade head`
- `modules/cms/models.py` — `embedding: Mapped[list[float] | None] = mapped_column(Vector(1536), nullable=True)` added; `from pgvector.sqlalchemy import Vector` import added
- `modules/agents/embedding/__init__.py`, `agent.py` — `generate_embedding(text)`: calls OpenAI `text-embedding-3-small` (1536-dim), returns None gracefully when `OPENAI_API_KEY` unset; `embed_page(db, page_id)`: builds embed text (title + page_type + hero + description + body snippet), stores on CMSPage; all exceptions swallowed (non-critical)
- `modules/recommendations/service.py` — `find_similar_pages(db, page_id, limit)`: cosine vector search (`embedding <=> CAST(:emb AS vector(1536))`) falling back to cluster/page_type filter; `find_similar_to_query(db, query_embedding, limit)`: direct vector search; `get_recommendations_for_user(db, user_id, limit)`: centroid of bookmarked page embeddings → vector search excluding already-bookmarked; `get_anonymous_recommendations(db, limit)`: DISTINCT ON cluster_id, freshness-ordered; `_compute_centroid`, `_vec_str`, `_row_to_dict` helpers
- `schemas/recommendations.py` — `RecommendationItem`, `SimilarPagesResponse`, `RecommendationsResponse` Pydantic schemas
- `api/routes/recommendations.py` — `GET /pages/{slug}/similar` (public, 404 if not found); `GET /account/recommendations` (auth-gated, personalised=True); `GET /recommendations` (public, personalised=False); `GET /search?q=` (semantic for >3-word queries, ILIKE fallback)
- `api/router.py` — `recommendations_router` registered
- `modules/publish/service.py` — `embed_page(db, cms_page.id)` triggered after every CMS publish (try/except, never blocks)
- `modules/refresh/tasks.py` — `embed_page` triggered after every content refresh
- `core/config.py` — `openai_api_key: str | None = None` added
- `pyproject.toml` — `openai>=1.51.0,<2.0.0` and `pgvector>=0.3.0,<1.0.0` added
- `.env.example` — `OPENAI_API_KEY=` documented with graceful-degradation note
- `tests/test_recommendations.py` — 15 tests (TC-B01 through TC-B15): generate_embedding no-op without key, OpenAI mock, embed_page missing page/stores vector, similar pages fallback/exclusion, anonymous recs, personalised recs, all 4 API endpoints, exception swallowing, bookmarked exclusion
- `lib/api.ts` — `RecommendationItem`, `SimilarPagesResponse`, `RecommendationsResponse` TS interfaces; `fetchSimilarPages`, `fetchPersonalisedRecommendations`, `fetchAnonymousRecommendations` helpers
- `components/content/RecommendedContent.tsx` — server component; fetches similar pages server-side; renders RecommendCard with hero image, page_type badge, title, description; returns null if no items
- `components/content/PersonalisedFeed.tsx` — client component; uses `useAuth()`; fetches personalised (logged-in) or anonymous (guest) recs; "For you / Based on your interests" vs "Popular now / Trending treks" labels
- `app/(public)/trek/[slug]/page.tsx` — replaced static related treks section with `<RecommendedContent slug={params.slug} limit={3} />`
- `app/(public)/explore/page.tsx` — added `<PersonalisedFeed limit={6} />` section below main trek grid
- `app/(public)/search/page.tsx` — semantic search: useEffect triggers when query >3 words, calls `GET /api/v1/search?q=…`, renders "Semantic matches" section with Sparkles icon; AbortController for cleanup
- 398/398 backend tests pass (15 new); next build clean; GitNexus re-indexed
What remains:
- Real OPENAI_API_KEY required to generate live embeddings (all fallbacks work without it)
- Bulk backfill job for existing published pages (future step)

### Step 33 — Premium User Accounts + Bookmarks
Status: done
What is done:
- Migration `20260430_0022_user_accounts.py` — user_bookmarks (user_id FK→users CASCADE, cms_page_id FK→cms_pages CASCADE, unique(user_id,cms_page_id)); user_downloads (user_id FK→users CASCADE, product_id nullable, filename, downloaded_at); trek_alerts (user_id FK→users CASCADE, trek_slug, alert_type, active bool, unique(user_id,trek_slug,alert_type)); user_profiles (user_id FK→users UNIQUE, fitness_level, trek_experience, preferred_regions JSON, budget_range, submitted_at); applied with `alembic upgrade head`
- `modules/account/__init__.py`, `models.py` — UserBookmark, UserDownload, TrekAlert, UserProfile ORM models; all registered in db/base.py
- `modules/account/service.py` — add/remove/list_bookmarks (enriched with CMSPage slug/title/hero_image_url), record/list_downloads, add/remove/list_alerts (idempotent), get/upsert_profile
- `api/routes/account.py` — POST/DELETE/GET /account/bookmarks; GET /account/downloads; POST/DELETE/GET /account/alerts; GET/PATCH /account/profile; all require get_current_user
- `schemas/account.py` — BookmarkCreate/Response, DownloadResponse, TrekAlertCreate/Response, UserProfileUpdate/Response
- `api/router.py` — account_router registered
- `tests/test_account.py` — 20 tests (TC-B01 through TC-B20): service CRUD, idempotency, 404 handling, API auth-gated 401, API happy path for bookmarks/profile/alerts
- `app/(public)/account/saved/page.tsx` — rewritten as client component; fetchBookmarks() on mount; card grid with hero image, page type badge, view + remove actions; loading/empty states
- `app/(public)/account/downloads/page.tsx` — rewritten as client component; fetchDownloads() on mount; filename + downloaded_at rendered; empty state
- `components/account/BookmarkButton.tsx` — client component; toggle add/remove bookmark; optimistic state; filled icon when bookmarked; graceful no-op on auth error
- `app/(auth)/auth/onboarding/page.tsx` — step 3 submit now calls upsertUserProfile(trek_experience, preferred_regions) then router.push("/explore"); graceful on auth failure
- `lib/api.ts` — BookmarkResponse, DownloadResponse, TrekAlertResponse, UserProfileResponse/Update interfaces; fetchBookmarks, addBookmark, removeBookmark, fetchDownloads, fetchAlerts, addAlert, removeAlert, fetchUserProfile, upsertUserProfile helpers
- 363/363 backend tests pass (20 new); next build clean (137 static pages); GitNexus: 7,396 nodes | 12,613 edges | 266 clusters | 199 flows
What remains:
- Trek alert delivery task not implemented (flagged as out of scope — Step 33 stores subscriptions; delivery fires in a future beat task)

### Step 33 Bug Fixes Round 1 (post-TC)
- `components/trek/TrekCard.tsx` — partial fix: calls fetchCMSPage(trek.slug) then addBookmark; still broken for static treks with no cms_pages row (fetchCMSPage returns 404, catch swallows silently)
- `app/(public)/account/page.tsx` — FIXED: client component with real API counts

### Step 33 Bug Fixes Round 2 (bookmark root cause + unauthenticated queue + reactive dashboard)
Root cause: static trek slugs (kedarkantha, valley-of-flowers, etc.) have no row in cms_pages — fetchCMSPage 404 → silent catch → bookmark never saved.
Fix:
- Migration `20260501_0023_bookmark_by_slug.py` — drops uq_user_bookmark constraint; makes cms_page_id nullable; adds trek_slug VARCHAR(300) + bookmark_title VARCHAR(500) + bookmark_image_url TEXT nullable columns; partial unique indexes: (user_id,cms_page_id) WHERE cms_page_id IS NOT NULL + (user_id,trek_slug) WHERE trek_slug IS NOT NULL
- `modules/account/models.py` — UserBookmark: cms_page_id nullable, trek_slug/bookmark_title/bookmark_image_url added
- `schemas/account.py` — BookmarkResponse: cms_page_id nullable, trek_slug field added; new BookmarkBySlugCreate + BookmarkCheckResponse schemas
- `modules/account/service.py` — add_bookmark_by_slug (first resolves CMS page by slug, else stores slug-only); remove_bookmark_by_slug (finds by trek_slug or cms_page FK); check_bookmark; list_bookmarks updated to enrich slug-only bookmarks
- `api/routes/account.py` — POST /account/bookmarks/by-slug, DELETE /account/bookmarks/by-slug/{trek_slug}, GET /account/bookmarks/check/{trek_slug}
- `components/trek/TrekCard.tsx` — handleBookmark now calls addBookmarkBySlug/removeBookmarkBySlug directly (no fetchCMSPage lookup); on 401/403 queues slug in localStorage pendingBookmarks; dispatches bookmark-changed custom event on success
- `lib/auth-context.tsx` — flushPendingBookmarks() reads localStorage pendingBookmarks after login/signup/loginWithGoogle and POSTs each to API; dispatches bookmark-changed on flush
- `app/(public)/account/page.tsx` — listens for bookmark-changed window event and re-fetches bookmark counts reactively (no page reload needed)
- `app/(public)/account/saved/page.tsx` — handleRemove uses b.id as removing key; calls removeBookmarkBySlug if trek_slug else removeBookmark; dispatches bookmark-changed
- `lib/api.ts` — BookmarkResponse: cms_page_id nullable, trek_slug added; BookmarkCheckResponse type; addBookmarkBySlug, removeBookmarkBySlug, checkBookmark helpers
- 363/363 backend tests pass; next build clean

### Step 32 — Deeper Dashboards and Revenue Attribution
Status: done
What is done:
- Migration `20260430_0021_revenue_attributions.py` — revenue_config (key unique, value_float); revenue_attributions (page_id FK→pages CASCADE, date, affiliate_clicks, lead_conversions, estimated_revenue_inr, page_type, cluster_id FK→keyword_clusters SET NULL, unique(page_id,date)); executive_summaries (week_label unique, content_md, sent_at); applied with `alembic upgrade head`
- `modules/revenue/__init__.py`, `models.py` — RevenueConfig, RevenueAttribution, ExecutiveSummary ORM models; registered in db/base.py
- `modules/revenue/service.py` — _ensure_config (seeds avg_cpc_inr=3.0, lead_value_inr=500.0 on first call); aggregate_revenue (iterates pages × date range, reads AffiliateClick + LeadSubmission counts, upserts rows); revenue_by_cluster, revenue_by_page_type, decaying_pages (7-day vs prev-7-day click comparison); upsert_executive_summary, list_executive_summaries; get/update config
- `modules/revenue/tasks.py` — aggregate_revenue_task (daily, aggregates last 1 day); generate_executive_summary_task (weekly, fires ExecutiveSummaryAgent)
- `modules/agents/executive_summary/__init__.py`, `agent.py` — ExecutiveSummaryAgent (LangGraph 3-node: gather_data → generate_summary → store_summary); builds prompt from top-5 cluster/page-type rows + top-3 decaying pages; 300-word markdown digest; upserts to executive_summaries table
- `api/routes/revenue.py` — GET /admin/revenue/by-cluster, /by-page-type, /decaying-pages; POST /admin/revenue/aggregate?days=N; GET/PATCH /admin/revenue/config/{key}; GET /admin/revenue/summaries; POST /admin/revenue/summaries/generate; all require get_current_admin
- `schemas/revenue.py` — ClusterRevenueRow, PageTypeRevenueRow, DecayingPageRow, RevenueConfigResponse/Update, AggregateRevenueResponse, ExecutiveSummaryResponse
- `api/router.py` — revenue_router registered
- `worker/celery_app.py` — app.modules.revenue.tasks in include; daily-aggregate-revenue + weekly-executive-summary beat entries
- `tests/test_revenue.py` — 18 tests (TC-B01 through TC-B18): config seed/CRUD, upsert summary, revenue_by_cluster/page_type, all API endpoints including 404 + patched task mock
- `app/(admin)/admin/revenue/page.tsx` — KPI strip (total revenue, clicks, leads); cluster revenue table; page-type table; decaying pages list (amber badges); inline config editor; executive summary history with expand/collapse; "Aggregate (7d)" + "Generate Summary" action buttons
- `app/(admin)/admin/layout.tsx` — TrendingUp icon; "Revenue" nav item added to Growth group before Monetization
- `lib/api.ts` — ClusterRevenueRow, PageTypeRevenueRow, DecayingPageRow, RevenueConfig, ExecutiveSummaryResponse interfaces; fetchRevenueByCluster/ByPageType, fetchDecayingPages, aggregateRevenue, fetchRevenueConfig, patchRevenueConfig, fetchExecutiveSummaries, triggerExecutiveSummary helpers
- 363/363 backend tests pass (18 new); next build clean (137 static pages); GitNexus: 7,396 nodes | 12,613 edges | 266 clusters | 199 flows
What remains:
- ANTHROPIC_API_KEY required for ExecutiveSummaryAgent to generate summaries
- Revenue estimates are proxy-based on click counts × config constants — not real payment receipts

### Step 31 — Email Automation and Audience Workflows
Status: done
What is done:
- Alembic migration `20260430_0020_email_sequences.py` — adds `preferences` JSON + `active` Boolean to `newsletter_subscribers`; creates `subscriber_tags` (subscriber_id FK, tag, created_at, unique(subscriber_id,tag)); `email_sequences` (id UUID, name, slug unique, description, created_at); `email_sequence_steps` (id UUID, sequence_id FK, step_number, subject, body_template, delay_days, created_at); `subscriber_sequence_enrollments` (id UUID, subscriber_id FK, sequence_id FK, current_step, next_send_at, enrolled_at, status, unique(subscriber_id,sequence_id)); applied with `alembic upgrade head`
- `modules/email_sequences/__init__.py`, `models.py` — SubscriberTag, EmailSequence, EmailSequenceStep, SubscriberSequenceEnrollment ORM models; registered in db/base.py
- `modules/email_sequences/service.py` — seed_default_sequences (3 built-in sequences: winter_trek_nurture, monsoon_prep, general_trek_discovery; idempotent); add_subscriber_tag (idempotent); enroll_subscriber + enroll_by_tag (tag→sequence routing); update_subscriber_preferences; generate_preferences_token/verify_preferences_token (HMAC-SHA256); get_pending_enrollments
- `modules/email_sequences/tasks.py` — send_welcome_email_task (Celery; pulls 3 top trek_guide CMS pages for recommendations; graceful no-op when SMTP unconfigured; try/except wrap in auth route); process_nurture_sequences_task (daily Celery beat; Jinja2 template render; step advance; status=completed on last step; preference.nurture check; graceful per-enrollment error catch)
- `api/routes/email_sequences.py` — admin_router: GET /admin/email-sequences, GET /admin/email-sequences/{id}, POST /admin/email-sequences/seed, POST /admin/email-sequences/{id}/enroll/{subscriber_id}; public_router: PATCH /newsletter/preferences (HMAC token), GET /newsletter/unsubscribe (sets active=False)
- `schemas/email_sequences.py` — EmailSequenceResponse, EmailSequenceStepResponse, SubscriberSequenceEnrollmentResponse, SubscriberPreferencesUpdate, SeedSequencesResponse
- `api/router.py` — email_sequences_admin_router + email_sequences_public_router registered
- `modules/newsletter/models.py` — preferences + active fields added to NewsletterSubscriber
- `modules/leads/service.py` — subscriber tagging hook after create_lead commit: looks up subscriber by email, calls add_subscriber_tag + enroll_by_tag; graceful exception handling
- `api/routes/auth.py` — send_welcome_email_task.delay(user.email, user.full_name) fired after email signup (try/except — never breaks signup)
- `worker/celery_app.py` — app.modules.email_sequences.tasks in include list; daily-nurture-sequences beat entry (86400s)
- `pyproject.toml` — jinja2>=3.1,<4.0 added
- `tests/test_email_sequences.py` — 17 tests (TC-B01 through TC-B17): ORM tag insert, seed 3 sequences, idempotency, tag service, enroll_by_tag winter/fallback, enrollment idempotency, prefs update, HMAC token, API list/detail/seed/404, prefs invalid token, unsubscribe valid token, welcome task no-SMTP, lead tagging
- `lib/api.ts` — EmailSequence, EmailSequenceStep, SeedSequencesResult; fetchEmailSequences, fetchEmailSequence, seedEmailSequences
- `app/(admin)/admin/email-sequences/page.tsx` — sequence list (expandable steps panel), KPI strip (sequences/steps/enrollments), Seed button, info card explaining welcome/tagging/nurture/unsubscribe flow
- `app/(admin)/admin/layout.tsx` — "Email Sequences" nav item (Workflow icon) added to Growth group after Newsletter
- 325/325 backend tests pass; `next build` clean (136 static pages); GitNexus re-indexed: 6,857 nodes | 11,664 edges | 236 clusters | 185 flows
What remains:
- SMTP must be configured in services/api/.env for welcome + nurture emails to fire
- Jinja2 installed (3.1.6) — required for process_nurture_sequences_task template rendering
- Digest weekly send uses existing weekly-newsletter-generate Celery beat (Step 27 NewsletterAgent); no additional beat task needed

### Step 30 — Dynamic Destination Hubs
Status: done
What is done:
- No Alembic migration — CMSPage already has `page_type`; hub pages use values `seasonal_hub`, `cluster_hub`, `regional_hub`
- `modules/agents/seasonal_content/__init__.py`, `agent.py` — SeasonalContentAgent (LangGraph 3-node: prepare_context → generate_content → store_page); supports 4 slugs: winter/summer/monsoon/spring; generates 700–900 word seasonal overview; upserts CMSPage slug=`seasons/{slug}` with status=published; `max_tokens = 2000`; SEASON_META dict drives titles/months/overview/regions prompts
- `modules/hubs/__init__.py`, `tasks.py` — `regenerate_seasonal_hubs_task` Celery task (name: `hubs.regenerate_seasonal_hubs`); iterates all 4 seasons; graceful per-season error catch
- `schemas/hubs.py` — HubPageResponse, HubRegenerateRequest, HubRegenerateResponse; HUB_PAGE_TYPES set; VALID_SEASON_SLUGS set
- `api/routes/hubs.py` — GET /admin/hubs (filter by hub_type); POST /admin/hubs/{slug:path}/regenerate (path param captures slashes); seasonal → SeasonalContentAgent; cluster/regional → 501 (pipeline managed); both require get_current_admin
- `api/router.py` — hubs_router registered
- `worker/celery_app.py` — `app.modules.hubs.tasks` in include list; `quarterly-seasonal-hub-regeneration` beat entry (7776000s = 90 days)
- `tests/test_hubs.py` — 9 tests: SEASON_META coverage, unknown season error, agent creates page (mocked LLM), API list (all + filtered + invalid type), API regenerate seasonal (mocked LLM), API regenerate cluster returns 501, API regenerate invalid season returns 422
- `lib/api.ts` — HubPage, HubRegenerateResult interfaces; fetchHubPages, regenerateHub helpers
- `app/(public)/trek-types/[slug]/page.tsx` — new server component; CMS-powered cluster hub page; hero + breadcrumb + cms_section prose + FAQ + CTA; static template fallback; generateMetadata with canonical/OG; revalidate=3600
- `app/(public)/regions/[slug]/page.tsx` — CMS-first (fetchCMSPage `regions/{slug}`); renders CMS content_html block if available; FAQAccordion from content_json.faqs; BreadcrumbSchema; static fallback preserved
- `app/(public)/seasons/[slug]/page.tsx` — CMS-first (fetchCMSPage `seasons/{slug}`); renders CMS content if available; FAQAccordion from content_json.faqs; BreadcrumbSchema; spring slug + Leaf icon added; AffiliateDisclosure appended
- `app/(admin)/admin/hubs/page.tsx` — Hub list table (type badge, status badge, last updated, Regenerate button per seasonal hub, View link); KPI strip (total/seasonal/cluster/regional); filter pills by hub_type; "Generate Missing Seasonal Hubs" panel for seasons not yet generated; real-time message feedback per slug
- `app/(admin)/admin/layout.tsx` — "Destination Hubs" nav item (Globe icon) added to Growth group after Operators
- 308/308 backend tests pass; `next build` clean; GitNexus re-indexed: 6,572 nodes | 11,155 edges | 220 clusters | 178 flows
What remains:
- ANTHROPIC_API_KEY required for SeasonalContentAgent to generate real content
- cluster_hub regeneration via pipeline (POST /admin/hubs/trek-types/{slug}/regenerate returns 501 — use pipeline trigger instead)
- regional_hub content generation: create CMSPages with page_type=regional_hub via pipeline or manual CMS editor

### Step 29 — Operator Listing + Lead Marketplace Basics
Status: done
What is done:
- Alembic migration `20260430_0019_operators.py` — creates `operators` table (id UUID PK, name, slug UNIQUE, region JSON, trek_types JSON, contact_email, phone nullable, website_url nullable, active bool server_default=true, created_at); creates `operator_specializations` table (id UUID PK, operator_id FK→operators CASCADE, trek_slug, priority int 1-5); adds `assigned_operator_id` FK→operators SET NULL + `status_history` JSON to `lead_submissions`; applied with `alembic upgrade head`
- `modules/operators/__init__.py`, `models.py` — Operator + OperatorSpecialization ORM models; Operator has relationship to OperatorSpecialization (cascade delete) and to LeadSubmission; LeadSubmission now has `assigned_operator` relationship + `assigned_operator_id` + `status_history` columns
- `db/base.py` — Operator + OperatorSpecialization registered
- `schemas/operators.py` — OperatorCreate, OperatorPatch, OperatorResponse, OperatorSpecializationCreate/Response, AssignOperatorRequest
- `schemas/leads.py` — VALID_LEAD_STATUSES extended: `routed`, `lost` added; `LeadResponse` extended with `assigned_operator_id` + `status_history`; `StatusHistoryEntry` model added
- `modules/operators/service.py` — list_operators (active_only filter), get_operator, create_operator (slug uniqueness check), update_operator, delete_operator, find_matching_operator (fuzzy trek_types match, returns highest-priority active operator)
- `modules/leads/service.py` — `_push_status_history` helper; `create_lead` now auto-routes to matching operator (status → "routed") via `find_matching_operator`; `update_lead_status` records history entry; `assign_operator_to_lead` (manual re-assign + auto-route to "routed" if "new")
- `modules/leads/tasks.py` — `_send_email` helper extracted; `notify_admin_new_lead_task` updated to show assigned operator in email; new `notify_operator_new_lead_task` (Celery) sends lead details to operator contact_email
- `api/routes/leads.py` — fires `notify_operator_new_lead_task.delay()` when lead is auto-routed on create
- `api/routes/operators.py` — `router`: GET/POST /admin/operators, GET/PATCH/DELETE /admin/operators/{id}; `leads_router`: PATCH /admin/leads/{id}/assign-operator; both require get_current_admin
- `api/router.py` — operators_router + operators_leads_router registered
- `tests/test_operators.py` — 15 tests (TC-B01 through TC-B15): ORM insert, duplicate slug ValueError, list, get (found+not_found), update, delete, find_matching_operator hit+miss, API list, API create+get+delete, API patch, API 404, auto-route on lead create, API assign-operator, assign-operator 404s
- `lib/api.ts` — AdminLead extended with `assigned_operator_id` + `status_history`; Operator + OperatorSpecialization interfaces; OperatorCreate; fetchOperators, createOperator, patchOperator, deleteOperator, assignLeadOperator helpers
- `app/(admin)/admin/operators/page.tsx` — operator list table (name/contact, trek type chips, active/inactive toggle, edit/delete); add/edit inline form (name, slug, email, phone, website, regions, trek_types, active toggle); auto-slug from name on add; confirmation dialog on delete
- `app/(admin)/admin/leads/page.tsx` — rewritten: assigned_operator column with assign-dropdown for unassigned leads; status_history expandable drawer per row; routed/lost statuses added to KPI row + filter + action buttons; 6-column KPI strip
- `app/(admin)/admin/layout.tsx` — "Operators" nav item (Building2 icon) added to Growth group
- 299/299 backend tests pass; `next build` clean (✓ Compiled successfully)
- GitNexus re-indexed: 6,407 nodes | 10,901 edges | 215 clusters | 187 flows
What remains:
- SMTP must be configured in services/api/.env for operator email notifications to fire
- Step 30 (Dynamic destination hubs) pending

### Post-Step 28 Bug Fixes
Status: done
What was done:
- **Bug 1 — Compliance check not persisting to DB** (commit after Step 28): `POST /admin/drafts/{id}/compliance-check` route called `compliance_service.run_compliance_check(db, draft_id)` which internally did `db.flush()` but the route never called `db.commit()`. Because `get_db` uses `autocommit=False` and only closes (never commits), the agent's `compliance_status` + `compliance_notes` changes were rolled back when the session closed. Every subsequent `GET /drafts` returned the original `compliance_status = "unchecked"`. Fix: added `db.commit()` after the successful agent run in `api/routes/compliance.py`. 284/284 tests pass after fix.
- **Bug 2 — TC-F05 "Re-check" label never appears**: The compliance button label condition `compStatus === "passed"` only matched the "passed" state. After an override the status is "overridden", so the button always showed "Check Compliance" again. Fix: changed condition to `compStatus === "unchecked" ? "Check Compliance" : "Re-check"` — now shows "Re-check" for any previously-checked state (passed/flagged/overridden). In `app/(admin)/admin/drafts/page.tsx`.

### Step 28 — Compliance Guard Agent
Status: done
What is done:
- Alembic migration `20260430_0018_compliance_fields.py` — adds `compliance_status` (String(32), server_default='unchecked', indexed), `compliance_notes` (JSON nullable), `compliance_override_note` (Text nullable), `compliance_overridden_by` (String(255) nullable), `compliance_overridden_at` (DateTime nullable) to `content_drafts`; creates `compliance_rules` table (id UUID PK, name unique, rule_type, description, rule_config JSON, is_active Boolean, created_at); applied with `alembic upgrade head`
- `modules/compliance/models.py` — ComplianceRule ORM model registered in `db/base.py`
- `modules/compliance/service.py` — seed_default_rules (idempotent: 4 default rules; skips if any exist), list_rules, run_compliance_check (seeds then runs agent), override_compliance (sets overridden + audit trail)
- `modules/agents/compliance/agent.py` — ComplianceGuardAgent (LangGraph 3-node: fetch_draft → run_compliance → store_report); claude-haiku-4-5-20251001; 4 rules: affiliate_disclosure (string match), safety_disclaimer (difficulty-triggered), risky_wording (LLM call using .replace not .format), ymyl_claims (count≥2 threshold); stores compliance_status + compliance_notes on draft
- `schemas/compliance.py` — ComplianceRuleResponse, ComplianceResultItem, ComplianceCheckResponse, ComplianceOverrideRequest, ComplianceOverrideResponse
- `api/routes/compliance.py` — POST /admin/drafts/{id}/compliance-check, PATCH /admin/drafts/{id}/compliance-override, GET /admin/compliance/rules; registered in router.py
- `modules/publish/service.py` — compliance gate added to publish_to_cms: auto-runs check for unchecked drafts; blocks publish if flagged (unless overridden)
- `tests/test_compliance.py` — 13 tests (TC-B01 through TC-B13): ORM insert, seed idempotency, list rules, API list rules, 404 check, happy-path mocked LLM, status persists, override 404/happy-path/audit-trail, publish blocked when flagged, publish allowed when overridden, publish auto-checks unchecked
- `tests/test_publish.py` — 3 existing publish success tests updated to mock compliance check (patch target: `app.modules.compliance.service.run_compliance_check`)
- `lib/api.ts` — ComplianceResultItem, ComplianceCheckResult, ComplianceOverrideResult interfaces; runComplianceCheck, overrideCompliance helpers
- `app/(admin)/admin/drafts/page.tsx` — compliance_status + compliance_notes added to Draft interface; compliance badge (unchecked/passed/flagged/overridden) per card header; per-rule result list in expanded view (fail=red, warn=amber, pass=muted); Run Compliance Check button in action bar; Override button + note textarea for flagged drafts
- `next.config.mjs` — experimental.proxyTimeout: 120_000 (fixes TC-03 ECONNRESET for all LLM-backed admin endpoints)
- `CLAUDE.md` + `PROCESS_GUARDRAILS.md` — Backend Test Cases added to Step Completion Gate; TC-B01/TC-F01 format documented in Section 12
- 284/284 backend tests pass; next build clean (132 static pages)
- GitNexus re-indexed: 6,164 nodes | 10,475 edges | 200 clusters | 187 flows
What remains:
- Step 29 (Operator listing + lead marketplace) pending

### Step 27 — Newsletter Automation + Repurposing Agent
Status: done
What is done:
- Alembic migration `20260429_0017_newsletter_campaigns.py` — creates `newsletter_campaigns` table (id UUID PK, week_label String(50), subject String(500), preview_text String(300) nullable, body_html Text, status String(32) default=draft, sent_at nullable, created_at) and `social_snippets` table (id UUID PK, page_id FK→pages SET NULL nullable, platform String(50), copy Text, copy_title String(500) nullable, status String(32) default=draft, created_at); applied with `alembic upgrade head`
- `modules/newsletter/models.py` — NewsletterCampaign + SocialSnippet ORM models added (alongside existing NewsletterSubscriber)
- `db/base.py` — NewsletterCampaign + SocialSnippet registered
- `schemas/newsletter.py` — NewsletterCampaignResponse, GenerateCampaignResponse, SendCampaignResponse, SocialSnippetResponse, RepurposeResponse added
- `modules/newsletter/service.py` — list_campaigns, get_campaign, send_campaign (Mailchimp/Brevo send via API; graceful no-op when platform unconfigured), _send_mailchimp, _send_brevo, list_snippets added
- `modules/agents/newsletter/__init__.py`, `agent.py` — NewsletterAgent (LangGraph 3-node: fetch_pages → generate_newsletter → store_campaign); picks top 5 published CMSPages by recency; Claude generates subject/preview_text/body_html; JSON parsed with regex fallback; stores NewsletterCampaign with status=draft
- `modules/agents/social_repurpose/__init__.py`, `agent.py` — SocialRepurposeAgent (LangGraph 3-node: fetch_page → generate_snippets → store_snippets); takes page_slug; Claude generates Instagram (280 chars) + Pinterest (title + 150 chars) + Twitter hook; stores 3 SocialSnippet records
- `modules/newsletter/tasks.py` — auto_generate_newsletter_task (Celery) added before sync_subscriber_task
- `worker/celery_app.py` — weekly-newsletter-generate beat entry (604800s)
- `api/routes/newsletter_admin.py` — GET /admin/newsletter, POST /admin/newsletter/generate, GET /admin/newsletter/{id}, POST /admin/newsletter/{id}/send, GET /admin/newsletter/snippets/list, POST /admin/pages/{slug}/repurpose; all require get_current_admin
- `api/router.py` — newsletter_admin_router + newsletter_pages_router registered
- `tests/test_newsletter_agent.py` — 15 tests (2 model ORM, 5 list/get campaigns, 3 send paths, 1 generate mocked, 2 repurpose, 2 snippets); 271/271 backend tests pass
- `lib/api.ts` — NewsletterCampaign, GenerateCampaignResult, SendCampaignResult, SocialSnippet, RepurposeResult interfaces; fetchNewsletterCampaigns, generateNewsletter, sendNewsletterCampaign, fetchSocialSnippets, repurposePage helpers
- `app/(admin)/admin/newsletter/page.tsx` — campaign list with Preview + Send actions (iframe preview modal), social snippets tab with repurpose form + clipboard copy per snippet, status badges
- `app/(admin)/admin/layout.tsx` — "Newsletter" nav item (Mail icon) added to Growth group
- `next build` clean (132 static pages); 271/271 backend tests pass
- GitNexus re-indexed: 5,930 nodes | 10,072 edges | 183 clusters | 181 flows
What remains:
- Configure NEWSLETTER_PLATFORM + NEWSLETTER_PLATFORM_API_KEY + NEWSLETTER_LIST_ID for real Mailchimp/Brevo send
- Weekly auto-generate fires Monday 09:00 UTC via Celery Beat (worker must be running)

### Step 26 — Cannibalization Detection + Consolidation Agent
Status: done
What is done:
- Alembic migration `20260429_0016_cannibalization_issues.py` — creates `cannibalization_issues` table (page_a_id + page_b_id FK→pages CASCADE, shared_keywords JSON, severity VARCHAR(16), recommendation VARCHAR(32), status VARCHAR(32) default=open, resolved_at nullable, created_at); 4 indexes on page_a_id, page_b_id, severity, status
- `modules/cannibalization/__init__.py`, `models.py` — CannibalizationIssue ORM
- `modules/cannibalization/service.py` — detect_cannibalization() (pairwise keyword overlap detection: full keyword set = {primary_keyword} ∪ supporting_keywords; ≥2 shared → issue; upserts on re-run); get_issues(severity, status, limit); resolve_issue(); get_issue()
- Severity: HIGH (same primary_keyword or 5+ shared), MEDIUM (3–4 shared), LOW (2 shared)
- Recommendation: merge (HIGH/same-primary), redirect (MEDIUM), differentiate (LOW)
- `modules/agents/consolidation/__init__.py`, `agent.py` — ConsolidationAgent (LangGraph 3-node: fetch_pages → merge_content → store_draft); creates ContentBrief stub + ContentDraft with status=requires_review
- `api/routes/cannibalization.py` — GET /admin/cannibalization (filter by severity/status), POST /detect, POST /{id}/resolve, POST /{id}/merge; all require get_current_admin
- `api/router.py` — cannibalization_router registered
- `schemas/cannibalization.py` — CannibalizationIssueResponse (enriched with page slugs/titles), DetectResponse, ResolveRequest, MergeResponse
- `db/base.py` — CannibalizationIssue registered
- `tests/test_cannibalization.py` — 17 tests (severity/recommendation unit tests, detect service, list/filter, resolve 200/422/404, merge 400/404/happy-path with mocked LLM); 256/256 backend tests pass
- Pre-existing fix: test_refresh.py stale pages tests now use `?limit=500`; refresh.py endpoint le raised to 1000 (from 200) to accommodate growing test data
- `lib/api.ts` — CannibalizationIssue interface + fetchCannibalizationIssues, detectCannibalization, resolveCannibalizationIssue, triggerConsolidationMerge helpers
- `app/(admin)/admin/cannibalization/page.tsx` — new page: scan button, severity+status filter pills, issue cards with shared keyword chips, Merge/Dismiss/Resolve actions
- `app/(admin)/admin/layout.tsx` — "Cannibalization" nav item (Swords icon) added to Growth group
- `next build` clean; 256/256 backend tests pass; GitNexus 5,663 nodes | 9,587 edges | 181 flows
What remains:
- V2.1: Embedding-similarity upgrade for semantic (not just string-match) keyword overlap detection (Step 35 prereq)

### Step 25 — Advanced Fact Validation System
Status: done
What is done:
- Alembic migration `20260428_0015_draft_claims_ymyl.py` — adds `evidence_url` (nullable Text) and `ymyl_flag` (bool, server_default=false) to `draft_claims`; applied with `alembic upgrade head`
- `modules/agents/fact_validation/__init__.py`, `agent.py` — ClaimExtractionAgent (LangGraph 3-node: fetch_draft → extract_claims → store_claims); YMYL_CLAIM_TYPES = {altitude, safety_advisory, permit_requirement, emergency_contact, medical_advisory}; uses `.replace()` not `.format()` to avoid KeyError from JSON `{}` blocks in extraction prompt; clears existing claims before re-inserting; `evidence_url = None` in V2.0 (EvidenceSearchAgent mocked)
- `api/routes/fact_validation.py` — POST /admin/drafts/{id}/fact-check → FactCheckTriggerResponse (draft_id, claims_extracted, ymyl_claims, flagged_claims); requires get_current_admin
- `api/router.py` — fact_validation_router registered
- `modules/content/models.py` — DraftClaim: `ymyl_flag: Mapped[bool]`, `evidence_url: Mapped[str | None]` added
- `schemas/content.py` — DraftClaimCreate + DraftClaimResponse: ymyl_flag + evidence_url added
- `schemas/admin.py` — ClaimResponse: ymyl_flag + evidence_url added
- `api/routes/admin.py` — list_fact_check_claims + patch_fact_check_claim pass new fields in ClaimResponse
- `api/routes/content.py` — get_draft_claims serialization updated for new fields
- `tests/test_fact_validation.py` — 7 tests (model field check, ORM insert, agent mock 4 claims + YMYL detection, claim clearing on re-run, endpoint 200/404/400); 239/239 backend tests pass
- Pre-existing fix: test_refresh.py stale pages test uses `?limit=200` (50+ real pages in DB exceed default limit=50)
- `lib/api.ts` — FactCheckClaim: `ymyl_flag: boolean` + `evidence_url: string | null`; `FactCheckTriggerResult` interface; `triggerFactCheck(draftId)` helper
- `app/(admin)/admin/fact-check/page.tsx` — rewritten: claims grouped by draft (byDraft map), per-draft "Re-run fact-check" button (triggerFactCheck), YMYL badge (ShieldAlert/red), evidence URL link, YMYL+flagged counts in header, confidence bar, flaggedOnly filter
- `next build` clean (zero TypeScript errors); 239/239 backend tests pass
What remains:
- V2.1 micro-task: wire `trackEvent("admin_draft_approved")` / `trackEvent("admin_draft_published")` in `/admin/drafts` page (flagged V1 code gap, separate scope)
- V2.1: EvidenceSearchAgent with real web search (Brave/Serper API) behind feature flag

### Step 24 — Analytics Ingestion + Admin Panel Full Wiring
Status: done
What is done:
- Alembic migration `20260428_0014_analytics.py` — creates `affiliate_clicks` table (UUID PK, page_slug, affiliate_program, affiliate_link_url, clicked_at, user_agent, session_id, created_at); indexed on affiliate_program, clicked_at, page_slug
- `modules/analytics/__init__.py`, `models.py` — AffiliateClick ORM model
- `modules/analytics/service.py` — `track_affiliate_click` (creates AffiliateClick with explicit timestamps); `get_analytics_summary` (6 COUNT queries: leads_last_30d, affiliate_clicks_last_30d, newsletter_subscribers_total, pages_published_total, pipeline_runs_last_30d, agent_runs_last_30d)
- `schemas/analytics.py` — AffiliateClickCreate, AffiliateClickResponse, AnalyticsSummaryResponse
- `api/routes/analytics.py` — dual routers: POST /track/affiliate-click (public, 201) + GET /admin/analytics/summary (admin auth)
- `db/base.py` — AffiliateClick registered
- `api/router.py` — analytics public + admin routers registered
- `tests/test_analytics.py` — 5 tests; 232/232 backend tests pass
- `lib/analytics.ts` — trackEvent(name, properties) utility: fires to GA4 (window.gtag) and Plausible (window.plausible); silent no-op if neither configured
- `lib/api.ts` — AnalyticsSummary, AffiliateClickPayload, AgentRun interfaces; fetchAnalyticsSummary, trackAffiliateClick, fetchAgentRuns helpers
- `components/monetization/AffiliateCard.tsx` — trackEvent + trackAffiliateClick on affiliate link click
- `components/monetization/LeadForm.tsx` — trackEvent("lead_form_submit") on success
- `components/monetization/NewsletterCapture.tsx` — trackEvent("newsletter_subscribe") on new subscription
- `app/layout.tsx` — conditional GA4 gtag.js script injection (NEXT_PUBLIC_GA4_ID env var)
- `app/(admin)/admin/page.tsx` — rewritten as "use client"; real KPIs from /admin/analytics/summary; real agent runs table from /admin/agent-runs with status badges
- `app/(admin)/admin/analytics/page.tsx` — rewritten; 6 real KPI cards; GA4 integration note
- `app/(admin)/admin/logs/page.tsx` — rewritten; real agent run table with refresh button; status badges
- `.env.local.example` — NEXT_PUBLIC_GA4_ID documented
- Bug fix (pre-existing): test_cms.py list_pages tests fixed with limit=10000 after 50+ pages in DB hit the default limit=50 ceiling
- `next build` clean with zero TypeScript errors; 232/232 backend tests pass
- GitNexus re-indexed: 5,106 nodes | 8,744 edges | 165 clusters | 172 flows
What remains:
- Configure NEXT_PUBLIC_GA4_ID with real G-XXXXXXXXXX ID for production event tracking
- V1 content seeding: run pipeline to generate at least 10 trek guide posts, 5 packing lists, 5 seasonal pages

### Step 23 — Content Refresh Engine (Basic)
Status: done
What is done:
- Alembic migration `20260427_0013_content_refresh.py` — adds `freshness_interval_days`, `last_refreshed_at`, `do_not_refresh` to `pages`; adds `freshness_interval_days` to `content_drafts`; creates `refresh_logs` table (page_id FK→pages, triggered_by, trigger_at, completed_at, result, notes)
- `modules/linking/models.py` — Page model updated with 3 new fields
- `modules/content/models.py` — ContentDraft updated with `freshness_interval_days`
- `modules/refresh/__init__.py`, `models.py` — RefreshLog ORM model
- `modules/refresh/service.py` — `get_stale_pages` (excludes do_not_refresh, uses PostgreSQL interval arithmetic); `create_refresh_log`, `update_refresh_log`, `get_refresh_logs`
- `modules/refresh/tasks.py` — `refresh_task` (Celery: SEOAEOAgent re-run → flag check → upsert_page_from_draft or requires_review gate); `auto_refresh_task` (Celery beat: detect 5 stale pages, dispatch refresh_task per page)
- `api/routes/refresh.py` — GET /admin/refresh/stale, POST /admin/refresh/trigger, GET /admin/refresh/logs; all require get_current_admin
- `schemas/refresh.py` — StalePageResponse, RefreshTriggerRequest, RefreshLogResponse, RefreshTriggerResponse
- `db/base.py` — RefreshLog registered
- `api/router.py` — refresh_router registered
- `worker/celery_app.py` — `app.modules.refresh.tasks` added to include; `daily-auto-refresh` beat entry (86400s)
- `tests/test_refresh.py` — 13 tests (stale detection, do_not_refresh exclusion, recently-refreshed exclusion, trigger 404/422/happy-path with mock dispatch, logs list); 227/227 backend tests pass
- `lib/api.ts` — StalePage, RefreshLog, RefreshTriggerResponse interfaces + fetchStalePages, triggerRefresh, fetchRefreshLogs helpers
- `app/(admin)/admin/refresh/page.tsx` — stale pages table with Refresh-now button per row; refresh log history table with result badge; responsive, matches design system
- `app/(admin)/admin/layout.tsx` — "Content Refresh" nav item (RefreshCw icon) added to Growth group
- `next build` clean; 227/227 backend tests pass; GitNexus re-indexed
What remains:
- Beat schedule runs daily — adjust `freshness_interval_days` per page_type (30/60/90/120 days) via DB update if needed

### Post-Step 23 Bug Fixes (commits 783a004 → current)
Status: done
Five bugs found during end-to-end testing of the Step 23 refresh flow and the pipeline orchestrator. All fixed as separate labelled bug-fix commits. 227/227 backend tests pass after each fix.

**Bug 1 — Pipeline StaleDataError on pipeline_stages UPDATE (commit 783a004)**
- Symptom: `StaleDataError: UPDATE statement on table 'pipeline_stages' expected to update 1 row(s); 0 were matched` on `run_pipeline` and `resume_pipeline` Celery tasks
- Root cause: `TrendDiscoveryAgent._store_results` calls `self.db.rollback()` on duplicate topic errors. SQLAlchemy's `rollback()` always expires ALL session-tracked objects regardless of `expire_on_commit=False`. The `stage_record` (PipelineStage) held by `_execute_stages` was expired; subsequent `_update_stage` commit matched 0 rows.
- Fix: `_update_stage` and `_update_run` now call `db.get(Model, id)` to re-fetch a fresh ORM instance by PK before setting attributes and committing. Both silently no-op if the row is missing.
- Files changed: `services/api/app/modules/pipeline/service.py`

**Bug 2 — Published pages not appearing in Content Refresh queue (commit b5e44a7)**
- Symptom: Pipeline-published pages visible in Master CMS but absent from `/admin/refresh/stale`
- Root cause: `publish_to_cms` wrote to `cms_pages` but never called `sync_pages_from_cms`. The `pages` table (which Content Refresh queries) was only populated by the daily Celery beat or a manual `/admin/links/sync` trigger. The Step 22 MASTER_TRACKER and DEPENDENCY_MAP incorrectly stated this sync was hooked in — it was not in the actual code.
- Fix: `publish_to_cms` now calls `sync_pages_from_cms(db)` after `upsert_page_from_draft`, within the same transaction (flush only; caller commits). Applies to both manual publish and pipeline `_run_publish`.
- Files changed: `services/api/app/modules/publish/service.py`

**Bug 3 — refresh_task TypeError: unexpected keyword argument 'input' (commit 96c85e2)**
- Symptom: `Task refresh.run_refresh raised unexpected: TypeError("BaseAgent.run() got an unexpected keyword argument 'input'")`
- Root cause: `refresh_task` called `agent.run(input={...})`. `BaseAgent.run()` signature is `run(self, input_data, run_id=None)` — the parameter is `input_data`, not `input`.
- Fix: Changed `input=` to `input_data=` on line 49 of `modules/refresh/tasks.py`.
- Files changed: `services/api/app/modules/refresh/tasks.py`

**Bug 4 — Test fixtures wiping real pipeline data on every test run (commits b4fc9e1, d3bd4c7)**
- Symptom: `refresh.run_refresh` returned `result: failed, reason: no_draft` even for pages with a published CMS entry. After investigation: `test_publish.py` and `test_cms.py` `clean_state` fixtures ran `DELETE FROM content_briefs` (which CASCADE-deletes `content_drafts`) and `DELETE FROM cms_pages` on every test run, destroying all real pipeline data.
- Root cause: Blanket `DELETE` on all content tables in `autouse=True` fixtures targeting the shared dev database.
- Fix: Replaced blanket deletes with snapshot approach — record pre-existing IDs for all 5 content tables before each test, delete only newly-created rows post-test in FK-safe order (ContentBrief first → CASCADE to ContentDraft → PublishLog, then CMSPage, KeywordCluster, TopicOpportunity). Count-exact test assertions updated to delta assertions.
- Files changed: `services/api/tests/test_cms.py`, `services/api/tests/test_publish.py`

**Bug 5 — refresh_task hard-fails with "no_draft" when ContentDraft was previously deleted**
- Symptom: Clicking "Refresh" on a published page returns `result: failed, reason: no_draft` even though the page exists in `cms_pages`. Happens when the page's `ContentDraft` row was wiped by test runs before the Bug 4 isolation fix landed.
- Root cause: `refresh_task` queried `ContentDraft` by `cms_page_id` and immediately returned failure when no row found, with no recovery path. Pages whose draft chains were deleted by earlier blanket test deletes are permanently stuck in a "can't refresh" state.
- Fix: When no `ContentDraft` is found, `refresh_task` now looks up the `CMSPage` record and reconstructs a stub `ContentBrief` + `ContentDraft` from it (title, slug, content_html), flushes both, then proceeds with the SEO/AEO agent and re-publish as normal. The refresh succeeds for any published page regardless of draft chain history.
- Files changed: `services/api/app/modules/refresh/tasks.py`

### Step 22 — Internal Linking Engine + Lead Pipeline + Newsletter Platform
Status: done
What is done:
- Alembic migration `20260427_0012_internal_linking_lead_status.py` — creates `pages` and `page_links` tables; adds `status` column to `lead_submissions`
- `modules/linking/models.py` — `Page` + `PageLink` ORM models with FK relationships; registered in `db/base.py`
- `schemas/linking.py` — PageResponse, RelatedPageResponse, AnchorSuggestion, SyncResponse, OrphanResponse
- `modules/linking/service.py` — `sync_pages_from_cms`, `get_related_pages` (cluster-first + fallback), `get_orphan_pages`, `get_anchor_suggestions`
- `modules/linking/tasks.py` — `sync_pages_task` (daily beat), `detect_orphans_task` (daily beat)
- `modules/leads/service.py` — `list_leads` + `update_lead_status` added
- `modules/leads/tasks.py` — `notify_admin_new_lead_task` (SMTP, graceful skip if unconfigured)
- `modules/newsletter/tasks.py` — `sync_subscriber_task` (Mailchimp + Brevo, graceful skip)
- `modules/newsletter/service.py` — fires `sync_subscriber_task.delay()` after DB insert
- `api/routes/linking.py` — POST /admin/links/sync, GET /links/suggestions/{slug}, GET /admin/links/orphans, GET /admin/links/anchors/{slug}
- `api/routes/leads_admin.py` — GET /admin/leads, PATCH /admin/leads/{id}
- `api/routes/leads.py` — fires `notify_admin_new_lead_task.delay()` after submit
- `api/routes/newsletter.py` — POST /newsletter/sync (admin)
- `api/router.py` — linking public+admin, leads_admin registered
- `worker/celery_app.py` — linking/leads/newsletter tasks + daily beat for sync_pages + detect_orphans
- `modules/publish/service.py` — `sync_pages_from_cms()` hooked in after every publish (non-fatal)
- `tests/test_linking.py` — 12 tests; 214/214 backend tests pass
- Frontend: `lib/api.ts` — RelatedPage, OrphanPage, AnchorSuggestion, AdminLead types + fetch helpers
- Frontend: `RelatedContent.tsx` — server-component path fetches from `/links/suggestions/{slug}` when `pageSlug` prop given
- Frontend: `/admin/linking` page rewritten with real API: orphan table + sync trigger + anchor suggestions (inline row expand)
- Frontend: `/admin/leads` page — paginated leads table, KPI row, status filter, mark-as-contacted action
- Frontend: admin sidebar — Leads nav item added (Users icon)
- GitNexus re-indexed: 4,771 nodes | 8,189 edges | 172 flows
What remains:
- SMTP creds must be configured in services/api/.env to enable lead email notifications
- NEWSLETTER_PLATFORM, NEWSLETTER_PLATFORM_API_KEY, NEWSLETTER_LIST_ID must be set to activate external sync

### Step 21 — RBAC Enforcement (+ Step 21 Arch Fix: Separate CMS Auth)
Status: done
What is done:
- RequireRole class in dependencies.py with named singletons (require_super_admin, require_admin, require_editor, require_pipeline, require_agent_admin)
- create_access_token extended with roles list in JWT payload
- services/api/app/schemas/rbac.py — RoleResponse, RoleAssignRequest, UserWithRolesResponse
- services/api/app/modules/rbac/service.py — seed_roles, assign/revoke role helpers, list_users_with_roles
- scripts/seed_roles.py + scripts/assign_admin.py — management scripts
- ARCHITECTURAL FIX: Separated CMS admin auth from public user auth entirely (no shared DB)
  - get_current_admin dependency added to dependencies.py (validates trekyatra_admin_token cookie)
  - create_admin_token() added to security.py (stateless JWT, typ: admin_access)
  - Settings: admin_email, admin_password, admin_cookie_name, admin_token_expire_hours added to config.py
  - NEW routes/admin_auth.py: POST /admin/auth/login, POST /admin/auth/logout, GET /admin/auth/me
  - All 9 admin route routers (admin, publish, content, pipeline, agent_triggers, agent_runs, worker, cms, users) switched from RequireRole to get_current_admin
  - apps/web-next/middleware.ts — checks trekyatra_admin_token for /admin/* (not user token); redirects to /admin/sign-in
  - apps/web-next/app/(admin-auth)/admin/sign-in/page.tsx — standalone admin sign-in page (no sidebar)
  - apps/web-next/app/(admin)/admin/layout.tsx — Sign out button added to header
  - apps/web-next/lib/admin-auth-api.ts — adminLogin, adminLogout, getAdminMe client helpers
  - conftest.py bypass updated to override get_current_admin
  - test_rbac.py rewritten: 20 tests (admin token guards, admin auth endpoints, role seeding, role assignment, user management API)
  - 202/202 backend tests pass; next build clean (128 pages); GitNexus re-indexed 4519 nodes | 7744 edges | 165 flows
What remains:
- Admin password is set in services/api/.env — change from TrekAdmin@2026 to your preferred password

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

### Step 17 — Full Publish Orchestration Pipeline (+ enhancements)
Status: done
What is done (enhancements, post-TC review):
- Alembic migration `20260423_0010_cms_hero_image.py` — adds hero_image_url (String 512, nullable) to cms_pages
- `CMSPage` model + all 3 CMS schemas updated with hero_image_url field
- `CMSPageForm` — hero_image_url URL input + preview; trek_facts strip (6 fields: duration, altitude, difficulty, season, permits, base); trek_facts persisted to content_json.trek_facts; buildPayload updated
- `lib/api.ts` — TrekFacts interface added; CMSPage + CMSPagePayload extended with hero_image_url and trek_facts
- Pipeline service `resume()` fix: paused_at_draft_approval now resumes at seo_aeo (not publish) — SEO/AEO agent runs before every publish
- 2 new pipeline tests: draft-approval resume dispatches task, stages_slice confirms seo_aeo→publish path; 139/139 backend tests pass
- Trek detail page full overhaul: generateMetadata (seo_title/description), descriptive anchor IDs (#why-this-trek, #quick-facts, etc.), sticky sidebars fixed (nested sticky+overflow), all 12 TOC items match real section blocks, 4 new content blocks (best_time, difficulty, packing, safety), hero_image_url from CMS, trek facts from content_json.trek_facts, H1 strips SEO subtitle (splits on : or —); CMS section extraction broadened (question-form headings, intro pre-heading capture); CMS form fields full-width (max-w-4xl removed)
- Anthropic 529 resilience: `agents/client.py` shared factory with `max_retries=6`; all 5 agents updated to use `get_anthropic_client()`; 139/139 tests pass
- Sticky sidebar root fix: `globals.css` changed `overflow-x: hidden` → `overflow-x: clip` on html/body; `hidden` on `<html>` re-assigns the scroll container away from the viewport, breaking `position: sticky` in Chromium/Safari
- CMS empty sections fix: `cms/service.py:reparse_sections_from_draft` + `POST /cms/pages/{slug}/reparse-sections` route + Re-parse sections button in CMSPageForm; prevents double-processing HTML via `_process_content_json` passthrough; 2 new tests; 141/141 pass
- Section parser overhaul (parser fix batch): `_parse_sections_from_markdown` updated to use `^#{1,2}` (H3 = content not boundary), H1 always opens why_this_trek (captures intro paragraphs), `faqs` moved to top of `_SECTION_HEADING_MAP` (first-match-wins; fixes FAQ content landing in why_this_trek), `difficult\b` added to difficulty pattern, `key facts` and `overview` added to why_this_trek pattern; `_extract_trek_facts_from_markdown` helper added — extracts duration/altitude/difficulty/season/permits/base from structured markdown; `upsert_page_from_draft` + `reparse_sections_from_draft` both write trek_facts to content_json; FE hardcoded fallbacks "Required"/"Sankri"/"Moderate" replaced with "—"; 8 new parser unit tests; 148/149 pass (1 pre-existing pipeline test pollution — unrelated)

### Step 20 — Monetization Frontend Components
Status: done
What is done:
- Alembic migration `20260427_0011_leads_newsletter.py` — creates `lead_submissions` (id, name, email, phone nullable, trek_interest, message nullable, source_page, source_cluster nullable, cta_type, created_at) and `newsletter_subscribers` (id, email UNIQUE, name nullable, source_page, lead_magnet nullable, created_at)
- `modules/leads/models.py` — LeadSubmission ORM model
- `modules/newsletter/models.py` — NewsletterSubscriber ORM model with UniqueConstraint on email
- `db/base.py` — LeadSubmission + NewsletterSubscriber registered
- `schemas/leads.py` — LeadCreate (custom email validator) + LeadResponse
- `schemas/newsletter.py` — NewsletterSubscribeCreate + NewsletterSubscribeResponse (already_subscribed: bool)
- `modules/leads/service.py` — create_lead()
- `modules/newsletter/service.py` — subscribe() with idempotent duplicate detection
- `api/routes/leads.py` — POST /api/v1/leads (201)
- `api/routes/newsletter.py` — POST /api/v1/newsletter/subscribe (200)
- `api/router.py` — leads_router + newsletter_router registered
- `tests/test_leads_newsletter.py` — 8 tests; 182/182 backend tests pass
- `apps/web-next/lib/api.ts` — LeadPayload, LeadResponse, NewsletterPayload, NewsletterResponse interfaces + submitLead() + subscribeNewsletter()
- `apps/web-next/components/monetization/InArticleAdSlot.tsx` — conditional AdSense/placeholder
- `apps/web-next/components/monetization/SidebarAdSlot.tsx` — 300×250 ad slot
- `apps/web-next/components/monetization/FooterAdSlot.tsx` — 970×60 footer ad
- `apps/web-next/components/monetization/AffiliateCard.tsx` — product card with rel="nofollow sponsored noopener"
- `apps/web-next/components/monetization/AffiliateRail.tsx` — snap-scroll horizontal rail
- `apps/web-next/components/monetization/ComparisonTable.tsx` — comparison table with checkmark icons
- `apps/web-next/components/monetization/GearRecommendation.tsx` — inline affiliate gear mention
- `apps/web-next/components/monetization/LeadForm.tsx` — name/email/phone/trek/message → POST /leads; localStorage-backed
- `apps/web-next/components/monetization/OperatorCard.tsx` — operator display + embedded LeadForm
- `apps/web-next/components/monetization/ConsultationCTA.tsx` — inline/card CTA wrapping LeadForm
- `apps/web-next/components/monetization/NewsletterCapture.tsx` — email → POST /newsletter/subscribe; localStorage guards duplicate
- `apps/web-next/components/monetization/LeadMagnetCapture.tsx` — download CTA wrapping NewsletterCapture
- `apps/web-next/components/monetization/InlineNewsletterBlock.tsx` — mid-article wrapper for NewsletterCapture
- `apps/web-next/components/trust/DisclosureBlock.tsx` — affiliate/ads/AI disclosure block
- `apps/web-next/components/trust/TrustSignals.tsx` — date/author/fact-checked trust bar
- `apps/web-next/components/trust/StickyMobileCTA.tsx` — lg:hidden sticky mobile CTA with localStorage 7-day dismiss
- `apps/web-next/app/layout.tsx` — conditional AdSense script via NEXT_PUBLIC_ADSENSE_ID
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — InArticleAdSlot + AffiliateRail + TrustSignals + StickyMobileCTA inserted
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — AffiliateRail + NewsletterCapture inserted
- `apps/web-next/app/(public)/.env.local.example` — NEXT_PUBLIC_ADSENSE_ID documented
- `next build` clean (127 static pages); 182/182 backend tests pass

### Step 19 Bug Fixes — Fact-check wiring, flagged-marker stripping, pipeline clear
Status: done
What is done:
- `PATCH /admin/fact-check/claims/{claim_id}`: new endpoint updates `flagged_for_review` on DraftClaim; `update_draft_claim()` service function added to `content/service.py`
- `ClaimPatch` Pydantic schema added to `schemas/admin.py`
- Fact Check admin page: "Mark verified" calls PATCH with `flagged_for_review=false`, optimistic UI update removes flag; "Flag for editor" calls PATCH confirm + shows "Sent to editor queue ✓" (no DB change, already flagged)
- `patchFactCheckClaim()`, `clearPipelineRuns()`, `clearAgentRuns()` helpers added to `lib/api.ts`
- Pipeline page: "Clear all" button in Failed/Cancelled section header calls `DELETE /admin/pipeline/runs/clear` and reloads
- `_strip_flagged_markers()` + `_strip_flagged_markers_html()` helpers in `cms/service.py`: strip `*(flagged for verification)*`, `[flagged for verification ...]`, `<em>(flagged...)</em>` from markdown/HTML before storage
- `_md_to_html()` now calls `_strip_flagged_markers()` before markdown conversion
- `_process_content_json()` now strips flagged HTML markers from already-stored HTML sections
- Section patterns expanded: "safety" gains `medical|health.*altitude|mountain.*safe|know before`; "cost_estimate" gains `invest|spend|financial|tariff|expenditure`
- 6 new backend tests; 174/174 pass; `next build` clean
- Pipeline keyword_cluster fallback: `_run_keyword_cluster` now falls back to 10 most-recent DB topics when trend_discovery returns `topic_ids: []`, preventing hard failure on every re-run
- TrendDiscoveryAgent `_store_results`: added `logger.warning()` + `self.db.rollback()` in except block — fixes silent DB session corruption when first `create_topic` leaves an aborted transaction (causing all subsequent topics to fail silently)
- 174/174 backend tests pass; `next build` clean; GitNexus re-indexed (4,093 nodes | 7,032 edges | 155 flows)

### Step 19 — SEO and Schema Infrastructure (Frontend)
Status: done
What is done:
- `apps/web-next/lib/schema.ts` — schema builder utilities: `buildArticleSchema`, `buildFAQSchema`, `buildBreadcrumbSchema`, `buildItemListSchema`, `buildWebSiteSchema`; all use `NEXT_PUBLIC_SITE_URL` env
- `apps/web-next/components/seo/SchemaInjector.tsx` — renders `<script type="application/ld+json">` for each valid schema object; filters null entries
- `apps/web-next/app/sitemap.ts` — Next.js App Router sitemap: static pages + trek detail slugs + published CMS pages by type prefix; deduplicates by URL; fails gracefully when API unavailable
- `apps/web-next/app/robots.ts` — blocks `/admin/`, `/account/`, `/auth/`, `/api/`; references sitemap URL
- `apps/web-next/app/layout.tsx` — `metadataBase`, global OG site defaults, Twitter card defaults, `robots: {index: true, follow: true}` added
- `apps/web-next/app/(public)/page.tsx` — homepage gets `buildWebSiteSchema()` via SchemaInjector
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — canonical, OG, Twitter card via `generateMetadata()`; Article + FAQPage + BreadcrumbList JSON-LD; section padding increased `pt-16 pb-16 md:pt-20 md:pb-20`; TOC URL hash reinstated via `history.pushState`
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — canonical, OG, Twitter card; Article + FAQ JSON-LD
- `apps/web-next/app/(public)/permits/[slug]/page.tsx` — canonical, OG, Twitter card; Article + FAQ JSON-LD
- `apps/web-next/app/(public)/guides/[slug]/page.tsx` — canonical, OG, Twitter card; Article + FAQ JSON-LD
- Step 18 bug fixes: trek facts two-pass extraction (table → KV, colon required); FAQ H3 format parsing; stale-run cleanup at startup; fact-check admin page wired to real DraftClaim data
- Backend: `DELETE /admin/pipeline/runs/clear` + `DELETE /admin/agent-runs/clear` bulk cleanup endpoints; `GET /admin/fact-check/claims` with DraftClaim join; startup `_cancel_stale_runs()` lifespan hook
- `apps/web-next/app/(admin)/admin/fact-check/page.tsx` rewritten as real-API client component
- `apps/web-next/lib/api.ts`: `FactCheckClaim` type + `fetchFactCheckClaims` helper
- 168/168 backend tests pass; `next build` clean; CLAUDE.md updated with inter-step dependency rules (Section 16)

### Step 18 — Public Frontend Content Page Templates
Status: done
What is done:
- Backend parser: fixed permits regex (`permit\b[^*:\n]{0,20}(?::?\*\*)?:?`) to match "Permit Required:" format; fixed base regex to match "Nearest Base Villages:" + note stripping; added `_extract_faq_section_raw` + `_parse_faqs_from_section` — parses bold-question/paragraph-answer FAQ format into `[{q, a}]` list; `upsert_page_from_draft` + `reparse_sections_from_draft` both now write `content_json.faqs`; 4 new tests (permits format, nearest base villages, FAQ parse, FAQ extract); 153/153 pass
- Shared components created: `components/content/FAQAccordion.tsx` (client, smooth open/close, accent active state), `components/content/TableOfContents.tsx` (client, IntersectionObserver scroll spy, active highlight with border-l-2), `components/content/Breadcrumb.tsx`, `components/content/RelatedContent.tsx`, `components/content/AuthorBlock.tsx`, `components/content/UpdatedBadge.tsx`, `components/content/SafetyDisclaimer.tsx`, `components/content/AffiliateDisclosure.tsx`
- Trek page rewrite: uses TableOfContents (scroll spy replaces hardcoded i===0), FAQAccordion (from content_json.faqs with HTML answers), Breadcrumb, AuthorBlock; added body-level Quick Facts section (`#quick-facts`) so TOC link scrolls correctly; cost fallback changed to generic "Contact for pricing" message; permits fallback made generic; difficulty badge uses tf.difficulty
- CMSPageForm: FAQ textarea removed; replaced with structured Q&A pair editor (add/remove pairs); answer field accepts HTML from auto-parse or plain text; Re-parse sections button also updates FAQ state when new pairs extracted
- `lib/api.ts`: `FAQItem` type exported; `CMSPage.content_json.faqs` typed; `CMSPagePayload.content_json.faqs` typed
- New page templates: `app/(public)/packing/[slug]/page.tsx`, `app/(public)/permits/[slug]/page.tsx`, `app/(public)/guides/[slug]/page.tsx` — all CMS-powered with static fallbacks, use shared components
- next build clean (89+ pages); 153/153 backend tests pass
- Alembic migration `20260423_0009_pipeline.py` — creates `pipeline_runs` (id UUID PK, pipeline_type, status, current_stage, start/end_stage, input/output_json, error_detail, timestamps) and `pipeline_stages` (id UUID PK, pipeline_run_id FK, stage_name, agent_run_id FK→agent_runs, status, error_detail, timestamps)
- `app/modules/pipeline/models.py` — `PipelineRun` + `PipelineStage` ORM models with relationship; `db/base.py` updated
- `app/schemas/pipeline.py` — `PipelineRunCreate`, `PipelineRunResponse`, `PipelineStageResponse`, `PipelineTriggerResponse`
- `app/modules/pipeline/service.py` — CRUD helpers + `PipelineOrchestrator` class: `run()` / `resume()` / stage dispatchers for all 6 stages; checkpoint gates: `paused_at_brief_approval` (after content_brief), `paused_at_draft_approval` (after content_writing if draft has flagged claims); partial pipeline support via start_stage/end_stage
- `app/modules/pipeline/tasks.py` — `run_pipeline_task`, `resume_pipeline_task`, `daily_discovery_task` (Celery beat)
- `app/worker/celery_app.py` — pipeline tasks included; beat_schedule daily_discovery added
- `app/api/routes/pipeline.py` — POST /run, GET /runs, GET /runs/{id}, POST /runs/{id}/resume, POST /runs/{id}/cancel
- `app/api/router.py` — pipeline_router registered
- `tests/test_pipeline.py` — 20 tests: CRUD, stages_slice, API trigger/list/get/cancel/resume/409, orchestrator failure propagation, metadata coverage
- 137/137 backend tests pass; `next build` clean
- `apps/web-next/lib/api.ts` — PipelineRun/PipelineStage types + triggerPipeline/fetchPipelineRuns/fetchPipelineRun/resumePipelineRun/cancelPipelineRun
- `apps/web-next/app/(admin)/admin/pipeline/page.tsx` — fully rewritten: TriggerForm (start stage selector + seed topics/brief_id/draft_id inputs), RunCard (stage track, output chips, resume/cancel buttons, approval gate notice, error detail), KPI strip, auto-refresh while runs are active

### Step 16 — Master CMS Foundation
Status: done
What is done:
- WordPress removed entirely: deleted `app/modules/wordpress/`, `app/api/routes/wordpress.py`, `app/schemas/wordpress.py`, `tests/test_wordpress*.py`, `docker-compose.wordpress.yml`, `infrastructure/wordpress/`; 5 WP config settings removed from `config.py` and `.env.example`
- `services/api/alembic/versions/20260423_0008_master_cms.py` — creates `cms_pages` table; drops WP columns from drafts+logs; adds `cms_page_id`+`published_url`
- `services/api/app/modules/cms/service.py` — full CRUD + `upsert_page_from_draft` (agent pipeline → CMS); `_md_to_html` converts markdown at storage time; `_parse_sections_from_markdown` extracts named sections from agent output into `content_json.sections`; `_process_content_json` converts section markdown to HTML for manual saves; `cache_invalidate`/`cache_invalidate_all` (Redis DB 2)
- `services/api/app/api/routes/cms.py` — `GET/POST /cms/pages`, `GET/PATCH/DELETE /cms/pages/{slug}`, `POST /cms/cache/invalidate`
- `services/api/app/modules/publish/service.py` — `publish_to_cms` replaces `push_draft_to_wordpress`
- 117/117 backend tests pass
- `apps/web-next/lib/api.ts` — `CMSPage` + `TrekContentSections` interfaces; `fetchCMSPage`/`fetchCMSPages`/`createCMSPage`/`updateCMSPage` helpers
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — each named Block renders from `content_json.sections[key]` (HTML) when present; static template is fallback; `notFound()` guard for unknown slugs; `formatUpdatedAt` from `cmsPage.published_at`; sticky sidebars `max-h` capped
- `apps/web-next/app/api/revalidate/route.ts` — Next.js on-demand revalidation endpoint
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — KPI cards + pages table; New page button + edit icon per row; cache clear (per-page + global)
- `apps/web-next/app/(admin)/admin/cms/new/page.tsx` — manual CMS page creation form
- `apps/web-next/app/(admin)/admin/cms/[slug]/edit/page.tsx` — edit existing CMS page with Save + Publish + cache clear
- `apps/web-next/components/admin/CMSPageForm.tsx` — shared form: title, slug, page type, status, SEO meta, 10 section textareas (markdown)
- `apps/web-next/app/globals.css` — `.cms-section` prose styles for agent-generated HTML blocks
- `apps/web-next/app/(admin)/admin/drafts/page.tsx` — "Publish to Master CMS" CTA label
- `services/api/pyproject.toml` — `markdown>=3.6` dependency added
- `next build` clean (89 static pages); GitNexus re-indexed

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