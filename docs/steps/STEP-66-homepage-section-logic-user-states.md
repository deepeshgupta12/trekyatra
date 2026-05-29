# STEP-66 — Homepage Section Logic by User State

**Status:** Done
**Date Started:** 2026-05-29
**Date Completed:** 2026-05-29
**Branch:** main

---

## Scope

Revamp all homepage sections to handle four distinct user states correctly. Each section must
render the most contextually relevant content and heading for the user's current relationship
with TrekYatra. The existing homepage already has server-side CMS data fetching and two of
the four states partially handled in `PersonalisedFeed`; this step closes the remaining gaps
and standardises the logic across every section.

---

## Four User States

| State | Auth | Behavior Data | Definition |
|-------|------|---------------|------------|
| **A — New Logged In** | `user != null` | `hasBehaviorData() === false` | Signed up / logged in but has viewed fewer than 1 trek (no localStorage record yet) |
| **B — Repeat Logged In** | `user != null` | `hasBehaviorData() === true` | Logged in AND has local browse history (≥1 trek view recorded in `ty_behavior_v1`) |
| **C — New Logged Out** | `user === null` | `hasBehaviorData() === false` | First visit or cleared storage — no context at all |
| **D — Repeat Logged Out** | `user === null` | `hasBehaviorData() === true` | Returning visitor who has browsed treks but never signed up or is signed out |

**Detection logic (client-side only):**
```typescript
const { user, isLoading } = useAuth();
const hasBehavior = hasBehaviorData();            // reads localStorage ty_behavior_v1
const profile = getBehaviorProfile();             // { views, topRegions, topDifficulties }

// State identification
const isLoggedIn    = !!user;
const isRepeatUser  = hasBehavior;

// State A: isLoggedIn && !isRepeatUser
// State B: isLoggedIn && isRepeatUser
// State C: !isLoggedIn && !isRepeatUser
// State D: !isLoggedIn && isRepeatUser
```

---

## Section-by-Section Logic Matrix

### Section 1 — Hero + Search
| State | Behaviour |
|-------|-----------|
| A | Same generic hero. No change. |
| B | Same generic hero. No change. |
| C | Same generic hero. No change. |
| D | Same generic hero. No change. |

**Decision:** Hero is the entry point for all users. Personalisation here reduces conversion;
keep it consistently aspirational.

---

### Section 2 — Welcome Banner (NEW component: `HomeWelcomeBanner`)
Placed immediately below the hero, before the Trending section.
Only rendered for **logged-in users (States A + B)**.

| State | Rendered? | Content |
|-------|-----------|---------|
| A | ✅ Yes | `"Welcome to TrekYatra, [first_name]! Start by exploring the treks below."` + subtle "Complete your profile" soft nudge |
| B | ✅ Yes | `"Welcome back, [first_name]!"` + stat line: `"You've browsed [N] treks across [top region]."` + row of last 3 viewed trek thumbnail chips (from behavior profile) |
| C | ❌ Hidden | — |
| D | ❌ Hidden | — |

**Logic detail:**
- `first_name` derived from `user.display_name || user.full_name?.split(" ")[0] || "Explorer"`
- `N` = `getBehaviorProfile()?.views.length ?? 0`
- `top region` = `getBehaviorProfile()?.topRegions[0]`
- Trek chips link to `/trek/[slug]`; chips sourced from `getBehaviorProfile()?.views.slice(0, 3)`
- Component hides itself while `authLoading` is true (no flash)
- On mobile: compact single-line greeting only (no chips); chips shown ≥ sm breakpoint

---

### Section 3 — Trending Treks
Server-rendered TrekCards (data unchanged). Heading text adapts via new client component
`HomeTrendingHeader` which replaces the static `<Section>` header only.

| State | Section heading | Sub-label |
|-------|----------------|-----------|
| A | `"Treks Indians are exploring right now"` | `"Great starting points for first-time trekkers"` |
| B | `"Recommended for you"` | `"Based on your interest in [topRegions[0]]"` (if topRegions available) or generic if not |
| C | `"Trending this month"` | `"Treks Indians are obsessing over right now"` |
| D | `"Continue exploring"` | `"Popular treks from [topRegions[0]]"` (first browsed region) or generic |

