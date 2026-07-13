---
name: ui-ux-pro-max
description: "Premium mobile UI/UX craft for apps/mobile/. Use when designing or redesigning ANY screen/component where visual quality matters (hero screens, detail pages, cards, lists, sheets). Covers the design philosophy, layout patterns (full-bleed hero + overlaid stats, at-a-glance panels, section rhythm, multi-column grids), safe-area rules, robust sticky/pinned patterns, motion, and a pre-ship checklist. Complements mobile-design-system (which owns tokens/fonts/nav/API contracts)."
---

# TrekYatra — UI/UX Pro Max (apps/mobile)

The **taste layer** for the mobile app. `mobile-design-system` owns the raw material
(color/font/spacing tokens, nav conventions, API contracts, GlassSurface). This skill
owns how those materials are composed into screens that feel premium and reduce
cognitive load. **Read both before building or redesigning a mobile screen.**

## When to Use

- Redesigning a screen that feels "blanch / high cognitive load / no WOW factor"
- Building a hero/detail screen, a card grid, a filter/list, or a bottom sheet
- Any time a screenshot review flags layout, spacing, hierarchy, or safe-area issues

## Design Philosophy (the 5 rules)

1. **One hero, one job.** Every screen opens with its single most characteristic
   element at full strength (a full-bleed image hero, a bold list header, a live map).
   Everything else is quieter. Don't compete for attention.
2. **Facts at a glance beat walls of text.** Surface the 2–4 numbers a user actually
   wants (duration, altitude, difficulty, price, distance) as scannable chips/stats
   near the top — never bury them in prose. Prose is for depth, not for the summary.
3. **Rhythm over density.** Consistent vertical spacing between sections (a spacing
   scale, not ad-hoc margins) reads as calm and premium. Cramped = cheap.
4. **Encode state in form, not just text.** Difficulty → colour; live/stale → pill;
   distance → badge. A glanceable visual carries meaning faster than a label.
5. **Motion serves, never decorates.** A crossfade, a scroll-reveal, a hover press —
   one orchestrated moment beats scattered effects. When unsure, less motion.

## Spacing & Radius Scale (use these, don't invent)

Reference `constants/theme.ts` (`spacing`, `radius`). In StyleSheet, standardise on:

| Token | px | Use |
|-------|----|----|
| gutter | 16 | screen horizontal padding (the app-wide left/right margin) |
| section gap | 24–28 | vertical space between major sections |
| card gap | 12 | between cards in a grid/row |
| inner pad | 14–16 | padding inside cards/panels |
| radius card | 14–18 | cards, panels, images |
| radius pill | 7 / 20 | small label pills / full-round chips |

**Never** ship a screen with per-element margins that fight each other. Use a parent
with `gap`, or a single consistent `marginHorizontal: 16` on the content column.

## Typography

Three families (loaded in `_layout.tsx` — verify before adding a weight, per
`mobile-design-system`): `PlayfairDisplay` (display/headings), `Inter` (body/UI),
`JetBrainsMono` (data/code).

| Role | Family / size |
|------|---------------|
| Screen title / hero | `PlayfairDisplay_700Bold`, 26–30, lineHeight ~1.2 |
| Section heading | `PlayfairDisplay_700Bold`, 18, or Inter_700Bold |
| Body | Inter_400Regular, 14–15, lineHeight ~1.5 |
| Label / eyebrow | Inter_700Bold, 10–11, letterSpacing 1.5–2, UPPERCASE, accent colour |
| Stat value | Inter_700Bold, 13–15 |
| Stat label / caption | Inter, 10–11, muted |

On a photographic hero, white text gets a `textShadow` (`rgba(0,0,0,0.45)`, radius 4–6)
so it stays legible over any image.

## Signature Layout Patterns

### 1. Full-bleed hero with overlaid stats (detail screens)
The strongest "WOW" move. Image fills a tall container (`height + topInset`), a
multi-stop `LinearGradient` darkens the base for legibility, and the title + a compact
**at-a-glance stat panel** (2–3 stats with icon + value + label, hairline dividers)
sit pinned to the bottom over the image. Back/share as circular glass buttons at
`topInset + 10`. This replaces a separate plain "meta strip" — facts live *on* the hero.
Reference implementation: `components/trek/TrekHero.tsx`.

### 2. At-a-glance stat panel
A row of 2–4 stats, each `icon + value + label`, separated by `StyleSheet.hairlineWidth`
dividers, on a translucent/`GlassSurface` panel. Colour the value when it encodes state
(difficulty). Cap at 3 on a phone width; overflow → drop or scroll.

