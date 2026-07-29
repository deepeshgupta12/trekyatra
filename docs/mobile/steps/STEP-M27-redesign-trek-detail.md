# STEP-M27 — v1.1 Redesign, Phase 4: Trek Detail

**Status:** In progress (2026-07-29) — hero done; deeper restructure staged.

## Goal
Restyle the trek-detail hero/stats/photo-tour/pinned CTA to the mockup (screenshot 2)
while **preserving** the touch-desync-safe pinned section bar, offline cache, and premium gating.

## Done — matches the owner's exact reference layout
- `components/trek/TrekHero.tsx` — back/share buttons → frosted `GlassSurface` (pine icons);
  **stats removed** from the hero (moved to the summary card); title + **state subtitle**.
- `components/trek/TrekSummaryCard.tsx` (new) — paper card overlapping the hero:
  - **Route sub-card**: icon + "Trail Route" + subtitle + ↗; **route-map thumbnail**
    (route_image_url, 800w + onError fallback) → opens guide tab (full `TrekRouteMap`).
  - **Stats grid**: Duration / Max altitude / Difficulty (real fields; difficulty color-coded).
  - **Photo tour** card → reports tab (trip-report gallery). No video "Preview" (no per-trek
    video, per owner decision).
- `trek/[slug].tsx` — TrekSummaryCard wired after TrekHero; onOpenMap → guide, onOpenPhotos →
  reports (existing setActiveTab). Impact LOW (0); tsc 0.

## Data grounding (no invented fields)
Real model has Duration/Max-altitude/Difficulty/state/route_image_url — NOT rating, "Length",
"Elev-gain", structured start→end route, or video. The card maps to real fields; difficulty
pill/subtitle stand in for the mockup's ★rating/route.

## Done — pinned bar floated (UI-only, actions unchanged)
- `TrekStickyBar` — same actions (Plan / Save / Compare) per owner note; **only the UI enhanced**:
  the bar now FLOATS (inset margins, rounded 22, GlassSurface, shadow) instead of edge-attached.
  In-flow (reserves height — nothing hides behind it). Props unchanged (slug/trekName). Impact
  LOW (0); tsc 0. Bottom tab navigation keeps its 5 elements (floated in M25) — no Download added.

## Preserved
- ⚠️ The inline+overlay **pinned section TrekTabBar** (touch-desync-safe), offline badge, and
  premium `GatedContentOverlay` remain intact — untouched by this redesign.

## Validation
- `gitnexus impact`: TrekHero LOW (0). tsc 0. a11y + testIDs on buttons.

## Notes
- Next after device test: photo tour + pinned bar + optional glass stats card.
