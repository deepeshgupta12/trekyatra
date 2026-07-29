# STEP-M25 — v1.1 Redesign, Phase 2: Home

**Status:** In progress (2026-07-29)

## Goal
Wire the Phase-1 foundation into a redesigned Home matching the approved mockup —
personalized greeting header, AI/voice search, quick filter chips, and prominent
TrailCards — brand-locked (saffron/pine).

## Files Created
- `components/home/HomeHeroV2.tsx` — light personalized header (avatar + location + "Hi,
  {name} 👋", AISearchBar with voice, QuickFilterChips). Replaces the image-carousel HomeHero
  + welcome banners; imagery moves into the cards.
- `components/home/PopularTrailsSection.tsx` — "Popular with trekkers" horizontal rail of
  TrailCards with an auth-gated save heart (mirrors TrekStickyBar's saveTrek + trackTrekSaved).

## Files Modified
- `app/(tabs)/(home)/index.tsx` — HomeHero + HomeWelcomeBannerA/B + HomeTrendingSection →
  HomeHeroV2 + PopularTrailsSection; hero wired to search / voice / notifications / map / filter
  navigation with analytics. All existing sections (nearby, category, regions, difficulty,
  seasonal, personalised feed, recently-viewed, comparison, resources, operators) preserved
  below. Location label = behavior top-region.
- `lib/analytics.ts` — trackAiSearchOpened / trackVoiceSearchUsed / trackFilterChipTapped.

## Deferred (tracked)
- **Floating glass tab-bar restyle** — cross-cutting (every screen's layout/safe-area), so it
  ships as its own isolated change. Current tab bar is already GlassSurface + FAB.
- HomeWelcomeBanner + HomeTrendingSection files left in place (no longer imported by Home) —
  removed in a later cleanup, not deleted now to avoid touching unrelated imports.

## Validation
- `gitnexus impact`: HomeScreen / CustomTabBar LOW (0). New components: no upstream.
- `tsc --noEmit`: 0 errors. a11y labels + testIDs on all interactives; no `any`.
- Analytics: home_view (existing) + ai_search_opened / voice_search_used / filter_chip_tapped /
  trek_saved.

## Notes
- Voice + AI search currently route to the existing search screen; the deeper voice→TrekSage
  wiring lands with the Phase-3 Search redesign.
- Next: STEP-M26 Explore + Search.
