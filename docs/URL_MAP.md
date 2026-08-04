# TrekYatra — Complete URL Structure Map

> **IMPORTANT PROCESS RULE**: Before creating any new URL or route, the proposed URL pattern
> must be listed here and confirmed by the user. No new URL structures should be introduced
> without updating this file and getting confirmation.

Last updated: 2026-08-03 (region hubs made fully dynamic + SEO/AEO schema + sitemap-indexed)

---

## Public Content Pages

| URL Pattern | Page | CMS page_type | Notes |
|-------------|------|---------------|-------|
| `/` | Homepage | — | Hero, trending, seasonal tabs, regions, feed |
| `/explore` | Trek explorer | — | Full grid with filters |
| `/search` | Search | — | Fuse.js fuzzy + semantic for long queries |
| `/compare` | Trek comparison tool | — | Side-by-side compare tool (`?slugs=a,b` interactive form — stays intact) |
| `/compare/[pair]` | Clean comparison page | — | Server-rendered `{a}-vs-{b}` (e.g. `/compare/kedarkantha-vs-brahmatal`); rendered **live** from the two `trek_guide` pages' backfill data via `GET /api/v1/public/comparisons/{pair}` — **NOT** a CMS page. Pairs are recorded in the `trek_comparisons` table by the publish-triggered comparison agent (same-state top-3); full SEO+AEO (JSON-LD); listed in the separate `/compare-sitemap.xml` (referenced from core `sitemap.xml`) — Step 81 |
| `/treksage` | TrekSage AI chat assistant | — | Myra-style conversational assistant (code-defined, not CMS); session persisted via `treksage_chat_sessions`; calls `POST /api/v1/treksage/chat`; Step 73 |
| `/plan` | Trip planning wizard | — | 6-step intent wizard — Step 57 (done) |
| `/plan/results` | Trek recommendation output | — | Top 5 CMS treks with match scores + lead capture — Step 57 (done) |
| `/trek/[slug]` | Trek detail | `trek_guide` | CMS-first, ISR. **Serves ONLY `trek_guide` pages** — a CMS page of another type at this slug never renders here: `news_article` → **404** (news lives only at `/news/{slug}`); other content types 301/308-redirect to their canonical prefix. "In this cluster" shows only published trek links + this trek's news (as `/news/`). |
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
| `/regions/[slug]` | Regional hub | `regional_hub` (optional) | **Dynamic, code-rendered hub (2026-08-03 rewrite).** Single source of truth = `lib/regions.ts` (`REGIONS` + `resolveRegion`/`regionSlugForState`/`groupStateCounts`). Canonical slugs: uttarakhand, himachal, kashmir, ladakh, maharashtra, sikkim, karnataka (India) + `nepal`, `pakistan`, `tibet` (International Himalaya). A trek's `trek_state` (incl. composite international values like "Koshi Province, Nepal / Tibet, China") resolves to the right hub by exact/`matchWord` substring match — **no per-region code**. Stats (trek count, beginner routes, peak season, permits), FAQs, and schema (`TouristDestination` + `FAQPage` + `BreadcrumbList`) are all generated live from published trek data. An optional `regional_hub` CMS page at slug `regions/{slug}` enriches with editor content + custom FAQs (not required). **Canonical dedupe:** the region page emits `<link rel=canonical>` to the short hub slug; the old auto-slugified composite URLs (`/regions/gilgit-baltistan-pakistan`, `/regions/koshi-province-nepal-tibet-china`, etc.) **301-redirect** to their canonical hub (`next.config.mjs`). Indexed via the root `sitemap.xml` (one `/regions/{slug}` per region with published treks, derived from `trek-state-counts`). Region hero images are real per-region photos in `/public/images/region-*.webp`. |
| `/seasons/[slug]` | Seasonal hub | `seasonal_hub` | CMS-powered |
| `/trek-types/[slug]` | Cluster hub (Trek Category) | `cluster_hub` | Code-first + CMS overlay (like regions). **Generatable from `/admin/hubs`** (2026-08-04): curated categories (`category_meta` — beginner-friendly/weekend/high-altitude/lake/snow/family, matched by predicate) OR keyword_clusters. Renders a live member-trek grid (`/treks/by-cluster?category=` or `?cluster_id=`) + FAQ/ItemList schema. |
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
| `/news-sitemap.xml` | Google News sitemap | Dynamic XML; includes `<news:news>` elements + all `/news/{slug}` `<url>` entries. **All news URLs live here** — NOT in core sitemap.xml. Referenced from core — Step 56 |
| `/compare-sitemap.xml` | Comparison sitemap | Dynamic XML; all `/compare/{a-vs-b}` `<url>` entries from `GET /public/comparisons`. **All compare URLs live here** — NOT in core sitemap.xml. Referenced from core — 2026-07-21 |
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
| `/admin/reports` | Trip Reports moderation queue | Pending/Approved/Rejected filter tabs; approve or reject UGC trail condition reports — STEP-78 |
| `/admin/logs` | System logs | NOT BUILT — post-launch |
| `/admin/app-version` | App Version Gate (iOS) | Force/soft update + maintenance kill-switch — edits live, no app release; STEP-M23 |
| `/admin/settings` | Settings | NOT BUILT — post-launch |

