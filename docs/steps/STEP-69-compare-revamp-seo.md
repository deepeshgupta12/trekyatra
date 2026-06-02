# STEP-69 — Compare Feature SEO/AEO Revamp

**Status:** Done
**Phase:** SEO / Production Hardening
**Dependencies:** Step 26 (trek data API), Step 44 (saved comparisons), Step 45 (JSON-LD schemas), Step 50 (AEO FAQ blocks)

---

## Scope

The current `/compare` page is a functional stub with serious weaknesses that prevent it from performing in SEO or AEO:

| Weakness | Details |
|---------|---------|
| Static data | Uses `import { treks } from "@/data/treks"` — NOT CMS trek data |
| No SEO metadata | No `generateMetadata`, no title/description, no OG tags |
| No JSON-LD | No structured data (WebPage, FAQPage, ItemList schemas) |
| No AEO content | No FAQ block for voice search / AI answer boxes |
| No sitemap entry | `/compare` not in `sitemap.ts` |
| No saved comparisons wiring | `POST/GET /api/v1/account/comparisons` exists but not called |
| No interlinking | No "Compare" CTA from trek detail pages or explore page |
| No canonical | No canonical URL set |

This step delivers a full production-grade compare page.

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/web-next/app/(public)/compare/page.tsx` | Full rewrite — CMS data, metadata, JSON-LD, AEO FAQ, saved comparisons, canonical |
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | Add "Compare" CTA button linking to `/compare?slugs={slug}` |
| `apps/web-next/app/sitemap.ts` | Add `/compare` static entry |
| `apps/web-next/lib/api.ts` | Verify `fetchTreks()` (or add) for compare page to pull live CMS trek list |
| `apps/web-next/components/trek/TrekCard.tsx` | Add optional `showCompareButton` prop that links to `/compare?slugs={slug}` |
| `docs/URL_MAP.md` | Add `/compare` entry if missing (verify current state) |

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web-next/app/(public)/compare/CompareClient.tsx` | Extract client-side state/interactions into a separate client component |

---

## Architecture Change: Server + Client Split

The current page is `"use client"` entirely. This prevents:
- `generateMetadata` (must be Server Component)
- Server-side data fetch from CMS API
- JSON-LD injection server-side

**New pattern:**
```
compare/page.tsx        ← Server Component (metadata, data fetch, JSON-LD)
compare/CompareClient.tsx ← Client Component ("use client") — slug state, URL sync, dropdowns
```

The server component fetches the full trek list from CMS API on the server and passes it as `initialTreks` to `CompareClient`.

---

## Data Source Change

**Before:** `import { treks } from "@/data/treks"` (12 hardcoded static treks)

**After:** Server-side fetch from CMS API:
```typescript
// In compare/page.tsx (Server Component)
const cmsPages = await fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 100 });
const treks = cmsPages.map(mapCMSPageToTrek); // maps CMS page to Trek shape
```

`mapCMSPageToTrek` maps the `CMSPage` fields to the `Trek` interface shape used by `TrekCard`. If CMS pages are empty (e.g. dev environment), fall back to static `@/data/treks`.

---

## Metadata (generateMetadata)

```typescript
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Compare Treks Side by Side | TrekYatra",
    description: "Compare India's best treks by duration, altitude, difficulty, best season, and cost. Find the right Himalayan trek for your fitness and schedule.",
    keywords: ["compare treks india", "himalayan trek comparison", "best treks for beginners", "trek difficulty comparison"],
    alternates: {
      canonical: "https://trekyatra.co.in/compare",
    },
    openGraph: {
      title: "Compare Treks Side by Side | TrekYatra",
      description: "Compare duration, altitude, difficulty, and cost for India's top trekking routes.",
      url: "https://trekyatra.co.in/compare",
      type: "website",
    },
  };
}
```

---

## JSON-LD Schemas

Inject three schemas via `SchemaInjector`:

### 1. WebPage schema
```json
{
  "@type": "WebPage",
  "name": "Compare Treks Side by Side",
  "description": "...",
  "url": "https://trekyatra.co.in/compare"
}
```

### 2. ItemList schema (top 6 treks by popularity)
```json
{
  "@type": "ItemList",
  "name": "Popular Indian Treks",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "url": "https://trekyatra.co.in/trek/kedarkantha", "name": "Kedarkantha Trek" },
    ...
  ]
}
```

### 3. FAQPage schema (mirrors the AEO FAQ block)

---

## AEO FAQ Block

Add 6 FAQs below the compare table. These target voice search and AI answer boxes:

