# STEP-M07c — Region Tabs with Trek Cards (+ Home Difficulty Tabs Bugfix)

**Status:** Done ✓ (2026-06-14)
**Phase:** Explore & Search
**Dependencies:** STEP-M06 (Home screen), STEP-M07a (Browse tab, `contentApi.exploreTreks`)

> Redefines the previously-unscoped "M07c — Browse/Search Polish Pass" placeholder with a concrete, user-requested deliverable. A second, unrelated bug found on the same screen (Home difficulty tabs) was fixed in a separate commit per process rules.

---

## Scope

### Bugfix: Home difficulty tabs showing empty Easy/Moderate sections

**Root cause** (verified against the DB): `DifficultyTabsSection.tsx` filtered `dedupedTreks` (= `trending + seasonal`, a ~10-20 item subset from `useHomeData`) with exact equality `t.trek_difficulty === activeTab`. Published `trek_guide` CMS pages have `trek_difficulty` = `null` ×3290, `"Moderate-Difficult"` ×31, `"Moderate"` ×10 — no page is exactly `"Easy"` or `"Challenging"`, and `"Moderate-Difficult"` never equals `"Moderate"`. So even the "Moderate" tab (which has 41 matching published pages) rendered empty.

The web equivalent (`apps/web-next/components/home/DifficultyTabsSection.tsx`) avoids this with fuzzy substring matching against the full CMS page list (`"moderate-difficult".includes("moderate")` → true, also matches "Challenging" via `.includes("difficult")`).

**Fix**: New `apps/mobile/hooks/useDifficultyTreks.ts` — per active tab, queries `contentApi.exploreTreks({trekDifficulty: value}, 10, 0)` (existing, exact-match backend endpoint, unchanged) for a list of raw DB values:
- `Easy: ["Easy"]`
- `Moderate: ["Moderate", "Moderate-Difficult"]`
- `Challenging: ["Challenging", "Difficult", "Moderate-Difficult"]`

Results are merged + deduped by slug (up to 10). `DifficultyTabsSection.tsx` now calls this hook directly and no longer takes a `treks` prop. `apps/mobile/app/(tabs)/(home)/index.tsx` drops the now-unused `dedupedTreks` computation.

**Result**: "Moderate" tab now shows up to 10 cards. "Easy"/"Challenging" still show "No … treks to show right now" — correct, since no published treks currently carry those exact labels (a data gap, not a code bug).

### Feature: Region tabs with trek cards (Home "Explore by Region")

User confirmed (via AskUserQuestion): region chips become **tab-like** — tapping a chip selects it and shows 5 trek cards for that state below, with a "View all →" link to Browse pre-filtered by that state. First region ("Himachal Pradesh") selected by default.

- New `apps/mobile/hooks/useRegionTreks.ts` — `useQuery` over `contentApi.exploreTreks({trekState: region}, 5, 0)`, `staleTime: 10min`.
- `apps/mobile/components/home/RegionsRow.tsx` rewritten:
  - Header row: "Explore by Region" + "View all →" (same `viewAll` style as `DifficultyTabsSection`) → `router.push('/(tabs)/browse?region=' + activeRegion)`. The Browse screen (`apps/mobile/app/(tabs)/browse/index.tsx:36-38`) already reads `?region=` and calls `useExploreStore().setTrekState(params.region)` — **no Browse changes needed**.
  - Chip row: same 8 regions, now selectable tabs (active = saffron `#E8702A` background, mirrors `DifficultyTabsSection`'s `tab`/`tabText` styles).
  - Below: up to 5 `TrekCard`s (`width={180}`) for `activeRegion`, or "No treks for \<activeRegion\> yet." empty state.

**Data reality**: published `trek_state` values are `"Uttarakhand"` ×46, `"Himachal Pradesh"` ×31, `null` ×3254. Only those 2 of the 8 region chips currently render cards; the other 6 ("Jammu & Kashmir", "Sikkim", "Ladakh", "Maharashtra", "Rajasthan", "Karnataka") show the empty state until CMS content for those states is published — expected, not a bug.

---

## Decisions
- Both fixes reuse `contentApi.exploreTreks()` (added in M07a) — **no backend changes**, no new endpoints.
- Difficulty fix uses a hardcoded fuzzy-value-list per tab (exact-match queries unioned) rather than changing the backend to ILIKE — avoids touching `services/api/app/modules/cms/service.py`, which is shared with the web Explore filters (zero blast radius on `apps/web-next`).
- `DifficultyTabsSection`'s pre-existing "View all → /(tabs)/browse?difficulty=..." link (Browse doesn't read a `?difficulty=` param) is a separate, undiscussed latent issue — flagged but not fixed here (out of scope, not raised by user).
- No `apps/web-next` files touched — zero blast radius on production website (desktop + mobile web).