## System Routes

| URL | Purpose | Notes |
|-----|---------|-------|
| `/sitemap.xml` | Core XML sitemap | Auto-generated, force-dynamic. Hub/editorial/guide pages + **all hub URLs emitted code-first from their taxonomies** (2026-08-04): **region hubs** (`/regions/{slug}` from `trek-state-counts`), **seasonal hubs** (`/seasons/{slug}` — 5 canonical seasons from `lib/seasons` + `december`/`may` month hubs), **trek-category hubs** (`/trek-types/{slug}` — 6 curated categories from `lib/categories`). Emitted regardless of CMS generation (they render code-first); any generated CMS hub page at the same slug de-dupes. **References** child sitemaps (treks, hi-trek, news, compare) via robots.txt. |
| `/robots.txt` | Robots rules | Auto-generated from robots.ts. Lists **5 sitemaps** explicitly (core `sitemap.xml` + `/treks-sitemap.xml` + hi-trek + news + compare) — the core `sitemap.xml` is a urlset (not a sitemap index), so children must be declared here for discovery. Fallback `SITE_URL` = `https://www.trekyatra.co.in` (2026-07-28) |
| `/treks-sitemap.xml` | **Single catch-all trek sitemap** | Dynamic XML listing **ALL** published `/trek/{slug}` pages, **any region (India or international), auto-included with ZERO per-region code** → `generateTrekSitemap()` → `GET /public/sitemap-treks` (no state; limit 50000). Replaced the old 10 per-state/region sitemaps (`/{region}-treks-sitemap.xml`), which now **301-redirect** here (next.config.mjs). This is the future-proof design: publish a trek in any new region and it appears automatically. (2026-08-03) |
| `/llms.txt` | LLM site guide (llmstxt.org) | Static curated `apps/web-next/public/llms.txt` — markdown overview + key **public** URLs (start-here, treks, guides, regions/seasons, compare, news, operators, about, programmatic access, sitemaps) for AI/LLM consumers. Meta-file like robots.txt — **NOT indexed** (excluded from sitemap). Lists only public pages + public API/MCP endpoints (no admin/account/auth). Added 2026-07-27 |
| `/api/revalidate` | Next.js cache revalidate | POST, internal |

## TrekSage MCP Server & Datacenter Subdomain (Step 72)

| URL Pattern | Page / Endpoint | Notes |
|-------------|-----------------|-------|
| `datacenter.trekyatra.co.in/` | Datacenter index + JSON viewer | Shows trek list or, with `?slug=<slug>`, renders the full `TrekProfile` JSON bible (content_sections/faqs included) used by TrekSage MCP; Step 73 |
| `datacenter.trekyatra.co.in/trek-guide/[slug]` | **308 redirect** to `/?slug=[slug]` | Old route preserved as permanent redirect; Step 73 |
| `https://api.trekyatra.co.in/mcp` | TrekSage MCP server (Streamable HTTP) | 8 tools: search_treks, get_trek_details, recommend_treks, compare_treks, get_trek_content, ask_trek_question, create_trek_plan_lead, translate_trek_content. Mounted in `app/main.py` |

## API Routes (FastAPI — via DO ingress /api/)

