# STEP-M-DS3 — Home Screen Web-Parity + Content Hub Screens

**Status:** Done ✓ (2026-06-12)
**Phase:** Foundation
**Dependencies:** STEP-M-DS1 (design system), STEP-M06 (Home screen + 4-state personalisation), STEP-M-DS2 (splash/onboarding polish)

> Note: numbered `M-DS3` (not `M09`) because `STEP-M09-plan-my-trek-wizard.md` is already
> reserved in the roadmap for the full "Plan My Trek" wizard feature step. This is a
> cross-cutting Home-screen parity + content-hub pass, in the same family as `M-DS1`/`M-DS2`.

---

## Scope

QA found the mobile Home screen (`apps/mobile/app/(tabs)/(home)/index.tsx`) was missing most of the sections present on the production web home page (`apps/web-next/app/(public)/page.tsx`). This step:

1. Brings the mobile Home screen to full section parity with web, in the same order.
2. Builds the content-hub destination screens those new sections link to (Packing, Permits, Costs, Safety, Beginner, Plan My Trek, Compare, Resources/Products, Operators) — none of these existed in the mobile app before this step.
3. Bundles a backend fix (per user decision) so recommendation-sourced trek cards on Home show difficulty/region/duration/season tags — previously hardcoded to `null` because `RecommendationItem` and `mapRecommendationToTrekListItem` did not carry that metadata.

**Zero blast radius on `apps/web-next`** — backend change is additive (4 new optional response fields on `RecommendationItem`); no existing endpoint contract changed. No `apps/web-next` files were touched.

### Decisions