**Logic detail:**
- `HomeTrendingHeader` is `"use client"` and mounted as the `<Section>` header slot
- The TrekCard grid is still SSR — only the heading text is client-driven
- If `authLoading`, show skeleton text (2 lines, `animate-pulse`) to avoid layout shift
- Falls back to State C text if `getBehaviorProfile()` returns null

---

### Section 4 — Category Hub (Trust Pillars)
All states: **Unchanged.** This section is informational / navigational and should be
consistent for discoverability.

---

### Section 5 — Regions Grid
All states: **Unchanged** for the grid cards themselves.

**Future enhancement (Step 68+):** Highlight the user's top browsed region with a
"Your region" badge. Deferred to avoid over-engineering this step.

---

### Section 6 — DifficultyTabsSection (MODIFIED)
Client component already. Modify to **auto-select the user's most-browsed difficulty tab**
when behavior data exists.

| State | Default tab |
|-------|-------------|
| A | `"Easy"` (best UX for new users — start accessible) |
| B | `getBehaviorProfile()?.topDifficulties[0]` → matched to `"Easy" | "Moderate" | "Challenging"`. Falls back to `"Easy"` if no match. |
| C | `"Easy"` |
| D | `getBehaviorProfile()?.topDifficulties[0]` → same matching. Falls back to `"Easy"`. |

**Matching rule:** The `topDifficulties` strings come from trek `difficulty` values
(e.g., `"Easy"`, `"Moderate"`, `"Challenging"`, `"Moderate to Challenging"`).
Tab IDs are `"Easy"`, `"Moderate"`, `"Challenging"`. Matching:
```typescript
function matchTab(raw: string): "Easy" | "Moderate" | "Challenging" {
  const lower = raw.toLowerCase();
  if (lower.includes("challenging")) return "Challenging";
  if (lower.includes("moderate"))    return "Moderate";
  return "Easy";
}
```

**Implementation:** Add a `useEffect` inside `DifficultyTabsSection` that fires once on
mount (after hydration) to set `activeTab` from behavior profile. Does NOT re-run on
every render; runs only `[isHydrated]` to avoid flicker.

---

### Section 7 — Editorial Feature
All states: **Unchanged.** Static editorial content is trust-building and should be
consistent.

---

### Section 8 — SeasonalTreksSection
All states: **Unchanged.** The auto-season selection by month is already the right
behaviour for all user states. Season is temporal, not user-specific.

---

### Section 9 — PersonalisedFeed (MODIFIED — 4 full states)
Currently shows 2 states (logged-in OR has behavior). Expanded to all 4.

| State | Section shown? | API called | Heading label | Sub-label |
|-------|---------------|-----------|--------------|-----------|
| A | ✅ Yes | `fetchAnonymousRecommendations(6)` | `"Popular treks"` | `"Most loved by our community"` |
| B | ✅ Yes | `fetchPersonalisedRecommendations(6)` | `"For [first_name]"` | `"Based on your browsing history"` |
| C | ❌ Hidden | — | — | — |
| D | ✅ Yes | `fetchAnonymousRecommendations(6)` | `"Continue exploring"` | `"Treks based on your browsing history"` |

**Logic changes in `PersonalisedFeed.tsx`:**
```typescript
// State determination (after authLoading is false)
if (!user && !hasBehavior) return null;   // State C — hidden

const label = user
  ? (hasBehavior
      ? `For ${firstName}`          // State B
      : "Popular treks"             // State A
    )
  : "Continue exploring";           // State D

const subLabel = user
  ? (hasBehavior
      ? "Based on your browsing history"
      : "Most loved by our community"
    )
  : "Treks based on your browsing history";

const fetcher = user
  ? fetchPersonalisedRecommendations   // States A + B (user_id on backend)
  : fetchAnonymousRecommendations;     // State D
```

**Note on State A:** `fetchPersonalisedRecommendations` will return generic/popular results
for a new user (no bookmarks, no vector centroid) — the backend already gracefully falls back
to popular content when no personalization data exists. So calling the personalized endpoint
for State A is safe. The heading `"Popular treks"` is displayed regardless of which endpoint
is used, so the UX matches expectations.

---

