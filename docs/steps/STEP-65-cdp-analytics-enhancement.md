# STEP-65 — CDP Analytics Enhancement

**Status:** Done  
**Date Completed:** 2026-05-27  
**Branch:** main

---

## Scope

Enhancement of the CDP analytics layer (Step 64) with five major upgrades:

1. **Dynamic Funnel Builder** — Clevertap/Moengage-style builder: event catalog dropdowns, date range, Unique Users / Total Events toggle, per-step drop-off visualization
2. **Full Retention Heatmap** — N×M color-coded cohort grid (9 weeks × up to 12 cohorts) replacing the old 3-column week1/2/4 table
3. **Expanded Segmentation** — 10 segments (up from 5), each with human-readable `criteria_label` and trend indicator
4. **User Activity Timeline** — email lookup → chronological event history with category filter, pagination, and user profile card
5. **Plan My Trek Stepwise Tracking** — `trackEvent` wired at each of the 6 wizard steps

---

## Files Created

| File | Purpose |
|------|---------|
| `services/api/tests/test_cdp_step65.py` | 13 new tests for Step 65 additions |
| `apps/web-next/app/(admin)/admin/cdp/activity/page.tsx` | User Activity admin page |
| `docs/steps/STEP-65-cdp-analytics-enhancement.md` | This file |

---

## Files Modified

| File | What Changed |
|------|-------------|
| `services/api/app/schemas/cdp.py` | Added `FunnelStepIn`, `DynamicFunnelIn`, `DynamicFunnelStepOut`, `DynamicFunnelOut`, `EventCatalogItem`, `EventCatalogOut`, `CohortRetentionCell`, `CohortHeatmapRow`, `CohortHeatmapOut`, `ActivityItem`, `UserActivityOut` |
| `services/api/app/modules/cdp/service.py` | Replaced `get_funnel`/`get_cohorts`/`get_segments` with new implementations; added `get_event_catalog`, `get_dynamic_funnel`, `get_cohort_heatmap`, `get_user_activity`; expanded SEGMENTS list to 10 |
| `services/api/app/api/routes/cdp.py` | Added `GET /events/catalog`, `POST /funnels/dynamic`, `GET /users/activity`; replaced cohorts route to return heatmap; removed old `GET /funnels/{name}`; fixed static-before-dynamic route ordering for `/users/activity` |
| `services/api/tests/test_cdp.py` | Updated 3 tests to match new schemas (POST funnel, 10 segments, cohort heatmap) |
| `apps/web-next/lib/analytics.ts` | Added `trackPlanWizardStep(step, data?)` helper |
| `apps/web-next/app/(public)/plan/page.tsx` | Added `useEffect` step-tracking hook + `trackPlanWizardCompleted` on submit |
| `apps/web-next/app/(admin)/admin/cdp/funnels/page.tsx` | Full rewrite — dynamic builder UI |
| `apps/web-next/app/(admin)/admin/cdp/cohorts/page.tsx` | Full rewrite — N×M heatmap table |
| `apps/web-next/app/(admin)/admin/cdp/segments/page.tsx` | Rewrite — 10 segments with `criteria_label` |
| `apps/web-next/app/(admin)/admin/layout.tsx` | Added "User Activity" nav link under CDP group |
| `docs/MASTER_TRACKER.md` | Step 65 row added |
| `docs/IMPLEMENTATION_PLAN.md` | Step 65 marked Done |
| `docs/URL_MAP.md` | Added `/admin/cdp/activity`; updated funnels/cohorts entries |
| `docs/DEPENDENCY_MAP.md` | Step 65 section with all files and blast radii |
| `README.md` | Feature matrix, test count (568→581), API surfaces, roadmap row |

---

## No Database Migration

No new tables or columns. All queries run against existing `analytics_events`, `analytics_sessions`, `user_traits`, and `users` tables.

---

## Key Technical Decisions

- **Route order**: `GET /users/activity` registered before `GET /users/{user_id}` because FastAPI's `uuid.UUID` parameter validation raises 422 (not 404) for non-UUID strings, which would shadow the static route if ordered after.
- **Breaking cohort schema**: `GET /admin/cdp/cohorts` response changed from `{rows: [{cohort_week, retained_week1/2/4}]}` to `{rows: [{cohort_week, total_users, retention: [{week, users, pct}]}], max_weeks: 9}`. Frontend and backend shipped together.
- **`pct = -1` sentinel**: Cells for cohort weeks that haven't yet reached a given offset week are returned with `pct: -1` and rendered as "—" in the heatmap (not 0%).
- **No `adminFetch` in CDP pages**: CDP admin pages use plain `fetch("/api/v1/admin/cdp/...", { credentials: "include" })` — there is no `adminFetch` wrapper.
- **Plan wizard tracking via `useEffect`**: Step tracking fires on `[step]` dependency change to avoid double-fire from inline calls in event handlers.

---

## Test Results

```
Backend: 581/581 pass (13 new in test_cdp_step65.py)
Frontend build: next build — zero TypeScript errors
```

---

## Notes

- GitNexus re-index required after this step (new `.py` and `.tsx` files created).
- Two pre-existing flaky tests in `test_refresh.py` fail intermittently due to shared DB state in test ordering; confirmed unrelated to Step 65.
