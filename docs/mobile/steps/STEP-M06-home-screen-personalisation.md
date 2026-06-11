# STEP-M06 — Home Screen + 4-State Personalisation

**Status:** Done ✓ (2026-06-10)
**Phase:** Discovery
**Dependencies:** STEP-M02 (auth), STEP-M04 (offline), STEP-M05 (TrekCard)

---

## Scope

Build the Home tab — the first screen users see on every app open. Mirrors the web homepage's 4-state personalisation logic exactly (States A/B/C/D). All personalisation is client-side using `useAuth()` + `AsyncStorage` behavior profile, matching the web implementation.

The screen must feel native: pull-to-refresh, skeleton loaders per section, smooth scroll, and haptic feedback on interactions.

---

## Four User States (identical to web)

| State | Condition | Home Experience |
|-------|-----------|----------------|
| **A — New logged-in** | `user != null`, no behavior | Welcome banner + "Popular treks" feed |
| **B — Repeat logged-in** | `user != null`, has behavior | "Welcome back {name}" + last-viewed chips + personalised feed |
| **C — New logged-out** | no user, no behavior | Generic hero + trending treks only (no feed, no banner) |
| **D — Repeat logged-out** | no user, has behavior | Recently viewed row + "Continue exploring" anonymous feed |

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/index.tsx` | Home screen root — orchestrates all sections |
| `apps/mobile/components/home/HomeWelcomeBanner.tsx` | States A + B: logged-in greeting + last-viewed chips |
| `apps/mobile/components/home/HomeTrendingSection.tsx` | All states: trending trek horizontal scroll row |
| `apps/mobile/components/home/RecentlyViewedRow.tsx` | State D: recently viewed compact horizontal row |
| `apps/mobile/components/home/PersonalisedFeedSection.tsx` | States A/B/D: recommendation feed grid |
| `apps/mobile/components/home/SeasonalPicksRow.tsx` | All states: seasonal treks (current month auto-selected) |
| `apps/mobile/components/home/RegionsRow.tsx` | All states: state/region horizontal chip row |
| `apps/mobile/components/home/HomeSkeleton.tsx` | Skeleton loader for full home screen |
| `apps/mobile/hooks/useHomeData.ts` | Parallel queries: trending, personalised recs, seasonal |
| `apps/mobile/hooks/useBehaviorProfile.ts` | Reads `ty_behavior_v1` from AsyncStorage |

---

## Home Screen Section Order

```
1. HomeWelcomeBanner     (States A + B only)
2. HomeTrendingSection   (All states — 4 trek cards horizontal)
3. RegionsRow            (All states — state name chips)
4. SeasonalPicksRow      (All states — current-season treks)
5. RecentlyViewedRow     (State D only)
6. PersonalisedFeedSection (States A + B + D)
```

State C (new logged-out) sees: Trending + Regions + Seasonal only. No banner, no feed.

---

## HomeWelcomeBanner (States A + B)

```
State A:
┌───────────────────────────────┐
│ 👋 Welcome, Priya             │
│ Discover your first trek      │
│ [Browse popular treks →]      │
└───────────────────────────────┘

State B:
┌───────────────────────────────┐
│ 👋 Welcome back, Priya        │
│ You've browsed 12 treks       │
│ mostly in Himachal Pradesh.   │
│ [Kedarkantha chip] [Hampta chip] [Valley chip] │
└───────────────────────────────┘
```

Last-viewed chips (State B): up to 3, horizontal scroll. Tapping navigates to trek detail.

---

## HomeTrendingSection

- Horizontal scroll row of 4–6 trek cards
- Data from `GET /api/v1/treks/trending` (same endpoint as web)
- Heading changes by state:
  - State A: "Trending this month"
  - State B: "Recommended for you"
  - State C: "Trending this month"
  - State D: "Continue exploring"
- No subheading (matches web fix from Step 66 bug fix)

---

## PersonalisedFeedSection (States A / B / D)

```
Heading:
  State A: "Popular treks" / "Most loved by our community"
  State B: "For {firstName}" / "Based on your browsing history"
  State D: "Continue exploring" / "Treks based on your browsing history"

Content: 2×3 grid of FeedCard (same as web FeedCard but native)
API:
  States A + D: GET /api/v1/recommendations/anonymous
  State B:      GET /api/v1/recommendations/personalised
```

State C returns null — section not rendered at all (no heading shown).

---

## Behavior Profile (AsyncStorage)

Same schema as web `localStorage ty_behavior_v1`:

```typescript
// hooks/useBehaviorProfile.ts
interface TrekViewEntry {
  slug: string;
  region: string;     // state name (e.g. "Himachal Pradesh")
  difficulty: string;
  season: string;
  ts: number;
}