### Section 10 — Recently Viewed Section (NEW component: `RecentlyViewedSection`)
Placed between SeasonalTreksSection and PersonalisedFeed. Only rendered for **State D
(Repeat Logged Out)** — provides quick re-access to trek pages without requiring login.

| State | Rendered? |
|-------|-----------|
| A | ❌ Hidden |
| B | ❌ Hidden (PersonalisedFeed already covers this) |
| C | ❌ Hidden |
| D | ✅ Yes |

**Content:**
- Heading: `"Recently viewed"` / Sub: `"Pick up where you left off"`
- Horizontal scroll row of up to 5 trek cards sourced from `getBehaviorProfile()?.views.slice(0, 5)`
- Each card: compact form — trek image thumbnail (60×60), trek name, region label, link to `/trek/[slug]`
- Below the row: soft CTA — `"Sign in to save your treks and get personalised recommendations"` → `/auth/sign-in`
- On mobile: horizontal scroll (`overflow-x-auto snap-x`); on desktop: 5-col grid

---

### Section 11 — Comparison CTA
All states: **Unchanged.**

---

### Section 12 — Resources / Downloads
All states: **Unchanged.**

---

## Complete Homepage Section Order (Post Step 66)

```
1. Hero + Search                         → All states: generic
2. HomeWelcomeBanner                     → States A+B only (logged-in)
3. Trending Treks                        → All states: cards same, heading personalised
4. Category Hub (Trust Pillars)          → All states: unchanged
5. Regions Grid                          → All states: unchanged
6. DifficultyTabsSection                 → All states: tab pre-selected for B+D
7. Editorial Feature                     → All states: unchanged
8. SeasonalTreksSection                  → All states: unchanged
9. RecentlyViewedSection                 → State D only (repeat logged-out)
10. PersonalisedFeed                     → States A+B+D; hidden for C
11. Comparison CTA                       → All states: unchanged
12. Resources / Downloads                → All states: unchanged
13. Operators CTA                        → All states: unchanged
14. Newsletter / Footer                  → All states: unchanged
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web-next/components/home/HomeWelcomeBanner.tsx` | States A+B welcome banner with last-viewed trek chips |
| `apps/web-next/components/home/HomeTrendingHeader.tsx` | Client component for personalized trending section heading |
| `apps/web-next/components/home/RecentlyViewedSection.tsx` | State D recently-viewed compact row with login CTA |

---

## Files to Modify

| File | What Changes |
|------|-------------|
| `apps/web-next/components/content/PersonalisedFeed.tsx` | 4-state logic: label/sub-label/fetcher/visibility per state |
| `apps/web-next/components/home/DifficultyTabsSection.tsx` | `useEffect` on mount to pre-select preferred difficulty from behavior profile |
| `apps/web-next/app/(public)/page.tsx` | Import HomeWelcomeBanner, HomeTrendingHeader, RecentlyViewedSection; update section layout |

---

## Implementation Details

### `HomeWelcomeBanner.tsx`

```tsx
"use client";
// Rendered only for logged-in users (States A + B).
// Hidden while authLoading to prevent flash.
// State A: greeting + profile-complete nudge
// State B: greeting + stat line + last 3 trek chips
```

Key logic:
- `isLoading` from `useAuth()` → render `null` to avoid flash
- `user` from `useAuth()` → `null` → render `null`
- `profile = getBehaviorProfile()` on client mount
- `hasBehavior = profile !== null && profile.views.length > 0`

### `HomeTrendingHeader.tsx`

```tsx
"use client";
// Replaces static Section eyebrow/title for the Trending section.
// Reads auth + behavior profile and computes heading/sub-label.
// While loading: skeleton placeholder (same height as heading text).
```

The existing `<Section>` wrapper in `page.tsx` is replaced:
```tsx
// Before:
<Section eyebrow="Trending this month" title="Treks Indians are obsessing over right now" cta={{...}}>
// After:
<section className="py-16 md:py-24">
  <div className="container-wide">
    <HomeTrendingHeader cta={{ label: "View all treks", to: "/explore" }} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
      {trending.map(t => <TrekCard key={t.slug} trek={t} />)}
    </div>
  </div>
</section>
```

### `RecentlyViewedSection.tsx`

