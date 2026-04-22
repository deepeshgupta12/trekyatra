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

## Status
pending

## Notes
- `generateMetadata()` must be async and await the WP post fetch — reuse same fetch as the page component (Next.js deduplicates requests in the same render pass)
- FAQPage schema only injected if the draft/post has a non-empty FAQ section (check before injecting)
- Sitemap: cap at 1000 URLs per sitemap file initially; add sitemap index if content grows past that
- Organization schema: include logo URL, social profiles, and site name — set these as env vars
- SearchAction schema on homepage enables Google's Sitelinks Searchbox — implement only if public search page is live
- Do not add Review schema unless real verified reviews exist — Google penalizes fake review markup
