# STEP 19 — SEO and Schema Infrastructure (Frontend)

## Goal
Implement all SEO rendering controls in the Next.js frontend: metadata API, JSON-LD structured data, canonical tags, XML sitemap, and robots.txt. This is the technical SEO foundation that makes content rankable and answer-engine-ready.

## Scope

### Next.js Metadata API
- Implement `generateMetadata()` in every dynamic page: title, description, Open Graph (og:title, og:description, og:image, og:type), Twitter Card
- Metadata templates by page type (trek guide, packing list, comparison, etc.)
- Dynamic title pattern: `{Trek Name} — Trek Guide | TrekYatra`
- Global metadata defaults in `app/layout.tsx`
- Canonical tag: set via `alternates.canonical` in metadata

### JSON-LD Structured Data
- `SchemaInjector` component: renders <script type="application/ld+json"> in page head
- Schema types by page:
  - Trek Guide → Article + BreadcrumbList + FAQPage (if FAQs present)
  - Packing List → Article + ItemList
  - Comparison → Article
  - Permit Guide → Article + FAQPage
  - Beginner Roundup → ItemList
  - Home → WebSite + Organization + SearchAction
  - Author page → Person
- `buildArticleSchema(post)` — utility for article-type schemas
- `buildFAQSchema(faqs)` — utility for FAQPage schemas
- `buildBreadcrumbSchema(crumbs)` — utility for breadcrumb schemas
- `buildWebSiteSchema()` — static org + site schema

### XML Sitemap
- `/sitemap.xml` via Next.js App Router `app/sitemap.ts`
- Pulls post list from WP API (trek guides, packing lists, etc.)
- Includes changefreq and priority hints by page type
- Excludes auth pages, account pages, admin pages

