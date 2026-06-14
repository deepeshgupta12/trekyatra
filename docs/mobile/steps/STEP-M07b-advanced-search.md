# STEP-M07b — Advanced Search: Semantic, Voice, Recent, Trending

**Status:** Done ✓ (2026-06-14)
**Phase:** Explore & Search
**Dependencies:** STEP-M07a (Browse Tab — basic search screen)

> Second of the M07a/b/c split. All four features deferred from M07a (semantic search, voice search, recent searches, trending searches) are in scope per explicit user decision. M07c (Browse/Search polish pass) remains deferred.

---

## Scope

### Backend
**No changes.** `services/api/app/api/routes/search.py` already implements:
- `POST /search/semantic` — body `{q, page_type?, limit?}` → `list[SemanticSearchResult]` (pgvector + text hybrid, intent detection)
- `GET /search/trending?limit=` → `list[str]` (most-searched queries, curated fallback)
- `POST /search/log` (204) — fire-and-forget search analytics

All three confirmed working and unmodified — only consumed from mobile in this step.

### New dependency
- `expo-speech-recognition@^56.0.1` (jamsch), installed via `npx expo install expo-speech-recognition` — SDK-56-compatible.
- `apps/mobile/app.config.ts` — added to `plugins`:
  ```ts
  [
    "expo-speech-recognition",
    {
      microphonePermission: "Allow TrekYatra to use the microphone for voice search.",
      speechRecognitionPermission: "Allow TrekYatra to use speech recognition for voice search.",
      androidSpeechServicePackages: ["com.google.android.googlequicksearchbox"],
    },
  ]
  ```
- Requires `expo-dev-client` (already present) — **not available in Expo Go or on web**. Guarded via `Platform.OS !== "web" && ExpoSpeechRecognitionModule.isRecognitionAvailable()`; the mic icon is hidden entirely when unsupported.

### Mobile data layer
- `apps/mobile/lib/mobileApi.ts` (additive):
  - New `SemanticSearchResult` interface (`slug, title, page_type, hero_image_url, seo_description, trek_state, trek_difficulty, trek_duration, trek_season, trek_suitability, score, matched_by`).
  - `contentApi.semanticSearch(q, page_type?, limit?)` → `POST /api/v1/search/semantic`.
  - `contentApi.getTrendingSearches(limit?)` → `GET /api/v1/search/trending?limit=`.
  - `contentApi.logSearch(query, clickedSlug?, clickedPageType?)` → `POST /api/v1/search/log`, `.catch()`-wrapped (the 204 empty body otherwise throws on `resp.json()`).

### New hooks
- `apps/mobile/hooks/useRecentSearches.ts` (NEW) — AsyncStorage key `ty_recent_searches`, max 8 entries, most-recent-first, de-duped (case-insensitive). Exposes `recentSearches`, `addRecentSearch`, `removeRecentSearch`, `clearRecentSearches`.
- `apps/mobile/hooks/useTrendingSearches.ts` (NEW) — `useQuery` over `contentApi.getTrendingSearches(8)`, `staleTime: 30min`.
- `apps/mobile/hooks/useSemanticSearch.ts` (NEW) — debounces the raw query 800ms; enabled only when the debounced query has more than 3 words (matches original M07 spec); `useQuery` over `contentApi.semanticSearch(debouncedQuery)`, `staleTime: 60s`.

### `apps/mobile/app/(tabs)/browse/search.tsx` (rewritten)
- **Empty/short query (< 2 chars)**: shows "Recent Searches" (chips with per-item "×" remove + "Clear all"; tapping a chip sets the query) and "Trending Searches" (chips from `useTrendingSearches`, tapping sets the query). Reuses the rounded-pill chip visual style from `FilterChips.tsx`. Falls back to the original "Start typing to search" placeholder only when both lists are empty.
- **Mic button**: rendered in the input bar only when voice is available (computed once via `VOICE_AVAILABLE` module constant). Tap requests permission via `ExpoSpeechRecognitionModule.requestPermissionsAsync()`, then `start({lang: "en-US", interimResults: true})`. `useSpeechRecognitionEvent("result")` updates `query` live from `event.results[0].transcript`; `"start"`/`"end"`/`"error"` toggle the recording indicator (saffron mic icon while active).
- **Results (query ≥ 2 chars)**: existing `/search/suggestions` typeahead list unchanged. If `useSemanticSearch` returns results (debounced query > 3 words), a "Suggested for you" section is shown above the suggestions list, deduped by slug against the suggestions, with a "Smart match" badge when `matched_by !== "text"`.
- **On result tap or submit**: calls `addRecentSearch(query)` and (on tap) `contentApi.logSearch(query, item.slug, item.page_type)` before navigating — navigation logic by `page_type` unchanged from M07a.

---

