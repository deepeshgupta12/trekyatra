# STEP-M-DS1 — Mobile Design System Overhaul

**Status:** Done ✓ (2026-06-10)
**Phase:** Foundation
**Dependencies:** STEP-M01 (Expo bootstrap), STEP-M02 (auth screens), STEP-M04 (offline layer)
**Precedes:** STEP-M05 (trek detail) — all subsequent screens use these tokens

---

## Scope

Replace the dark-only admin-style design system with the full TrekYatra brand identity as specified in the product design spec:

- **Design tokens**: Pine (dark forest green), Saffron (warm orange), Sky (steel blue), Earth (warm brown), Mist (light gray), Paper (warm cream) — shared DNA with the web platform
- **Dark mode**: System-based + user-toggle using NativeWind v4's `useColorScheme` / `setColorScheme`
- **Onboarding redesign**: 4-slide full-bleed mountain photography carousel replacing the 3-emoji slide version
- **Custom FAB tab bar**: Center Plan button raised above the tab bar (iOS + Android)
- **Auth screens**: Light design (Paper background, Pine text) replacing dark theme
- **Splash**: Pine dark green background (`#1D3A2E`) matching the cinematic app launch
- **Logo**: Actual TrekYatra logo asset used in onboarding, auth, and splash screens

---

## Color Tokens

### Light Mode
| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| Pine | `hsl(162, 42%, 14%)` | `#1D3A2E` | Primary text, headings, dark backgrounds |
| Saffron | `hsl(22, 95%, 56%)` | `#E8702A` | CTAs, active states, FAB, badges |
| Sky | `hsl(205, 60%, 56%)` | `#5298C9` | Links, info badges, icons |
| Earth | `hsl(28, 35%, 32%)` | `#6B4929` | Secondary text, captions |
| Mist | `hsl(200, 20%, 95%)` | `#EBF2F2` | Borders, dividers, card backgrounds |
| Paper | `hsl(36, 50%, 96%)` | `#FAF5EE` | Page backgrounds, card fills |

### Dark Mode (mirrors existing dark theme)
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0c0e14` | Page background |
| Surface | `#14161f` | Card background |
| Border | `rgba(255,255,255,0.10)` | Borders/dividers |
| Text primary | `#ffffff` | Headings |
| Text secondary | `rgba(255,255,255,0.70)` | Body text |
| Saffron | `#E8702A` | CTAs (same as light) |
| Pine dark | `#0c1a12` | Splash, profile header |

---

## Onboarding Slides (4)

| # | Icon | Headline | Sub | Photo |
|---|------|---------|-----|-------|
| 1 | Compass (Saffron) | 250+ India-first trek guides | Curated by editors who've been there — from Sahyadris to Sikkim | `onboarding-1.jpg` (himalaya dawn) |
| 2 | Shield (Pine dark) | Trust-first safety intel | Permits, weather windows, AMS, and risk grades verified by certified guides | `onboarding-2.jpg` (pink mountains) |
| 3 | Map (Sky) | Offline maps & GPX | Download routes, elevation profiles & camp coords. Trail-ready, no signal | `onboarding-3.jpg` (ladakh landscape) |
| 4 | Sparkles (Earth) | Plan in 60 seconds | AI matches you to the right trek by season, fitness, budget & start city | `onboarding-4.jpg` (snowy peaks) |

---

## Tab Bar (Custom FAB)

```
[ Home ] [ Explore ]  [● Plan ●]  [ Saved ] [ You ]
                    ↑ raised FAB (saffron circle, 56px)
```

- Light mode: Paper/white tab bar background, shadow above
- Dark mode: `#0f1117` background, white/10 border
- Active icon/label: Saffron
- Inactive: Gray/muted
- Plan FAB: 56px saffron circle, 8px elevation, -20px `marginTop` to create the raise effect

---

## Files Created
| File | Purpose |
|------|---------|
| `apps/mobile/providers/ThemeProvider.tsx` | NativeWind color scheme + AsyncStorage user preference |
| `apps/mobile/hooks/useTheme.ts` | `useTheme()` hook returning isDark + toggleTheme + setTheme |
| `apps/mobile/components/ui/Logo.tsx` | TrekYatra logo component (image + text mark) |
| `apps/mobile/components/tabs/CustomTabBar.tsx` | FAB-elevated Plan tab bar |
| `apps/mobile/assets/onboarding-1.jpg` through `onboarding-4.jpg` | Onboarding trek photos |
| `apps/mobile/assets/logo.png` | TrekYatra logo (copied from web) |

## Files Modified
| File | Change |
|------|--------|
| `apps/mobile/constants/theme.ts` | Full rewrite — Pine/Saffron/Sky/Earth/Mist/Paper + dark mode object |
| `apps/mobile/tailwind.config.js` | New tokens + `darkMode: 'class'` |
| `apps/mobile/app/(auth)/welcome.tsx` | 4-slide full-bleed photo carousel |
| `apps/mobile/app/(tabs)/_layout.tsx` | Custom `CustomTabBar` + hidden downloads tab |
| `apps/mobile/app/(auth)/sign-in.tsx` | Light/dark aware design |
| `apps/mobile/app/(auth)/sign-up.tsx` | Light/dark aware design |
| `apps/mobile/components/ui/SafeArea.tsx` | Theme-aware background |
| `apps/mobile/components/ui/Button.tsx` | Saffron + light mode aware |
| `apps/mobile/app/_layout.tsx` | Wrapped in ThemeProvider |
| `apps/mobile/app.config.ts` | Splash background → Pine `#1D3A2E` |