| Pattern | Notes |
|---------|-------|
| `/api/v1/health` | Health check |
| `/api/v1/public/treks/{slug}/reports` | **Public GET** — paginated approved trip reports + condition_summary envelope; STEP-78 |
| `/api/v1/reports` | **Auth POST** — submit a trip report (status=pending); STEP-78 |
| `/api/v1/reports/media/upload` | **Auth POST** — upload report photo to DO Spaces → CDN URL (max 5MB, JPEG/PNG/WebP); STEP-78 |
| `/api/v1/reports/{id}` | **Auth DELETE** — delete own pending report; STEP-78 |
| `/api/v1/app/version-config` | **Public GET** — mobile version gate decision (ok/soft/force/maintenance) for `?platform&current_version`; fail-open; STEP-M23 |
| `/api/v1/admin/app/version-config` | **Admin GET/PUT** — read/update the version gate + maintenance kill-switch per platform; STEP-M23 |
| `/api/v1/admin/reports` | **Admin GET** — moderation queue filterable by status; STEP-78 |
| `/api/v1/admin/reports/{id}/moderate` | **Admin PATCH** — approve or reject a report; STEP-78 |
| `/trekker/[signalId]` | **Public** — privacy-safe trekker profile page; accessed via signal UUID (not user ID); shows display_name, bio, trek_count, experience, planning context; STEP-79 |
| `/account/buddy-requests` | **Auth** — buddy requests dashboard (received/sent tabs, accept/decline, inline chat for accepted pairs); STEP-79 |
| `/api/v1/public/treks/{slug}/buddy-count` | **Public GET** — total active signal count + per-month breakdown; STEP-79 |
| `/api/v1/public/trekkers/{signal_id}` | **Public GET** — public trekker profile via signal UUID; no email/user_id in response; STEP-79 |
| `/api/v1/buddies/signals/{trek_slug}` | **Auth GET** — list active signals for a trek (display_name masked, is_own flag); STEP-79 |
| `/api/v1/buddies/signals` | **Auth POST** — create/upsert a buddy signal (trek_slug, month_year, group_size, experience, notes); STEP-79 |
| `/api/v1/buddies/signals/{signal_id}` | **Auth DELETE** — deactivate own signal; STEP-79 |
| `/api/v1/buddies/requests/received` | **Auth GET** — list requests addressed to me (static route — registered before `/{id}`); STEP-79 |
| `/api/v1/buddies/requests/sent` | **Auth GET** — list requests I sent (static route); STEP-79 |
| `/api/v1/buddies/requests` | **Auth POST** — send buddy request to a signal; 400 for own signal, 409 for duplicate; STEP-79 |
| `/api/v1/buddies/requests/{request_id}` | **Auth PATCH** — accept or reject a request (receiver only, pending only); STEP-79 |
| `/api/v1/buddies/requests/{request_id}/messages/read` | **Auth POST** — mark all unread messages as read (static — registered before `/messages`); STEP-79 |
| `/api/v1/buddies/requests/{request_id}/messages` | **Auth GET/POST** — get chat messages (auto-marks read) / send new message; 403 if not party or not accepted; STEP-79 |
| `/api/v1/public/treks/{slug}/conditions` | **Public GET** — live conditions (weather + trail status + permit status + summary); 404 if no coordinates; STEP-80 |
| `/api/v1/admin/conditions` | **Admin GET** — list all published trek_guide pages with coords/trail/permit/weather status; STEP-80b |
| `/api/v1/admin/conditions/seed-coordinates` | **Admin POST** — seed `trek_base_lat`/`trek_base_lng` on `cms_pages` from `TREK_COORDS` dict for ~40 Himalayan treks; STEP-80 |
| `/api/v1/admin/conditions/refresh-all` | **Admin POST** — dispatch `conditions.refresh_all` Celery task immediately (returns task_id); STEP-80b |
| `/api/v1/admin/conditions/{slug}/refresh` | **Admin POST** — force-refresh a single trek's conditions from Open-Meteo; STEP-80 |
| `/admin/conditions` | **Admin page** — Live Conditions dashboard (KPI cards, seed + refresh-all actions, per-trek status table); STEP-80b |
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
| `/api/v1/treks/seasonal?season=&month=` | **Public GET** — treks in a canonical season (`spring\|summer\|monsoon\|autumn\|winter`) or month; **backfill-first** matcher (`trek_best_months`→`trek_open_months`→`trek_season` string) via `app.modules.hubs.season_meta`. Powers home season tabs + `/seasons/[slug]` (2026-08-04) |
| `/api/v1/treks/by-cluster?cluster_id=&theme=` | **Public GET** — treks in a Trek Category: `cluster_id` FK membership first, then `trek_themes` keyword fallback (`app.modules.hubs.cluster_meta`). Powers `/trek-types/[slug]` (2026-08-04) |
| `/api/v1/plan/*` | Trip planner |
| `/api/v1/leads` | Lead capture |
| `/api/v1/newsletter/*` | Newsletter (public subscribe → `newsletter_subscribers`; new signups get a source-aware **welcome email** + platform sync) |
| `/api/v1/admin/newsletter/subscribers` | **Admin GET** — paginated subscribers, filter `?source_page=` (e.g. `ios_waitlist`); PII, admin-gated (2026-08-04) |
| `/api/v1/admin/newsletter/subscribers/export.csv` | **Admin GET** — CSV export of matching subscribers; PII, admin-gated (2026-08-04) |
| `/api/v1/admin/hubs/{slug}/regenerate` | **Admin POST** — regenerate a hub. `seasonal_hub` → SeasonalContentAgent; **`regional_hub` → RegionalContentAgent** (hybrid: deterministic scaffold + optional LLM intro; 2026-08-04); `cluster_hub` → 501 (pipeline) |
| `/api/v1/admin/hubs/regions/catalog` | **Admin GET** — canonical region hubs available to generate (powers "Generate Missing Regional Hubs"); source `app.modules.hubs.region_meta.REGIONS` (2026-08-04) |
| `/api/v1/admin/hubs/clusters/catalog` | **Admin GET** — Trek Category hubs available to generate: curated categories (`category_meta.CATEGORIES`) + pipeline keyword_clusters, each with `has_page` (powers "Generate Missing Trek Category Hubs") (2026-08-04) |
| `/api/v1/admin/hubs/clusters/generate` | **Admin POST** — generate a `cluster_hub` from `{category_slug}` (curated) or `{cluster_id}` (keyword_cluster) via **ClusterContentAgent** (hybrid). Existing cluster hubs also regenerate via `/{slug}/regenerate` (2026-08-04) |
| `/api/v1/treks/by-cluster?category=` | **Public GET** — curated Trek Category slug matches treks by predicate (`category_meta`); else cluster_id/theme. Powers `/trek-types/[slug]` (2026-08-04) |
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
