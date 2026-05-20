# Step 51 — Trek Entity Wiring + Explore/Regions Fixes

## Status: Done — 2026-05-20

## Summary
Wire CMS trek_* metadata columns fully into trek cards (entity wiring). Fix regions page duplication. Add functional sort to explore page. Add state pre-filter from URL. Create state-specific sitemaps.

## Issues Fixed

### A. Regions page — trek duplication
`.concat(treks)` appended ALL static treks after the filtered state treks → 6 cards showed duplicates.
Fix: remove `.concat(treks)`.

### B. Regions page — "View all" link
Change to "View all treks in {state_name}" linking to `/explore?state={state}`.

### C. Trek card entity wiring from CMS
`fetchTrekCMSOverrides()` previously returned only `{image, title}`. Must extend to return:
- `difficulty` (from trek_difficulty column)
- `duration` (from trek_duration column)
- `season` (from trek_season column)
- `suitability` (from trek_suitability column)
- `altitude` (from content_json.trek_facts.altitude)

### D. Trek type + TrekCard updates
- Add `suitability?: string` to Trek type
- Handle extended difficulty values ("Easy–Moderate", "Moderate–Difficult" etc.) in diffColors
- Show BEGINNER badge when suitability contains "Beginners"

### E. Explore page — functional sort
Add sort state wired to the select:
- Featured (default order)
- Difficulty (low → high) — tiebreak: duration, altitude
- Duration (short → long) — tiebreak: difficulty, altitude
- Altitude (low → high) — tiebreak: difficulty, duration

### F. Explore page — `?state=` URL pre-filter
Read `?state=Uttarakhand` from URL, apply as filter, show state name in filter chips.

### G. State-specific sitemaps
Create route handlers:
- `/uttarakhand-treks-sitemap.xml`
- `/himachal-treks-sitemap.xml`
- `/kashmir-treks-sitemap.xml`
- `/ladakh-treks-sitemap.xml`
- `/maharashtra-treks-sitemap.xml`
- `/sikkim-treks-sitemap.xml`
- `/karnataka-treks-sitemap.xml`
Plus update sitemap.ts to reference these.

## Deferred
- Dynamic filters (explicit user request to defer to later step)
- Season chart improvement (regions page)
