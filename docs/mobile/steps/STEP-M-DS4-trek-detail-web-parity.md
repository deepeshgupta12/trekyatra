# STEP-M-DS4 — Trek Detail Screen Web-Parity (Trust Signals, News, Related Pages, Contents Sheet, Compare CTA)

**Status:** Done ✓ (2026-06-12)
**Phase:** Foundation
**Dependencies:** STEP-M05 (Trek Detail Screen), STEP-M-DS3 (Home Screen Web-Parity + Content Hub Screens, provides `guide/[slug]` + `compare.tsx`)

> Note: numbered `M-DS4` (not a new `M0x`) — same "cross-cutting polish/parity pass" family as
> `M-DS1`/`M-DS2`/`M-DS3`, since STEP-M05 is already marked Done and this closes gaps found in QA.

---

## Scope

QA found the mobile trek detail screen (`apps/mobile/app/(tabs)/(home)/trek/[slug].tsx`, built in STEP-M05) was missing several sections present on the production web trek detail page (`apps/web-next/app/(public)/trek/[slug]/page.tsx`). The user picked a specific subset to close in this step:

1. **Trust signals** — fact-checked badge + "Updated/Published {date}" row, sourced from `CMSPage.published_at`/`updated_at`.
2. **Trek News** — horizontal card row of news articles for this trek, from `/api/v1/public/news/by-trek/{trek_slug}`.
3. **"In this cluster" related pages** — vertical list of related CMS pages, from `/api/v1/links/suggestions/{slug}`.
4. **Table of Contents** — native "Contents" bottom-sheet (Wikipedia/Medium/Notion pattern), not the web's sticky-sidebar scroll-spy.
5. **"Compare this trek" CTA** — third icon button on `TrekStickyBar`, opens `/compare?slug={slug}` with this trek pre-selected.

Explicitly **excluded** (flagged, not silently skipped):
- Breadcrumb navigation — web-only concept, doesn't belong in a native app.
- In-article ad slot — AdSense doesn't fit a native app; revisit with AdMob in a future step if ever needed.
- Mobile news article detail screen — News cards deep-link externally to `https://trekyatra.co.in/news/{slug}` instead (no mobile news detail screen exists).

**Zero blast radius on `apps/web-next`** — no backend code changes were needed. `GET /api/v1/cms/pages/{slug}` already returns `published_at`/`updated_at` (`services/api/app/schemas/cms.py:66-68`), and the public news/related-pages endpoints already exist and require no auth. The only backend-adjacent change is additive: 2 new optional fields on the mobile `CMSPage` TypeScript interface, sourced from fields the API already returns. No `apps/web-next` files were touched.

### Decisions

- TOC implemented as a native "Contents" bottom-sheet modal (`TrekContentsSheet.tsx`) — a "☰ Contents" pill button (shown only when the Guide tab has ≥2 headings with stable `id`s) opens a `Modal` listing headings indented by level; tapping a heading scrolls the article to that section and dismisses the sheet. Replaces the web's horizontal "Jump to section" chip row + scroll-spy sidebar, per explicit user feedback that the web pattern is not idiomatic for a mobile app.
- Scroll-to-section uses a two-level offset: the "tab body" wrapper `View` records its own `y` via `onLayout` (offset within the main `ScrollView`), and each `HeadingBlock` with a stable `id` records its `y` relative to that wrapper via a new optional `onLayout` passthrough prop plumbed through `CMSContentRenderer`'s new `onHeadingLayout?: (id, y) => void` prop. `scrollViewRef.current?.scrollTo({ y: tabBodyOffset + headingY - 60 })` (60px accounts for the sticky tab bar height).
- `TrekNewsSection` and `RelatedPagesSection` both fetch on mount and render `null` if the API returns an empty array — most treks currently have zero news articles / cluster pages, so these sections are commonly hidden (expected, not a bug).
- `RelatedPagesSection` routes by `page_type`: `trek_guide` → `/trek/{slug}`, everything else (`packing_list`/`permit_guide`/`cost_guide`/`safety_guide`/`beginner_guide`/etc.) → `/guide/{slug}` (the generic CMS detail screen from STEP-M-DS3).
- `compare.tsx` reads `useLocalSearchParams<{ slug?: string }>()` and pre-selects that trek (if present in the trending-treks list) on load — user still picks the 2nd trek manually.
- `TrekStickyBar` gains a third 48×48 icon button (Ionicons `git-compare-outline`, same style as the existing Save button) that navigates to `/compare?slug={slug}`.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/mobile/components/trek/TrustSignals.tsx` | "Updated/Published {date}" + author + fact-checked badge row |
| `apps/mobile/components/trek/TrekNewsSection.tsx` | Horizontal news-article card row for this trek (external deep link) |
| `apps/mobile/components/trek/RelatedPagesSection.tsx` | "In this cluster" vertical related-pages list |
| `apps/mobile/components/trek/TrekContentsSheet.tsx` | Native "Contents" bottom-sheet modal (TOC) |

## Files Modified

| File | Change |
|------|--------|
| `apps/mobile/lib/mobileApi.ts` | `CMSPage` gains `published_at`/`updated_at` (additive); new `NewsArticle`/`RelatedPage` interfaces; new `contentApi.getNewsByTrek(slug, limit)` and `contentApi.getRelatedPages(slug, limit)` |
| `apps/mobile/hooks/useTrekDetail.ts` | `mapDbToPage` (offline SQLite fallback) sets `published_at: null, updated_at: null` to satisfy the extended `CMSPage` type |
| `apps/mobile/components/cms/blocks/HeadingBlock.tsx` | Accepts optional `onLayout` prop, passed through to the wrapping `View` |
| `apps/mobile/components/cms/CMSContentRenderer.tsx` | Accepts optional `onHeadingLayout?: (id, y) => void`; passed to `HeadingBlock` only when `block.id` is set |
| `apps/mobile/components/trek/TrekStickyBar.tsx` | Added third icon button ("Compare", Ionicons `git-compare-outline`) → `/compare?slug={slug}` |
| `apps/mobile/app/(tabs)/(home)/compare.tsx` | Reads `?slug=` search param; pre-selects that trek on mount if present in trending-treks list |
| `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` | Wires in `TrustSignals` (under `TrekMetaStrip`), "☰ Contents" pill + `TrekContentsSheet` (Guide tab, ≥2 headings), `TrekNewsSection` + `RelatedPagesSection` (after `TrekRelatedRow`, Guide tab only); `scrollViewRef` + `headingOffsets`/`tabBodyOffset` refs for scroll-to-section |

---

## Notes

- `cd apps/mobile && npx tsc --noEmit`: 0 errors.
- `gitnexus_impact` (upstream) before editing: `TrekDetailScreen` LOW (0 impacted), `contentApi` LOW (0 impacted), `CompareScreen` LOW (0 impacted), `HeadingBlock` LOW (0 impacted), `CMSContentRenderer` LOW (0 impacted), `TrekStickyBar` LOW (0 impacted). `CMSPage` (mobile interface, `apps/mobile/lib/mobileApi.ts`) showed HIGH/54 impacted — but this is purely file-import fan-out (18 files `import` from `mobileApi.ts`); the change itself (2 new optional fields) is additive and breaks none of those consumers, confirmed by 0 `tsc` errors after the change.
- `gitnexus_detect_changes(scope:"all")`: `risk_level: "medium"`, 14 changed symbols / 5 affected / 8 changed files. Changed files: `CLAUDE.md` (pre-existing unrelated touch), `compare.tsx`, `trek/[slug].tsx`, `CMSContentRenderer.tsx`, `HeadingBlock.tsx`, `TrekStickyBar.tsx`, `useTrekDetail.ts`, `mobileApi.ts` — all expected for this step. The 4 new components don't appear in `detect_changes` (untracked-until-indexed); picked up by the `npx gitnexus analyze --force` re-index.
- `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -q`: 639 passed, 1 skipped — same 2 pre-existing unrelated `test_refresh.py` failures (`test_stale_pages_includes_null_last_refreshed`, `test_stale_page_response_shape`), confirmed present on `main` before this step (no backend files touched).
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Backend Test Cases — STEP-M-DS4

No backend files changed — no new backend tests. Full suite re-run for regression check: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v` → 639 passed, 1 skipped (2 pre-existing unrelated failures, confirmed present on `main` before this step).