## Decisions
- Voice search requires a dev-client/EAS build (not Expo Go) — accepted per user decision to include voice search now; the mic button is hidden gracefully (not crashed) on unsupported platforms via `isRecognitionAvailable()` + a `Platform.OS !== "web"` check.
- Recent searches are AsyncStorage-only (no backend sync), max 8, matching the "lightweight local history" pattern already used elsewhere in the app.
- Semantic search threshold (>3 words, 800ms debounce) matches the original `STEP-M07-explore-search.md` spec.
- No backend changes — all three consumed endpoints (`/search/semantic`, `/search/trending`, `/search/log`) were already implemented and tested in prior steps (Step 58 and search analytics).
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/mobile/hooks/useRecentSearches.ts` | AsyncStorage-backed recent searches (max 8) |
| `apps/mobile/hooks/useTrendingSearches.ts` | Fetches `/api/v1/search/trending` |
| `apps/mobile/hooks/useSemanticSearch.ts` | Debounced `/api/v1/search/semantic` query (>3 words) |

## Files Modified

| File | Change |
|------|--------|
| `apps/mobile/lib/mobileApi.ts` | New `SemanticSearchResult` type + `semanticSearch`/`getTrendingSearches`/`logSearch` |
| `apps/mobile/app/(tabs)/browse/search.tsx` | Recent/Trending sections, mic-based voice search, semantic "Suggested for you" section, recent-search + search-log tracking |
| `apps/mobile/app.config.ts` | Added `expo-speech-recognition` plugin config |
| `apps/mobile/package.json` | New dependency `expo-speech-recognition@^56.0.1` |

---

## Notes

- `cd apps/mobile && npx tsc --noEmit`: 0 errors.
- `gitnexus_detect_changes(scope:"all")`: risk "low", 9 changed symbols / 0 affected / 6 changed files (`search.tsx`, `mobileApi.ts`, plus pre-existing `CLAUDE.md` touch). New hook files + `app.config.ts`/`package.json` reflected after `npx gitnexus analyze --force` re-index.
- `npx gitnexus analyze --force` re-index after this step: **465,306 nodes | 746,928 edges | 3,176 clusters | 300 flows** (from 491,679 / 788,324 / 3,709 / 300 at start of step — drop attributable to indexer scope-extraction/timeout fallbacks during this run, not a code deletion; mobile changes for this step are present in the new graph).
- Backend: full suite re-run — 643 pass, same 2 pre-existing `test_refresh.py` failures from M07a (`test_stale_pages_includes_null_last_refreshed`, `test_stale_page_response_shape`), confirmed unrelated and unchanged by this step. No new backend tests required (no backend changes).
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Backend Test Cases — STEP-M07b

None — no backend files were modified in this step. All consumed endpoints (`/search/semantic`, `/search/trending`, `/search/log`) were already covered by prior steps' test suites.

---

## Frontend Test Cases — STEP-M07b

Run: mobile app on a **dev-client build** (`cd apps/mobile && npx expo run:ios` / `run:android`, or an EAS dev build) — voice search (TC-F03) requires a dev-client/EAS build and will not appear in Expo Go or web.

### TC-F01: Recent searches
Steps:
1. From Browse, tap the search bar and search for a trek (e.g. "Kashmir Great Lakes"), then tap a result.
2. Navigate back to the search screen (clear the query if needed).
Expected: a "Recent Searches" section appears with a chip for "Kashmir Great Lakes" (or whatever was searched).
3. Tap the chip.
Expected: the search input is filled with that text and results reload.
4. Tap "×" on the chip, then "Clear all".
Pass = chip is removed individually, then the whole section disappears after "Clear all"; state persists across app restarts (AsyncStorage).

### TC-F02: Trending searches
Steps:
1. On the search screen with an empty query, observe the "Trending Searches" section.
Expected: a row of chips populated from `GET /api/v1/search/trending` (curated fallback terms if no real query data yet).
2. Tap a trending chip.
Expected: the search input fills with that term and results load.
Pass = trending chips render and tapping one performs a search.

### TC-F03: Voice search (dev-client build only)
Steps:
1. On a dev-client build, observe the mic icon in the search input bar.
Expected: mic icon visible (hidden on Expo Go/web).
2. Tap the mic icon, grant microphone/speech permission if prompted, and speak a trek name.
Expected: the mic icon turns saffron/active while recording; the search input fills with the recognized speech text; results load.
3. Tap the mic icon again while recording.
Expected: recognition stops, icon returns to inactive state.
Pass = mic button hidden gracefully where unsupported; on supported builds, voice input correctly fills the search field and triggers a search.

### TC-F04: Semantic search "Suggested for you"
Steps:
1. Type a long natural-language query (>3 words), e.g. "easy trek for beginners in winter near delhi".
2. Wait ~1 second (800ms debounce).
Expected: a "Suggested for you" section appears above the regular results, with results not already shown in the plain suggestions list; results matched via semantic/hybrid search show a "Smart match" badge.
Pass = section appears only for >3-word queries after the debounce, with no duplicate slugs between sections.

### TC-F05: Mobile layout (375px)
Steps:
1. Resize/view on a 375px-wide device (e.g. iPhone SE simulator).
Expected: Recent/Trending chip rows wrap correctly without overflow; mic icon, clear button, and search icon fit within the input bar without clipping; "Suggested for you" section and result rows render correctly without overflow.
Pass = no layout breakage at 375px on the search screen in any state (empty, typing, results, recent/trending).
