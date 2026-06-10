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

---

## Verification

### Manual smoke tests (one per state)

**State A** (sign up fresh account, no viewed treks):
1. **TC-M06-01**: Sign up → home screen → welcome banner visible + "Popular treks" heading in feed

**State B** (signed-in, browse 3+ treks):
2. **TC-M06-02**: Browse Kedarkantha + Hampta + Valley from trek detail → return to home → recently viewed chips in banner; personalised feed heading shows "For {name}"

**State C** (fresh install, not signed in):
3. **TC-M06-03**: Fresh install, not signed in, no browsed treks → no welcome banner, no feed section → only trending + regions + seasonal

**State D** (not signed in, browsed treks):
4. **TC-M06-04**: Browse 3 treks (not signed in) → return to home → "Recently viewed" row shows correct treks; feed section shows "Continue exploring"

**General:**
5. **TC-M06-05**: Pull-to-refresh → data reloads + sync triggers
6. **TC-M06-06**: Skeleton loads shown on first open before data arrives
7. **TC-M06-07**: Tap trending trek card → navigates to trek detail screen
8. **TC-M06-08**: Tap region chip (e.g., "Himachal Pradesh") → navigates to region screen
