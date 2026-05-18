# TrekYatra — Complete URL Structure Map

> **IMPORTANT PROCESS RULE**: Before creating any new URL or route, the proposed URL pattern
> must be listed here and confirmed by the user. No new URL structures should be introduced
> without updating this file and getting confirmation.

Last updated: 2026-05-16

---

## Public Content Pages

| URL Pattern | Page | CMS page_type | Notes |
|-------------|------|---------------|-------|
| `/` | Homepage | — | Hero, trending, seasonal tabs, regions, feed |
| `/explore` | Trek explorer | — | Full grid with filters |
| `/search` | Search | — | Fuse.js fuzzy + semantic for long queries |
| `/compare` | Trek comparison | — | Side-by-side compare tool |
| `/plan` | Trip planning wizard | — | 4-step wizard → TripPlannerAgent |
| `/trek/[slug]` | Trek detail | `trek_guide` | CMS-first, static fallback |
| `/packing` | Packing hub | — | Hub + CMSPageHub(packing_list) |
| `/packing/[slug]` | Packing guide | `packing_list` | CMS-powered |
| `/permits` | Permits hub | — | Hub + CMSPageHub(permit_guide) |
| `/permits/[slug]` | Permit guide | `permit_guide` | CMS-powered |
| `/guides/[slug]` | General guide | multiple | cost_guide, gear_guide, itinerary, beginner_guide, safety_guide, expert_guide |
| `/costs` | Cost guides hub | — | CMSPageHub(cost_guide) |
| `/gear` | Gear hub | — | CMSPageHub(gear_guide) |
| `/itineraries` | Itineraries hub | — | CMSPageHub(itinerary) |
| `/beginner` | Beginner hub | — | CMSPageHub(beginner_guide/beginner_roundup) + trek cards |
| `/compare` | Comparison tool | — | |
| `/regions/[slug]` | Regional hub | `regional_hub` | CMS-powered |
| `/seasons/[slug]` | Seasonal hub | `seasonal_hub` | CMS-powered |
| `/trek-types/[slug]` | Cluster hub | `cluster_hub` | CMS-powered |
| `/safety` | Safety hub | — | Static |
| `/safety-disclaimer` | Safety disclaimer | `editorial` | CMS-driven |

## Operators Marketplace

| URL Pattern | Page | Notes |
|-------------|------|-------|
| `/operators` | Operator listing | Public, region filter |
| `/operators/[slug]` | Operator detail | Reviews, inquiry form |

## Digital Products & Subscriptions

| URL Pattern | Page | Notes |
|-------------|------|-------|
| `/products` | Product catalog | Digital products |
| `/products/[slug]` | Product detail | Razorpay checkout |
| `/premium` | Premium pricing | Stripe subscription |
| `/success/checkout` | Post-purchase | Download link |
| `/success/signup` | Post-signup | Welcome redirect |

## User Account (Auth-gated)

| URL Pattern | Page | Notes |
|-------------|------|-------|
| `/account` | Dashboard | Counts + overview |
| `/account/saved` | Saved treks | Real bookmark API |
| `/account/downloads` | Downloads | Purchase history |
| `/account/settings` | Profile settings | PATCH /auth/me |
| `/account/enquiries` | Lead history | GET /auth/me/leads |
| `/account/premium` | Subscription | Status + upgrade |
| `/account/compare` | Saved comparisons | STUB — Step 44 pending |

## Authentication

| URL Pattern | Page | Notes |
|-------------|------|-------|
| `/auth/sign-in` | Sign in | Email + Google OAuth |
| `/auth/sign-up` | Sign up | Email |
| `/auth/forgot-password` | Password reset request | HMAC JWT |
| `/auth/reset-password` | Reset password | Token from email |

## Newsletter

| URL Pattern | Page | Notes |
|-------------|------|-------|
| `/newsletter` | Subscribe | Trail Letter |

## Editorial / Trust Pages (CMS-driven, editorial page_type)

| URL Pattern | CMS Slug | Notes |
|-------------|----------|-------|
| `/about` | `about` | Editorial team + mission |
| `/about/authors` | — | Static (Deepesh Kumar Gupta) |
| `/contact` | `contact` | Email channels |
| `/privacy` | `privacy` | Privacy policy |
| `/terms` | `terms` | T&Cs |
| `/affiliate-disclosure` | `affiliate-disclosure` | Affiliate policy |
| `/methodology` | `methodology` | Editorial standards |

## Multilingual (Hindi)

| URL Pattern | Page | Notes |
|-------------|------|-------|
| `/hi/trek/[slug]` | Hindi trek guide | TranslationAgent |
| `/hi/guides/[slug]` | Hindi guide | TranslationAgent |
| `/hi/packing/[slug]` | Hindi packing | TranslationAgent |

