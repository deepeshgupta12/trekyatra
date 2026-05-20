# Step 52 — Dynamic Explore Filters

## Status: Pending

## Summary
Replace the hardcoded `filterGroups` array in the Explore page with dynamic filters derived from the actual published CMS trek_guide pages. Filters update automatically as new treks are pipeline-published, and apply correctly to the full trek list.

## Motivation
Current `filterGroups` in `explore/page.tsx` is a static hardcoded array:
```javascript
const filterGroups = [
  { name: "State", options: ["Uttarakhand", "Himachal Pradesh", ...] },
  { name: "Difficulty", options: ["Easy", "Moderate", "Difficult", "Challenging"] },
  { name: "Duration", options: ["1 day", "2-3 days", "4-6 days", "7+ days"] },
  { name: "Season", options: ["Winter", "Summer", "Monsoon", "Autumn"] },
  { name: "Suitability", options: ["Beginner", "Family", ...] },
];
```
Issues:
1. Filters don't reflect actual published trek data (a trek for Arunachal Pradesh won't appear in State filter)
2. Duration/Season/Difficulty options are buckets that don't match CMS values like "Dec – Apr", "6 Days", "Moderate"
3. `active` filter state has no actual effect on `trekList` — filter chips show but don't hide/show treks
4. No multi-select across groups (e.g. "Uttarakhand AND Beginner" should AND-filter)

## Scope

### A. Backend — new filter facets endpoint
`GET /api/v1/treks/filter-facets` — returns distinct values from published trek_guide CMS pages:
```json
{
  "states":      ["Uttarakhand", "Himachal Pradesh", "Ladakh", ...],
  "difficulties": ["Easy", "Moderate", "Difficult", ...],
  "seasons":     ["Dec – Apr", "Jun – Sep", "Oct – Nov", ...],
  "suitabilities": ["Beginners", "Beginners, Intermediate", "Intermediate", ...],
  "duration_buckets": ["1-3 days", "4-6 days", "7-9 days", "10+ days"]
}
```
Query: SELECT DISTINCT trek_state, trek_difficulty, trek_season, trek_suitability, trek_duration FROM cms_pages WHERE page_type = 'trek_guide' AND status = 'published' AND field IS NOT NULL. Group duration into buckets server-side.

### B. Frontend data layer
- `fetchFilterFacets(): Promise<FilterFacets>` — GET /api/v1/treks/filter-facets; graceful fallback to static filterGroups if API unavailable

### C. Frontend — filter logic wired to trek list
Current: `active` filter chips are decorative only — they don't filter `trekList`.
New: `trekList` is filtered by ALL active selections (AND within a group if same group; OR across groups is NOT correct — should be AND across groups):
```javascript
const filtered = useMemo(() => {
  let list = sortTreks(baseList, sortBy);
  // State filter
  const activeStates = active.filter(a => facets.states.includes(a));
  if (activeStates.length) list = list.filter(t => activeStates.includes(t.state));
  // Difficulty filter
  const activeDiffs = active.filter(a => facets.difficulties.includes(a));
  if (activeDiffs.length) list = list.filter(t => activeDiffs.some(d => t.difficulty?.includes(d)));
  // Season filter (bucket → month range matching)
  // Suitability filter
  return list;
}, [baseList, sortBy, active, facets]);
```

### D. Frontend — `filterGroups` rebuilt from facets
Replace the hardcoded `filterGroups` constant with state derived from `fetchFilterFacets()`:
```javascript
const [filterGroups, setFilterGroups] = useState(STATIC_FILTER_GROUPS);
useEffect(() => {
  fetchFilterFacets().then(f => setFilterGroups(buildFilterGroups(f))).catch(() => {});
}, []);
```

### E. URL state for filters (shareable filter links)
Active filters readable from/writable to URL params so filter state is shareable:
- `/explore?state=Uttarakhand&difficulty=Moderate`
- Supports the existing `?state=` param from the region "View all treks in X" link
- Multi-value: `/explore?state=Uttarakhand&state=Himachal+Pradesh`

## New API Endpoint
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/v1/treks/filter-facets` | Public | FilterFacets JSON |

## Files to Create (Backend)
- `services/api/app/api/routes/treks.py` — add `/filter-facets` route to existing treks router

## Files to Modify (Frontend)
- `apps/web-next/lib/api.ts` — add `FilterFacets` interface + `fetchFilterFacets()`
- `apps/web-next/app/(public)/explore/page.tsx` — dynamic filterGroups, wired filter logic, URL state

## Filter Matching Logic

### State
Exact match: `trek.state === activeState`

### Difficulty
Partial match: `trek.difficulty.includes(activeDifficulty)` — handles "Easy–Moderate" matching "Easy" or "Moderate"

### Duration buckets
Parse `trek.duration` to days, then bucket:
- "1-3 days" → 1–3
- "4-6 days" → 4–6
- "7-9 days" → 7–9
- "10+ days" → ≥ 10

### Season
Map season display values to months, then check overlap:
- "Winter (Dec–Feb)" → months 12, 1, 2
- "Spring (Mar–May)" → months 3, 4, 5
- "Summer (Jun–Aug)" → months 6, 7, 8
- "Autumn (Sep–Nov)" → months 9, 10, 11
Parse trek_season string ("Dec – Apr") to month range, check overlap with active season bucket.

### Suitability
Partial match: `trek.suitability?.includes(activeSuitability)` — "Beginners, Intermediate" matches "Beginners"

## Filter AND logic (across groups)
- Multiple selections WITHIN the same group = OR (show treks that match ANY selected state)
- Selections ACROSS groups = AND (a trek must match the state filter AND the difficulty filter)

## Acceptance Criteria
- [ ] Filter facets populated from actual published CMS trek_guide data
- [ ] Selecting "Uttarakhand" shows only Uttarakhand treks
- [ ] Selecting "Uttarakhand" AND "Moderate" shows only Uttarakhand + Moderate treks
- [ ] Active filter chips accurately reflect what's applied
- [ ] Filter count badge on mobile button updates correctly
- [ ] `?state=Uttarakhand` URL param pre-applies state filter (already done in Step 51)
- [ ] All backend tests pass; `next build` clean

## Dependencies
- Step 51 (trek entity wiring + CMS override merge) — done ✅ (trek_state, trek_difficulty etc. now in trek list)
- trek_* columns on cms_pages (migration 0034) — done ✅
- fetchTrekCMSOverrides() returning full entity data — done ✅

## Notes
- Static `filterGroups` constant can remain as fallback when API is unavailable
- Filter chips in the mobile drawer already exist — just need to connect to filter logic
- No DB migration needed — all filter values derive from existing trek_* columns
