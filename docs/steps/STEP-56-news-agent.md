# Step 56 — Weekly News Agent + /news/[slug] Pages

## Status: Done

## Summary
A weekly cron job agent that extracts the most recent news articles related to published trek guides and creates SEO/AEO-optimised news pages under `/news/{slug}`.

## Motivation
- Fresh news content drives Google News indexing and improves SERP freshness signals
- Trek-specific news (new route openings, permit changes, weather alerts, operator news) is high-intent for users
- Automated weekly generation keeps content fresh without manual editorial effort

## Agent Design

### Cron Schedule
- Runs every Monday at 12:00 AM IST (UTC+5:30 → 18:30 UTC Sunday)
- Celery beat schedule: `weekly_news_agent`

### Input
For each published trek_guide CMS page:
- `slug` — trek slug
- `trek_name` — from cms_pages.trek_name or title
- `trek_state` — from cms_pages.trek_state

### Process (LangGraph nodes)
1. **fetch_news** — call a news API (e.g. NewsAPI, SerpAPI news, or DuckDuckGo news) for `"{trek_name} trek {year}"` and `"{trek_name} permit {year}"`
2. **filter_relevant** — LLM filters for genuine news (not generic articles); scores relevance
3. **write_article** — LLM writes a structured news article following SEO/AEO guidelines
4. **store_cms** — creates/updates a CMS page at slug `{trek_slug}-news-{YYYY-WW}`

### Article Structure (mandatory)
- H1: `{Trek Name} News — Week of {Date}`
- H2: Summary of key developments
- H2: Detailed breakdown of each news item
- H2: What this means for trekkers
- H2: FAQs
- Table of Contents
- Schema.org `NewsArticle` JSON-LD
- Meta title: `{Trek Name} Latest News {Month Year}`
- Meta description: 150-160 chars with trek name + key news item

## New URL Pattern
`/news/[slug]` — trek news articles

| URL Pattern | Page | CMS page_type | Notes |
|-------------|------|---------------|-------|
| `/news` | News hub | — | Lists all news articles, filterable by trek/state |
| `/news/[slug]` | Trek news article | `news_article` | Auto-generated weekly by agent |

## New DB Columns (or new table)
- Add `news_article` to `page_type` enum/allowed values
- OR create a separate `news_articles` table with: `id`, `slug`, `trek_slug`, `title`, `content_html`, `content_json`, `published_at`, `week_number`

## SEO Requirements
- `<meta name="news_keywords">` with trek name + key entities
- `datePublished` + `dateModified` in NewsArticle schema
- `about` pointing to the trek guide CMS page
- Canonical URL: `/news/{slug}`
- Sitemap: `/news-sitemap.xml` — updated weekly

## AEO Requirements
- FAQ schema with at least 3 Q&A pairs
- `speakable` property in Article schema for voice search
- Structured `hasPart` linking to the source trek guide

## Files to Create (Backend)
- `services/api/alembic/versions/YYYYMMDD_0036_news_article.py` — news_articles table
- `services/api/app/modules/agents/news/agent.py` — NewsAgent LangGraph
- `services/api/app/modules/agents/news/prompts.py` — article writing prompt
- `services/api/app/worker/tasks/news.py` — Celery task

## Files to Create (Frontend)
- `apps/web-next/app/(public)/news/page.tsx` — news hub
- `apps/web-next/app/(public)/news/[slug]/page.tsx` — individual news article
- `apps/web-next/app/news-sitemap.xml/route.ts` — news sitemap

## Files to Modify
- `services/api/app/worker/celery_app.py` — add weekly_news_agent beat schedule
- `docs/URL_MAP.md` — add /news and /news/[slug]

## Dependencies
- Step 46 (trek_* columns for filtering) ✅
- Step 17 (pipeline publish) ✅
- News data source: Google News RSS (free, no API key required)

---

## Implementation Notes (Done — 2026-05-26)

### News source decision
Google News RSS (`https://news.google.com/rss/search?q=...&hl=en-IN&gl=IN&ceid=IN%3Aen`) — free, no API key. Parsed with `xml.etree.ElementTree`.

### Files Created (Backend)
- `services/api/app/modules/agents/news/__init__.py` — package init
- `services/api/app/modules/agents/news/prompts.py` — ARTICLE_PROMPT for Claude Haiku; `|||` separator splits HTML from JSON metadata
- `services/api/app/modules/agents/news/agent.py` — LangGraph 4-node agent: fetch_news → filter_relevant → write_article → store_cms; public `generate_news(trek_slug, trek_name, trek_state, db)` API
- `services/api/app/worker/tasks/news.py` — `news.generate_for_trek` Celery task + `news.weekly_all_treks` cron task
- `services/api/app/api/routes/news.py` — GET /public/news, GET /public/news/by-trek/{trek_slug}, GET /public/news/{slug}, POST /admin/news/generate/{trek_slug}
- `services/api/tests/test_news.py` — 18 tests (all pass)

