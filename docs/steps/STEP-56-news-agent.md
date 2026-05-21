# Step 56 — Weekly News Agent + /news/[slug] Pages

## Status: Pending

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
- News data source: NewsAPI key or SerpAPI key (new env var `NEWS_API_KEY`)
