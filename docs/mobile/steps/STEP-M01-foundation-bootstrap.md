# STEP-M01 — Expo Project Bootstrap + Navigation + Design System

**Status:** Done (2026-06-03)
**Phase:** Foundation
**Dependencies:** None (first mobile step)
**Estimated effort:** 2–3 days

---

## Scope

Scaffold the entire React Native mobile application structure. This step creates the monorepo workspace entry point at `apps/mobile/`, wires file-based navigation with Expo Router v3, establishes the NativeWind design system, loads custom fonts, sets up Sentry error reporting, and ensures both Android and iOS builds export cleanly.

Nothing UI-functional is built in this step — only the structural shell that all subsequent steps build on top of.

---

## Files to Create

### App Root
| File | Purpose |
|------|---------|
| `apps/mobile/` | New workspace entry (added to root `package.json` workspaces) |
| `apps/mobile/package.json` | Expo SDK 51 deps, NativeWind, Expo Router, Sentry, Zustand, TanStack Query |
| `apps/mobile/app.config.ts` | Dynamic Expo config (name, slug, bundle IDs, icons, splash, permissions) |
| `apps/mobile/eas.json` | EAS Build profiles: development, preview, production |
| `apps/mobile/metro.config.js` | NativeWind Metro transformer config |
| `apps/mobile/babel.config.js` | Babel + NativeWind plugin |
| `apps/mobile/tsconfig.json` | TypeScript config (strict, path aliases: @/ → app/) |
| `apps/mobile/global.css` | NativeWind global stylesheet (imports Tailwind base) |
| `apps/mobile/tailwind.config.js` | Tailwind config with TrekYatra design tokens |

### Navigation (Expo Router file-based)
| File | Route | Purpose |
|------|-------|---------|
| `apps/mobile/app/_layout.tsx` | Root layout | Providers: QueryClient, AuthProvider, AnalyticsProvider, ThemeProvider |
| `apps/mobile/app/(tabs)/_layout.tsx` | Tab bar | 5 tabs: Home, Browse, Plan, Saved, Account |
| `apps/mobile/app/(tabs)/index.tsx` | `/` (Home tab) | Placeholder HomeScreen |
| `apps/mobile/app/(tabs)/browse.tsx` | `/browse` | Placeholder ExploreScreen |
| `apps/mobile/app/(tabs)/plan.tsx` | `/plan` | Placeholder PlanScreen |
| `apps/mobile/app/(tabs)/saved.tsx` | `/saved` | Placeholder SavedScreen |
| `apps/mobile/app/(tabs)/account.tsx` | `/account` | Placeholder AccountScreen |
| `apps/mobile/app/(auth)/_layout.tsx` | Auth group | Unauthenticated flow layout |
| `apps/mobile/app/(auth)/sign-in.tsx` | `/sign-in` | Placeholder SignInScreen |
| `apps/mobile/app/(auth)/sign-up.tsx` | `/sign-up` | Placeholder SignUpScreen |
| `apps/mobile/app/+not-found.tsx` | 404 | Not found screen |

### Design System
| File | Purpose |
|------|---------|
| `apps/mobile/components/ui/Button.tsx` | Native pressable with haptic feedback + variant system |
| `apps/mobile/components/ui/Badge.tsx` | Status badge (same colour map as web) |
| `apps/mobile/components/ui/Card.tsx` | Surface card with border |
| `apps/mobile/components/ui/SkeletonLoader.tsx` | Animated loading placeholder |
| `apps/mobile/components/ui/SafeArea.tsx` | SafeAreaView wrapper with background |
| `apps/mobile/components/ui/Typography.tsx` | Display / Body / Caption / Mono text components |
| `apps/mobile/constants/theme.ts` | Colour tokens, font families, spacing scale |

### Shared Types (new shared package)
| File | Purpose |
|------|---------|
| `packages/types/index.ts` | Trek, CMSPage, User, RecommendationItem shared interfaces |
| `packages/types/package.json` | `@trekyatra/types` package |

### Providers
| File | Purpose |
|------|---------|
| `apps/mobile/providers/QueryProvider.tsx` | TanStack Query client |
| `apps/mobile/providers/AuthProvider.tsx` | Auth state context (Zustand store adapter) |
| `apps/mobile/stores/authStore.ts` | Zustand auth store (token, user, isLoading) |

---

## Dependencies (package.json)