### Files Modified (Backend)
- `services/api/app/api/router.py` — news_router registered
- `services/api/app/worker/celery_app.py` — `app.worker.tasks.news` in include list; `weekly-news-agent` beat schedule (604800s)

### Files Created (Frontend)
- `apps/web-next/app/(public)/news/page.tsx` — news hub; groups articles by trek, cards with date + week label
- `apps/web-next/app/(public)/news/[slug]/page.tsx` — article page with NewsArticle JSON-LD (speakable, about, hasPart), FAQ accordion, sidebar trek links, news_keywords meta
- `apps/web-next/app/news-sitemap.xml/route.ts` — Google News sitemap with `<news:news>` elements

### Files Modified (Frontend)
- `apps/web-next/lib/api.ts` — NewsArticle interface + fetchNewsArticles, fetchNewsByTrek, fetchNewsArticle, generateTrekNews
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — related news section (thumbnail, title, href links) + SiteNavigation JSON-LD schema
- `apps/web-next/app/sitemap.ts` — `/news`, `/news-sitemap.xml`, `news_article` page_type added
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — "Generate News" (Newspaper icon) button per EN trek_guide row

### Key design decisions
- `page_type = "news_article"` stored in existing `cms_pages` table — no new DB table needed
- News slug: `{trek_slug}-news-{YYYY-WW}` (idempotent weekly upsert)
- LLM model: `claude-haiku-4-5-20251001`, max_tokens=4000; fallback template HTML when no API key
- Admin auth bypassed in tests by global `bypass_admin_auth_for_existing_tests` conftest fixture
- Route ordering: `/by-trek/` registered before `/{slug}` to prevent ambiguity

### Test results
18/18 tests pass. `next build` passes with zero TypeScript errors.

---

## Architecture Fix — Per-Item Articles (2026-05-26)

Rewrote agent, tests, frontend page, and admin CMS to fix 8 reported issues.

### Core architectural change
**Old:** One aggregated weekly digest page per trek (`{trek_slug}-news-{YYYY-WW}`) containing all RSS items in a single `content_html`.
**New:** One separate CMS page per RSS article, slug derived from the news headline + YYYY-MM.

### Files Modified (Backend — Fix)
- `services/api/app/modules/agents/news/agent.py` — Completely rewritten: `_slug_from_title()` (strips source attribution, appends YYYY-MM), `_clean_title()`, `_fallback_for_item()`, `_llm_article_for_item()`, `write_and_store_articles` node (replaces write_article + store_cms); content_json now `{trek_slug, news_item: {...}, faqs: [...]}` (single item, not list)
- `services/api/app/modules/agents/news/prompts.py` — Replaced ARTICLE_PROMPT with INDIVIDUAL_ARTICLE_PROMPT; instructs model to strip source attribution from h1, avoid double "Trek", generate per-item 300-word article
- `services/api/app/worker/tasks/news.py` — Updated log statement for new return format
- `services/api/app/api/routes/news.py` — `get_news_by_trek` filter changed from slug prefix (`slug.startswith`) to JSON field (`content_json ->> 'trek_slug'`) — works for both old and new articles
- `services/api/tests/test_news.py` — Completely rewritten: 19 tests (was 18); new tests for `_slug_from_title`, `_clean_title`, `_fallback_for_item`, `write_and_store_articles` (create + skip); all pass

### Files Created (Frontend — Fix)
- `apps/web-next/lib/trek-utils.ts` — Shared `cmsPageToTrek()` utility; eliminates duplicated logic in DifficultyTabsSection + SeasonalTreksSection

### Files Modified (Frontend — Fix)
- `apps/web-next/lib/api.ts` — `NewsArticle.content_json` adds `news_item` field (single RSS item, new format); `news_items` kept for legacy backward compat
- `apps/web-next/app/(public)/news/[slug]/page.tsx` — Rewritten: improved hero (trek badge, source attribution in byline), Table of Contents from `content_json`'s h2 IDs, sidebar shows TOC + trek links + single source attribution; breadcrumb fixed; uses `content_json.news_item` (not legacy `news_items`)
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — Fixed "Trek Trek" double heading: `{trek.name} Trek — Recent Updates` → `{trek.name} — Latest News`
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — Added tabs (All / Trek Guides / News / Other), status filter, language filter, Generate News popup modal (replaces inline feedback message); `news_article` added to PAGE_PREFIX (`/news`)
- `apps/web-next/components/home/DifficultyTabsSection.tsx` — Replaced local `cmsToTrek` with imported `cmsPageToTrek` from trek-utils
- `apps/web-next/components/home/SeasonalTreksSection.tsx` — Replaced local `cmsToTrek` with imported `cmsPageToTrek` from trek-utils

### Test results (Fix)
19/19 backend tests pass. `next build` passes with zero TypeScript errors.