---

## Frontend Test Cases — STEP-M-DS4

Run: mobile app on simulator/device, backend running (`make api`).

### TC-M-DS4-F01: Trust signals row
Steps:
1. Open any trek detail page (Guide tab).
Expected: directly below the meta-strip chips, a row shows "Updated {date}" (or "Published {date}" if never updated), "TrekYatra Editorial", and a green "Fact-checked" badge with a shield icon.
Pass = row renders with correct date formatting (e.g. "12 Jun 2026") and fact-checked badge.

### TC-M-DS4-F02: Trek News section — content + empty state
Steps:
1. Open a trek detail page for a trek that has published news articles linked to it.
2. Open a trek detail page for a trek with no linked news articles.
Expected: (1) a "Trek News" horizontal row of cards (image/placeholder, title, date) appears after "You might also like"; tapping a card opens the article in the device browser at `https://trekyatra.co.in/news/{slug}`. (2) the "Trek News" section is fully hidden (no heading, no empty box).
Pass = both behaviors confirmed.

### TC-M-DS4-F03: "In this cluster" related pages — content + empty state
Steps:
1. Open a trek detail page for a trek with related CMS pages (e.g. one with packing/permit/cost guides in its cluster).
2. Open a trek detail page for a trek with no related pages.
Expected: (1) an "In this cluster" section lists rows with title + page-type tag (e.g. "Packing", "Permits"); tapping a row navigates to `/guide/{slug}` (or `/trek/{slug}` for `trek_guide` type) with back navigation working. (2) section is fully hidden.
Pass = both behaviors confirmed, navigation + back works.

### TC-M-DS4-F04: Contents bottom sheet (TOC)
Steps:
1. Open a trek detail page whose Guide content has ≥2 headings with anchor ids.
2. Tap the "☰ Contents" pill above the content.
3. Tap one of the listed sections.
Expected: a bottom sheet slides up listing all headings (H2 indented less than H3); tapping a section closes the sheet and scrolls the article so that section is near the top of the viewport (below the sticky tab bar).
Pass = sheet opens/closes correctly; scroll lands at (or very near) the tapped section.

### TC-M-DS4-F05: Compare CTA from sticky bar
Steps:
1. On any trek detail page, tap the new compare-icon button (3rd button on the sticky bottom bar, next to Plan and Save).
Expected: navigates to the Compare screen with this trek already selected as the first chip (shown highlighted); user can then pick a second trek to see the comparison table.
Pass = compare screen opens with the originating trek pre-selected.

### TC-M-DS4-F06: Mobile layout (small device)
Steps:
1. On a small simulator (e.g. iPhone SE), open a trek detail page with all new sections populated (trust signals, news, related pages, contents pill) and scroll through.
Expected: no horizontal overflow; Trust Signals row wraps to 2 lines if needed; News cards scroll horizontally; Related Pages rows wrap title text without clipping the tag; Contents sheet does not exceed ~65% of screen height and is scrollable if it has many headings.
Pass = no layout clipping/overflow on any new section at small widths.
