---
name: mobile-design-system
description: "Use whenever creating or modifying any screen/component under apps/mobile/. Covers theme tokens, fonts, NativeWind config, navigation/tab-bar conventions, and the most common mobile UI bugs (font mismatches, route-name mismatches, stale API contracts) found during the M-DS1–M06 crosscheck."
---

# TrekYatra Mobile Design System (apps/mobile)

## When to Use

- Building or editing any screen/component in `apps/mobile/app/**` or `apps/mobile/components/**`
- Adding a new font, color, or spacing token
- Adding/editing tabs in `(tabs)/_layout.tsx` or `CustomTabBar.tsx`
- Wiring a new screen to a backend API (`lib/mobileApi.ts`)

## Source of Truth

| Concern | File |
|---------|------|
| Colors (light/dark) | `apps/mobile/constants/theme.ts` (`lightColors`, `darkColors`) |
| Theme hook | `apps/mobile/hooks/useTheme.ts` → `{ colors, isDark, toggleTheme, setTheme }` |
| Fonts | `apps/mobile/constants/theme.ts` (`fonts`) + loaded in `apps/mobile/app/_layout.tsx` via `useFonts()` |
| Spacing / radius | `apps/mobile/constants/theme.ts` (`spacing`, `radius`) |
| NativeWind tokens | `apps/mobile/tailwind.config.js` (must mirror `theme.ts` brand colors) |
| Tab bar | `apps/mobile/components/tabs/CustomTabBar.tsx` + `apps/mobile/app/(tabs)/_layout.tsx` |
| Mobile API client | `apps/mobile/lib/mobileApi.ts` |

## Color Palette (brand tokens — same in light & dark)

| Token | Value | Use |
|-------|-------|-----|
| `pine` | `#1D3A2E` | Primary text/headings (light mode), brand green |
| `saffron` / `accent` | `#E8702A` | CTAs, active tab, FAB, links |
| `sky` | `#5298C9` | Info badges, links |
| `earth` | `#6B4929` | Secondary/caption text |
| `mist` | `#EBF2F2` | Borders, subtle backgrounds |
| `paper` | `#FAF5EE` | Light-mode page background |

Dark mode background `#0c0e14`, surface `#14161f`, sidebar `#0f1117` — matches the admin web palette in the root `CLAUDE.md`.

Always read colors via `useTheme().colors` (StyleSheet components) or NativeWind tokens (`bg-pine`, `text-accent`, etc.) — never hardcode hex values for brand colors in new code.

## Fonts — MANDATORY CHECK

Three font families are used: `Inter` (body), `PlayfairDisplay` (display/headings), `JetBrainsMono` (mono/code).

**Every font weight referenced anywhere in `apps/mobile/**` via a literal `fontFamily: "..."` string MUST be imported and passed to `useFonts()` in `apps/mobile/app/_layout.tsx`.** RN silently falls back to the system font if a `fontFamily` isn't loaded — this produces "broken UI" symptoms (wrong weight/size, layout shift) with **no error or warning**.

Before adding a new `fontFamily: "X_700Bold"` reference:
1. `grep -rn "fontFamily" apps/mobile/components apps/mobile/app | grep -o '"[A-Za-z_0-9]*"' | sort -u` — list all referenced font strings
2. Cross-check against the `useFonts({...})` block in `apps/mobile/app/_layout.tsx`
3. If a referenced weight isn't loaded, either add it to `useFonts()` (preferred — confirm the `.ttf` exists under `node_modules/@expo-google-fonts/<family>/`) or change the component to use an already-loaded weight

`constants/theme.ts` exports a `fonts` object (`fonts.display`, `fonts.body`, etc.) — prefer referencing these constants over hardcoded strings so there's a single place to update.

## Navigation / Tab Bar Conventions

