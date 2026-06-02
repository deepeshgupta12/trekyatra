# STEP-70 — Component Wiring: MonetizationSlot (Z02) + GatedContent (Z03)

**Status:** Pending
**Phase:** Production Hardening
**Dependencies:** Step 36 (MonetizationSlot built), Step 40 (GatedContent built), Step 26 (trek CMS page + is_premium field)

---

## Scope

Two components were built in earlier steps but never wired into the trek detail page:

| Gap | Component | Status |
|-----|-----------|--------|
| Z02 | `MonetizationSlot` | Built (Step 36, `components/monetization/MonetizationSlot.tsx`) — NOT used in trek/[slug]/page.tsx |
| Z03 | `GatedContent` | Built (Step 40, `components/subscription/GatedContent.tsx`) — NOT used anywhere |

**Current state of trek/[slug]/page.tsx:**
- Line 17: Imports `AffiliateRail` directly — static affiliate gear hardcoded
- Line 492: `<AffiliateRail items={gearItems} title="Recommended gear for this trek" />` — does NOT use intent-based selection
- No check for `cmsPage.is_premium` anywhere in the page

**MonetizationSlot** is a Server Component at `components/monetization/MonetizationSlot.tsx`. It calls `fetchIntent(slug)` → picks between `AffiliateRail`, `LeadForm`, `NewsletterCapture` based on the user's journey stage. It is smarter and more revenue-optimised than hardcoded `AffiliateRail`.

**GatedContent** is a Client Component at `components/subscription/GatedContent.tsx`. It renders a blur overlay with "Upgrade to Premium" CTA when a page is marked `is_premium=true` in the CMS.

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/web-next/app/(public)/trek/[slug]/page.tsx` | (1) Replace hardcoded `AffiliateRail` with `MonetizationSlot`; (2) Add `is_premium` gate wrapping CMS body content |

---

## Change 1: Replace AffiliateRail with MonetizationSlot (Z02)

**Before (line 492):**
```tsx
<AffiliateRail items={gearItems} title="Recommended gear for this trek" />
```

**After:**
```tsx
<Suspense fallback={null}>
  <MonetizationSlot slug={cmsPage?.slug ?? slug} sourcePage={`/trek/${slug}`} />
</Suspense>
```

**Import to add:**
```typescript
import MonetizationSlot from "@/components/monetization/MonetizationSlot";
```

**Note:** The current page also fetches `gearItems` from `fetchPublicAffiliateProducts` for this `AffiliateRail` call. After wiring `MonetizationSlot`, the page-level `gearItems` fetch can be removed since `MonetizationSlot` internally calls `fetchPublicAffiliateProducts` when the intent module is `"affiliate"`. Verify that `gearItems` is not used elsewhere on the page before removing.

---

## Change 2: GatedContent blur overlay (Z03)

The CMS page has `is_premium: boolean` (already in DB and TypeScript type at `lib/api.ts:69`). When `cmsPage.is_premium === true`, the body content sections should be replaced with the `GatedContent` blur overlay.

**Pattern:** Wrap the entire content body (the `<div id="article-body">` or equivalent outer wrapper) conditionally:

```tsx
{cmsPage?.is_premium ? (
  <GatedContent
    title={`${cmsPage.title} — Premium Content`}
    teaser={cmsPage.summary ?? undefined}
  />
) : (
  {/* ...full article body blocks as now... */}
)}
```

**Import to add:**
```typescript
import GatedContent from "@/components/subscription/GatedContent";
```

**Placement:** The gate wraps the article body section only (below the hero + meta strip + quick facts). The page title, hero image, meta strip, quick facts, and sticky CTA remain visible to non-premium users — only the detailed body content (itinerary, permits, packing, etc.) is gated.

**Where to locate the body section in the current page:**
The body blocks start after the quick-facts `<section id="quick-facts">` at ~line 382. The first gated block should be `<Block id="route-overview">` at line 400. The gate wraps from line 400 to the end of the body (before the alternatives/related section).

---

## No DB Migration Required

`is_premium` column already exists on `cms_pages` table. No schema changes needed.

---

## Tests

File: `services/api/tests/test_wiring_step70.py` — backend has no new endpoints; testing is frontend-only for this step.

### Frontend verification

1. **TC-70-01**: Standard trek page (`is_premium=false`) → full article body renders; `AffiliateRail` no longer appears; `MonetizationSlot` renders (newsletter / lead / affiliate based on intent)
2. **TC-70-02**: Set a CMS test page to `is_premium=true` via admin CMS editor → trek detail page for that slug shows blur overlay with "Upgrade to Premium" button; itinerary/permits/packing sections NOT visible
3. **TC-70-03**: Click "Upgrade to Premium" in the gate → redirects to `/premium`
4. **TC-70-04**: Sign in link in gate → `/auth/sign-in` (existing premium user flow)
5. **TC-70-05**: `next build` passes with zero errors after wiring

---

## Blast Radius

| Symbol | Impact |
|--------|--------|
| `trek/[slug]/page.tsx` | Only file changed; blast radius limited to trek detail page |
| `MonetizationSlot` | No change to component itself; wiring only |
| `GatedContent` | No change to component itself; wiring only |
| `AffiliateRail` still imported | Keep import; component still used in the `MonetizationSlot` flow internally |

---

## Notes

- `MonetizationSlot` is already a Server Component (`async function`) — no `"use client"` needed; the `Suspense` wrapper handles async streaming
- `GatedContent` is `"use client"` — it can be used directly in the Server Component page file as a leaf node (no state needed at page level)
- The `gearItems` fetch (`fetchPublicAffiliateProducts`) at the top of the page file should be removed after Z02 wiring, as it becomes redundant. Confirm no other usage before removing.
