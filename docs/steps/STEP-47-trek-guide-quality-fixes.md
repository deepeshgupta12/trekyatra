# Step 47 — Trek Guide Quality Fixes

## Status: Done — 2026-05-19

## Summary
Four targeted quality fixes to the trek guide system identified from production testing.

## Issues Fixed

### 1. "In this cluster" sidebar showing editorial/policy pages
**Root cause:** `_page_type_from_cms()` defaulted unknown page types to `"trek_guide"`. Editorial pages (methodology, terms, privacy, affiliate, contact) have `page_type = "editorial"` which is not in the explicit mapping, so they were synced into the linking graph as trek guides. The "In this cluster" sidebar then showed these as "related content".

**Fix:**
- Added `_EXCLUDED_FROM_LINKING` frozenset: `{editorial, regional_hub, seasonal_hub, cluster_hub, region_listing, premium_compendium}`
- `sync_pages_from_cms()` now filters these types from the SQL query AND has a safety guard loop
- `get_related_pages()` now restricts results to `safe_types` (trek_guide, packing_list, permit_guide, beginner_guide, comparison, seasonal)
- Added more page types to the explicit `_page_type_from_cms()` mapping (beginner_roundup, cost_guide, gear_guide, itinerary, safety_guide, expert_guide)

**Files:** `services/api/app/modules/linking/service.py`

### 2. Permits and Base blank on public trek page
**Root cause 1:** `_FACT_TABLE` pattern for `base` only matched `**Base**`, `**Start**`, `**Trailhead**`, `**Last Village**` — NOT `**Nearest Base**` which the LLM commonly generates.

**Root cause 2:** `_FACT_KV` pattern for `base` required "village/camp/town" suffix after "base" — missed plain `**Base:** Sankri`.

**Root cause 3:** `_FACT_KV` permits value capture limit was 80 chars — too short for verbose permit descriptions.

**Fix:**
- `_FACT_TABLE` base: added `Nearest`, `Starting`, `Base Village`, `Base Camp` as header prefix options
- `_FACT_KV` base: `base` alone (without village/camp suffix) now matches
- `_FACT_KV` permits: value capture increased from 80 → 150 chars
- Season table pattern: made "Best" prefix optional

**Files:** `services/api/app/modules/cms/service.py`

### 3. Trek metadata DB columns (trek_state, trek_name, etc.) not visible in CMS admin
**Root cause:** `CMSPageForm` only showed `content_json.trek_facts` fields (duration, altitude, difficulty, season, permits, base). The 6 new Step 46 DB columns (`trek_name`, `trek_state`, `trek_difficulty`, `trek_duration`, `trek_season`, `trek_suitability`) were not surfaced in the admin.

**Fix:** Added a "Trek metadata (pipeline-generated)" read-only section above the Trek facts strip in `CMSPageForm`. Shows all 6 columns with a visual indicator if empty ("not set"). Only shows for `page_type = "trek_guide"`.

**Files:** `apps/web-next/components/admin/CMSPageForm.tsx`

### 4. Quick Utilities links not trek-specific
**Root cause:** The sidebar links for Packing, Permits, Cost pointed to generic hubs (`/packing`, `/permits`, `/costs`) rather than trek-specific content.

**Fix:**
- Updated Quick Utilities to link to `/trek/[slug]/packing`, `/trek/[slug]/permits`, `/trek/[slug]/costs`
- Created three new Next.js pages under `apps/web-next/app/(public)/trek/[slug]/`:
  - `packing/page.tsx` — searches for CMS packing_list page at `{slug}-packing-list` / `{slug}-packing`
  - `permits/page.tsx` — searches for CMS permit_guide at `{slug}-permit-guide` / `{slug}-permits`
  - `costs/page.tsx` — searches for CMS cost_guide at `{slug}-cost-guide` / `{slug}-costs`
- All three pages: 404 if no trek-specific page exists; render breadcrumb `Home → Trek Name → Guide Type`
- URL_MAP.md updated with the three new URL patterns

**Files:**
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` (Quick Utilities links updated)
- `apps/web-next/app/(public)/trek/[slug]/packing/page.tsx` (NEW)
- `apps/web-next/app/(public)/trek/[slug]/permits/page.tsx` (NEW)
- `apps/web-next/app/(public)/trek/[slug]/costs/page.tsx` (NEW)
- `docs/URL_MAP.md` (3 new URL patterns added)

## Production actions after deploying this commit
1. **Run linking sync**: go to `/admin/linking` → click "Sync from CMS". This re-syncs the `pages` table excluding editorial page types, so the "In this cluster" sidebar will show only trek-related content.
2. **Re-parse or re-publish Kedarkantha**: click "Re-parse sections" in the CMS edit page to re-extract permits and base from the stored draft with the improved regex.
