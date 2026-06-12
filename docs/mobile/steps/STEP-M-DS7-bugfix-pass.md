# STEP-M-DS7 — QA Bugfix Pass: Tab Bar, Back Button, Trek Content Rendering, Home Hero

**Status:** Done ✓ (2026-06-12)
**Phase:** Foundation
**Dependencies:** STEP-M05 (Trek Detail Screen), STEP-M06 (Home Screen), STEP-M-DS6 (Splash→Onboarding Transition + Skip CTA)

> Numbered `M-DS7` — same "cross-cutting polish/bugfix pass" family as `M-DS1`-`M-DS6`. QA on M-DS6 surfaced 4 bugs (screenshot of Trek Detail + Home screens), fixed here.

---

## Scope

1. **Bottom tab bar ghost "downloads" tab** (`CustomTabBar.tsx`):
   - The `options.href === null` filter alone was not excluding the hidden `downloads` route from the rendered tab bar, causing a 6th hollow-circle "downloads" tab near the center FAB.
   - Added an explicit `if (route.name === "downloads") return null;` guard alongside the existing `href === null` check.

2. **"< index" back button** (`(home)/_layout.tsx`):
   - The Home stack's `index` screen has no `title`, so the back button label from `trek/[slug]`/`guide/[slug]` fell back to the route name "index".
   - Added `headerBackButtonDisplayMode: "minimal"` to the Stack's top-level `screenOptions` — removes all back-button text labels app-wide in this stack (icon-only chevron), matching the Airbnb/Cred icon-only back-button convention. `trek/[slug]`/`guide/[slug]` already use `headerTransparent: true` + `headerTintColor: "#ffffff"`, so the chevron renders in white over the hero image with no further header changes.

3. **Trek detail Guide/Packing/Permits/Costs tabs empty** (`trek/[slug].tsx`, `mobileApi.ts`, new `HtmlContentRenderer.tsx`):
   - **Root cause**: the mobile screen expected `body_json: Block[]` for all 4 tabs, but the backend CMS never populates `body_json` — it returns `content_html` (full rendered article HTML, ~27KB) and `content_json.sections` (a dict of per-section HTML fragments, observed keys: `why_this_trek`, `route_overview`, `itinerary`, `best_time`, `difficulty`, `permits`, `cost_estimate`, `packing`, `safety`). Additionally, the screen fetched `${slug}-packing`, `${slug}-permits`, `${slug}-costs` as separate CMS pages — these slugs do not exist in the CMS (confirmed 404 on all three in production) and were dead code.
   - Added `react-native-render-html` dependency.
   - New `apps/mobile/components/cms/HtmlContentRenderer.tsx` — wraps `RenderHTML`, styled via `tagsStyles` using TrekYatra theme tokens from `useTheme()`: `h1`-`h4` → PlayfairDisplay, `p`/`li`/`td`/`th` → Inter, `a` → saffron accent (underlined), `blockquote` → saffron left border + italic, `table`/`th`/`td` → theme-bordered.
   - `apps/mobile/lib/mobileApi.ts` — `CMSPage` interface gains `content_html: string` and `content_json: { sections?: Record<string, string>; [key: string]: unknown } | null` (additive).
   - `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx`:
     - Removed the dead `useTrekDetail(${slug}-packing/-permits/-costs)` calls (always 404).
     - `getTabContent()` now only returns `trek.body_json` for the Guide tab (future-proofing if the backend ever populates it).
     - New `getTabHtml()`: Guide tab → full `trek.content_html`; Packing/Permits/Costs tabs → `trek.content_json.sections.{packing,permits,cost_estimate}` respectively.
     - Render order: `body_json` (Block[]) via `CMSContentRenderer` → else `content_html`/section fragment via `HtmlContentRenderer` → else the existing "No {tab} guide available yet" empty state (preserved for pages genuinely missing a section).
   - `apps/mobile/hooks/useTrekDetail.ts` — `mapDbToPage` (offline SQLite fallback) sets `content_html: ""` and `content_json: null`, since these fields are not persisted to SQLite (no schema columns). Offline-cached trek pages will show the empty state for Guide/Packing/Permits/Costs — same known limitation as `body_json` previously.

