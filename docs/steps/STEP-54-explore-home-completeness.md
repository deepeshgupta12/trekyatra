# Step 54 — Explore + Home Page Completeness

## Status: Done — 2026-05-21

## Issues Fixed

### 1. Home trending — popularity-ranked from CMS (views + saves + recency)
**Root cause:** `trending = trekList.slice(0, 4)` uses static data order.
**Fix:** New backend `GET /api/v1/cms/pages/trending` endpoint — ranks published trek_guide pages by: (page_views last 30d × 0.5) + (bookmark count × 0.3) + (recency score × 0.2). Frontend fetches and uses these for the trending section.

### 2. Explore page: all CMS treks in baseList (not just 12 static)
**Root cause:** `baseList` built from `fetchTreks()` which returns 12 static entries. Filters applied to this list, so Uttarakhand shows only 3 static treks.
**Fix:** `fetchAllCMSTreks()` — fetches ALL published trek_guide CMS pages and converts to Trek objects. Merges with static treks (de-duped by slug, CMS priority). Explore page uses this as baseList.

### 3. Explore page: is_featured flag + "Featured" sort
**Root cause:** No `is_featured` column on cms_pages; "Featured" sort just preserves insertion order.
**Fix:**
- Migration 0035: `is_featured BOOLEAN DEFAULT FALSE` on cms_pages
- CMSPagePatch + CMSPageResponse: expose `is_featured`
- CMSPageForm: checkbox for is_featured (Trek Guide pages only)
- "Featured" sort: `is_featured=true` first, then published_at desc

### 4. Explore page: remove hardcoded sections + empty state + pagination
**Root cause:** 3 hardcoded rail sections ("Best winter treks…", "Weekend treks near Mumbai…", "Beginner Himalayan treks") repeat the same trekList cards. No "no results" state. No pagination.
**Fix:**
- Remove the 3 hardcoded sections (will be wired as CMS interlinking content later)
- Add empty state when trekList.length === 0: "No treks match your filters. Try removing some filters."
- Pagination: show 12 per page with "Load more" button

### 5. SeasonalTreksSection: CMS data + season matching
**Root cause:** `SeasonalTreksSection` receives static `treks` prop; `trekMatchesSeason` checks trek.season string for 3-letter month abbreviations which may not match CMS values like "Dec – Apr".
**Fix:** Pass CMS pages to SeasonalTreksSection; use improved season matching that handles "Dec – Apr" style ranges and maps to months correctly.

## Files to Create/Modify (Backend)
- `services/api/alembic/versions/20260521_0035_cms_is_featured.py` — NEW migration
- `services/api/app/modules/cms/models.py` — is_featured column
- `services/api/app/schemas/cms.py` — is_featured in patch + response
- `services/api/app/api/routes/cms.py` — GET /cms/pages/trending endpoint

## Files to Modify (Frontend)
- `apps/web-next/lib/api.ts` — fetchAllCMSTreks(), fetchTrendingTreks()
- `apps/web-next/app/(public)/explore/page.tsx` — full baseList from CMS, pagination, empty state, remove hardcoded sections
- `apps/web-next/app/(public)/page.tsx` — use trending API for trending section
- `apps/web-next/components/home/SeasonalTreksSection.tsx` — CMS data + improved season matching
- `apps/web-next/components/admin/CMSPageForm.tsx` — is_featured checkbox
