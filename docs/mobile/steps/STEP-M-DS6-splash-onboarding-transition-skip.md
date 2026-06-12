# STEP-M-DS6 — Splash → Onboarding Transition Animation + Onboarding Skip CTA

**Status:** Done ✓ (2026-06-12)
**Phase:** Foundation
**Dependencies:** STEP-M-DS5 (Splash Screen Rebuild — Static Background + Logo Card), STEP-M-DS2 (Splash, Onboarding & Auth Polish — `OnboardingProvider`, `useOnboarding`)

> Numbered `M-DS6` — same "cross-cutting polish/parity pass" family as `M-DS1`-`M-DS5`. Small, self-contained step: adds a launch animation + crossfade transition from splash into onboarding, and a "Skip" CTA on the onboarding carousel that jumps straight to Sign up/Sign in.

---

## Scope

1. **Splash → onboarding transition animation** (`AnimatedSplash.tsx`):
   - On mount, the logo card fades in and scales from `0.85` → `1.08` → `1.0` (spring-like overshoot via `withSequence`/`withTiming`).
   - Logo card and background image enlarged slightly (140×140 card / 100×100 logo → 152×152 card / 110×110 logo).
   - After the existing 1.8s display duration, the entire overlay fades its opacity to `0` over 350ms (`withTiming` + `Easing.in`) before calling `onFinish()` via `runOnJS`. Because `app/_layout.tsx` already renders `AnimatedSplash` as an absolute z-indexed overlay above the `<Stack>` (with the onboarding screen mounted underneath), this opacity fade produces a smooth crossfade into `(auth)/welcome.tsx` — no `_layout.tsx` changes needed.

2. **Onboarding "Skip" CTA** (`(auth)/welcome.tsx`):
   - New top-right pill button labeled "Skip", styled to match the existing top-left back-button badge (`rgba(13,20,16,0.55)` circular/pill background, white text).
   - Shown on slides 1-3 (non-last slides). Tapping it calls `markDone()` (via `useOnboarding()`) and navigates with `router.replace("/(auth)/sign-up")`.
   - On the last slide, this Skip button is hidden because the existing "Start exploring →" / "Already have an account? Sign in" CTAs already provide direct access to Sign up/Sign in — an additional Skip button there would be redundant.
   - This is **distinct** from the pre-existing M-DS2 "Skip — continue as guest" buttons on `sign-in.tsx`/`sign-up.tsx`, which mark onboarding done and route to `(tabs)/(home)` for anonymous browsing. Those were not modified.

### Decisions
- Reintroduced `react-native-reanimated` (`useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSequence`, `withDelay`, `runOnJS`, `Easing`) into `AnimatedSplash.tsx` — the package remains a project dependency used elsewhere, so no new install required.
- `onFinish()` contract unchanged (`{ onFinish: () => void }`); now invoked from the fade-out's `withTiming` completion callback via `runOnJS` instead of `setTimeout`. Total time-to-`onFinish()` remains ~1.8s (1450ms hold + 350ms fade).
- Skip CTA target is `/(auth)/sign-up`, matching `handleGetStarted`'s destination — the user can still reach Sign in from the Sign up screen's own link.
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Files Modified

| File | Change |
|------|--------|
| `apps/mobile/components/ui/AnimatedSplash.tsx` | Re-added `react-native-reanimated` animations: logo scale/fade-in on mount, container fade-out before `onFinish()`; enlarged card (152×152) and logo (110×110) |
| `apps/mobile/app/(auth)/welcome.tsx` | Added `handleSkip()` (calls `markDone()` + `router.replace("/(auth)/sign-up")`) and a top-right "Skip" pill button shown on non-last onboarding slides |

---

## Notes

- `cd apps/mobile && npx tsc --noEmit`: 0 errors.
- `gitnexus_impact("AnimatedSplash", upstream)` and `gitnexus_impact("WelcomeScreen", upstream)`: both LOW risk, 0 impacted before editing — confirmed safe leaf components.
- `gitnexus_detect_changes(scope:"all")`: `risk_level: "low"`, 14 changed symbols / 0 affected / 2 changed files (`AnimatedSplash.tsx`, `welcome.tsx`) — as expected.
- No `apps/web-next` files touched — **zero blast radius on production website (desktop + mobile web)**.

---

## Backend Test Cases — STEP-M-DS6

No backend files changed — no new backend tests.

---

## Frontend Test Cases — STEP-M-DS6

Run: mobile app on simulator/device (`cd apps/mobile && npx expo start`).

### TC-M-DS6-F01: Splash launch animation + crossfade to onboarding
Steps:
1. Force-quit and relaunch the app (first-time / onboarding-not-done state).
Expected: splash background + white logo card appear; the logo fades in and scales up slightly with a small overshoot ("pop") before settling; after ~1.45s the entire splash overlay smoothly fades out (~350ms), revealing the onboarding carousel (slide 1) underneath — no abrupt cut or flash of blank screen.
Pass = animation plays once on cold start, logo is noticeably larger than before, transition into onboarding is a smooth crossfade (not instant).

### TC-M-DS6-F02: Skip CTA on onboarding slides 1-3
Steps:
1. From onboarding slide 1, tap the "Skip" pill button (top-right).
Expected: app navigates directly to the Sign up screen (no bounce back to onboarding).
2. Force-quit and relaunch the app — repeat from slide 2 and slide 3 (swipe forward, then tap "Skip").
Expected: same result — lands on Sign up screen directly.
Pass = "Skip" is visible and tappable on slides 1-3, each tap lands on the Sign up screen, and the app does not redirect back to onboarding afterward (confirms `markDone()` was called).

### TC-M-DS6-F03: Last slide unaffected
Steps:
1. Swipe to the 4th (last) onboarding slide.
Expected: no top-right "Skip" pill is shown; only "Start exploring →" and "Already have an account? Sign in" CTAs are visible at the bottom, as before.
Pass = last slide layout unchanged from prior step (M-DS2/M-DS5).
