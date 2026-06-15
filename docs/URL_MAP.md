# TrekYatra — Complete URL Structure Map

> **IMPORTANT PROCESS RULE**: Before creating any new URL or route, the proposed URL pattern
> must be listed here and confirmed by the user. No new URL structures should be introduced
> without updating this file and getting confirmation.

Last updated: 2026-05-27 (Step 64)

---

## Public Content Pages

| URL Pattern | Page | CMS page_type | Notes |
|-------------|------|---------------|-------|
| `/` | Homepage | — | Hero, trending, seasonal tabs, regions, feed |
| `/explore` | Trek explorer | — | Full grid with filters |
| `/search` | Search | — | Fuse.js fuzzy + semantic for long queries |
| `/compare` | Trek comparison | — | Side-by-side compare tool |
| `/plan` | Trip planning wizard | — | 6-step intent wizard — Step 57 (done) |
| `/plan/results` | Trek recommendation output | — | Top 5 CMS treks with match scores + lead capture — Step 57 (done) |
| `/trek/[slug]` | Trek detail | `trek_guide` | CMS-first, static fallback |
| `/trek/[slug]/packing` | Trek-specific packing guide | `packing_list` | Links to the packing guide CMS page for this trek slug; 404 if no packing page exists |
| `/trek/[slug]/permits` | Trek-specific permit guide | `permit_guide` | Links to the permit guide CMS page for this trek slug; 404 if no permit page exists |
| `/trek/[slug]/costs` | Trek-specific cost guide | `cost_guide` | Links to the cost guide CMS page for this trek slug; 404 if no cost page exists |
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
| `/account/compare` | Saved comparisons | Live — wired to GET/POST/DELETE /account/comparisons; Step 44 |

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
| `/news` | Trek news hub | Lists all news_article pages grouped by trek — Step 56 |
| `/news/[slug]` | Trek news article | `news_article` | Auto-generated weekly; slug `{trek_slug}-news-{YYYY-WW}` — Step 56 |
| `/news-sitemap.xml` | Google News sitemap | Dynamic XML; includes `<news:news>` elements — Step 56 |
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
| `/admin/cdp` | CDP Overview | Step 64 — KPI strip + nav cards |
| `/admin/cdp/users` | CDP Users | Paginated user list with search |
| `/admin/cdp/users/[id]` | CDP User Detail | Profile, sessions, events, touchpoints |
| `/admin/cdp/events` | CDP Event Explorer | Filterable event table (7 filters: category, event name, anonymous_id, page_url, date range, exclude_internal) + pagination + CSV export (Step 67) |
| `/admin/cdp/funnels` | CDP Funnels | Dynamic funnel builder — event catalog dropdowns, date range, count-type toggle + 6 preset templates (Steps 65, 67) |
| `/admin/cdp/cohorts` | CDP Cohorts | Retention heatmap — N×M 9-week color-coded grid + configurable cohort type (Steps 65, 67) |
| `/admin/cdp/segments` | CDP Segments | 10 expanded audience segments with human-readable criteria (Step 65) |
| `/admin/cdp/segments/builder` | CDP Segment Builder | Visual rule builder — AND condition rows, event catalog dropdown, live preview count, save to backend (Step 67) |
| `/admin/cdp/content` | CDP Content Analytics | Per-page CMS analytics: views 7d/30d, scroll depth, leads, sortable + page_type filter (Step 67) |
| `/admin/cdp/content/treks` | CDP Trek Analytics | Trek-level funnel: views, plan CTAs, completions, save count, conversion rate — sorted by conv. rate (Step 67) |
| `/admin/cdp/webhooks` | CDP Webhooks | Campaign trigger webhook rules CRUD — create/list/delete outbound HTTP hooks per event (Step 67) |
| `/admin/cdp/activity` | CDP User Activity | Email lookup → chronological event timeline (Step 65) |
| `/admin/cdp/gsc` | CDP GSC | Google Search Console performance data |
| `/admin/logs` | System logs | NOT BUILT — post-launch |
| `/admin/settings` | Settings | NOT BUILT — post-launch |

