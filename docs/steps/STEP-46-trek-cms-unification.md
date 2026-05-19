# Step 46 — Trek CMS Unification + Pipeline Quality Fixes

## Status: Done — 2026-05-19 (additional fixes 2026-05-19)

## Summary
A permanent fix for the slug collision issue, trek metadata exposure as first-class DB columns, image agent timing correction, and content quality fixes (flagged_for_review markers bleeding into rendered content).

## Motivation

### 1. Slug Collision (Production Bug)
Pipeline publishes trek guides at slugs like `/trek/kedarkantha-trek` while static stub sits at `/trek/kedarkantha`. Root cause: `_slugify(target_keyword)` where `target_keyword = "Kedarkantha Trek"` → `"kedarkantha-trek"`. Fix: strip trek-genre noise words before slugifying.

### 2. Trek Metadata in CMS (Feature)
User wants State, Trek Name, Difficulty, Duration, Season, Suitability as first-class DB columns on `cms_pages` (not buried inside `content_json.trek_facts`). This enables: filtering in Explore, correct breadcrumbs (Home > State > Trek Name), search type badges, Compare attributes from CMS, Plan My Trek wizard.

### 3. Flagged-for-Review Content Bleed (Bug)
`_strip_flagged_markers()` only matches `"flagged for verification"` and bare `"flagged"`. The LLM also writes `"flagged for review"`, `"flagged – please verify"` etc. These show up in rendered page content. Fix: extend regex patterns.

### 4. Image Agent Timing (Enhancement)
Currently runs post-publish. Should run post-content-writing so the image is associated with the CMS page immediately at publish time (not asynchronously after).

### 5. Search Page Bugs (Step 44 fixes)
- TC-F02: Recent searches not updating when input cleared via X button
- TC-F03: "Did you mean?" not showing for near-miss fuzzy queries
- "fuzzy matched" text visible to users (should be removed)

## Files to Modify (Backend)
- `services/api/alembic/versions/20260519_0034_cms_trek_metadata.py` — NEW migration
- `services/api/app/modules/cms/models.py` — 6 new trek metadata columns
- `services/api/app/modules/cms/service.py` — flagged regex fix + state extraction + populate trek columns at upsert
- `services/api/app/modules/agents/content_writing/agent.py` — slug noise stripping
- `services/api/app/modules/pipeline/service.py` — move image agent to post-content-writing
- `services/api/app/schemas/cms.py` — trek metadata fields in Pydantic response

## Files to Modify (Frontend)
- `apps/web-next/lib/api.ts` — CMSPage interface + trek metadata fields
- `apps/web-next/app/(public)/search/page.tsx` — TC-F02, TC-F03 fixes, remove "fuzzy matched"
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — breadcrumb uses trek_state
- `apps/web-next/app/(admin)/admin/cms/page.tsx` — show trek metadata fields (read-only)

## New DB Columns (migration 0034)
| Column | Type | Notes |
|--------|------|-------|
| `trek_state` | String(100) | e.g. "Uttarakhand" — from base field |
| `trek_name` | String(255) | Canonical trek name e.g. "Kedarkantha" |
| `trek_difficulty` | String(50) | Easy / Moderate / Difficult |
| `trek_duration` | String(100) | e.g. "6 days" |
| `trek_season` | String(200) | e.g. "December to April" |
| `trek_suitability` | String(100) | e.g. "Beginners, intermediate" |

All nullable, only populated for `page_type = "trek_guide"`.

## Slug Fix Logic
```
"Kedarkantha Trek"          → strip "Trek"          → "kedarkantha"
"Hampta Pass Trek"          → strip "Trek"          → "hampta-pass"
"Valley of Flowers trek"    → strip "trek"          → "valley-of-flowers"
"Kedarkantha Complete Guide"→ strip "Complete Guide"→ "kedarkantha"
```
Strip pattern (applied before `_slugify`): trailing `trek | trail | expedition | complete guide | trekking guide | trek guide | trek tips | trek 202X | hike | hiking | trekking | guide | tips`

## URL Structure (unchanged)
`/trek/{slug}` — slug = canonical place name only, no suffixes

## Breadcrumb (updated)
`Home → {trek_state} → {trek_name}` (if trek_state available)
Falls back to `Home → Explore → {trek.state || region}` (existing)

## Post-Ship Fixes (commit 4fa074a + HTTP 500 fix)

### TC-F01 Did you mean? (search page)
- Root cause: `trekFuse` (6-field weighted) compresses scores below 0.05 guard
- Fix: dedicated `didYouMeanFuse` (name-only, threshold 0.55, score guard 0.02)

### Pipeline force_page_type
- Added `force_page_type` to `PipelineRunCreate`, pipeline route, trend_discovery agent, pipeline service, lib/api.ts, admin TriggerForm dropdown
- When set to "trek_guide", LLM comparison topics are filtered/overridden so pipeline always creates a trek guide

### HTTP 500 on Publish — savepoint fix
- Root cause: `**trek_meta` in CMSPage constructor fails when migration 0034 not applied on production DB
- Fix: `_apply_trek_meta()` helper wraps trek column writes in a nested savepoint; publish succeeds with or without migration 0034 applied
- **Production action required**: run `alembic upgrade head` on production to apply migrations 0031–0034 and start populating trek metadata columns

## Acceptance Criteria
- [ ] New pipeline run for Kedarkantha publishes at `/trek/kedarkantha` (not `/trek/kedarkantha-trek`)
- [ ] `cms_pages.trek_state`, `trek_name`, `trek_difficulty`, `trek_duration`, `trek_season`, `trek_suitability` populated at publish
- [ ] Rendered trek page content contains zero "(flagged for review)" markers
- [ ] Image agent runs after content_writing stage and stores URL in draft
- [ ] Search page recent searches update when X button is clicked
- [ ] "Did you mean?" appears for typos like "kederkantha"
- [ ] All backend tests pass; next build passes
