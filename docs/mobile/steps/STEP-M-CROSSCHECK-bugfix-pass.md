# Mobile Crosscheck Bugfix Pass (M-DS1–M06)

**Status:** Done ✓ (2026-06-11) — Test Cases pending user confirmation
**Phase:** Foundation
**Dependencies:** STEP-M-DS1, STEP-M03, STEP-M05, STEP-M06

> This pass was implemented and committed (`10ec0ca`) before this step doc existed —
> `MASTER_TRACKER.md` and `IMPLEMENTATION_PLAN.md` already document the "what", but no
> Backend/Frontend Test Cases block was ever delivered. This doc backfills that, per the
> CLAUDE.md Test Case Delivery Standard, so the user can confirm/close it.

---

## Scope

User QA reported 4 bugs after M05+M06:

1. Splash/animations not working.
2. Login appeared to do nothing — no success message, broken UI on splash/onboarding/login.
3. Home screen + bottom nav broken.
4. Tapping a trek-state pill showed a "coming in M03" placeholder despite M03 being implemented.

## Files Modified

| File | Change |
|------|--------|
| `services/api/app/api/routes/treks.py`, `services/api/app/modules/cms/service.py` | NEW `GET /api/v1/treks/seasonal?month=&limit=` endpoint (`get_seasonal_pages`) — mirrors web seasonal-trek season-range matching logic |
| `apps/mobile/app/_layout.tsx` | Added missing `PlayfairDisplay_700Bold`/`PlayfairDisplay_600SemiBold` to `useFonts()`; fixed post-login redirect `router.replace("/(tabs)")` → `router.replace("/(tabs)/(home)")` |
| `apps/mobile/components/tabs/CustomTabBar.tsx` | Fixed `getIconName`/`getLabelText` switch cases `"index"` → `"(home)"`; added `options.href === null` filter so the hidden `downloads` tab no longer renders as a 6th tab |
| `apps/mobile/lib/mobileApi.ts` | Rewired `contentApi` to real backend endpoints (`/cms/pages/trending`, `/treks/seasonal`, `/recommendations`, `/account/recommendations`, `/account/bookmarks/by-slug`) + added `mapCmsPageToTrekListItem`/`mapRecommendationToTrekListItem` |
| `apps/mobile/hooks/useHomeData.ts` | `getAnonymousRecommendations()` no longer passes unsupported `topRegions`/`topDifficulties` params |
| `apps/mobile/app/(tabs)/browse.tsx` | Placeholder text "coming in M03" → "coming in M07" |
| `.claude/skills/mobile-design-system/SKILL.md` (NEW) | Theme tokens, font-loading checklist, tab-bar route-name conventions, API contract discipline |

No `apps/web-next` changes — zero blast radius on production website (desktop + mobile web).

---

## Backend Test Cases — Mobile Crosscheck Bugfix Pass

Run: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/test_treks_seasonal.py -v`

### TC-B01: test_seasonal_treks_matches_month
Verifies: `GET /api/v1/treks/seasonal` (via `get_seasonal_pages`) returns pages whose `season` range covers the requested month, and excludes pages whose season range does not.

### TC-B02: test_seasonal_treks_excludes_pages_without_season
Verifies: published trek pages with no `season` value are excluded from `/api/v1/treks/seasonal` results.

### TC-B03: test_seasonal_treks_wraparound_season
Verifies: a season range that wraps across the calendar year boundary (e.g. "Dec - Apr") correctly matches a query month at the start of the year (month=1).

### TC-B04: test_seasonal_route_does_not_break_slug_route
Verifies: adding the new `/treks/seasonal` route does not shadow or break the existing `/api/v1/treks/{slug}` dynamic route (router registration order check).

### TC-B05: test_seasonal_route_does_not_break_filter_facets
Verifies: `/api/v1/treks/filter-facets` still returns `states`, `difficulties`, `seasons`, `suitabilities`, `durations` after the new route was added.

### TC-B06: test_seasonal_treks_default_month_is_current_month
Verifies: calling `/api/v1/treks/seasonal` with no `month` query param defaults to the current month and returns a list.

### TC-B07: test_seasonal_treks_respects_limit
Verifies: `/api/v1/treks/seasonal?limit=2` returns at most 2 results.

Full suite: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -q` → 637 passed, 1 skipped (2 pre-existing unrelated failures in `test_refresh.py`, confirmed via stash before this pass).

---

## Frontend Test Cases — Mobile Crosscheck Bugfix Pass

Run: `cd apps/mobile && npx expo start` (open in iOS Simulator or Expo Go)

### TC-F01: Splash + fonts render correctly
**Steps:**
1. Force-quit and relaunch the app.
**Expected:** Splash transitions cleanly into the app; Home header and section headings render in the Playfair Display font (not a system-font fallback).
**Pass =** No system-font fallback visible on Home header/section titles.

---

### TC-F02: Sign-in success navigates to Home
**Steps:**
1. On the sign-in screen, enter valid credentials and tap "Sign in".
**Expected:** On success, app navigates to `(tabs)/(home)` (not a blank/dead route).
**Pass =** Home tab renders after a successful sign-in — no "appears to do nothing" hang.

---

### TC-F03: Bottom tab bar — icons, labels, hidden tab
**Steps:**
1. Observe the bottom tab bar from the Home screen.
**Expected:** Home tab shows the correct icon and "Home" label (not `ellipse-outline` / raw `"(home)"` text). Exactly 5 visible tabs (Home/Browse/Plan/Saved/Account) — the hidden `downloads` route does NOT appear as a 6th tab.
**Pass =** 5 correctly-labelled tabs, no stray 6th tab.

---

### TC-F04: Home content sections populate with real data
**Steps:**
1. On the Home tab, check "Trending this month" and "Explore by Region" sections.
**Expected:** Sections show real CMS-backed data (not empty placeholders) — "Trending this month" calls `/cms/pages/trending`, region chips are populated.
**Pass =** Both sections show non-empty, real trek data.

---

### TC-F05: Trek-state pill no longer shows "coming in M03"
**Steps:**
1. From Home, tap a trek-state pill / "Explore by Region" chip that routes to the Browse tab.
**Expected:** Browse screen shows placeholder text "Trek explorer — coming in M07" (not "coming in M03").
**Pass =** Placeholder text reads "M07", not "M03".

---

### TC-F06: Anonymous + personalised recommendations load
**Steps:**
1. As an anonymous user, check the Home recommendations section.
2. Sign in, then check the Home recommendations section again.
**Expected:** Anonymous: `getAnonymousRecommendations()` returns data from `/recommendations` without error (no unsupported-param crash). Signed-in: personalised recs load from `/account/recommendations`.
**Pass =** Both anonymous and signed-in recommendation sections populate without errors.

---

### TC-F07: Save/bookmark a trek from Home
**Steps:**
1. Tap the save/bookmark icon on a trek card from Home (signed in).
**Expected:** Calls `POST /account/bookmarks/by-slug` and the card reflects the saved state.
**Pass =** Save action succeeds, bookmark icon updates.
