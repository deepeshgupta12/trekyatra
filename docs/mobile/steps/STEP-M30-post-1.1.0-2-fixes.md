# STEP-M30 — v1.1 Post-Build Fixes #2 (1.1.0 (2) device test)

**Status:** Issues recorded + **owner-confirmed 2026-07-31**. Implementing in priority order.
This is the MASTER tracker for the second round of redesign fixes.

### Owner decisions (2026-07-31)
- **N08/N09 gallery source:** hero image + route-map image + user trip-report photos (NO new CMS
  field — build from images we already have).
- **N12 news detail:** fix the header + **port the mobile-web `/news/[slug]` layout** (full parity).
- **Go-ahead:** implement N01–N13 now, in the recorded priority order.
**Blocking:** App Store review submission is BLOCKED until every item below is resolved.
**Source:** Owner device-test of `1.1.0 (2)` — 5 screenshots + a **design-inspiration** reference
(Ama Dablam first-fold). Follows the process (read dependent MD files, gitnexus impact per symbol
BEFORE editing, tsc + both-platform, MD updates, regression re-check).

## ⚠️ Regression-safety principle (applies to EVERY fix — same as M29)
Each incremental fix/enhancement MUST NOT break current UI, existing implementations, features,
functionality, or between-screen navigation. Before each commit: gitnexus impact on touched
symbols; confirm the change is additive/scoped; re-check navigations. Smallest change that resolves
the defect.

---

## 🎯 DESIGN INSPIRATION — Trek-detail first fold (screenshot 5: "Ama Dablam Trek")
> The owner has flagged **repeatedly** that this reference is being ignored. It is a first-class
> contract for the trek-detail first fold. The current build must be reworked to match it.

The reference first fold (top to the fold) is:
1. **Full-bleed hero image** with three frosted circular controls top row: back (left), share +
   overflow/more (right). Rating pill "★ 4.8" bottom-left over the image, then a large serif
   **title** ("Ama Dablam Trek") and a thin **route subtitle** ("Namche Bazaar → Lukla").
