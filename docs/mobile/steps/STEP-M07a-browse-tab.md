# STEP-M07a — Browse Tab: Grid, Filters, Regions/Seasons Hubs, Basic Search

**Status:** Done ✓ (2026-06-12)
**Phase:** Explore & Search
**Dependencies:** STEP-M05 (Trek Detail Screen), STEP-M06 (Home Screen), STEP-M-DS7 (Home search bar destination)

> First of the M07a/b/c split. M07b (advanced search — semantic, voice, recent, trending) and M07c (Browse/Search polish pass) are explicitly deferred.

---

## Scope

### Backend (additive only)
`GET /api/v1/cms/pages` (`services/api/app/api/routes/cms.py` `list_cms_pages`) gains 5 new optional query params, all defaulting to `None`:
- `trek_state: str | None`
- `trek_difficulty: str | None`
- `trek_season: str | None`
- `trek_duration_min: int | None`
- `trek_duration_max: int | None`

`services/api/app/modules/cms/service.py` `list_pages()` adds matching filter clauses:
- `trek_state` / `trek_difficulty` — exact match
- `trek_season` — `ilike(f"%{value}%")`
- `trek_duration_min`/`trek_duration_max` — `trek_duration` is free text (e.g. "6 Days"); extracts the leading integer day count via `regexp_replace(trek_duration, r"[^0-9].*$", "")` cast to `Integer`, guarded by `trek_duration.op("~")(r"^[0-9]")` to avoid cast errors on non-numeric strings.

### Mobile state/data layer
- `apps/mobile/stores/exploreStore.ts` (NEW) — Zustand store: `trekState`, `trekDifficulty`, `trekSeason`, `durationBucket` + setters + `clearAll()`. Exports `DURATION_BUCKETS` (1–3, 4–6, 7–9, 10+ days), mirroring backend `_DURATION_BUCKETS` from `treks.py`.
- `apps/mobile/hooks/useFilterFacets.ts` (NEW) — `useQuery` over `GET /api/v1/treks/filter-facets`, 1h `staleTime`.
- `apps/mobile/hooks/useExplore.ts` (NEW) — `useInfiniteQuery` over `GET /api/v1/cms/pages?page_type=trek_guide&status=published&limit=24&offset=...&trek_state=...` with the explore filters; exposes `pages`, `isLoading`, `isFetchingMore`, `hasMore`, `loadMore`, `refresh`.
- `apps/mobile/lib/mobileApi.ts` — new `FilterFacets`, `SearchSuggestion`, `ExploreFilters` interfaces; `contentApi.getFilterFacets`, `contentApi.exploreTreks(filters, limit, offset)`, `contentApi.getSearchSuggestions(q)`.

### Shared components
- `apps/mobile/components/browse/SearchBar.tsx` (NEW) — `SearchBar` + `SearchBarWrapper`: tappable rounded pill, saffron search icon, navigates to `/(tabs)/browse/search`.
- `apps/mobile/components/home/HomeSearchBar.tsx` — refactored to wrap the shared `SearchBar` (passes `marginTop: -24` override) — no visual change from M-DS7.
- `apps/mobile/components/browse/TrekGrid.tsx` (NEW) — 2-column `FlatList` of `TrekCard`, `onEndReached` infinite scroll, loading/empty states, `ListHeaderComponent` prop so screens can pass search/filter/hub content as the list header (single scrollable surface).
- `apps/mobile/components/browse/FilterChips.tsx` (NEW) — horizontal scroll row: "Filters" chip (opens `FilterSheet`) + one chip per active filter (with "×" to clear) + "Clear all".
- `apps/mobile/components/browse/FilterSheet.tsx` (NEW) — full-screen `Modal` (slide-up, `Pressable` backdrop, no `@gorhom/bottom-sheet`). Sections: Region, Difficulty, Season (from `useFilterFacets`), Duration (from `DURATION_BUCKETS`). Draft state + Apply/Clear all.