- New Home section order mirrors web: `HomeWelcomeBanner` (A/B) → `HomeTrendingSection` → `CategoryHubRow` → `RegionsRow` → `DifficultyTabsSection` → `EditorialFeatureCard` → `SeasonalPicksRow` → `RecentlyViewedRow` (D) → `PersonalisedFeedSection` (A/B/D) → `ComparisonCTACard` → `ResourcesRow` → `OperatorsCTACard`. All new sections render for **all** 4 home states (A/B/C/D), matching web.
- New content-hub screens are pushed routes under `apps/mobile/app/(tabs)/(home)/` (e.g. `router.push("/packing")`), following the existing `trek/[slug].tsx` pattern — reachable from any tab while keeping tab-bar context.
- `permits.tsx`, `costs.tsx`, `safety.tsx`, `beginner.tsx` use a new shared `CMSHubScreen` component over `contentApi.getCmsPagesByType("permit_guide" | "cost_guide" | "safety_guide" | "beginner_guide")`, mirroring web's `fetchCMSHubPages`. Tapping a card opens a new generic `guide/[slug].tsx` detail screen via `CMSContentRenderer`.
- `packing.tsx` is a static screen ported/condensed from `apps/web-next/app/(public)/packing/page.tsx`'s `ContentPage` blocks (Clothing/Footwear/Gear/Documents sections).
- `plan-my-trek.tsx` is a condensed single-screen wizard (intent / months / duration / experience chips) calling the existing `POST /api/v1/plan/recommend` endpoint. Gates submission on auth — if logged out, taps the submit button route to sign-in instead.
- `compare.tsx` is a lightweight 2-trek comparison (region/difficulty/duration/season rows) over the trending-treks list. The full M08 attribute-table + saved-comparisons feature is explicitly **out of scope** here and remains future work under STEP-M08.
- `products.tsx` and `operators.tsx` are new list screens over the existing `/api/v1/products` and `/api/v1/operators` endpoints (new `contentApi.getProducts()` / `contentApi.getOperators()` helpers).
- New Home section components (`CategoryHubRow`, `DifficultyTabsSection`, `EditorialFeatureCard`, `ComparisonCTACard`, `ResourcesRow`, `OperatorsCTACard`) follow existing conventions: `useTheme()` colors, `PlayfairDisplay_700Bold` headings (already loaded font), `Ionicons` from `@expo/vector-icons`, saffron accent `#E8702A`.
- `DifficultyTabsSection` operates on a new `dedupedTreks` list (merge of `trending` + `seasonal`, deduped by `slug`) computed in `index.tsx`.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/mobile/components/cms/CMSHubScreen.tsx` | Shared CMS hub-list screen: fetches `contentApi.getCmsPagesByType(pageType)`, handles loading/error/empty states, renders cards → `guide/[slug]` |
| `apps/mobile/app/(tabs)/(home)/guide/[slug].tsx` | Generic CMS page detail screen — renders title + `seo_description` + `CMSContentRenderer` |
| `apps/mobile/app/(tabs)/(home)/permits.tsx` | `CMSHubScreen` over `permit_guide` |
| `apps/mobile/app/(tabs)/(home)/costs.tsx` | `CMSHubScreen` over `cost_guide` |
| `apps/mobile/app/(tabs)/(home)/safety.tsx` | `CMSHubScreen` over `safety_guide` |
| `apps/mobile/app/(tabs)/(home)/beginner.tsx` | `CMSHubScreen` over `beginner_guide` |
| `apps/mobile/app/(tabs)/(home)/packing.tsx` | Static packing-system guide (ported from web `packing` page) |
| `apps/mobile/app/(tabs)/(home)/plan-my-trek.tsx` | Condensed Plan My Trek wizard, calls `planApi.recommend` |
| `apps/mobile/app/(tabs)/(home)/compare.tsx` | Lightweight 2-trek comparison over trending treks |
| `apps/mobile/app/(tabs)/(home)/products.tsx` | Resources/products list (`contentApi.getProducts()`) |
| `apps/mobile/app/(tabs)/(home)/operators.tsx` | Verified operators list (`contentApi.getOperators()`) |
| `apps/mobile/components/home/CategoryHubRow.tsx` | 5-card row → Packing/Permits/Costs/Safety/Plan My Trek |
| `apps/mobile/components/home/DifficultyTabsSection.tsx` | Easy/Moderate/Challenging tabs over `dedupedTreks`, "View all" → Browse with `difficulty` filter |
| `apps/mobile/components/home/EditorialFeatureCard.tsx` | Image + gradient editorial card → `/beginner` |
| `apps/mobile/components/home/ComparisonCTACard.tsx` | Static CTA with example trek pairs → `/compare` |
| `apps/mobile/components/home/ResourcesRow.tsx` | Horizontal product cards (hidden if empty) → `/products` |
| `apps/mobile/components/home/OperatorsCTACard.tsx` | Static CTA → `/operators` |

## Files Modified

| File | Change |
|------|--------|
| `services/api/app/schemas/recommendations.py` | `RecommendationItem` gains 4 new optional fields: `trek_difficulty`, `trek_state`, `trek_duration`, `trek_season` |
| `services/api/app/modules/recommendations/service.py` | `_page_to_dict`, `find_similar_pages`, `find_similar_to_query`, `get_anonymous_recommendations`, `_row_to_dict` extended to select + populate the 4 new fields from `CMSPage` |
| `services/api/tests/test_recommendations.py` | +TC-B16 `test_recommendation_items_include_trek_metadata`, +TC-B17 `test_anonymous_recommendations_include_trek_metadata_keys` |
| `apps/mobile/lib/mobileApi.ts` | `RecommendationItem` +4 fields; `mapRecommendationToTrekListItem` maps them through instead of hardcoding `null`; new `Product`, `Operator`, `PlanRecommendRequest`, `TrekRecommendation`, `PlanRecommendResponse` interfaces; `contentApi.getCmsPagesByType/getProducts/getOperators`; new `planApi.recommend` |
| `apps/mobile/app/(tabs)/(home)/_layout.tsx` | `Stack.Screen` registrations + titles for `guide/[slug]`, `packing`, `permits`, `costs`, `safety`, `plan-my-trek`, `beginner`, `compare`, `products`, `operators` |
| `apps/mobile/app/(tabs)/(home)/index.tsx` | Rewired section order to mirror web Home (see Decisions); added `dedupedTreks` computation |

---

## Notes

- `cd apps/mobile && npx tsc --noEmit`: 0 errors (run after mobileApi.ts edit, after content-hub screens, and after full `index.tsx` wiring — clean each time).
- `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v`: 639 passed, 1 skipped — same 2 pre-existing unrelated `test_refresh.py` failures (`test_stale_pages_includes_null_last_refreshed`, `test_stale_page_response_shape`) confirmed present on clean `main` via `git stash` before this step began.
- `gitnexus_detect_changes(scope: "all")`: `risk_level: "high"`, 27 changed symbols / 6 affected / 7 changed files. Reviewed: changed files are `CLAUDE.md` (pre-existing unrelated touch), `apps/mobile/app/(tabs)/(home)/_layout.tsx`/`index.tsx`, `apps/mobile/lib/mobileApi.ts`, and the backend `recommendations/service.py`/`recommendations.py`/`test_recommendations.py` — all expected for this step. Affected processes: `HomeScreen → UseAuth/UseThemeContext/GetBehaviorProfile/HasBehaviorData` (expected, HomeScreen changed) and `Get_recommendations_for_user → _vec_str/_row_to_dict` (expected, backend changes). No unexpected scope.
- `npx gitnexus analyze --force` run to pick up the 16 brand-new mobile files (new screens/components are untracked-until-indexed, so they did not appear in `detect_changes`).
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Backend Test Cases — STEP-M-DS3

Run: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/test_recommendations.py -v`