### 3. Multi-column card grid
`flexDirection: "row", flexWrap: "wrap", gap: 12`. Compute card width as
`Math.floor((windowWidth - 2*gutter - gap) / columns)` — **`Math.floor` is mandatory**
(sub-pixel overflow silently wraps the row to 1 column). If the card component carries
its own `marginRight` (built for horizontal scrollers, e.g. `TrekCard`), pass a
`noMargin` prop in grids or the margin overflows the row. See `beginner.tsx`.

### 4. Section rhythm
Each content section = eyebrow (uppercase accent label) + `PlayfairDisplay` heading +
body/cards, with `marginTop: 24–28` between sections. This single pattern makes long
pages feel authored, not dumped.

## Safe Area — HARD RULES (these caused real crashes/collisions)

1. **`SafeAreaProvider` MUST wrap the app root** (`app/_layout.tsx`), ideally with
   `initialMetrics={initialWindowMetrics}`. Without it, `useSafeAreaInsets()` returns
   undefined/0 and every inset-aware component silently breaks.
2. **Never do `height + insets.top` unguarded.** If insets are undefined,
   `number + undefined = NaN`, RN drops the style, and the view **collapses to content
   height** — a full-bleed hero collapses under the notch. Always
   `const topInset = insets.top ?? 0;` and use `topInset`.
3. **Headerless screens** (`headerShown:false` + full-bleed hero): put back/share at
   `topInset + 10`; put the first below-hero section's breathing room as explicit
   `paddingTop`, not reliance on the hero.

## Sticky / Pinned Bars — use the overlay pattern, NOT dynamic sticky height

A `ScrollView` `stickyHeaderIndices` header whose **height changes while pinned**
(e.g. adding a safe-area `topInset` on scroll) **desyncs RN touch hit-testing** — taps
land on the wrong element ("clicking goes to the wrong section"). Instead:

- Render the bar **inline** in the scroll at constant height (no inset).
- Render a **second copy as an absolute overlay** OUTSIDE the ScrollView
  (`position:absolute, top:0, zIndex:20`, with `topInset`), shown once the inline bar
  scrolls under the notch (track `onScroll` offset vs the inline bar's `onLayout` y).
- Both call the same handler. No sticky-height mutation → no touch desync.

Reference: the pinned `TrekTabBar` in `app/(tabs)/(home)/trek/[slug].tsx`.

## Glass UI

Follow `mobile-design-system` → GlassSurface rules. Premium-specific notes:
- Chrome/containers (bars, cards, sheets, inactive chips) = `GlassSurface`.
- Primary CTAs / active states = **solid saffron `#E8702A`**, never glassed.
- Max ~2–3 glass layers per screen (GPU cost). A pinned overlay bar + a sticky CTA is
  already 2 — don't stack a third.

## Motion

- Simple fades/crossfades/press states → RN `Animated` (`useNativeDriver:true`).
- Reanimated (`react-native-reanimated`) is powerful but **crashes on New-Arch reload
  races** (`uiManager_==nullptr` commit assertion) — a dev-only Fast-Refresh transient,
  not production. Keep reanimated usage minimal and avoid mounting/unmounting
  reanimated-driven views rapidly during scroll.
- Hero image swaps: `expo-image` with `transition` + a blurhash `placeholder`.

## Pre-Ship Checklist (every redesigned screen)

- [ ] Opens with one clear hero; secondary elements are quieter
- [ ] The 2–4 key facts are glanceable near the top (not buried in prose)
- [ ] Consistent gutter (16) + section rhythm (24–28); no fighting margins
- [ ] `useSafeAreaInsets()` guarded (`?? 0`); no `x + insets` that can NaN
- [ ] No dynamic-height sticky header (use the inline + overlay pattern)
- [ ] Grid widths use `Math.floor`; grid cards use `noMargin` if the card self-margins
- [ ] Type uses loaded weights only; white-on-image text has a shadow
- [ ] Active/CTA = solid saffron; chrome = GlassSurface; ≤3 glass layers
- [ ] Every touchable has `accessibilityLabel` (+ `testID` where tested)
- [ ] `npx tsc --noEmit` clean; built + eyeballed on iPhone 17 Pro (notch) at 375px too

## Related

- `.claude/skills/mobile-design-system/SKILL.md` — tokens, fonts, nav, API contracts, GlassSurface (the material layer)
- `docs/mobile/MOBILE_IMPLEMENTATION_PLAN.md` — screen inventory + per-pass bug history (the SafeAreaProvider / sticky-bar / grid lessons above come from Passes 3–5)
