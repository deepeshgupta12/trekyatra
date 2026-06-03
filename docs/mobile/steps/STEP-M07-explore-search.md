# STEP-M07 — Explore & Search

**Status:** Pending
**Phase:** Discovery
**Dependencies:** STEP-M05 (TrekCard), STEP-M06 (home screen patterns)

---

## Scope

Build the Browse tab (Explore) and Search screen. Full parity with the web `/explore` and `/search` pages including facet filters, fuzzy search, semantic search for long queries, and region/season hubs.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/mobile/app/(tabs)/browse.tsx` | Browse tab root — trek grid + header |
| `apps/mobile/app/(tabs)/search.tsx` | Search screen |
| `apps/mobile/app/(tabs)/browse/regions.tsx` | Regions list screen |
| `apps/mobile/app/(tabs)/browse/regions/[slug].tsx` | Regional hub screen |
| `apps/mobile/app/(tabs)/browse/seasons/[slug].tsx` | Seasonal hub screen |
| `apps/mobile/components/browse/TrekGrid.tsx` | Infinite scroll grid of TrekCards |
| `apps/mobile/components/browse/FilterSheet.tsx` | Bottom sheet filter panel |
| `apps/mobile/components/browse/FilterChips.tsx` | Active filter chips row |
| `apps/mobile/components/browse/SearchBar.tsx` | Search input with clear + mic |
| `apps/mobile/components/browse/SearchResultsList.tsx` | Search results (unified: fuzzy + semantic) |
| `apps/mobile/components/browse/TrendingSearches.tsx` | Trending queries chip row |
| `apps/mobile/components/browse/RecentSearches.tsx` | Recent searches (AsyncStorage) |
| `apps/mobile/hooks/useExplore.ts` | TanStack Query: paginated trek list with filters |
| `apps/mobile/hooks/useSearch.ts` | Search query hook: debounced API + local Fuse |
| `apps/mobile/hooks/useFilterFacets.ts` | Fetch facet counts from /treks/filter-facets |

---

## Browse Screen (Explore Tab)

### Layout
```
[Search bar — tappable, navigates to search screen]
[Active filter chips row — scrollable]
[Trek grid — 2 columns, infinite scroll]
[Filter FAB — bottom right]
```

### Data
- `GET /api/v1/treks?state=&difficulty=&season=&duration_min=&duration_max=&page=&limit=24`
- Same API as web explore page
- Infinite scroll: `useInfiniteQuery` — loads next page when within 400px of bottom
- Offline: shows SQLite-cached treks from `cmsPages` WHERE `page_type = 'trek_guide'`

### Filter Sheet (Bottom Sheet)

Triggered by FAB or "Filters" button. Uses `@gorhom/bottom-sheet`.

```
[State filter]       Multi-select pills: Uttarakhand, Himachal Pradesh, Kashmir…
[Difficulty]         Single-select: Easy / Moderate / Challenging / Difficult
[Duration]           Range slider: 1 to 14 days
[Season]             Multi-select: Summer / Monsoon / Autumn / Winter
[Altitude]           Range slider: 0 to 6000m
[Sort by]            Radio: Popularity / Difficulty (low) / Altitude / Duration

[Clear filters]  [Apply filters]
```

Facet counts (e.g., "Uttarakhand (62)") from `GET /api/v1/treks/filter-facets`.

Active filters persist in Zustand `exploreStore` (survives tab navigation).

---

## Search Screen

### Layout
```
[← Back]  [Search bar — focused on open]  [Cancel]
─────────────────────────────────────────────────
[Trending searches]  (if query empty)
[Recent searches]    (if query empty, after first search)
─────────────────────────────────────────────────
[Search results — live as user types]
  Section: Exact/Fuzzy matches
    TrekCard rows
  Section: Semantic matches (for queries > 3 words)
    TrekCard rows with match reason badge
```

### Search Logic

**Fuzzy (instant, as-you-type):**
- `GET /api/v1/search/suggestions?q={query}` → autocomplete + trek cards
- Debounced 250ms

**Semantic (for long/natural-language queries):**
- Triggered when query length > 3 words OR after 800ms pause
- `POST /api/v1/search/semantic` with `{ query, filters: {} }`
- Shows "semantic" badge on matched results

**Voice search:**
- Mic icon in search bar → `expo-speech-recognition` (if available)
- On transcript → populate search query

**Recent searches:**
- AsyncStorage key `ty_recent_searches` — array of last 10 queries
- Shown as chips when search bar focused + query empty
- Tapping a recent search populates the bar

**Trending searches:**
- `GET /api/v1/search/trending` → top 8 queries
- Shown as chips below recent searches

---

## Regions Screen

```
[State grid — 2 columns]
  Himachal Pradesh (48 treks) [image]
  Uttarakhand      (62 treks) [image]
  Kashmir & Ladakh (29 treks) [image]
  Sahyadris        (70+ treks)[image]
  Sikkim & NE      (24 treks) [image]
```

Tapping a state → Regional hub screen (fetches CMS `regional_hub` page + trek list for that state).

## Seasonal Hub Screen

Same as regional hub but for seasons (`/seasons/[slug]`). Shows trek cards filtered by best season.

---

## Verification

### Manual smoke tests
1. **TC-M07-01**: Browse tab loads trek grid with 24 treks on first open
2. **TC-M07-02**: Open filter sheet → select "Himachal Pradesh" + "Moderate" → apply → grid shows filtered results
3. **TC-M07-03**: Active filter chips row shows selected filters; tapping X removes a filter
4. **TC-M07-04**: Search for "kedarkantha" → instant fuzzy result shows Kedarkantha card
5. **TC-M07-05**: Search for "easy trek for beginners in winter near delhi" → semantic results appear
6. **TC-M07-06**: Voice search → dictate "hampta pass" → search executes
7. **TC-M07-07**: Recent searches appear after first search; tapping re-runs search
8. **TC-M07-08**: Trending searches chips load from API
9. **TC-M07-09**: Regions screen loads → tap Uttarakhand → regional hub shows all Uttarakhand treks
10. **TC-M07-10**: Infinite scroll → scrolling to bottom of grid loads next page