### TC-M09-B01: test_recommendation_items_include_trek_metadata
Verifies: personalised `RecommendationItem` responses include populated `trek_difficulty`, `trek_state`, `trek_duration`, `trek_season` fields sourced from the `CMSPage` row.

### TC-M09-B02: test_anonymous_recommendations_include_trek_metadata_keys
Verifies: anonymous (`get_anonymous_recommendations`) responses include the same 4 metadata keys (non-`null` where the source `CMSPage` has the data).

Full suite: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v` → 639 passed, 1 skipped (2 pre-existing unrelated failures, confirmed present on `main` before this step).

---

## Frontend Test Cases — STEP-M-DS3

Run: mobile app on simulator/device, backend running (`make api`).

### TC-M09-F01: New Home sections render in order — all 4 states
Steps:
1. Cold-launch the app logged out with no behavior history (State C) and scroll Home.
2. Repeat logged out with behavior history (State D), logged in with no behavior (State A), and logged in with behavior (State B) — toggle via sign-in/out and clearing app data between runs.
Expected: in every state, sections appear in this order: Welcome Banner (A/B only) → Trending → Category Hub row (Packing/Permits/Costs/Safety/Plan My Trek) → Regions → Difficulty tabs (Easy/Moderate/Challenging) → Editorial "Your first trek" card → Seasonal Picks → Recently Viewed (D only) → Personalised Feed (A/B/D only) → Comparison CTA → Resources row → Operators CTA.
Pass = all sections present in the listed order for every state, with state-gated sections appearing only in their states.

### TC-M09-F02: Category Hub navigation
Steps:
1. From Home, tap each of the 5 Category Hub cards (Packing, Permits, Costs, Safety, Plan My Trek) in turn.
Expected: each opens its respective screen with a back button returning to Home.
Pass = all 5 navigate correctly and back navigation works.

### TC-M09-F03: CMS hub screens — content + empty states
Steps:
1. Open Permits, Costs, Safety, and Beginner from their Category Hub / Editorial entry points.
2. For a page type with no published CMS pages, observe the empty state.
3. Tap a card on a hub screen with content.
Expected: hub screens show a loading state, then either a list of cards (image + title + description) or an empty-state message; tapping a card opens `guide/[slug]` showing the full CMS content via `CMSContentRenderer`.
Pass = loading/empty/content states all render correctly; detail screen renders body content.

### TC-M09-F04: Packing guide (static content)
Steps:
1. Tap "Packing" from the Category Hub.
Expected: shows "The Indian trekker's packing system" hero + Clothing/Footwear/Gear/Documents sections with bullet lists and cards.
Pass = all 4 sections render with their bullets/cards.

### TC-M09-F05: Plan My Trek — auth gating + submission
Steps:
1. While logged out, open Plan My Trek, select some chips, and tap submit.
Expected: routes to sign-in instead of submitting.
2. While logged in, repeat — select intent/month/duration/experience chips and submit.
Expected: shows a loading state, then either result cards (title, match-score pill, meta, "why this matches", tappable → trek detail) or a "no match" message.
Pass = logged-out submit routes to sign-in; logged-in submit returns results or a no-match message without error.

### TC-M09-F06: Compare — 2-trek selection
Steps:
1. Open Compare from the Comparison CTA card.
2. Select one trek — observe "Select 1 more trek to compare" helper text.
3. Select a second trek.
Expected: a comparison table appears showing Region / Difficulty / Duration / Best season for both treks side by side.
Pass = helper text shown with 0-1 selected; table renders correctly with 2 selected.

### TC-M09-F07: Resources & Operators screens
Steps:
1. From Home, tap the Resources row "View all" (or a card) → Products screen.
2. From Home, tap the Operators CTA → Operators screen.
Expected: Products screen lists active products with image/title/price (or "Free"); Operators screen lists active operators with logo/letter-fallback, name, region, rating, description, trek-type tags, and a "Visit website →" link that opens the browser.
Pass = both screens load lists without error; Resources row itself is hidden on Home if there are zero active products.

### TC-M09-F08: Recommendation cards show trek metadata tags
Steps:
1. As a logged-in user with behavior history (State B), scroll to the Personalised Feed section.
Expected: recommendation trek cards now show difficulty/region/duration/season tags (previously blank/null).
Pass = at least one recommendation card displays a non-empty difficulty, region, duration, or season tag.

### TC-M09-F09: Mobile layout (375px equivalent / small device)
Steps:
1. On a small simulator (e.g. iPhone SE) or by resizing, scroll the full Home screen and each new content-hub screen.
Expected: no horizontal overflow, all rows scroll horizontally where intended (Category Hub, Resources), cards/text wrap correctly.
Pass = no layout clipping or overflow on any new section/screen at small widths.
