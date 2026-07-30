# STEP-M29 — v1.1 Redesign: Post-Build Fixes (1.1.0 device test)

**Status:** Issues recorded + confirmed by owner 2026-07-30. This is the MASTER tracker for the
redesign fixes — every defect (D01–D27) is checked off here as it lands.
**Blocking:** App Store review submission is BLOCKED until every item below is resolved.
**Source:** Owner device-test of `1.1.0 (1)` — 11 screenshots, 15 reported issues + navigation,
broken into distinct defects (IDs Dnn). Fixes follow the process (gitnexus impact per symbol,
tsc, both-platform, MD updates).

## ⚠️ Regression-safety principle (applies to EVERY fix)
Each incremental fix/enhancement MUST NOT break current UI, existing implementations, features,
functionality, or **between-screen navigation**. Before each commit: gitnexus impact on touched
symbols; confirm the change is additive/scoped; re-check that navigations into and out of the
touched screen still work. Prefer the smallest change that resolves the defect. If a fix risks a
shared component (TrekCard/tab bar/router), isolate it and note the blast radius.

## Navigation is currently broken (owner)
- **D27** — **Screen-to-screen navigation is not working correctly** (cross-cutting). Diagnose the
  router/route wiring across the app (may overlap D04 chip→Explore, D05 view-all, and pushed-screen
  back behaviour). Verify every tab, drawer item, card tap, "View all", back, and deep link routes
  to the correct screen. This is a **first-class, high-priority** item — fix + verify holistically.

---

## HOME  (owner issues 1, 3, 4)

### Owner #1 — Home top (screenshot 1)
- **D01** — Excess **padding above the greeting/username** block at the top of Home.
- **D02** — Quick-filter chips (Difficulty / Length / Elevation gain) are **not centre-aligned**.
- **D03** — **"Length" filter is wrong** — there is no length data. Rename to **"Duration"** and wire
  the real **duration** filter behaviour.
- **D04** — Tapping a quick-filter chip must **navigate to Explore with the filter bottom-sheet
  OPENED** (currently it just routes to browse; sheet not opened, filter not applied).

### Owner #3 — "View all"/"See all" (screenshot 2)
- **D05** — **"View all" / "See all"** on every Home section (Explore by Region, Treks by difficulty,
  Popular, etc.) **does nothing** — no navigation and no filter applied on the destination.

### Owner #4 — Personalized feed (screenshot 3)
- **D06** — **News articles must NOT appear** in the personalized "For {name} / Based on your
  browsing history" feed.