4. **Home screen hero + search bar** (`(home)/index.tsx`, new `HomeHero.tsx`/`HomeSearchBar.tsx`):
   - New `apps/mobile/components/home/HomeHero.tsx` — full-width 200px banner using `assets/onboarding-1.jpg`, pine-tinted gradient overlay (`rgba(13,20,16,...)`, matching `TrekHero`'s gradient pattern), "TrekYatra" wordmark (PlayfairDisplay) + tagline.
   - New `apps/mobile/components/home/HomeSearchBar.tsx` — tappable rounded-pill search bar (not an editable input on Home — Airbnb/Cred pattern), saffron search icon, overlaps the hero's bottom edge via negative margin, navigates to `/(tabs)/browse/search` (the M07a search screen).
   - `apps/mobile/app/(tabs)/(home)/index.tsx` — replaced the old plain-text `HomeHeader` (rendered in both the skeleton-loading state and the loaded state) with `<HomeHero />` + `<HomeSearchBar />`; removed the now-unused `HomeHeader` function and its styles, and the now-unused `Text` import / `colors` destructure.

### Decisions
- No `@gorhom/bottom-sheet` or other new heavy dependencies — only `react-native-render-html` added (peer `react-native-svg` already present).
- `content_html`/`content_json` are **not** added to the offline SQLite schema in this step — would require a drizzle migration, not requested. Offline trek-detail content falls back to the empty state, same as the pre-existing `body_json` behavior.
- Home search bar destination `/(tabs)/browse/search` is built in the immediately-following STEP-M07a.
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/mobile/components/cms/HtmlContentRenderer.tsx` | Theme-styled `RenderHTML` wrapper for `content_html`/section-fragment rendering |
| `apps/mobile/components/home/HomeHero.tsx` | Home screen hero banner |
| `apps/mobile/components/home/HomeSearchBar.tsx` | Home screen tappable search pill |

## Files Modified

| File | Change |
|------|--------|
| `apps/mobile/package.json` | New dependency `react-native-render-html` |
| `apps/mobile/components/tabs/CustomTabBar.tsx` | Added `route.name === "downloads"` filter to remove ghost tab |
| `apps/mobile/app/(tabs)/(home)/_layout.tsx` | Added `headerBackButtonDisplayMode: "minimal"` to Stack `screenOptions` |
| `apps/mobile/lib/mobileApi.ts` | `CMSPage` gains `content_html`/`content_json` fields |
| `apps/mobile/hooks/useTrekDetail.ts` | `mapDbToPage` sets defaults for new `CMSPage` fields |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Removed dead sub-page fetches; new `getTabHtml()`; renders `HtmlContentRenderer` for Guide/Packing/Permits/Costs |
| `apps/mobile/app/(tabs)/(home)/index.tsx` | Replaced `HomeHeader` with `HomeHero` + `HomeSearchBar` |

---

## Notes

- `cd apps/mobile && npx tsc --noEmit`: 0 errors.
- `gitnexus_impact` upstream on `CustomTabBar`, `CMSContentRenderer`, `useTrekDetail`: all LOW risk (0–1 impacted; `useTrekDetail` → `TrekDetailScreen` only, expected).
- `gitnexus_detect_changes(scope:"all")`: 11 changed symbols / 10 affected / 9 changed files — all within the files listed above (plus a pre-existing unrelated `CLAUDE.md` touch from before this step).
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Backend Test Cases — STEP-M-DS7

No backend files changed — no new backend tests.

---

## Frontend Test Cases — STEP-M-DS7

Run: mobile app on simulator/device (`cd apps/mobile && npx expo start`).

### TC-M-DS7-F01: Bottom tab bar shows exactly 5 tabs
Steps:
1. Open the app to any tab screen.
Expected: tab bar shows Home, Explore, the saffron Plan FAB, Saved, You — no 6th hollow-circle "downloads" tab.
Pass = exactly 5 tab items (4 regular + 1 center FAB) visible, no extra ghost tab.

### TC-M-DS7-F02: Trek detail back button shows clean chevron
Steps:
1. From Home, tap into any trek (e.g. Kashmir Great Lakes Trek).
2. Look at the top-left of the screen, over the hero image.
Expected: a plain white back chevron (←), no "index" or any other text label next to it.
Pass = back button is icon-only; tapping it returns to Home.

### TC-M-DS7-F03: Trek detail Guide/Packing/Permits/Costs tabs show real content
Steps:
1. On the Kashmir Great Lakes Trek detail screen, view the "Guide" tab.
Expected: full article content renders (headings, paragraphs, etc.) — not "No guide guide available yet".
2. Tap "Packing" tab.
Expected: packing-list section content renders.
3. Tap "Permits" tab.
Expected: permits section content renders.
4. Tap "Costs" tab.
Expected: cost-estimate section content renders.
Pass = all 4 tabs show real HTML content styled with TrekYatra fonts/colors (PlayfairDisplay headings, Inter body, saffron links); no empty-state placeholder for treks that have CMS content.

### TC-M-DS7-F04: Home screen hero + search bar
Steps:
1. Open the Home tab (cold start or via tab bar).
Expected: a full-width hero banner with a mountain photo, pine gradient overlay, "TrekYatra" wordmark and tagline; directly below, a rounded search-bar pill reading "Search treks, regions, seasons…" with a saffron search icon, slightly overlapping the hero's bottom edge.
2. Tap the search bar.
Expected: navigates toward the Browse/Search screen (built in STEP-M07a — if not yet implemented at test time, this will show a "not found" route; re-test after M07a).
Pass = hero + search bar render correctly above all existing Home sections (trending, regions, etc.), in both the loading-skeleton and loaded states.

### TC-M-DS7-F05: Empty-state fallback preserved
Steps:
1. Find a trek (or CMS page) whose `content_json.sections` lacks a `permits` or `cost_estimate` key (if any exist).
Expected: that tab still shows the original "No {tab} guide available yet" empty state — no crash, no blank screen.
Pass = empty state renders gracefully when a section fragment is genuinely absent.
