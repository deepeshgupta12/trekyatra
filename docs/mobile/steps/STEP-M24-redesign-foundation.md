# STEP-M24 — v1.1 Redesign, Phase 1: Design Foundation

**Status:** In progress (2026-07-29)
**Part of:** v1.1 mobile redesign (approved mockups → `docs/mobile/steps/` M24–M28). Ships as
App Store `1.1.0`; no interim `1.0.0 (2)` submission (owner decision).

## Goal
Additive, zero-risk foundation components the later phases build on — brand-locked
(saffron/pine + existing Glass UI), reference layouts from the approved mockups.

## Files Created
- `components/trek/TrailCard.tsx` — full-bleed card: difficulty badge (top-left), save heart
  (top-right), route-map thumbnail (bottom-right, from `route_image_url`), title+route+meta.
  Presentational (parent owns save state); 400w variant + onError fallback. **New component,
  not a TrekCard change** — screens opt in during Phases 2–3, so nothing breaks.
- `components/home/AISearchBar.tsx` — frosted `GlassSurface` search entry + saffron sparkle +
  voice mic (expo-speech-recognition wired by parent).
- `components/home/QuickFilterChips.tsx` — horizontal entry chips (Difficulty/Length/Elevation);
  active = solid saffron per the Glass-UI legibility rule.

## Files Modified
- `lib/mobileApi.ts` — added optional `route_image_url` to `TrekListItem` + `CMSPageResponseLike`
  and populated it in `mapCmsPageToTrekListItem` (backend `CMSPageResponse` already returns it).
  Additive/optional → backward-compatible, zero blast radius.

## Deferred to Phase 2
- Glass floating tab bar (CustomTabBar) — done with Home so the whole surface lands consistently.

## Validation
- `gitnexus impact`: TrekCard / CustomTabBar / mapper all LOW (0 symbols). New files: no upstream.
- `tsc --noEmit`: 0 errors.
- Accessibility: every interactive element has `accessibilityLabel` + `testID` (plan rule 7). No `any`.

## Notes
- All colors via `useTheme()` / brand tokens; Playfair for titles (loaded), Inter body.
- Next: STEP-M25 wires these into the redesigned Home.
