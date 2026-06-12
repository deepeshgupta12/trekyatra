# STEP-M-DS5 — Splash Screen Rebuild (Static Background + Logo Card)

**Status:** Done ✓ (2026-06-12)
**Phase:** Foundation
**Dependencies:** STEP-M-DS2 (Splash, Onboarding & Auth Polish — introduced `AnimatedSplash.tsx`)

> Numbered `M-DS5` — same "cross-cutting polish/parity pass" family as `M-DS1`-`M-DS4`. Tiny, self-contained step: replaces the cinematic SVG/Reanimated splash sequence with a static composition, per user-provided background image asset.

---

## Scope

Replace `AnimatedSplash.tsx`'s animated "Trail Comes Alive" SVG/Reanimated sequence with a static composition:
- Full-bleed background photo (user-provided mountain sunrise trail image)
- A white, rounded-corner card centered on screen containing `logo.png`
- Same `onFinish()` callback contract — called after a fixed 1.8s display duration via `setTimeout`, so `app/_layout.tsx` integration is unchanged

### Decisions
- New asset `apps/mobile/assets/splash-background.jpg` (864×1821, user-provided) used with `resizeMode="cover"` for full-bleed coverage on any device aspect ratio.
- Card sized 140×140 (matching the previous `logoWrap` dimensions) with `borderRadius: 24`, white background, and a soft shadow; `logo.png` rendered at 100×100 inside it.
- Removed `react-native-svg` and `react-native-reanimated` usage from this component (no longer needed for a static composition) — both packages remain in use elsewhere in the app.
- `app/_layout.tsx` is unchanged — `AnimatedSplash` keeps the same `{ onFinish: () => void }` prop contract.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/mobile/assets/splash-background.jpg` | Full-bleed splash background photo (user-provided) |

## Files Modified

| File | Change |
|------|--------|
| `apps/mobile/components/ui/AnimatedSplash.tsx` | Rewritten as static composition: full-bleed background image + centered white rounded card with `logo.png`; `onFinish()` fired via `setTimeout(1800ms)` |

---

## Notes

- `cd apps/mobile && npx tsc --noEmit`: 0 errors.
- `gitnexus_impact("AnimatedSplash", upstream)`: LOW risk, 0 impacted — leaf component, only consumer (`app/_layout.tsx`) unchanged since the prop contract is identical.
- `gitnexus_detect_changes(scope:"all")`: `risk_level: "low"`, 5 changed symbols / 0 affected / 1 changed file — all within `AnimatedSplash.tsx`, as expected.
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Backend Test Cases — STEP-M-DS5

No backend files changed — no new backend tests. (No full-suite re-run needed; no backend code touched since the M-DS4 regression check.)

---

## Frontend Test Cases — STEP-M-DS5

Run: mobile app on simulator/device (`cd apps/mobile && npx expo start`).

### TC-M-DS5-F01: Splash displays on cold start
Steps:
1. Force-quit and relaunch the app.
Expected: splash shows the full-bleed mountain/sunrise background image with a white rounded card containing the TrekYatra logo centered on screen, for ~1.8 seconds, then transitions to onboarding/home.
Pass = static composition renders correctly, no flash of blank/black screen, transitions cleanly.

### TC-M-DS5-F02: Mobile layout (small + large device)
Steps:
1. Run on a small simulator (iPhone SE) and a large one (iPhone 16 Pro Max / tablet if available).
Expected: background image covers the full screen with no letterboxing (via `resizeMode="cover"`); logo card stays centered and proportionate on both sizes.
Pass = no letterboxing/stretching, card remains centered on both screen sizes.