- The Home tab's route group is **`(home)`**, not `index` (changed in STEP-M05 to enable a stack navigator for trek detail screens). Any switch/lookup keyed on `route.name` (e.g. `CustomTabBar.getIconName`, `getLabelText`) **must use `"(home)"`**, not `"index"`.
- The "Plan" tab (`route.name === "plan"`) is rendered as a center FAB in `CustomTabBar` and bypasses `getIconName`/`getLabelText` entirely — don't add a case for it in those switches.
- When adding a new tab in `(tabs)/_layout.tsx`, also add a corresponding case to `getIconName` and `getLabelText` in `CustomTabBar.tsx` — `default` falls back to `"ellipse-outline"` and the raw route name as the label, which looks broken.

## API Contract Discipline (lib/mobileApi.ts)

Mobile screens must call **endpoints that actually exist on the backend** — TypeScript will not catch a wrong URL string. Before adding a `contentApi`/`accountApi` method:

1. Grep `services/api/app/api/routes/**` for the route (check `router = APIRouter(prefix=...)` + the `@router.get/post(...)` path)
2. Check the route's `response_model` in `services/api/app/schemas/**` and map the response shape to the mobile TS interface (e.g. `CMSPageResponse` → `TrekListItem`) — don't assume field names match
3. Known mappings already implemented in `mobileApi.ts`:
   - Trending treks → `GET /api/v1/cms/pages/trending` (`CMSPageResponse[]`)
   - Seasonal treks → `GET /api/v1/treks/seasonal?month=` (`CMSPageResponse[]`)
   - Anonymous/personalised recs → `GET /api/v1/recommendations` / `GET /api/v1/account/recommendations` (`RecommendationsResponse{personalised, items}`)
   - Save/bookmark a trek → `POST /api/v1/account/bookmarks/by-slug` body `{trek_slug}`

## Glass UI (GlassSurface)

Since M-DS8, the app uses a platform-adaptive "Glass UI" aesthetic via a single reusable primitive: `apps/mobile/components/ui/GlassSurface.tsx`.

- **Always use `GlassSurface` instead of a one-off `BlurView`/`GlassView`.** Props: `children`, `style?`, `rounded?: keyof typeof radius | "none"` (default `"lg"`), `intensity?` (default 35, Android blur intensity), `glassStyle?: "regular"|"clear"` (default `"regular"`), `bordered?: boolean` (default `true`).
- **Platform branching is automatic**: on `Platform.OS === "ios" && isLiquidGlassAvailable()` it renders `expo-glass-effect`'s `GlassView` (native Apple Liquid Glass, iOS 26+); everywhere else it renders `expo-blur`'s `BlurView` with a `colors.glassOverlay` tint `View` underneath for text legibility.
- **Theme tokens**: `glassTint`, `glassBorder`, `glassOverlay` exist in both `lightColors` and `darkColors` in `constants/theme.ts` — don't hardcode rgba values for glass surfaces.
- **Corner radius on bottom sheets / partial rounding**: pass `rounded="none"` (sets `borderRadius: 0` on all corners as the base) then override only the corners you need in `style` (e.g. `borderTopLeftRadius`/`borderTopRightRadius: 20`) — RN merges per-property, so unset corners stay 0.
- **Performance guardrail**: limit to ~2-3 stacked `GlassSurface` layers per screen — GPU blur cost compounds with each layer.
- **Legibility/affordance rule**: active/selected states (active tab chips, the active "Filters" toggle, primary CTAs/buttons) stay **solid saffron** (`#E8702A`) — never glassed. Only "chrome/surface" containers (cards, bars, sheets, inactive chips, form inputs) get `GlassSurface`.
- **Deferred**: stack header glass (`headerTransparent` + `headerBackground`) — not applied; would require top-padding/safe-area changes across every screen in the affected `Stack`. Don't add it without a dedicated step.
- **Native module rebuild**: `expo-glass-effect` and `expo-blur` are native modules — a dev-client rebuild (`eas build --profile development` or `npx expo run:ios`/`run:android`) is required before glass effects render on-device (cumulative with the M07b `expo-speech-recognition` rebuild requirement).

## Process Hook

This skill is referenced from the root `CLAUDE.md` "Pre-Step Checklist" for any mobile step (`docs/mobile/steps/STEP-M*.md`). Read it before implementing or modifying any `apps/mobile/` screen, and re-run the font/route-name/API-contract checks above as part of build validation (in addition to `tsc --noEmit`).
