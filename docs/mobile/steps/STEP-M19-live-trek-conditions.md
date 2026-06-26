# STEP-M19 — Live Trek Conditions (Mobile)

## Status: Done

## Scope
Mobile parity for the Live Trek Conditions feature (STEP-80 backend). Adds weather + trail/permit status widget to the trek detail screen and a dedicated full conditions screen.

## Depends On
- STEP-80 backend must be deployed: `GET /api/v1/public/treks/{slug}/conditions`

## Mobile Files Created
- `apps/mobile/hooks/useConditions.ts` — fetches + caches conditions via SWR/useEffect; returns `ConditionOut | null | "loading" | "no-data"`
- `apps/mobile/components/trek/ConditionsWidget.tsx` — inline widget shown in trek detail (compact view: weather icon + temp, trail badge, permit badge)
- `apps/mobile/components/conditions/LiveConditionsScreen.tsx` — full-screen conditions detail (expanded weather 3-day forecast, trail status explanation, permit info, last updated time)

## Mobile Files Modified
- `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx` — add `ConditionsWidget` below hero section; add "View full conditions" link that navigates to `LiveConditionsScreen`

## UI Design
### ConditionsWidget (inline in trek detail)
- Card with `CloudSun` icon + section title "Live Conditions"
- Current temp (°C) + weather label (e.g. "Partly Cloudy")
- Trail status pill: green = open, amber = caution, red = closed
- Permit badge: shows "Permit Required" or "No Permit Required"
- "View details" arrow → navigates to `LiveConditionsScreen`
- Offline: shows cached data with "last updated" label; no data → section hidden

### LiveConditionsScreen (full-screen)
- Header: trek name + "Live Conditions"
- Current weather: large temp, weather label, humidity, wind speed
- 3-day forecast: horizontal scroll cards (day + icon + min/max temp)
- Trail Status card: status + explanation text
- Permit Status card: required/not + notes text
- Last updated timestamp + "Refresh" button
- Back navigation

## Type Safety
- Full TypeScript: `ConditionOut` interface imported/re-declared from shared API contract
- No `any` types
- All API fields optional-chained

## Offline Behaviour
- Cached result stored via `AsyncStorage` keyed `conditions_${slug}`
- On network error: serve cache, show "Offline – data from [date]" banner
- No cached data + offline: hide section entirely (no error state shown)

## Accessibility
- `accessibilityLabel` on all icon-only buttons
- Trail status uses both colour AND text label (not colour-only)
- Forecast cards: `accessibilityLabel="Day forecast: Mon, 22°C high, 14°C low"`

## Notes
- 3-day forecast: min/max temp per day from `forecast` array in `weather_json`
- `weather_json` structure is whatever Open-Meteo returns; parsed in `useConditions.ts`
- Both iOS and Android manually tested per CLAUDE.md mobile rules