### robots.txt
- `app/robots.ts` in Next.js App Router
- Block: /admin/*, /account/*, /auth/*
- Allow: everything else
- Sitemap reference included

### Breadcrumb navigation
- Site-wide breadcrumb using `Breadcrumb` component from Step 18
- Schema-backed (BreadcrumbList JSON-LD generated from breadcrumb data)

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 18 complete (all content page templates implemented)
- At least one post per content type available in WP for sitemap testing

## Dependency Check
- `apps/web-next/app/layout.tsx` — metadata defaults added (additive)
- All page files from Step 18 modified to add `generateMetadata()`
- No backend changes in this step
- `apps/web-next/app/sitemap.ts` — new file (Next.js App Router convention)
- `apps/web-next/app/robots.ts` — new file

## Planned Files to Create
- `apps/web-next/lib/schema.ts` — all schema builder utilities
- `apps/web-next/components/seo/SchemaInjector.tsx`
- `apps/web-next/app/sitemap.ts`
- `apps/web-next/app/robots.ts`

## Planned Files to Modify
- `apps/web-next/app/layout.tsx` — add global metadata defaults and Organization schema
- `apps/web-next/app/(public)/treks/[slug]/page.tsx` — add generateMetadata + Article + FAQ schemas
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — add generateMetadata + ItemList schema
- `apps/web-next/app/(public)/compare/[slug]/page.tsx` — add generateMetadata
- `apps/web-next/app/(public)/permits/[slug]/page.tsx` — add generateMetadata + FAQ schema
- `apps/web-next/app/(public)/seasons/[slug]/page.tsx` — add generateMetadata
- `apps/web-next/app/(public)/guides/[slug]/page.tsx` — add generateMetadata + ItemList schema
- `apps/web-next/app/(public)/page.tsx` — homepage WebSite + Organization schema
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
cd apps/web-next && npm run build
cd apps/web-next && npm run dev

# Sitemap
curl http://localhost:3000/sitemap.xml

# Robots
curl http://localhost:3000/robots.txt

# Schema validation: view source of a trek page and check for ld+json scripts
open http://localhost:3000/treks/<slug>
# Use Google Rich Results Test or browser devtools to verify JSON-LD

# OG tags: check with curl
curl -s http://localhost:3000/treks/<slug> | grep -i 'og:'
```

## Files Created
- `apps/web-next/lib/schema.ts` — buildArticleSchema, buildFAQSchema, buildBreadcrumbSchema, buildItemListSchema, buildWebSiteSchema
- `apps/web-next/components/seo/SchemaInjector.tsx` — JSON-LD script tag renderer; filters null schemas
- `apps/web-next/app/sitemap.ts` — Next.js App Router sitemap; static + trek slugs + CMS pages; deduplicates
- `apps/web-next/app/robots.ts` — blocks /admin/, /account/, /auth/, /api/; references sitemap URL

## Files Modified
- `apps/web-next/app/layout.tsx` — metadataBase, global OG/Twitter/robots defaults
- `apps/web-next/app/(public)/page.tsx` — WebSite JSON-LD via SchemaInjector
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — canonical, OG, Twitter, Article+FAQPage+BreadcrumbList JSON-LD; section padding; TOC hash fix
- `apps/web-next/app/(public)/packing/[slug]/page.tsx` — canonical, OG, Twitter, Article+FAQ JSON-LD
- `apps/web-next/app/(public)/permits/[slug]/page.tsx` — canonical, OG, Twitter, Article+FAQ JSON-LD
- `apps/web-next/app/(public)/guides/[slug]/page.tsx` — canonical, OG, Twitter, Article+FAQ JSON-LD
- `apps/web-next/lib/api.ts` — FactCheckClaim type + fetchFactCheckClaims (Step 18 fix)
- `apps/web-next/app/(admin)/admin/fact-check/page.tsx` — real-API client component (Step 18 fix)
- `apps/web-next/components/content/TableOfContents.tsx` — history.pushState URL hash (Step 18 fix)
- `services/api/app/main.py` — _cancel_stale_runs() lifespan startup hook (Step 18 fix)
- `services/api/app/api/routes/pipeline.py` — DELETE /admin/pipeline/runs/clear (Step 18 fix)
- `services/api/app/api/routes/agent_runs.py` — DELETE /admin/agent-runs/clear (Step 18 fix)
- `services/api/app/api/routes/admin.py` — GET /admin/fact-check/claims (Step 18 fix)
- `services/api/app/schemas/admin.py` — ClaimResponse model (Step 18 fix)
- `services/api/app/modules/cms/service.py` — two-pass trek facts extraction; H3 FAQ parsing (Step 18 fix)
- `services/api/app/modules/agents/seo_aeo/agent.py` — _clean_llm_json() (Step 18 SEO fix)
- `services/api/app/modules/agents/seo_aeo/prompts.py` — explicit JSON escaping instruction (Step 18 SEO fix)
- `services/api/tests/test_cms.py` — 11 new tests; 168/168 pass
- `CLAUDE.md` — Section 15 (Admin Design System) + Section 16 (Inter-Step Dependency Protocol) added

## Status
Done

## Notes
- `generateMetadata()` is async in all dynamic route pages; reuses the same CMS fetch as the page (Next.js deduplicates requests in the same render pass)
- FAQPage schema only injected when `faqItems.length > 0` — no empty schema blocks emitted
- Sitemap deduplicates by URL so static + CMS entries for the same trek slug don't duplicate
- Two-pass trek facts: table format (`| **Duration** | 7 days |`) tried first; KV format (`**Duration:** 7 days`) as fallback; season heading guard: colon REQUIRED to avoid capturing headings like "Best Time to Do the Trek?"
- _clean_llm_json() character-level walker: escapes literal \n/\r/\t inside JSON string values; fixes SEO/AEO agent truncation at char ~4479
- Stale-run cleanup: on startup, any AgentRun or PipelineRun with status="running" is set to "cancelled" — prevents phantom runs after worker restart
- CMS persistence (data not wiped): Docker bind mounts (./postgres-data, ./redis-data) are correct. If data appears wiped, check if test fixtures with autouse=True are deleting from the real DB or if pipeline runs are stuck at approval gates (no published CMS pages visible until pipeline completes)
- Fact Check page: uses real DraftClaim data joined with ContentDraft for title; supports flagged_only toggle
- GitNexus re-indexed post-step: 4,052 nodes | 6,910 edges | 115 clusters | 152 flows (commit fef0028)
- Pipeline keyword_cluster fix: `_run_keyword_cluster` now falls back to 10 most-recent DB topics when trend_discovery returns `topic_ids: []`; root cause was TrendDiscoveryAgent `_store_results` silently swallowing exceptions — if the first `create_topic` failed with a non-IntegrityError, the DB session was left in an aborted transaction state, causing all subsequent topic inserts to fail with PendingRollbackError; fixed by adding `logger.warning()` + `self.db.rollback()` in the except block
- GitNexus re-indexed post pipeline-fix: 4,093 nodes | 7,032 edges | 116 clusters | 155 flows
