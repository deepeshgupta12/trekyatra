# STEP-M-DS2 — Splash, Onboarding & Auth Polish

**Status:** Done ✓ (2026-06-11)
**Phase:** Foundation
**Dependencies:** STEP-M-DS1 (design system), STEP-M02 (mobile auth), Mobile Crosscheck Bugfix Pass (M-DS1–M06)

> Note: numbered `M-DS2` (not `M07`) because `STEP-M07-explore-search.md` is already reserved
> in the roadmap for the "Explore & Search" feature step. This is a cross-cutting polish pass,
> in the same family as `M-DS1` (Mobile Design System Overhaul).

---

## Scope

QA pass on the M-DS1–M06 mobile app (with screenshots) surfaced 6 issues, all addressed in this combined pass:

1. Splash screen showed the logo image *plus* a separate "TrekYatra" text label, with no animation.
2. Onboarding (welcome) screens: background image didn't cover the full screen, icon/graphic contrast was poor against bright photos, no way to go back to a previous slide, and the 4 USP slides didn't cover the product's major features.
3. No "Skip" option on sign-in/sign-up to go straight to Home as a guest.
4. "Continue with Google" button had no Google icon, and "Sign in with Apple" never rendered on iOS.
5. Email/password sign-in could spin forever with no error/success on a hung `fetch()`.
6. Splash had no "WOW" cinematic feel — implemented as a code-based SVG/Reanimated "Trail Comes Alive" sequence.

### Decisions

- One combined pass for all 6 issues (no separate hotfix + step split).
- `AuthGate` relaxed to allow anonymous browsing of `(tabs)` — matches M06 States C/D design intent. `useRequireAuth` continues to gate `account.tsx` and `saved.tsx`.
- Onboarding kept at 4 slides; slides 3 & 4 rewritten to cover all 6 candidate USPs (AI trip planner + personalised recs merged into slide 3; offline access + operator/community booking merged into slide 4).
- Apple Sign-In: **UI-only** fix — button renders on iOS with a "coming soon" alert on tap. Full backend Apple auth (new `/api/v1/auth/apple` endpoint + Apple Developer credentials + `expo-apple-authentication` config plugin) is a **future step** — flagged, not implemented here.
- Splash animation: code-based `react-native-svg` + `react-native-reanimated` approximation of "trail draws upward → reveals logo → sunrise glow → tagline", ~4.1s total. Full hand-illustrated Lottie was out of scope.

No backend or database changes — entirely `apps/mobile/` + docs. **Zero blast radius on `apps/web-next` (production website, Desktop and Mobile web).**

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/mobile/components/ui/AnimatedSplash.tsx` | "Trail Comes Alive" cinematic splash sequence — SVG mountain silhouette, animated trail draw, waypoint icons (tent/leaf/sparkles), logo reveal, sunrise glow (RadialGradient), tagline fade |

## Files Modified

| File | Change |
|------|--------|
| `apps/mobile/app/_layout.tsx` | Renders `<AnimatedSplash onFinish={...} />` as an overlay until fonts are ready AND the animation completes; `AuthGate` no longer force-redirects unauthenticated users to sign-in (anonymous browsing of `(tabs)` allowed) |
| `apps/mobile/app.config.ts` | Native `splash.backgroundColor` changed `#1D3A2E` → `#0c0e14` to match `AnimatedSplash`'s first frame (smoother handoff) |
| `apps/mobile/app/(auth)/welcome.tsx` | `Dimensions.get("window")` → `Dimensions.get("screen")` (full-bleed fix); icon badges now white icons on `rgba(13,20,16,0.55)` (visible in light & dark photo regions); added top `LinearGradient` for status-bar legibility; added back-chevron button (hidden on slide 0); rewrote slide 3 ("Plan in 60 seconds — picked for you") and slide 4 ("Trek offline. Book with trusted operators") copy |
| `apps/mobile/app/(auth)/sign-in.tsx` | Added "Skip" button (top-right) → sets onboarding flag + routes to `(tabs)/(home)`; passes `onApple={handleAppleComingSoon}` to `SocialSignInButtons` |
| `apps/mobile/app/(auth)/sign-up.tsx` | Added "Skip" button (top-right) → same behaviour as sign-in |
| `apps/mobile/components/auth/SocialSignInButtons.tsx` | Added `Ionicons name="logo-google"` to the Google button; Apple button now always renders when `isAppleAuthAvailable()` (defaults `onApple` to a local "coming soon" `Alert` if not provided), with `Ionicons name="logo-apple"` |
| `apps/mobile/components/ui/Button.tsx` | Added optional `icon?: React.ReactNode` prop, rendered before the label text |
| `apps/mobile/lib/authApi.ts` | `apiPost`/`apiGet` now use a shared `fetchWithTimeout` (15s `AbortController` timeout) — guarantees the sign-in/sign-up spinner stops with a visible error instead of spinning forever |
| `apps/mobile/package.json` / `package-lock.json` | Added `react-native-svg` (Expo SDK 56-compatible) |