```json
{
  "expo": "~51.0.0",
  "expo-router": "~3.5.0",
  "react-native": "0.74.x",
  "nativewind": "^4.0.0",
  "tailwindcss": "^3.4.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.5.0",
  "expo-font": "~12.0.0",
  "expo-secure-store": "~13.0.0",
  "expo-status-bar": "~1.12.0",
  "expo-splash-screen": "~0.27.0",
  "@sentry/react-native": "~5.22.0",
  "react-native-reanimated": "~3.10.0",
  "react-native-gesture-handler": "~2.16.0",
  "@gorhom/bottom-sheet": "^4.6.0"
}
```

---

## Design Token Mapping (web → mobile)

```typescript
// constants/theme.ts
export const colors = {
  background:   '#0c0e14',
  surface:      '#14161f',
  border:       'rgba(255,255,255,0.10)',
  accent:       'hsl(22, 92%, 54%)',   // brand orange
  accentGlow:   'hsl(22, 92%, 70%)',
  pine:         'hsl(162, 50%, 42%)',  // success green
  amber:        '#fbbf24',
  blue:         '#60a5fa',
  red:          '#f87171',
  textPrimary:  '#ffffff',
  textSecondary:'rgba(255,255,255,0.70)',
  textMuted:    'rgba(255,255,255,0.40)',
};

export const fonts = {
  display:  'PlayfairDisplay_600SemiBold',
  body:     'Inter_400Regular',
  bodyMed:  'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  mono:     'JetBrainsMono_400Regular',
};
```

---

## Tab Bar Configuration

```
Tab 1: Home     icon=house.fill       route=/
Tab 2: Browse   icon=compass          route=/browse
Tab 3: Plan     icon=sparkles         route=/plan     (CTA style — accent background)
Tab 4: Saved    icon=bookmark.fill    route=/saved
Tab 5: Account  icon=person.circle    route=/account
```

Tab bar colours:
- Background: `#0f1117` (dark navy — same as web sidebar)
- Active tint: accent orange
- Inactive tint: `rgba(255,255,255,0.40)`

---

## Tailwind Config (design token mapping)

```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0c0e14',
        surface:    '#14161f',
        accent:     'hsl(22 92% 54%)',
        pine:       'hsl(162 50% 42%)',
      },
      fontFamily: {
        display: ['PlayfairDisplay_600SemiBold'],
        sans:    ['Inter_400Regular'],
      },
    },
  },
  plugins: [],
};
```

---

## Sentry Setup

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV,
});
```

---

## Verification

### Build check
```bash
cd apps/mobile
npx expo export --platform all          # must succeed, zero errors
npx tsc --noEmit                        # zero TypeScript errors
```

### Device check (manual)
1. `npx expo start` → scan QR with Expo Go on Android
2. `npx expo start` → scan QR with Expo Go on iOS
3. All 5 tabs visible, each shows placeholder text
4. Tab bar renders with correct dark background + orange active indicator
5. No console errors or yellow warnings

---

## Notes

- `apps/mobile/` lives in the same monorepo as `apps/web-next/` and `services/api/`
- The `packages/types/` shared package is new — add to root `package.json` workspaces
- Expo Router v3 uses the `/app` directory for file-based routing (same convention as Next.js App Router but with `/app/(tabs)/` for the tab group)
- NativeWind v4 requires Metro config change + babel plugin — follow official NativeWind v4 setup guide exactly
- Do NOT use Expo Go for Step M02 onwards — many packages (SecureStore, biometric, push) require a dev build
- **Expo SDK upgraded from 51 → 56** at implementation time (SDK 51 was EOL). `react-native@0.85.3`, Expo Router `~56.0.0`, React 19 peer dep.
- **Reanimated pinned to `~3.16.0`** (v3.x) — v4 requires `react-native-worklets` which is not in mobile scope until M07.
- **`apps/mobile` must NOT be in npm workspaces** (`"apps/*"` glob must NOT be used). `react-native@0.85.3` declares `react@^19.2.3` as peer dep; if mobile is in workspaces, npm hoists React 19 to root, causing React error #31 on Next.js's `/404`/`/500` SSR prerender. Root `package.json` workspaces must be `["apps/web-next", "packages/*"]` — explicitly excluding mobile.
- **Post-push deployment failures (Failure 1–4):** See MASTER_TRACKER.md § "Step M01 — Post-push Deployment Fixes" for full incident log.