### Screens (`apps/mobile/app/(tabs)/browse/`)
- `_layout.tsx` (NEW) — `Stack`, mirrors `(home)/_layout.tsx`: `headerBackButtonDisplayMode: "minimal"`, theme-driven header styles, `index` has `headerShown: false`.
- `index.tsx` (NEW) — rebuilt Browse screen: "Explore Treks" title + `SearchBar` + `FilterChips` + "Explore by Region" horizontal row (8 static regions → `regions/[state]`) + "Best by Season" horizontal row (5 static seasons → `seasons/[season]`) + "All Treks" `TrekGrid` via `useExplore(filters)` where filters come from `exploreStore`. Reads `?region=` param via `useLocalSearchParams` (from existing Home `RegionsRow`, which links to `/(tabs)/browse?region=X`) and applies it to `exploreStore.trekState` on mount for backward compatibility.
- `regions/[state].tsx` (NEW) — region hub: header "Treks in {region}" + `TrekGrid` via `useExplore({ trekState: state })` (independent of global `exploreStore`).
- `seasons/[season].tsx` (NEW) — season hub: header "Best treks for {season}" + grid sourced from existing `GET /api/v1/treks/seasonal?month=` via a static slug→month map (winter/spring/summer/monsoon/autumn).
- `search.tsx` (NEW) — basic search: auto-focused `TextInput`, results via `GET /api/v1/search/suggestions?q=` (min 2 chars), tapping a result navigates to `/(tabs)/(home)/trek/{slug}` (for `page_type === "trek_guide"`) or `/(tabs)/(home)/guide/{slug}` (other page types). Empty input shows "Start typing to search" placeholder — **no recent/trending/semantic/voice search** (deferred to M07b).
- `apps/mobile/app/(tabs)/browse.tsx` (DELETED) — old "Browse — coming in M07" placeholder, replaced by the `browse/` directory (Expo Router resolves the tab automatically).

### Decisions
- Season hub uses the existing `GET /treks/seasonal?month=` endpoint (curated "best right now" logic) rather than the new `trek_season` filter, because `trek_season` is free-text (e.g. "Sep - Oct") and doesn't map cleanly to the 5 generic season labels shown on the Browse screen. The new `trek_season` ilike filter remains available in `FilterSheet` for users filtering by the CMS's actual season strings.
- No `@gorhom/bottom-sheet` dependency — `FilterSheet` uses a full-screen `Modal`, consistent with `TrekContentsSheet.tsx`.
- `exploreStore` filter state is in-memory only (no AsyncStorage) — resets on app restart, matching "explore session" semantics.
- M07b (advanced search: semantic, voice, recent searches, trending searches) and M07c (Browse/Search polish pass) are explicitly out of scope.
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/mobile/stores/exploreStore.ts` | Browse filter state (Zustand) + `DURATION_BUCKETS` |
| `apps/mobile/hooks/useFilterFacets.ts` | Fetches `/api/v1/treks/filter-facets` |
| `apps/mobile/hooks/useExplore.ts` | Paginated `/api/v1/cms/pages` fetch with explore filters |
| `apps/mobile/components/browse/SearchBar.tsx` | Shared tappable search pill (`SearchBar` + `SearchBarWrapper`) |
| `apps/mobile/components/browse/TrekGrid.tsx` | 2-col trek grid with infinite scroll |
| `apps/mobile/components/browse/FilterChips.tsx` | Active-filter chip row |
| `apps/mobile/components/browse/FilterSheet.tsx` | Full-screen filter Modal |
| `apps/mobile/app/(tabs)/browse/_layout.tsx` | Browse Stack layout |
| `apps/mobile/app/(tabs)/browse/index.tsx` | Rebuilt Browse screen |
| `apps/mobile/app/(tabs)/browse/regions/[state].tsx` | Region hub screen |
| `apps/mobile/app/(tabs)/browse/seasons/[season].tsx` | Season hub screen |
| `apps/mobile/app/(tabs)/browse/search.tsx` | Basic search screen |

## Files Modified

| File | Change |
|------|--------|
| `services/api/app/api/routes/cms.py` | `list_cms_pages` gains 5 optional filter query params |
| `services/api/app/modules/cms/service.py` | `list_pages()` adds matching filter clauses |
| `services/api/tests/test_cms.py` | 4 new tests for filter params |
| `apps/mobile/lib/mobileApi.ts` | New `FilterFacets`/`SearchSuggestion`/`ExploreFilters` types + `getFilterFacets`/`exploreTreks`/`getSearchSuggestions` |
| `apps/mobile/components/home/HomeSearchBar.tsx` | Refactored to wrap shared `SearchBar` |

## Files Deleted

| File | Reason |
|------|--------|
| `apps/mobile/app/(tabs)/browse.tsx` | Replaced by `browse/` directory stack |

---

## Notes

- `cd apps/mobile && npx tsc --noEmit`: 0 errors.
- `gitnexus_impact` upstream on `list_cms_pages`/`list_pages`: confirmed only `list_cms_pages` calls `list_pages` — LOW risk for additive optional params.
- `gitnexus_detect_changes(scope:"all")`: risk "low", 36 changed symbols / 0 affected / 5 changed files (`mobileApi.ts`, `cms.py`, `cms/service.py`, `test_cms.py`, plus pre-existing `CLAUDE.md` touch). New mobile route files appear after `npx gitnexus analyze --force` re-index.
- `npx gitnexus analyze --force` re-index after this step: **491,679 nodes | 788,324 edges | 3,709 clusters | 300 flows** (up from 491,612 nodes | 788,810 edges | 3,763 clusters at the start of this step).
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

### Pre-existing test failures flagged (not fixed in this step)
Full backend suite: 643 pass, **2 pre-existing failures** — `test_refresh.py::test_stale_pages_includes_null_last_refreshed` and `test_refresh.py::test_stale_page_response_shape`. These fail only when running the full suite (test-ordering/pollution issue), not in isolation. Confirmed via `git stash` that these fail identically on `main` before this step's changes — **unrelated to M07a**, reported here per CLAUDE.md rule 8 (report, do not fix silently). Recommend a separate, clearly-labelled bugfix step.

---

## Backend Test Cases — STEP-M07a

Run: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/test_cms.py -v`