```tsx
"use client";
// State D only: user === null && hasBehaviorData() === true
// Horizontal scroll on mobile, 5-col on desktop
// Trek data read from localStorage only — no API call needed
// (slug, name, region, difficulty, image all stored in TrekViewEntry — but image is NOT stored)
// Fallback: if no image → show accent gradient placeholder
```

**Important:** `TrekViewEntry` stores `{ slug, region, difficulty, season, ts }` — no `name` or `image`. The component must link to the trek page; name/image shown as a fallback display. Consider fetching trek names from the static trekList prop, or just displaying the slug formatted.

**Decision:** Pass `trekList: Trek[]` as a prop from the server component so the client can enrich the behavior-only view entries with names + images. This avoids an extra API call.

### `DifficultyTabsSection.tsx` modification

Add inside the component (after state initialization):
```typescript
// Pre-select preferred difficulty from behavior profile (runs once on hydration)
const [hydrated, setHydrated] = useState(false);
useEffect(() => {
  setHydrated(true);
  const profile = getBehaviorProfile();
  if (profile?.topDifficulties[0]) {
    const tab = matchDifficultyToTab(profile.topDifficulties[0]);
    setActiveTab(tab);
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

Where `matchDifficultyToTab`:
```typescript
function matchDifficultyToTab(raw: string): "Easy" | "Moderate" | "Challenging" {
  const lower = raw.toLowerCase();
  if (lower.includes("challenging") || lower.includes("hard")) return "Challenging";
  if (lower.includes("moderate"))                               return "Moderate";
  return "Easy";
}
```

Import `getBehaviorProfile` from `@/lib/behavior-tracker`.

### `PersonalisedFeed.tsx` modification

Full 4-state heading logic as described in the matrix above. Key changes:
1. `firstName` computed from `user.display_name || user.full_name?.split(" ")[0] || "Explorer"`
2. Section heading and sub-label derived from state matrix
3. Remove the `Section eyebrow="For you"` wrapper in `page.tsx` — the component handles its own heading internally
4. State A uses `fetchAnonymousRecommendations` (not personalized — new user has no data)

### `page.tsx` modifications

1. Import: `HomeWelcomeBanner`, `HomeTrendingHeader`, `RecentlyViewedSection`
2. Pass `trekList` to `RecentlyViewedSection` for image enrichment
3. Replace trending `<Section>` block with `<HomeTrendingHeader>` + card grid
4. Add `<HomeWelcomeBanner />` between hero and trending sections
5. Add `<RecentlyViewedSection trekList={trekList} />` between SeasonalTreks and PersonalisedFeed
6. Remove the outer `<Section eyebrow="For you"...>` wrapper around `<PersonalisedFeed>` (component manages its own header)

---

## No Backend Changes Required

All 4-state logic is implemented entirely client-side using:
- `useAuth()` → `user`, `isLoading` (already wired to GET /auth/me)
- `hasBehaviorData()` + `getBehaviorProfile()` → `localStorage` reads (no API call)
- Existing API endpoints: `fetchPersonalisedRecommendations` (Step 35), `fetchAnonymousRecommendations` (Step 35)

No new API routes, no DB migrations.

---

## Verification

### Frontend build
```bash
cd apps/web-next && npm run build   # zero TypeScript errors
```

### Manual smoke tests (4 states)
1. **State A** — Sign up a new account (no browse history), navigate to `/` → see welcome banner, "Popular treks" feed heading, Easy tab default
2. **State B** — Browse 3+ trek detail pages while logged in → navigate to `/` → see "Welcome back" banner with chips, personalized feed, preferred-difficulty tab pre-selected
3. **State C** — Open incognito, visit `/` → no banner, no feed, generic trending heading, Easy tab
4. **State D** — Open incognito, browse 3+ trek pages, then visit `/` → see "Recently viewed" section, "Continue exploring" feed, preferred-difficulty tab pre-selected; no welcome banner

---

## Notes

- The `getBehaviorProfile()` call is safe inside `useEffect` only — calling it during SSR returns `null` (guarded by `typeof window === "undefined"` check in the function). All new components that read behavior profile must be `"use client"` and must call it inside `useEffect` or after mount.
- Auth loading states must always be handled: render `null` or skeleton while `authLoading = true` to prevent layout shift / content flash.
- `RecentlyViewedSection` uses no API calls — entirely localStorage-driven. Trek names and images are enriched from the `trekList` server prop (12 static treks) **plus** a `cmsImageMap` built from `cmsTrekPages` (slug → `hero_image_url`). CMS-only treks not in the static list now receive their CMS hero image; if no image is found in either source the card shows an accent gradient placeholder.
- Step 67 (CDP revamp) will capture `home_section_view` events per section/state for analytics — this step focuses purely on the UX logic.

---

## Bug Fixes Applied (2026-05-29)

Four regressions discovered after initial delivery were fixed in the same step:

### Bug 1 — Trek images missing in RecentlyViewedSection
**Symptom:** Cards for CMS-only treks (e.g., "Prashar Lake", "Chandrakhani Pass") showed ⛰ placeholder instead of the trek image.
**Root cause:** `RecentlyViewedSection` enriched view entries against `trekList` (12 static treks only). CMS-only treks have no entry in `trekList` → `image: ""` → placeholder shown.
**Fix:**
- `page.tsx`: build `cmsImageMap: Record<string, string>` from `cmsTrekPages` (slug → `hero_image_url`) and pass as new `cmsImageMap` prop to `RecentlyViewedSection`
- `RecentlyViewedSection.tsx`: accept `cmsImageMap?: Record<string, string>` prop; use `staticMatch?.image || cmsImageMap[v.slug] || ""` for the image field

### Bug 2 — "FOR YOU / Treks matched to your interests" heading shows for State C
**Symptom:** In a fresh private-browse session (no auth, no behavior data), the large "FOR YOU" section heading and "Treks matched to your interests" subtitle still rendered on the homepage.
**Root cause:** `PersonalisedFeed` correctly returns `null` for State C, but `page.tsx` wrapped it in a `<Section eyebrow="For you" title="Treks matched to your interests">` component that always rendered its own heading regardless of whether the child was null.
**Fix:**
- `page.tsx`: removed the `<Section>` wrapper; `<PersonalisedFeed limit={6} />` is now rendered directly
- `PersonalisedFeed.tsx`: the component now renders its own `<section className="py-16 md:py-24"><div className="container-wide">` wrapper around its content; heading and subtitle are shown only when items are present. The layout gap and visual hierarchy match the other `Section`-wrapped areas.

### Bug 3 — Subheading below the trending section heading must be removed
**Symptom:** `HomeTrendingHeader` showed a sub-label line below the main heading (e.g., "Popular treks from Munsiyari, Pithoragarh district" or "Great starting points for first-time trekkers").
**User request:** Remove the subheading entirely across all states.
**Fix:**
- `HomeTrendingHeader.tsx`: removed `subLabel` state, all `setSubLabel(...)` calls, the `topRegion` local variables (States B and D), and the `<p className="text-muted-foreground text-sm mt-2">{subLabel}</p>` render line. Also removed the `getBehaviorProfile` import (now unused). The loading skeleton `<div className="h-4 w-56">` for the subLabel was also removed.

### Bug 4 — Welcome banner shows sub-location name instead of state name
**Symptom:** `HomeWelcomeBanner` showed "mostly in Munsiyari, Pithoragarh district." instead of the state name "Himachal Pradesh".
**Root cause:** `TrekViewTracker` was passing `region={trek.region}` to `recordTrekView`. The static trek `region` field stores sub-location strings ("Garhwal Himalayas", "Munsiyari, Pithoragarh district") not state names. These sub-location strings were stored in `localStorage ty_behavior_v1` and surfaced as `topRegions[0]`.
**Fix:**
- `apps/web-next/app/(public)/trek/[slug]/page.tsx`: changed `region={trek.region}` to `region={cmsPage?.trek_state || trek.state || trek.region}` in the `TrekViewTracker` props. For CMS-published trek pages `cmsPage.trek_state` (e.g., "Himachal Pradesh") takes priority; for static-only pages `trek.state` (e.g., "Uttarakhand") is used; `trek.region` (sub-location) only falls through if both are absent. Going forward all newly recorded views store the state name in the `region` field.