2. A **white rounded card that OVERLAPS the bottom of the hero** (card slides up over the image),
   containing two columns:
   - **Left:** a "Long Trek Route / <trek name>" label with a small **route-map thumbnail** (rounded,
     with route pins). This whole block is tappable → opens the map.
   - **Right:** a compact **vertical metadata list**, one row per fact, each with a leading icon:
     e.g. "Length 418.6", "Elev. gain 836m", "Difficulty 5h30m". (For TrekYatra these map to our
     real fields — Duration, Max altitude, Difficulty, Best season, etc. — NOT length/gain which we
     don't have; use OUR metadata, same visual treatment.)
3. Below the route+metadata row: **two media cards side by side** — "Preview" and **"Photo tour"**,
   each a rounded image tile with a circular ▶/play affordance.
4. Bottom action row: two buttons ("Download", "Map" in the ref). For TrekYatra keep OUR existing
   sticky actions (Plan / Save / Compare) — do NOT copy Download; adopt only the VISUAL treatment
   and the card/metadata composition of the first fold.

**Intent:** the first fold should read as a premium "overlapping card" composition with the route
thumbnail beside a clean metadata list and the media (photo tour) tiles — matching the reference's
hierarchy and polish. This supersedes the current M29 summary-card layout where it conflicts.

---

## HOME  (owner issue 1, 2)

- **N01** — **Remove the quick-filter chips** (Difficulty / Duration / Season) that sit below the
  Home search bar. They act as filters and the owner wants them gone entirely. (These were added
  behaviour in M29 D03/D04 — now to be removed, along with `QuickFilterChips` usage on Home.)
- **N02** — **"Recently viewed" must use the SAME trek card** component used by the other Home
  sections (visual consistency), and each card must show **last-viewed date** AND **last-updated
  date**.
- **N03** — **"Recently viewed" must render ABOVE the "Continue exploring"** section for **repeat
  users** (state D), per the full personalization logic already implemented (STEP-M28 matrix). Verify
  ordering for every state.

---

## EXPLORE  (owner issue 3)

- **N04** — **Move Categories, "Explore by Region", and "Best by Season" INTO the Filters sheet
  only** — remove them from the main Explore body. (They currently render outside the sheet and the
  owner reports the filters are "still not working properly" — root-cause the filter application too.)
- **N05** — **No-results UX + similar treks.** When the applied filters return no treks: show a
  **well-designed "No results found for the applied filters" message FIRST**, then below it a
  **"Similar treks" section** built from the applied filters (relax/loosen the filter criteria) —
  **similarity logic to be implemented** (e.g. drop the least-specific filter, or match on a subset
  of the selected facets).

---

## TREK DETAIL  (owner issue 4 — screenshots 1, 3, 5)

- **N06** — **First-fold UI must match the Ama Dablam reference (screenshot 5)** — see the DESIGN
  INSPIRATION section above. Rework `TrekHero` + `TrekSummaryCard` (overlapping card, route
  thumbnail beside a metadata list, Photo-tour tile with play affordance). **HIGH priority / owner
  repeatedly flagged.**
- **N07** — **Metadata table must show ALL tagged CMS trek entities**, not just Duration +
  Difficulty (screenshot 1 shows only 2). Include the **backfill CMS trek-data** (fields set under
  `https://www.trekyatra.co.in/admin/trek-data`) AND the **Master CMS Trek Metadata**. Available
  first-class columns on `CMSPage` include: `trek_state`, `trek_region`, `trek_difficulty`,
  `trek_duration`, `trek_duration_days_min/max`, `trek_season`, `trek_suitability`,
  `trek_max_altitude_ft`, `trek_best_months`, `trek_open_months`, `trek_avoid_months`,
  `trek_permit_required`, `trek_permit_notes`, `trek_budget_min/max`, `trek_themes`,
  `trek_crowd_level`, `trek_beginner_friendly`, `trek_solo_friendly`, `trek_family_friendly`,
  `trek_operator_available`. Render whichever are populated (hide nulls) in a clean facts table.
  → Needs backend response-schema check: `mobileApi` trek-detail shape must expose these fields.
- **N08** — **Photo Tour must open a PHOTO GALLERY**, not the Conditions tab. Currently
  `handleOpenPhotos` → `setActiveTab("reports")` (Trail Conditions) which is wrong. **Implement a
  trek-detail photo gallery** (trek images) and open it on Photo-tour tap.
- **N09** — **Trail Route Map image → open in the gallery/zoom view** on tap (image viewer), rather
  than only switching the guide tab.
- **N10** — **Trek News section (trek detail) must NOT show thumbnail images** — news images are not
  available (screenshot 3 shows empty grey placeholders). Make `TrekNewsSection` text-only cards.

---

## NEWS DETAIL  (owner issue 5 — screenshot 2)

- **N11** — **News detail header shows the literal `news/[slug]`** (the route pattern) instead of a
  real title, and there is a **large empty white gap at the top** (broken layout). Root cause: the
  `news/[slug]` screen is not registered with a proper title/`headerShown:false` in the `(home)`
  Stack, so it falls back to the route name. Fix the header (real title or hidden custom header) and
  the top layout.
- **N12** — **News detail page UI should match the Mobile-web news detail design** (parity with the
  web `/news/[slug]` layout).

---

## HAMBURGER MENU  (owner issue 6 — screenshot 4)

- **N13** — **Redesign the drawer/hamburger menu UI** (`AppDrawer`) — currently plain; needs a
  better-quality, brand-consistent treatment.

---

## Summary count
6 owner issues → **13 tracked items (N01–N13)** across Home (3), Explore (2), Trek detail (5),
News detail (2), Hamburger (1). Plus the trek-detail **first-fold design contract** (screenshot 5).

## Proposed fix priority (functional/high-visibility first)
1. **Trek detail** — N06 (first-fold to match reference), N07 (full metadata), N08 (photo gallery),
   N09 (map image → gallery), N10 (news thumbnails off). Highest owner emphasis.
2. **Explore** — N04 (move sections into Filters, fix filter application), N05 (no-results + similar).
3. **Home** — N01 (remove quick chips), N02/N03 (recently-viewed card + ordering).
4. **News detail** — N11 (header/layout), N12 (web parity).
5. **Hamburger** — N13 (drawer redesign).

Each group = its own commit (gitnexus impact + tsc + regression re-check + MD update). Then rebuild
`1.1.0 (3)`.

## Progress (checked off as landed)

### Trek detail group (landed)
- ✅ **N10** — `TrekNewsSection` is now **text-only** (eyebrow + title + date) — removed the
  `hero_image_url` thumbnail/placeholder (news images unavailable → empty grey boxes).
- ✅ **N07** — Full Master-CMS trek metadata.
  - Backend (additive/optional, web ignores extra fields): added `trek_region`,
    `trek_max_altitude_ft`, `trek_duration_days_min/max`, `trek_best_months`, `trek_open_months`,
    `trek_avoid_months`, `trek_permit_notes`, `trek_budget_min/max`, `trek_themes`,
    `trek_crowd_level`, `trek_beginner/solo/family_friendly`, `trek_operator_available` to
    `CMSPageResponse` (schemas/cms.py). Test `test_get_page_returns_master_cms_trek_metadata`.
  - Mobile: extended `CMSPage` type; new `TrekFactsTable` component renders **every populated**
    field (nulls hidden), formatting months/budget(₹)/booleans. Shown in the guide tab.
- ✅ **N08** — New `TrekGallery` full-screen viewer (paging + pinch-zoom). Images = hero +
  route-map + trip-report photos (`reports.items[].media[].url`). The Photo-tour tile opens it.
- ✅ **N09** — The summary "Trail Route" thumbnail AND the lower `TrekRouteMap` image now open the
  gallery at the route image (expand affordance added).
- ✅ **N06** — `TrekSummaryCard` reworked to the **Ama Dablam reference** first fold: route
  thumbnail on the left beside a compact metadata list (Duration / Max altitude / Difficulty /
  Best season) on the right, then a full-width Photo-tour tile with a play affordance. Uses OUR
  real fields (incl. `trek_max_altitude_ft`, previously the altitude stat was blank because the
  API never returned it). Sticky Plan/Save/Compare bar unchanged.
- tsc clean; backend cms+treks+unification 85/85.

### Explore group (landed)
- ✅ **N04** — Removed the **Categories**, **Explore-by-Region**, and **Best-by-Season** sections
  from the Explore body. Those dimensions (region/season/difficulty + suitability/duration) already
  exist as sections inside the **Filters sheet**, which is now the single filtering surface — so the
  confusing "outside" chips (which navigated to separate region/season screens instead of filtering
  the grid in place — the "filters not working" complaint) are gone. Explore body is now:
  title → search → Filters → Nearby → All Treks grid. `CategoryRow` is now unused (left in place).
  **Judgment call flagged:** the curated category labels (Himalayan/Sahyadri/…) were lossy shortcuts
  (e.g. "Himalayan" spans many states) — not re-added as sheet chips; the underlying facets cover them.
- ✅ **N05** — No-results UX + similar treks. When applied filters return nothing, Explore shows a
  designed empty state (icon + "No treks match your filters" + "Clear all filters") **then** a
  **"Similar treks"** grid. Similarity = relax the filters: keep only the primary facet
  (region→difficulty→season→suitability), or broaden to all treks when a single filter yielded
  nothing. Added `useExplore(filters, { enabled })` + `TrekGrid renderEmpty` override.
- tsc clean.

### Home group (landed)
- ✅ **N01** — Removed the Difficulty/Duration/Season **quick-filter chips** from the Home header
  (`HomeHeroV2` no longer renders `QuickFilterChips`; `FILTER_CHIPS` + imports removed).
- ✅ **N02** — "Recently viewed" now uses the **same `TrekCard`** as other Home sections, with a
  caption **Viewed <date> · Updated <date>**. New `useRecentlyViewed` hook hydrates the viewed slugs
  into full trek cards (fetches each trek's CMS page for title/image/`updated_at`, cached per slug)
  and carries the local viewed-at `ts`.
- ✅ **N03** — "Recently viewed" now renders **above** the personalised "Continue exploring" feed for
  repeat users (states B + D), per the personalization state machine; removed the old state-D-only
  placement lower down.
- tsc clean.