### TC-B01: test_list_pages_filters_by_trek_state_and_difficulty
Verifies: `list_pages(db, trek_state=..., trek_difficulty=...)` returns only pages matching both fields.

### TC-B02: test_list_pages_filters_by_trek_duration_range
Verifies: `list_pages(db, trek_duration_min=..., trek_duration_max=...)` correctly includes/excludes pages based on the leading day count parsed from free-text `trek_duration` (e.g. "2 Days", "10 Days").

### TC-B03: test_list_pages_no_filters_unchanged
Verifies: calling `list_pages(db)` with all new filter kwargs as `None` returns the same result set as before this step (no regression).

### TC-B04: test_api_list_pages_filters_by_trek_state
Verifies: `GET /api/v1/cms/pages?trek_state=Sikkim&trek_difficulty=Difficult` returns only pages matching both query params (created via POST then PATCHed to set `trek_state`/`trek_difficulty`).

---

## Frontend Test Cases — STEP-M07a

Run: mobile app on simulator/device (`cd apps/mobile && npx expo start`).

### TC-F01: Browse tab loads grid with filters
Steps:
1. Tap the "Explore" (Browse) tab.
Expected: "Explore Treks" title, search bar pill, "Filters" chip row, "Explore by Region" row (8 region chips), "Best by Season" row (5 season chips), then "All Treks" 2-column grid of trek cards.
Pass = grid loads with treks, no crash, infinite scroll loads more on scroll-to-bottom.

### TC-F02: Filter sheet apply/clear
Steps:
1. On Browse, tap the "Filters" chip.
2. Select a Region, Difficulty, Season, and Duration chip each.
3. Tap "Apply".
Expected: sheet closes, "Filters" chip row now shows one chip per selected filter, grid refreshes to show only matching treks (or empty state "No treks match your filters" if none match).
4. Tap "Clear all" in the chip row.
Expected: all filter chips disappear, grid returns to the unfiltered full list.
Pass = filters apply/clear correctly, grid reflects each state.

### TC-F03: Regions hub navigation
Steps:
1. On Browse, tap a region chip (e.g. "Uttarakhand") under "Explore by Region".
Expected: navigates to a region hub screen titled "Uttarakhand" with header "Treks in Uttarakhand" and a grid of treks filtered to that state (or "No treks found in Uttarakhand yet" if none).
Pass = correct title, correct filtered results, back button returns to Browse.

### TC-F04: Seasons hub navigation
Steps:
1. On Browse, tap a season chip (e.g. "Monsoon") under "Best by Season".
Expected: navigates to a season hub screen titled "Monsoon" with header "Best treks for Monsoon" and a grid of seasonal treks (sourced from `/treks/seasonal?month=8`).
Pass = correct title, grid loads (or shows "No treks recommended for Monsoon yet" if empty), back button returns to Browse.

### TC-F05: Basic search
Steps:
1. From Home, tap the search bar pill (or from Browse, tap the search bar).
Expected: navigates to the search screen, auto-focused text input, "Start typing to search" placeholder shown.
2. Type 2+ characters of a trek name (e.g. "Kashmir").
Expected: a list of matching results appears (thumbnail + title + description), no recent/trending list shown.
3. Tap a result.
Expected: navigates to that trek's detail screen (or guide screen for non-trek page types).
Pass = search returns relevant results, tapping navigates correctly, clearing the input returns to the placeholder.

### TC-F06: Mobile layout (375px)
Steps:
1. Resize/view on a 375px-wide device (e.g. iPhone SE simulator).
Expected: Browse grid remains 2 columns with no overflow/clipping; horizontal region/season rows scroll smoothly; filter sheet bottom sheet fits within 80% height and is scrollable; search screen input bar and results list render correctly without overflow.
Pass = no layout breakage at 375px across Browse, region/season hubs, filter sheet, and search.