## System Routes

| URL | Purpose | Notes |
|-----|---------|-------|
| `/sitemap.xml` | XML sitemap | Auto-generated, force-dynamic |
| `/robots.txt` | Robots rules | Auto-generated from robots.ts |
| `/api/revalidate` | Next.js cache revalidate | POST, internal |

## TrekSage MCP Server & Datacenter Subdomain (Step 72)

| URL Pattern | Page / Endpoint | Notes |
|-------------|-----------------|-------|
| `datacenter.trekyatra.co.in/` | Datacenter index | Lists all published trek_guide slugs; `apps/web-next/app/datacenter/page.tsx` |
| `datacenter.trekyatra.co.in/trek-guide/[slug]` | Full structured `TrekProfile` | Human + AI readable; `apps/web-next/app/datacenter/trek-guide/[slug]/page.tsx`; rewritten from `/trek-guide/[slug]` via host check in `middleware.ts`; `noindex` |
| `https://api.trekyatra.co.in/mcp` | TrekSage MCP server (Streamable HTTP) | 8 tools: search_treks, get_trek_details, recommend_treks, compare_treks, get_trek_content, ask_trek_question, create_trek_plan_lead, translate_trek_content. Mounted in `app/main.py` |

## API Routes (FastAPI — via DO ingress /api/)

| Pattern | Notes |
|---------|-------|
| `/api/v1/health` | Health check |
| `/api/v1/treks/{slug}/profile` | **Public GET** — full structured `TrekProfile`; Step 72 |
| `/api/v1/treks/compare` | **Public POST** — compare 2-4 trek slugs, returns rows + cached AI trade-off summary; Step 72 |
| `/api/v1/treks/{slug}/ask` | **Public POST** — Trek Detail Q&A (TrekSage), cached Haiku answers; Step 72 |
| `/api/v1/treks/{slug}/content` | **Public GET** — one content_json section for grounding; Step 72 |
| `/api/v1/leads/operator-help` | **Public POST** — operator-help fallback lead with details_json; Step 72 |
| `/api/v1/ai/log` | **Public POST** — AI interaction logging (web/mobile/chatgpt/claude); Step 72 |
| `/api/v1/public/sitemap-pages` | **Public** — returns slug/page_type/updated_at for published pages; used by sitemap.ts |
| `/api/v1/search/log` | **Public POST** — fire-and-forget search event logging (query, clicks); Step 44 |
| `/api/v1/search/suggestions?q=` | **Public GET** — CMS-powered autocomplete across all page types; Step 44 |
| `/api/v1/search/trending` | **Public GET** — most-searched queries last 7 days; Step 44 |
| `/api/v1/track/page-view` | **Public POST** — fire-and-forget page view recording for popularity signals; Step 44 |
| `/api/v1/account/comparisons` | **Auth GET** — list saved trek comparisons; Step 44 |
| `/api/v1/account/comparisons` | **Auth POST** — save a new comparison (name + slugs[]); Step 44 |
| `/api/v1/account/comparisons/{id}` | **Auth DELETE** — delete a saved comparison; Step 44 |
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
| `/search` | Enhanced search — CMS autocomplete, click tracking, recent searches, did-you-mean | ✅ IMPLEMENTED — Step 44 |
| `/api/partner/v1/*` | B2B partner API | Step 41 — pending |

---

## URL Naming Conventions

1. All URLs use **kebab-case** (`/trek-types`, `/safety-disclaimer`)
2. Dynamic segments use `[slug]` or `[id]` — never numeric IDs in public URLs
3. CMS slugs must **exactly match** the URL path segment (e.g. slug `kedarkantha` → `/trek/kedarkantha`). Pipeline enforces this via `_slugify_trek()` which strips noise suffixes ("Trek", "Complete Guide", etc.) so "Kedarkantha Trek" → slug `kedarkantha` — Step 46
4. Multilingual URLs prefix with language code: `/hi/trek/[slug]`
5. Admin URLs always prefix with `/admin/`
6. API URLs always prefix with `/api/v1/`
7. No trailing slashes