interface BehaviorProfile {
  views: TrekViewEntry[];
  topRegions: string[];
  topDifficulties: string[];
}

const BEHAVIOR_KEY = 'ty_behavior_v1';

export async function getBehaviorProfile(): Promise<BehaviorProfile | null> {
  const raw = await AsyncStorage.getItem(BEHAVIOR_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function hasBehaviorData(profile: BehaviorProfile | null): boolean {
  return !!profile && profile.views.length > 0;
}
```

---

## Pull-to-Refresh

```tsx
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={colors.accent}
      colors={[colors.accent]}  // Android
    />
  }
>
```

On refresh: invalidate all home queries + trigger content sync.

---

## Skeleton Loader

While loading (first open, no cached data):

```
[Skeleton banner — 80px height]
[Skeleton section header — 20px]
[4 skeleton trek cards — 160×220 each, horizontal row]
[Skeleton section header]
[6 skeleton feed cards — 72×72 + text lines]
```

All skeletons use `Animated` pulse (opacity 0.3 → 0.7 → 0.3) to indicate loading.

---

## Deep Linking

Home screen handles deep links from push notifications:

```
trekyatra://trek/kedarkantha     → open trek detail
trekyatra://plan                 → open plan wizard
trekyatra://account/saved        → open saved treks
```

Expo Router handles these via `scheme: "trekyatra"` in `app.config.ts`.

---

## Files Created
| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/(home)/index.tsx` | 4-state home screen with pull-to-refresh + skeleton |
| `apps/mobile/components/home/HomeWelcomeBanner.tsx` | HomeWelcomeBannerA (state A) + HomeWelcomeBannerB (state B) |
| `apps/mobile/components/home/HomeTrendingSection.tsx` | Horizontal trek card row, heading adapts per state |
| `apps/mobile/components/home/RegionsRow.tsx` | 8 region chips → browse filter |
| `apps/mobile/components/home/SeasonalPicksRow.tsx` | Current-month seasonal treks row |
| `apps/mobile/components/home/RecentlyViewedRow.tsx` | State D: recently viewed compact cards |
| `apps/mobile/components/home/PersonalisedFeedSection.tsx` | States A/B/D: 2×3 feed grid |
| `apps/mobile/components/home/HomeSkeleton.tsx` | Pulse-animated skeleton loader |
| `apps/mobile/hooks/useBehaviorProfile.ts` | Reads ty_behavior_v1 from AsyncStorage |
| `apps/mobile/hooks/useHomeData.ts` | Parallel TanStack useQueries: trending + seasonal + recs |

## Notes
- State resolution is client-side: `isLoggedIn + hasBehavior → A/B/C/D`
- State C (no user, no behavior) skips welcome banner and feed entirely
- Behavior profile data (topRegions, topDifficulties) feeds anonymous recommendation API
- PersonalisedFeedSection calls `/recommendations/personalised` for State B, `/recommendations/anonymous` for A/D
- `tsc --noEmit`: 0 errors

### Bugfix Pass (2026-06-11) — Mobile Crosscheck (M-DS1–M06)
QA found Home + bottom nav broken and trending/seasonal/recs sections empty. Root cause: `apps/mobile/lib/mobileApi.ts`'s `contentApi` was calling endpoints/params that don't exist on the backend, so `useHomeData` queries silently returned empty arrays. Fixed (see `docs/MASTER_TRACKER.md` for full details):
- `getTrendingTreks()` → `GET /api/v1/cms/pages/trending`
- `getSeasonalTreks(month?)` → **NEW** `GET /api/v1/treks/seasonal?month=` (backend endpoint added in this pass — `api/routes/treks.py` + `modules/cms/service.py::get_seasonal_pages`, 7 tests in `tests/test_treks_seasonal.py`)
- `getAnonymousRecommendations()` → `GET /api/v1/recommendations` (no params; `useHomeData.ts` updated to stop passing `topRegions`/`topDifficulties` as args)
- `getPersonalisedRecommendations()` → `GET /api/v1/account/recommendations`
- `saveTrek(slug)` → `POST /api/v1/account/bookmarks/by-slug`
- Added `mapCmsPageToTrekListItem`/`mapRecommendationToTrekListItem` to convert `CMSPageResponse`/`RecommendationItem` shapes to mobile `TrekListItem`
- Bottom nav: `CustomTabBar` `getIconName`/`getLabelText` `"index"` → `"(home)"`, plus `options.href === null` filter to hide the `downloads` tab (was rendering as a stray 6th tab)
- Verified via `tsc --noEmit` (0 errors) + simulator screenshot showing populated "Trending this month" and corrected Home tab

---

## Verification

## Frontend Test Cases (Pending Manual Verification)

Run: `cd apps/mobile && npx expo start` (open in iOS Simulator or Expo Go)

### TC-M06-F01: State A — New logged-in user (no behavior)
**Setup:** Create a fresh account (or clear AsyncStorage `ty_behavior_v1`). Sign in.
**Steps:**
1. Sign up with a new email
2. Complete onboarding → land on Home tab
**Expected:** "👋 Welcome, {firstName}" banner at top with Pine/mist background; "Browse popular treks →" CTA link; "Trending this month" horizontal trek row; Regions row; Seasonal picks row; Feed section heading "Popular treks" / "Most loved by our community". No "Recently Viewed" row.
**Pass =** Banner visible with correct first name; feed heading is "Popular treks" not "For {name}"

---

### TC-M06-F02: State B — Repeat logged-in user (has behavior)
**Setup:** Sign in with an existing account. Open 3+ trek detail screens (each records a view).
**Steps:**
1. Open Kedarkantha trek detail → go back
2. Open Hampta Pass trek detail → go back
3. Open Valley of Flowers trek detail → go back
4. Tap the Home tab
**Expected:** "👋 Welcome back, {name}" banner; view count shown (e.g. "You've browsed 3 treks"); up to 3 recently-viewed chips (Kedarkantha / Hampta / Valley) tappable; feed section heading shows "For {firstName}" / "Based on your browsing history".
**Pass =** Banner shows view count; chips present; feed heading is personalised

---

### TC-M06-F03: State C — Fresh logged-out (no behavior)
**Setup:** Clear app data OR manually delete `ty_behavior_v1` from AsyncStorage. Do NOT sign in.
**Steps:**
1. Launch fresh (no account, no viewed treks)
2. Land on Home tab
**Expected:** NO welcome banner. NO personalised feed section. Only: Trending treks row + Regions row + Seasonal picks row. Heading is "Trending this month".
**Pass =** 3 sections visible; no banner; no feed grid

---

### TC-M06-F04: State D — Repeat logged-out (has behavior)
**Setup:** Do NOT sign in. Open 3 trek detail screens to build behavior data.
**Steps:**
1. Open 3 trek pages while logged out
2. Return to Home tab
**Expected:** "Recently Viewed" compact card row appears; feed section shows "Continue exploring" / "Treks based on your browsing history"; feed calls anonymous recommendations API with your top regions.
**Pass =** Recently viewed row shows correct slugs; feed heading is "Continue exploring"

---

### TC-M06-F05: Pull-to-refresh
**Steps:**
1. On Home tab, pull down (scroll down past top)
2. Wait for spinner
**Expected:** Saffron spinner appears; data refreshes; trending/seasonal/recs all reload.
**Pass =** Spinner visible in saffron colour; content updates after release

---

### TC-M06-F06: Skeleton loading state
**Steps:**
1. Enable slow network (Network Link Conditioner or airplane mode briefly) OR cold launch
2. Watch Home tab during load
**Expected:** Pulse-animated grey skeleton blocks visible for banner, trending row, and feed grid before real data arrives. Skeleton replaces once data loads.
**Pass =** Skeleton pulse visible; no blank white screen; replaced by real content

---

### TC-M06-F07: Trek card navigation from home
**Steps:**
1. On Home tab, tap any trek card in the Trending row
**Expected:** Trek detail screen opens with back arrow ("‹") in header. Tapping back returns to Home tab.
**Pass =** Navigation works; back button returns to home without resetting scroll

---

### TC-M06-F08: Region chip navigation
**Steps:**
1. On Home tab, scroll to "Explore by Region" row
2. Tap "Himachal Pradesh"
**Expected:** Navigates to Browse (Explore) tab. Region filter should be pre-applied or browse screen opens.
**Pass =** Navigation to browse tab triggered; no crash

---

### TC-M06-F09: Home screen light/dark mode
**Steps:**
1. Set device to Light mode → open Home tab
2. Switch device to Dark mode → return to Home tab
**Expected:** Light mode: Paper (#FAF5EE) background, Pine text, white card surfaces. Dark mode: near-black background (#0c0e14), white text, dark card surfaces. All sections adapt.
**Pass =** No hardcoded colours bleeding through; welcome banner, cards, and skeleton all adapt to mode

---

### TC-M06-F10: Home screen — empty trending (API down)
**Steps:**
1. Set device to airplane mode + clear SQLite cache (uninstall/reinstall)
2. Open Home tab
**Expected:** Skeleton fades in; after timeout, sections show empty states gracefully (no crash, no error screen). Pull-to-refresh available.
**Pass =** App does not crash; no unhandled red-screen error