## Admin CMS (Auth-gated: trekyatra_admin_token)

| URL Pattern | Page | Notes |
|-------------|------|-------|
| `/admin/sign-in` | Admin login | Separate admin auth |
| `/admin` | Dashboard | KPI strip |
| `/admin/pipeline` | Pipeline orchestration | 6-stage monitor |
| `/admin/topics` | Topic discovery | |
| `/admin/clusters` | Keyword clusters | |
| `/admin/briefs` | Brief review | Approve/reject |
| `/admin/drafts` | Draft review | Dispatch |
| `/admin/cms` | Master CMS | CRUD + cache |
| `/admin/cms/new` | New CMS page | |
| `/admin/cms/[slug]/edit` | Edit CMS page | |
| `/admin/fact-check` | Fact check | YMYL claims |
| `/admin/cannibalization` | Cannibalization | Overlap detection |
| `/admin/linking` | Internal linking | Orphan + anchors |
| `/admin/leads` | Lead management | |
| `/admin/operators` | Operator CRUD | |
| `/admin/operators/[id]` | Operator detail | Agreements + reviews |
| `/admin/newsletter` | Newsletter | Campaigns + subscribers |
| `/admin/email-sequences` | Email sequences | Seed button |
| `/admin/products` | Product CRUD | |
| `/admin/orders` | Orders | |
| `/admin/monetization` | Monetization | Affiliate catalog + stats |
| `/admin/revenue` | Revenue | Dashboards |
| `/admin/refresh` | Content refresh | Stale queue |
| `/admin/hubs` | Destination hubs | Seasonal regeneration |
| `/admin/analytics` | Analytics | Summary |
| `/admin/logs` | System logs | NOT BUILT — post-launch |
| `/admin/settings` | Settings | NOT BUILT — post-launch |

## System Routes

| URL | Purpose | Notes |
|-----|---------|-------|
| `/sitemap.xml` | XML sitemap | Auto-generated, force-dynamic |
| `/robots.txt` | Robots rules | Auto-generated from robots.ts |
| `/api/revalidate` | Next.js cache revalidate | POST, internal |

## API Routes (FastAPI — via DO ingress /api/)

| Pattern | Notes |
|---------|-------|
| `/api/v1/health` | Health check |
| `/api/v1/public/sitemap-pages` | **Public** — returns slug/page_type/updated_at for published pages; used by sitemap.ts |
| `/api/v1/auth/*` | User auth (email + Google) |
| `/api/v1/admin/auth/*` | Admin CMS auth |
| `/api/v1/cms/pages/*` | CMS CRUD |
| `/api/v1/treks/*` | Public trek data |
| `/api/v1/plan/*` | Trip planner |
| `/api/v1/leads` | Lead capture |
| `/api/v1/newsletter/*` | Newsletter |
| `/api/v1/operators/*` | Operators public |
| `/api/v1/inquiries` | Booking inquiries |
| `/api/v1/products/*` | Digital products |
| `/api/v1/checkout/*` | Payment checkout |
| `/api/v1/subscriptions/*` | Stripe subscriptions |
| `/api/v1/account/*` | User account (auth-gated) |
| `/api/v1/recommendations/*` | Personalised feed |
| `/api/v1/links/*` | Internal linking |
| `/api/v1/intent/*` | User intent classification |
| `/api/v1/affiliate-products/*` | Affiliate catalog |
| `/api/v1/admin/*` | All admin APIs |

---

## Pending URL Structures (Proposed — Not Yet Built)

| `/beginner` | Beginner trek category — hub + trek cards + SEO content | ✅ IMPLEMENTED |
| `/moderate` | Moderate trek category — hub + trek cards + FAQs + schema | ✅ IMPLEMENTED |
| `/challenging` | Challenging trek category — hub + trek cards + FAQs + schema | ✅ IMPLEMENTED |
| `/api/partner/v1/*` | B2B partner API | Step 41 |
| `/search/*` | Enhanced search with click tracking | Step 44 |

---

## URL Naming Conventions

1. All URLs use **kebab-case** (`/trek-types`, `/safety-disclaimer`)
2. Dynamic segments use `[slug]` or `[id]` — never numeric IDs in public URLs
3. CMS slugs must **exactly match** the URL path segment (e.g. slug `kedarkantha` → `/trek/kedarkantha`)
4. Multilingual URLs prefix with language code: `/hi/trek/[slug]`
5. Admin URLs always prefix with `/admin/`
6. API URLs always prefix with `/api/v1/`
7. No trailing slashes