---

## Frontend Test Cases (Pending Manual Verification)

Run: `cd apps/mobile && npx expo start` (open in iOS Simulator or Expo Go)

### TC-M-DS1-F01: Onboarding carousel — full-bleed photos
**URL:** Onboarding (fresh install or clear AsyncStorage `trekyatra_onboarding_done`)
**Steps:**
1. Clear app data / fresh install
2. Launch the app
**Expected:** 4 full-bleed mountain photos fill the entire screen; dark gradient overlay from bottom; saffron/pine/sky/earth icon in glassmorphic box for each slide; white Playfair Display headline + muted subtext; 4 progress dots (active dot elongated saffron); saffron "Next →" button
**Pass =** Swipe through all 4 slides; slide 4 shows "Start exploring →" + "Already have an account? Sign in" link

### TC-M-DS1-F02: Onboarding — slide icons match spec
**Steps:**
1. Reach onboarding fresh state
2. Swipe through all 4 slides
**Expected:** Slide 1: compass icon (saffron); Slide 2: shield-checkmark (pine); Slide 3: map (sky); Slide 4: sparkles (earth)
**Pass =** Each icon color matches the spec exactly

### TC-M-DS1-F03: Sign-in screen — light design
**Steps:**
1. Complete onboarding → "Start exploring →" → land on sign-up → tap "Sign in"
**Expected:** Paper/white background (`#FAF5EE`); TrekYatra logo at top; "Welcome back" in Pine Playfair Display; subtle bordered inputs (Pine 15% border); saffron "Forgot password?" link; saffron "Sign in" button with glow shadow
**Pass =** No dark background visible; logo PNG renders correctly

### TC-M-DS1-F04: Sign-up screen — light design
**Steps:**
1. Complete onboarding → "Start exploring →"
**Expected:** Same Paper background; TrekYatra logo at top; "Join TrekYatra" heading; saffron "Create account" button with glow
**Pass =** Light design consistent with sign-in screen

### TC-M-DS1-F05: Custom FAB tab bar — layout and behavior
**Steps:**
1. Sign in and reach main tabs
**Expected:** Tab bar at bottom; 5 items: Home, Explore, [Plan FAB], Saved, You; Plan button is 56px saffron circle raised 20px above bar with saffron glow shadow; active tab turns saffron; inactive tabs use muted color
**Pass =** Tapping Plan navigates to plan screen; tapping other tabs navigates correctly

### TC-M-DS1-F06: Tab labels renamed
**Expected:** Second tab shows "Explore" (not "Browse"); fifth tab shows "You" (not "Account")
**Pass =** No "Browse" or "Account" labels visible in tab bar

### TC-M-DS1-F07: Downloads tab hidden
**Expected:** Only 5 tabs visible (Home, Explore, Plan, Saved, You); Downloads screen is NOT a tab
**Pass =** Exactly 5 items in tab bar; no Downloads tab

### TC-M-DS1-F08: Light mode default
**Steps:**
1. Set device to light mode; launch app fresh
**Expected:** Auth screens show Paper (#FAF5EE) background; tab bar shows white background; text is Pine (#1D3A2E)
**Pass =** No dark background on any auth or main screen in light mode

### TC-M-DS1-F09: Dark mode — system-driven
**Steps:**
1. Set device to dark mode in iOS/Android Settings
2. Launch app
**Expected:** App automatically adapts: dark background (#0c0e14), white text, dark tab bar (#0f1117)
**Pass =** Both auth screens and main screens flip to dark without layout breaks

### TC-M-DS1-F10: Splash screen color
**Steps:**
1. Cold-launch the app from home screen
**Expected:** Pine dark green (#1D3A2E) splash background appears before content loads
**Pass =** Green splash (not near-black); consistent with brand

---

## Blast Radius Assessment

| Symbol | Risk | Impact |
|--------|------|--------|
| `constants/theme.ts` | MEDIUM | Button, SafeArea, all screens read `colors.*` |
| `tailwind.config.js` | MEDIUM | NativeWind CSS class compilation for all components |
| `(tabs)/_layout.tsx` | LOW | Leaf component, only affects tab bar visual |
| `app/_layout.tsx` | LOW | Additive ThemeProvider wrapper |
| `SafeArea.tsx` | LOW | Leaf; background color becomes theme-aware |
| `Button.tsx` | LOW | Leaf; hero variant gets saffron background |

**No backend impact. No web-next impact.**

---

## Notes
- NativeWind v4 ships `setColorScheme` / `useColorScheme` — no custom CSS-in-JS needed
- `setColorScheme('system')` reads device OS preference; user toggle overrides with AsyncStorage
- Onboarding photos are bundled (not network) for offline-first availability
- Dark mode splash: Expo splash is static; Pine green background set via `app.config.ts backgroundColor`
- `downloads.tsx` hidden from tab bar via `href: null` (accessible via deep link from Saved screen)
- `tsc --noEmit`: 0 errors after implementation
