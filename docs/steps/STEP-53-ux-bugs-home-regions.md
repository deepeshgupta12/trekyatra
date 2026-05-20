# Step 53 — UX Bug Fixes: Home + Regions + Explore

## Status: Done — 2026-05-20

## Issues Fixed

### 1. Regions page: only static 3 treks shown (not pipeline-published ones)
**Root cause:** `stateTreks` built from `treks.filter(t => t.state.includes(r.name))` — static `treks.ts` has only 3 Uttarakhand entries. CMS-published treks with `trek_state = "Uttarakhand"` not included.
**Fix:** Fetch CMS pages by trek_state using `fetchCMSPages()`, convert to Trek objects, merge with static treks, de-duplicate by slug. Show most recent 6.

### 2. Explore page: filter sidebar not independently scrollable
**Root cause:** `sticky top-24 space-y-7` has no `max-h` or `overflow-y-auto`. Filter content taller than viewport scrolls with the page.
**Fix:** Add `max-h-[calc(100vh-7rem)] overflow-y-auto` to the sticky filter container.

### 3. Regions page: "Best time to trek" season chart
**Root cause:** Bar chart uses hardcoded intensity values `[0.9, 0.8, 0.5...]` — not derived from any trek data. Users don't understand what it shows.
**Fix:** Remove the section entirely. Replace with a simple text-based seasonal summary derived from the treks in that state.

### 4. Home page trending section: static stub cards
**Root cause:** `trending = trekList.slice(0, 4)` uses static trek list without CMS overrides (image, name, difficulty etc.).
**Fix:** Server-side: fetch `fetchTrekCMSOverrides()` and apply to trending array before passing to TrekCard.

### 5. DifficultyTabsSection: wrong state field + difficulty mismatch
**Root cause 1:** `cmsToTrek()` has `state: ""` hardcoded — CMS pages have `trek_state` column.
**Root cause 2:** `cmsMatchesDifficulty()` reads from `trek_facts.difficulty` only; pipeline pages now have `trek_difficulty` column (Step 46) which is more reliable.
**Fix:** Use `page.trek_state` for state; check `page.trek_difficulty` first, fall back to `trek_facts.difficulty`.

## Files Modified
- `apps/web-next/app/(public)/regions/[slug]/page.tsx` — CMS treks by state + season chart removal
- `apps/web-next/app/(public)/explore/page.tsx` — filter sidebar scroll CSS
- `apps/web-next/app/(public)/page.tsx` — CMS overrides for trending section
- `apps/web-next/components/home/DifficultyTabsSection.tsx` — state + difficulty fixes
- `apps/web-next/lib/api.ts` — fetchCMSTreksByState() helper