| Question | Answer |
|----------|--------|
| Which is easier — Kedarkantha or Brahmatal? | Both are beginner-friendly winter treks. Kedarkantha has a steeper summit push but shorter overall distance. Brahmatal is longer with a gentler gradient. |
| What is the easiest trek in India for beginners? | Kedarkantha (Uttarakhand), Dayara Bugyal, and Chopta-Tungnath are excellent beginner options — 4–6 days, moderate altitude gain, well-marked trails. |
| How do I compare treks by difficulty? | TrekYatra rates difficulty as Easy / Moderate / Challenging / Difficult based on altitude gain per day, trail grade, and required fitness. Use the compare tool to evaluate treks side by side. |
| Can I compare more than two treks? | Yes — TrekYatra's compare tool supports up to 3 treks simultaneously. Use the + Add Trek button to add a third. |
| Which trek has the highest altitude? | Use the "Max altitude" row in the comparison table. Stok Kangri (6,153 m) is the highest listed trek; most beginner treks peak at 3,000–4,500 m. |
| How much does a Himalayan trek cost? | Budget treks cost ₹5,000–₹12,000 for an independent trip. Operator-led packages range from ₹8,000–₹25,000 per person for 5–7 day treks. Use the compare tool to check cost estimates. |

---

## Saved Comparisons API Wiring

When a signed-in user clicks "Save comparison":
```typescript
// POST /api/v1/account/comparisons
await saveComparison({ slugs: selectedSlugs });
// Shows toast: "Comparison saved to your account"
```

Load saved comparisons on mount:
```typescript
// GET /api/v1/account/comparisons
const saved = await getSavedComparisons();
// Shows "Load saved" button if comparisons exist
```

If not signed in, show: "Sign in to save comparisons" link.

---

## Interlinking from Trek Detail Page

In `apps/web-next/app/(public)/trek/[slug]/page.tsx`, add a "Compare" button in the hero/CTA section:

```tsx
<Link href={`/compare?slugs=${cmsPage.slug}`}>
  <Button variant="outline" size="sm">
    Compare with another trek
  </Button>
</Link>
```

Position: in the `TrekCTAs` component area or just below the meta strip (before the article body), so it's visible above the fold.

---

## Sitemap Entry

In `apps/web-next/app/sitemap.ts`, add to the static routes section:
```typescript
{ url: `${BASE_URL}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
```

---

## URL Canonical and Share Link

- Canonical: `https://trekyatra.co.in/compare`
- Share links: `/compare?slugs=slug1,slug2` (existing URL param pattern — keep as-is)
- Preloaded from trek detail: `/compare?slugs=kedarkantha` (single slug → user picks the second to compare)

---

## No Migration Required

No new DB tables or columns. Uses existing `account_comparisons` table (Step 44).

---

## Verification

1. **TC-69-01**: `/compare` page — view source has `<title>Compare Treks Side by Side</title>`
2. **TC-69-02**: Dropdown list shows CMS trek names (not just 12 static treks)
3. **TC-69-03**: Select 2 treks → comparison table renders with CMS data
4. **TC-69-04**: FAQ section renders below the table with all 6 questions
5. **TC-69-05**: Trek detail page hero area has "Compare with another trek" button → click → `/compare?slugs={slug}` pre-loads that trek
6. **TC-69-06**: Signed in user → save comparison → "Comparison saved" toast; reload → saved state restored
7. **TC-69-07**: `next build` with no TypeScript errors
8. **TC-69-08**: View page source → find JSON-LD script with `@type: "FAQPage"`
9. **TC-69-09**: `GET /sitemap.xml` → `/compare` entry is present

---

## Implementation Notes (Done — 2026-06-02)

**Files Created:**
- `apps/web-next/app/(public)/compare/CompareClient.tsx` — `"use client"` component; `CompareTrek` interface exported; `CompareClient({ initialTreks })` renders dropdowns, comparison table, save button, AEO FAQ accordion (6 Qs)

**Files Modified:**
- `apps/web-next/app/(public)/compare/page.tsx` — FULL REWRITE: server component; `generateMetadata()` with canonical + OG; fetches CMS trek guides (`fetchCMSPages page_type=trek_guide, limit=200`); static fallback for empty API; 3 JSON-LD scripts (WebPage, ItemList top-6, FAQPage); `revalidate=3600`
- `apps/web-next/components/trek/TrekCTAs.tsx` — bug fix: `/compare?a=${slug}` → `/compare?slugs=${slug}` (URL param mismatch with compare page reader)

**No backend changes.** All APIs pre-exist (Step 16 CMS pages, Step 44 saved comparisons).

**Sitemap:** `/compare` was already present at priority 0.7 — no change needed.

**Build:** `next build` ✅ zero TypeScript errors (193 pages)
**GitNexus:** 13,370 nodes | 18,267 edges | 493 clusters | 140 flows