---

## Files Created
| File | Purpose |
|------|---------|
| `apps/mobile/hooks/useDifficultyTreks.ts` | Per-tab fuzzy-value `exploreTreks` query + dedupe, for `DifficultyTabsSection` |
| `apps/mobile/hooks/useRegionTreks.ts` | `exploreTreks({trekState: region}, 5, 0)` query, for `RegionsRow` |

## Files Modified
| File | Change |
|------|--------|
| `apps/mobile/components/home/DifficultyTabsSection.tsx` | Dropped `treks` prop; uses `useDifficultyTreks(activeTab)`; added loading state |
| `apps/mobile/app/(tabs)/(home)/index.tsx` | Removed unused `dedupedTreks` computation + `treks` prop on `<DifficultyTabsSection />` |
| `apps/mobile/components/home/RegionsRow.tsx` | Region chips → selectable tabs (default first region), added "View all →" header link + 5-card row / empty state below |

---

## Notes
- `cd apps/mobile && npx tsc --noEmit`: 0 errors.
- Backend: full suite re-run — 643 pass, 2 pre-existing `test_refresh.py` failures (unrelated, unchanged baseline from M07a/b). No backend files touched.
- `gitnexus_detect_changes(scope:"all")` (pre-re-index, after commit 1): risk "low", 6 changed symbols / 0 affected / 3 changed files (`(home)/index.tsx`, `DifficultyTabsSection.tsx`, `RegionsRow.tsx`).
- `npx gitnexus analyze --force` re-index after both commits: 491,841 nodes | 788,951 edges | 3,739 clusters | 300 flows (from 465,306/746,928/3,176/300 at start of step — increase reflects new hook files plus accumulated changes from prior steps since the last re-index)
- `gitnexus_detect_changes(scope:"all")` post-re-index: risk "low", 1 changed symbol (pre-existing `CLAUDE.md` edit, unrelated to this step) / 0 affected processes / 1 changed file — confirms no unexpected scope.
- No `apps/web-next` files touched — zero blast radius on production website (desktop + mobile web).

---

## Backend Test Cases — STEP-M07c

None — no backend files were modified. Both fixes reuse the existing, already-tested `GET /api/v1/cms/pages` filter params from M07a.

---

## Frontend Test Cases — STEP-M07c

Run: `cd apps/mobile && npx expo start` (or dev-client build), open the Home tab.

### TC-F01: Difficulty tabs — "Moderate" now shows treks
Steps:
1. On Home, scroll to "Treks by difficulty".
2. Tap "Moderate".
Expected: up to 10 trek cards render (previously showed "No moderate treks to show right now.").
Pass = cards render, each card links to a valid trek detail page.

### TC-F02: Difficulty tabs — "Easy"/"Challenging" graceful empty state
Steps:
1. Tap "Easy", then "Challenging".
Expected: "No easy/challenging treks to show right now." (same as before — no published treks carry these exact labels yet).
Pass = no crash, no infinite loading spinner; message renders once the query resolves.

### TC-F03: Region tabs — default + card render
Steps:
1. On Home, scroll to "Explore by Region".
Expected: "Himachal Pradesh" chip is selected (saffron) by default, with up to 5 trek cards below it.
2. Tap "Uttarakhand".
Expected: chip selection moves, up to 5 different cards render for Uttarakhand treks.
Pass = cards update on chip tap; each card links to a valid trek detail page.

### TC-F04: Region tabs — empty state for regions without data
Steps:
1. Tap "Sikkim" (or any of Jammu & Kashmir/Ladakh/Maharashtra/Rajasthan/Karnataka).
Expected: "No treks for Sikkim yet." message, no crash.
Pass = graceful empty state, chip remains selected.

### TC-F05: "View all" navigation
Steps:
1. With "Himachal Pradesh" selected, tap "View all →" in the "Explore by Region" header.
Expected: navigates to the Browse tab with the state filter pre-applied (grid shows Himachal Pradesh treks; the "Himachal Pradesh" filter chip/state is reflected in `FilterChips`).
Pass = Browse screen loads filtered results for the selected region, matching the existing `?region=` param flow.

### TC-F06: Mobile layout (375px)
Steps:
1. View Home on a 375px-wide device (e.g. iPhone SE simulator).
Expected: region chip row and trek card row scroll horizontally without overflow/clipping; difficulty section unchanged visually from M06.
Pass = no layout breakage at 375px in any state (loading, empty, populated).