- **D07** — The personalized **"For {name}" section must move to the TOP** of Home (above "Popular
  with trekkers") — it is the core personalized section.
- **D08** — **Re-verify the entire Home personalization + recommendation logic** against ALL defined
  use cases: logged-in / logged-out, new / repeat, onboarding done / skipped, cross-web sync
  (STEP-M28 matrix).

---

## BOTTOM NAVIGATION  (owner issue 2)
- **D09** — Bottom-nav **pill UI quality is poor** (needs a proper modern-app treatment).
- **D10** — **Extra padding inside the bottom** of the bottom nav.

---

## EXPLORE  (owner issues 5, 6)
- **D11** — **Explore filters need a full revisit.** Filter source must be the **CMS fields used by
  the WEB Explore screen** PLUS the **trek data used by Compare** — the union of both (unique
  fields + combinations). Rebuild the filter set from these real fields.
- **D12** — When **some filters are applied, scrolling stops working** on Explore.

---

## TREK DETAIL  (owner issues 7, 8, 9, 12)

### Owner #7 — hero + summary (screenshot 4)
- **D13** — Hero image **bottom corners are not rounded** (must match the approved reference UI).
- **D14** — **State is repeated** in the hero (region pill "UTTARAKHAND" + subtitle "Uttarakhand").
- **D15** — **Trek metadata** (trek-data backfill + Master CMS trek fields) renders **below the Trail
  Route** — wrong position; it should sit above / be repositioned per the reference.
- **D16** — The **Trail Route image (summary card) is not clickable**.

### Owner #8 — photo tour + log + nav (screenshot 5)
- **D17** — The **Photo-tour image is not clickable**.
- **D18** — The **"I did this trek — log it"** banner **collides with the navigation**.
- **D19** — The **navigation UI is broken / not aligned** with modern mobile-app conventions.

### Owner #9 — section collision (screenshot 6)
- **D20** — The **"Ask TrekSage" section collides with the Trail Route Map** section (overlap).

### Owner #12 — scroll safe-area (screenshot 8)
- **D21** — On scroll, the **pinned section-tab navigation collides with the device top** (notch /
  Dynamic Island) — safe-area not respected on the pinned bar.

---

## COMPARE  (owner issue 10, screenshot 7)
- **D22** — Selected **trek chips (pills) show NO trek name** (the compare selection chips at top are
  blank). [Recurrence of the earlier compare-name contrast bug — re-check.]

---

## PROFILE  (owner issue 11)
- **D23** — **Saved treks + saved comparisons are not reflected** in the user's profile
  (Saved / Comparisons screens empty despite saving).

---

## SETTINGS  (owner issue 13, screenshot 9)
- **D24** — **App version is hardcoded to 1.0.0** — must be **dynamic** (read the real app version,
  i.e. show 1.1.0 now, auto-updating per release).

---

## AUTH  (owner issue 14, screenshot 10)
- **D25** — In **dark mode the TrekYatra logo is invisible** on welcome/sign-in. Use the adaptive
  icon / a dark-mode-visible logo variant.

---

## NOTIFICATIONS  (owner issue 15, screenshot 11)
- **D26** — **Notification-centre UI is broken** (header padding/layout off at the top).

---

## Summary count
15 owner issues + navigation → **27 tracked defects (D01–D27)** across Navigation (1), Home (8),
Bottom nav (2), Explore (2), Trek detail (9), Compare (1), Profile (1), Settings (1), Auth (1),
Notifications (1).

## Fix priority (functional & cross-cutting first, visual last)
1. **Navigation (D27)** — cross-cutting; diagnose + fix routing so nothing else is built on broken nav.
2. **Home functional** — D04 (chip→Explore+sheet), D05 (view-all), D06/D07/D08 (personalization order+logic).
3. **Explore functional** — D11 (filters from Web CMS fields + Compare trek data), D12 (scroll).
4. **Data reflection** — D23 (saved/comparisons in profile), D22 (compare chip names), D24 (dynamic version).
5. **Trek detail** — D13–D21 (rounding, state dup, metadata order, clickable map/photo, collisions, safe-area).
6. **Visual/UI** — D01/D02/D03 (home top), D09/D10 (bottom nav), D25 (dark logo), D26 (notifications).

Each group = its own commit (gitnexus impact + tsc + regression re-check + MD update). Then rebuild `1.1.0 (2)`.

## Progress (checked off as landed)

### Group 1 — Home functional + top (landed)
- ✅ **D01** — Removed double top-inset. `SafeArea` (SafeAreaView) already applies `insets.top`;
  `HomeHeroV2` was adding `insets.top` again → doubled padding above the greeting. HomeHeroV2 now
  uses a fixed `paddingTop: 8` (dropped `useSafeAreaInsets`).
- ✅ **D02** — `QuickFilterChips` row now `flexGrow:1 + justifyContent:center` (symmetric
  `paddingHorizontal:16`) → chips sit centred when they fit, still scroll if they overflow.
- ✅ **D03** — Home quick chips: **"Length" → "Duration"** (real bucket filter) and
  **"Elevation gain" → "Season"** (no elevation data exists). Icons updated (time / partly-sunny).
- ✅ **D04** — Quick chip `onFilterPress` now routes `/(tabs)/browse?openFilters=1`. New
  `exploreStore.sheetOpenNonce` + `requestSheetOpen()`; `FilterChips` watches the nonce and opens
  the `FilterSheet`. So a chip tap lands on Explore **with the filter sheet open**.
- ✅ **D05** — Root cause: Explore only read `?region`, ignoring `?difficulty`/`?season`. `BrowseScreen`
  useEffect now applies **region + difficulty + season** from params (and honours `openFilters=1`).
  Home "View all" links already pass the right param (RegionsRow→`?region`,
  DifficultyTabsSection→`?difficulty=Easy|Moderate|Challenging` which matches the store's values), so
  they now filter the destination correctly.
- tsc clean; gitnexus detect_changes = additive, confined to Home/Browse/Explore render flows.

### Group 2 — Home personalization (landed)
- ✅ **D06** — News no longer appears in the personalised feed. Recommendations from
  `/api/v1/recommendations` + `/account/recommendations` can include `news_article` /
  `comparison` / `gear_review` pages; the feed is a **trek-card grid**, so `mobileApi` now filters
  recommendations to `page_type === "trek_guide"` (`isTrekRecommendation`) before mapping. Fixed
  **client-side** — the recommendation endpoints are shared with the live website, so the shared
  backend query was intentionally left untouched (no live-web risk).
- ✅ **D07** — `PersonalisedFeedSection` moved to the **top** of Home (immediately after the hero,
  above "Popular with trekkers"). Still gated to states A/B/D (hidden for logged-out-new "C").
- ✅ **D08** — Re-verified state machine + blend: `resolveState` (A=logged-in/no-behavior→"Popular
  treks", B=logged-in+behavior→"For {name}", C=logged-out/new→feed hidden, D=logged-out+behavior→
  "Continue exploring"); `blendedRegions/blendedDifficulties` anchor on onboarding prefs then append
  behavior; greeting region = `prefs.regions[0] ?? topRegions[0]`. Logic is correct — the only
  defects were D06/D07. Hardening: `PersonalisedFeedSection` now returns `null` entirely when empty
  (was rendering a bare heading) so the top-of-Home never shows an empty "For {name}".
- tsc clean.

### Group 3 — Explore filters (landed)
- ✅ **D12** — Scroll no longer breaks with filters. `TrekGrid` returned a **static `<View>`** for the
  empty state (`treks.length === 0`), so whenever a filter narrowed results to nothing the whole
  Explore screen became unscrollable. Now the `FlatList` always renders (empty message moved to
  `ListEmptyComponent`); `numColumns` drops to 1 + `key` remount when empty so the message spans
  full width. (components/browse/TrekGrid.tsx)
- ✅ **D11** — Filter set aligned to the **Web Explore** field set (the reference) unioned with
  Compare's trek data. Web Explore filters on **State · Difficulty · Duration · Season ·
  Suitability** (5); mobile had only the first 4 → **added Suitability**. Compare's fields
  (state/difficulty/duration) were already covered. Wiring, backend→frontend:
  - Backend (additive, backward-compatible — web doesn't pass it, so no live-web change): optional
    `trek_suitability` query param on `GET /api/v1/cms/pages` → `cms_service.list_pages` filters
    `trek_suitability ILIKE %value%` (mirrors web's `.includes()` and the existing `trek_season`
    filter). New pytest `test_list_pages_filters_by_trek_suitability`.
  - Mobile: `exploreStore.trekSuitability` + setter (+ `clearAll`); `ExploreFilters.trekSuitability`
    + `exploreTreks` sets `trek_suitability`; `FilterSheet` renders a **Suitability** chip section
    from `facets.suitabilities` (backend `FilterFacets` already returned it — it was previously
    unused); `FilterChips` active-chip + clear; `BrowseScreen` passes `trekSuitability` to `useExplore`.
  - **Scoping note:** kept the existing **single-select-per-category** model (web supports
    multi-select OR-within-group). Multi-select is an enhancement beyond the defect and a larger
    store/endpoint change; deferred deliberately. The filter *fields* now match web + Compare, which
    is the core of D11.
- tsc clean; CMS backend tests 55/55 (incl. new suitability test).

### Group 4 — Data reflection (landed)
- ✅ **D22** — Compare selection pills were blank. Root cause: `pillName` had `flex: 1` inside a
  **horizontal ScrollView** (auto/unbounded width) — with no flex basis the label collapses to
  width 0, so the trek name rendered but was invisible. Changed to content-sized
  (`maxWidth: 104, flexShrink: 1`, `numberOfLines={1}`). Not a contrast bug (the earlier attempt).
  (app/(tabs)/(home)/compare.tsx)
- ✅ **D23** — Saved treks + comparisons now reflected. Root cause: the drawer's "Saved Treks" →
  `/(tabs)/saved` hub **only showed a "Saved Comparisons" link and never listed bookmarked treks**.
  Rebuilt `saved/index.tsx` to list real bookmarks (`useSavedTreks` + `SavedTrekCard`) with
  loading/empty states, keeping the comparisons link. Also `TrekStickyBar.handleSave` now
  invalidates the `["account","bookmarks"]` query so a just-saved trek appears immediately.
  (Comparisons screen already loaded real data via `useComparisons`.)
  (app/(tabs)/saved/index.tsx, components/trek/TrekStickyBar.tsx)
- ✅ **D24** — App version is dynamic. `settings.tsx` and `about.tsx` now read
  `Constants.expoConfig?.version` (app.config.ts `version` → shows 1.1.0, auto-updates per release)
  instead of the hardcoded "1.0.0".
- tsc clean.

### D27 — navigation (root cause found; fix folded into Group 5 / trek-detail pass)
- **Diagnosis:** all **11** trek-detail navigations (from Explore search, TrekSage, Plan results,
  operators, notifications, and Home) hard-push `/(tabs)/(home)/trek/${slug}` — a route that lives
  **inside the Home tab's stack**. Pushing it from any *other* tab force-switches the active tab to
  Home, and `back()` returns to Home instead of the origin screen. That is the "navigation not
  working correctly" the owner saw. `trek/[slug]` is self-contained (its internal pushes are only
  `back()`, auth, premium, `/safety-disclaimer` — no absolute `(home)` sibling links), so the fix is
  to **promote `trek/[slug]` to a root-level route** (sibling of `(tabs)`, like `notifications`) and
  repoint all 11 call sites to `/trek/${slug}`. This is coupled to D18/D20 (bottom-nav collisions —
  promoting removes the tab bar under trek detail) and D21 (pinned-bar safe-area), so it is executed
  **together with the trek-detail pass (Group 5)** rather than in isolation.
