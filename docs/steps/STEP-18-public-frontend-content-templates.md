# STEP 18 — Public Frontend Content Page Templates

## Goal
Replace all static/mock data on public content pages with real content pulled from WordPress and the backend API. Implement full-fidelity page templates for every core V1 content type. These are the pages that will rank and generate revenue.

## Scope

### Page templates to implement (all consume Master CMS API via `/api/v1/cms/pages/{slug}`)
1. **Trek Guide** (`/treks/[slug]`) — full guide with TOC, breadcrumbs, FAQs, related treks, CTA slots
2. **Packing List** (`/packing/[slug]`) — checklist format, gear items with affiliate link slots, download CTA
3. **Best-Time / Seasonal** (`/seasons/[slug]`) — month calendar, weather summary, trek recommendations
4. **Comparison** (`/compare/[slug]`) — side-by-side comparison table, winner badge, CTA
5. **Permit Guide** (`/permits/[slug]`) — permit details, official source note, safety disclaimer
6. **Beginner Roundup** (`/guides/[slug]`) — curated list with trek cards and difficulty indicators
7. **Region / Category listing** (`/regions/[slug]`, `/treks`) — filterable card grid with pagination

### Shared content components
- `TableOfContents` — sticky sidebar or inline TOC from H2/H3 headings
- `Breadcrumb` — schema-ready breadcrumb navigation
- `FAQAccordion` — expandable FAQ section (structured for schema)
- `RelatedContent` — horizontal scroll rail of related page cards
- `AuthorBlock` — author info with updated-on timestamp
- `SafetyDisclaimer` — prominent block for safety-sensitive content
- `AffiliateDisclosure` — top-of-page disclosure for commercial pages
- `UpdatedBadge` — "last updated" freshness signal

### Data fetching pattern
- All content pages use Next.js `generateStaticParams` + ISR (revalidate: 3600)
- `fetchCMSPage(slug)` from `lib/api.ts` — server-side fetch with `cache: "no-store"`
- If CMS page not found or not published, serve static fallback data (existing `data/treks.ts`)
- Structured data (JSON-LD) injected in page metadata (wired in Step 19)
- Cache invalidation: `POST /api/v1/cms/cache/invalidate` + `POST /api/revalidate` from admin UI

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md
- Confirm Step 16 complete (Master CMS API working, publish_to_cms tested)
- At least 2-3 published CMS pages per content type (use admin CMS page or publish a draft)

## Dependency Check
- `apps/web-next/lib/api.ts` — fetchCMSPage / fetchCMSPages added in Step 16
- `apps/web-next/app/(public)/treks/[slug]/page.tsx` — fully rewritten; existing mock data replaced
- No backend changes in this step; all new code is frontend
- `apps/web-next/components/` — new shared components created (no existing components modified)

## Planned Files to Create
- `apps/web-next/components/content/TableOfContents.tsx`
- `apps/web-next/components/content/Breadcrumb.tsx`
- `apps/web-next/components/content/FAQAccordion.tsx`
- `apps/web-next/components/content/RelatedContent.tsx`
- `apps/web-next/components/content/AuthorBlock.tsx`
- `apps/web-next/components/content/SafetyDisclaimer.tsx`
- `apps/web-next/components/content/AffiliateDisclosure.tsx`
- `apps/web-next/components/content/UpdatedBadge.tsx`
- `apps/web-next/app/(public)/packing/[slug]/page.tsx`
- `apps/web-next/app/(public)/seasons/[slug]/page.tsx`
- `apps/web-next/app/(public)/permits/[slug]/page.tsx`
- `apps/web-next/app/(public)/guides/[slug]/page.tsx`

## Planned Files to Modify
- `apps/web-next/app/(public)/treks/[slug]/page.tsx` — real WP data + full template
- `apps/web-next/app/(public)/treks/page.tsx` — filterable listing from WP
- `apps/web-next/app/(public)/compare/[slug]/page.tsx` — real comparison data
- `apps/web-next/app/(public)/regions/[slug]/page.tsx` — real regional data
- `docs/MASTER_TRACKER.md`
- `docs/DEPENDENCY_MAP.md`

## Validation Commands
```bash
cd apps/web-next && npm run build
cd apps/web-next && npm run dev

# Visit each template type
open http://localhost:3000/treks
open http://localhost:3000/treks/<slug>
open http://localhost:3000/packing/<slug>
open http://localhost:3000/compare/<slug>
open http://localhost:3000/permits/<slug>
open http://localhost:3000/seasons/<slug>
open http://localhost:3000/guides/<slug>

# Verify fallback: stop WP, confirm pages still load from static fallback
```

## Status
pending

## Notes
- All page templates must include the UpdatedBadge (freshness signal for SEO trust)
- Comparison page: uses a structured comparison table; winner/recommended badge driven by a metadata field on the WP post
- Safety-sensitive content types (permit, beginner roundup, seasonal): always include SafetyDisclaimer
- Affiliate-heavy pages (packing list, gear pages): always include AffiliateDisclosure at top
- Mobile: TOC should collapse into a sticky "Jump to section" button on screens < 768px
- RelatedContent: uses `/api/v1/links/suggestions/{page_id}` once Step 22 (internal linking) is done; until then, shows same-cluster posts from WP
