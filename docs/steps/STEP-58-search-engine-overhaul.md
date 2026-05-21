# Step 58 — Search Engine Overhaul

## Status: Done — 2026-05-21

## Root Causes Fixed

### 1. Trending shows junk partial queries ("uttr")
`get_trending_queries` had no minimum length or count filter. Partial keystrokes
like "uttr" were logged when users clicked results mid-typing, then appeared in trending.
**Fix:** Added `LENGTH(TRIM(query)) >= 3 AND HAVING COUNT(*) >= 2` filter.

### 2. CMS-published treks not searchable ("Phulara Ridge Trek" → No matches)
`trekFuse` was a MODULE-LEVEL constant built from 12 static `treks.ts` entries.
CMS-published treks (100+ from pipeline) were never in the index.
**Fix:** Dynamic Fuse rebuilt from merged static + CMS data after async load.

### 3. Semantic queries fail ("Summer treks", "Beginner treks", "March treks")
Fuse.js fields were: name, region, state, season, difficulty, description.
- "Summer" ≠ "May – Jun" (no text match for season names)
- "Beginner" ≠ "Easy" or "Beginners, Intermediate"
- "March" ≠ "Dec – Apr"
**Fix:** Added computed `tags` field to each trek with season names (Winter/Summer/Monsoon/
Autumn), month names (January–December), difficulty labels (beginner/moderate/challenging),
and state synonyms. Tags are included as a Fuse.js key with weight 2.5.

## Files Modified
- `services/api/app/modules/search/service.py` — get_trending_queries filter
- `apps/web-next/app/(public)/search/page.tsx` — dynamic Fuse + tags + all CMS treks