---

## Notes

- `tsc --noEmit`: 0 errors
- No backend files touched — full backend suite re-run to confirm zero regressions (see Backend Test Cases)
- **Apple Sign-In backend integration is explicitly out of scope** for this pass and remains a future step: requires Apple Developer account credentials, `/api/v1/auth/apple` endpoint, and `expo-apple-authentication` config plugin entry in `app.config.ts`
- Login-hang investigation (#5): production API (`https://api.trekyatra.co.in`) responds correctly via `curl` (401 in ~0.3-0.5s), so the hang was frontend-side. The 15s timeout in `authApi.ts` guarantees the spinner resolves; if the user reproduces the hang again, Metro/console logs will be used for a follow-up root-cause fix.
- `AuthGate` change: anonymous users can now reach all `(tabs)` screens. `useRequireAuth()` (used by `account.tsx` and `saved.tsx`) continues to redirect anonymous users to sign-in only when they open those specific screens.
- `gitnexus_detect_changes(scope: "all")`: 39 changed symbols across 15 files, risk_level **medium**, 2 affected processes — both `SignInScreen → ApiGet` and `SignInScreen → UseThemeContext` (expected, given the Skip button + `apiGet` timeout changes in `sign-in.tsx`/`authApi.ts`). No unexpected scope. `npx gitnexus analyze --force` was triggered but ran long (>20 min) due to the pre-existing FTS read-only-DB issue on this machine (same non-blocking issue noted in the prior Mobile Crosscheck Bugfix Pass); it was not blocking since `detect_changes` already returned valid results from the existing index.

---

## Backend Test Cases — STEP-M-DS2

No backend files were modified in this pass. Full suite re-run to confirm zero regressions:

Run: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -q`

N/A — no new backend test cases (no backend changes).

---

## Frontend Test Cases — STEP-M-DS2

Run: `cd apps/mobile && npx expo start` (open in iOS Simulator or Expo Go)

### TC-M-DS2-F01: Animated splash plays on cold launch
**Steps:**
1. Force-quit and relaunch the app
**Expected:** Native splash (`#0c0e14`) is replaced almost instantly by the animated splash: dark mountain silhouette fades in, a saffron trail line draws upward, tent/leaf/sparkle icons appear along it, the trail fades and the TrekYatra logo settles at the peak with a sunrise glow, then the tagline "Explore. Dream. Discover." fades in. The whole sequence (~4s) fades out into the app.
**Pass =** Animation plays once, no flicker/flash of unstyled content, and transitions cleanly into onboarding/Home

---

### TC-M-DS2-F02: Onboarding — full-bleed background + contrast
**Steps:**
1. On a fresh install (or after clearing `trekyatra_onboarding_done` from AsyncStorage), view the welcome/onboarding carousel
2. Check both light and dark device appearance settings
**Expected:** Background photo fills the entire screen edge-to-edge (including under the status bar). Icon badge is clearly visible (white icon on dark translucent badge) regardless of slide/photo brightness, in both light and dark mode.
**Pass =** No gaps/borders around the photo; icon glyph legible on every slide in both modes

---

### TC-M-DS2-F03: Onboarding — back navigation + new USP copy
**Steps:**
1. Swipe/tap "Next →" to slide 2, 3, then 4
2. On slide 2+, tap the back-chevron (top-left)
**Expected:** Back chevron is hidden on slide 1, visible on slides 2-4; tapping it returns to the previous slide. Slide 3 reads "Plan in 60 seconds — picked for you" (AI planner + personalised recs). Slide 4 reads "Trek offline. Book with trusted operators" (offline maps + operator booking).
**Pass =** Back navigation works on slides 2-4; new copy visible on slides 3 & 4

---

### TC-M-DS2-F04: Skip from sign-in/sign-up → anonymous Home
**Steps:**
1. From onboarding, tap "Start exploring →" (or "Already have an account? Sign in")
2. On the sign-in (or sign-up) screen, tap "Skip" (top-right)
**Expected:** App navigates directly to the Home tab without requiring sign-in. All `(tabs)` screens are browsable while logged out.
**Pass =** Home tab loads; bottom tab navigation works while anonymous

---

### TC-M-DS2-F05: Anonymous user hits an auth-gated tab
**Steps:**
1. While anonymous (after Skip), tap the "Account" or "Saved" tab
**Expected:** Redirected to the sign-in screen (via `useRequireAuth`), unlike the other tabs which remain browsable.
**Pass =** Account/Saved redirect to sign-in; Home/Browse/Plan remain accessible anonymously

---

### TC-M-DS2-F06: Google + Apple sign-in buttons
**Steps:**
1. On the sign-in screen, scroll to "or continue with"
2. (iOS only) observe the Apple button
3. Tap "Sign in with Apple"
**Expected:** "Continue with Google" shows a Google "G" icon. On iOS, "Sign in with Apple" is visible with an Apple icon; tapping it shows a "Coming soon" alert (no crash, no navigation).
**Pass =** Google icon visible; Apple button visible on iOS with working "coming soon" alert

---

### TC-M-DS2-F07: Sign-in timeout / no infinite spinner
**Steps:**
1. On the sign-in screen, enter valid (or invalid) credentials and tap "Sign in"
2. If the backend is unreachable or slow, wait
**Expected:** Either sign-in succeeds and navigates to Home, or an error `Alert` appears (e.g. "Request timed out. Check your connection and try again.") within 15 seconds. The spinner never spins indefinitely.
**Pass =** Spinner always resolves to either success navigation or a visible error within 15s

---

## Follow-up Fixes (2026-06-11)

A second QA pass (with screenshots) on the rebuilt dev client found 4 remaining issues, all fixed in `apps/mobile/` only:

1. **Splash logo too small** — `AnimatedSplash.tsx`: `logoWrap`/`logo` increased 72×72 → 140×140.
2. **Skip → bounced back to onboarding** — `AuthGate` read `trekyatra_onboarding_done` into local state once on mount; `handleSkip` etc. wrote to `AsyncStorage` without updating that state, so the next `AuthGate` effect (triggered by the route change) still saw `onboardingDone=false` and redirected back to `/(auth)/welcome`. Fixed via new `apps/mobile/providers/OnboardingProvider.tsx` (Context wrapping `AsyncStorage`, exposes `{ isLoading, done, markDone }`); `AuthGate` now uses `useOnboarding()`, and `welcome.tsx`/`sign-in.tsx`/`sign-up.tsx` call `markDone()`.
3. **Onboarding background — hard edge, not a gradient** — the "layered gradient" was 7 stacked solid `View`s; the largest+most-opaque layer (55% height, 0.85 opacity) rendered topmost and fully covered the others, producing one hard-edged solid block (looked like a fixed-height background with no blend). Replaced with a single `expo-linear-gradient` `LinearGradient` (`transparent → rgba(5,8,15,0.92)`, `locations=[0, 0.4, 0.7, 1]`) over the full `ImageBackground`.
4. **Native dev-client rebuild for `react-native-svg`** — `apps/mobile/ios/` (gitignored, prebuilt) was rebuilt via `expo prebuild` + `pod install` (added `RNSVG 15.15.4`) + `expo run:ios` to link the native module — this fixed the "Unimplemented component: <RNSVGSvgView>" splash crash from the first QA pass.

**Files Created**: `apps/mobile/providers/OnboardingProvider.tsx`
**Files Modified**: `apps/mobile/components/ui/AnimatedSplash.tsx`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(auth)/welcome.tsx`, `apps/mobile/app/(auth)/sign-in.tsx`, `apps/mobile/app/(auth)/sign-up.tsx`

`tsc --noEmit`: 0 errors. No backend changes.

### Frontend Test Cases — Follow-up Fixes

### TC-M-DS2-FU01: Splash logo size
**Steps:** Force-quit and relaunch the app.
**Expected:** The TrekYatra logo at the peak of the splash animation is noticeably larger (140×140) than before, proportionate to the screen.
**Pass =** Logo is clearly larger and well-proportioned, not tiny relative to the mountain silhouette.

### TC-M-DS2-FU02: Skip → Home (no bounce-back)
**Steps:**
1. From onboarding, tap "Start exploring →" or "Already have an account? Sign in"
2. On the sign-in (or sign-up) screen, tap "Skip"
**Expected:** App navigates directly to `(tabs)/(home)` and stays there — does NOT bounce back to the onboarding/welcome screens.
**Pass =** Home tab loads and remains; bottom tab navigation works while anonymous.

### TC-M-DS2-FU03: Onboarding full-bleed gradient
**Steps:** Clear `trekyatra_onboarding_done` (or fresh install), view the welcome carousel, swipe through all 4 slides.
**Expected:** Each slide's photo fills the entire screen; a smooth gradient (not a hard line) darkens from transparent at top to near-opaque at the bottom, keeping headline/subtext legible against any photo.
**Pass =** No visible hard edge/seam between photo and overlay; text legible on all 4 slides.
