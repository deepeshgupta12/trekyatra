# TrekYatra Mobile App — Implementation Plan
## V5 Step-by-Step Execution Plan

**Framework:** React Native + Expo Router v3  
**Backend:** FastAPI (services/api/) extended with mobile namespace  
**Last Updated:** 2026-05-29

> Full architecture, feature scope, technology decisions, and milestone targets:
> see `docs/versions/V5-MOBILE-APP.md`

---

## Execution Rules (Mobile)

These rules apply to every mobile step, in addition to the project-wide rules in `CLAUDE.md`:

1. **Pre-step**: Read this file + `V5-MOBILE-APP.md` + the active step doc before writing any code
2. **Backend-first**: If a step requires new backend endpoints, implement + test backend first, then frontend
3. **No mock data**: Never build the UI against stub data — only wire against working endpoints
4. **Offline parity**: Every content screen that loads from the API must also render from the SQLite cache
5. **Both platforms**: Every change must be tested on both Android (Expo Go / EAS dev build) and iOS simulator
6. **Type safety**: No `any` types in TypeScript; all API response shapes must have Zod schemas or typed interfaces
7. **Accessibility**: Every interactive element must have `accessibilityLabel` and `testID` props
8. **Test delivery**: Every step must end with the manual smoke test checklist delivered to the user

---

## Phase 1 — Foundation (Steps M01–M05)

### Step M01 — Expo Bootstrap + Navigation + Design System [DONE]
- Expo SDK 56 monorepo workspace at `apps/mobile/` (upgraded from spec SDK 51)
- Expo Router v56.x file-based navigation: 5-tab bar (Home/Browse/Plan/Saved/Account) + auth stack
- NativeWind v4 design tokens (mirrors web Tailwind palette exactly)
- Shared type definitions at `packages/types/index.ts` for Trek, CMSPage, User, RecommendationItem
- expo-font + @expo-google-fonts (Playfair Display, Inter, JetBrains Mono)
- Sentry SDK v8 init in root _layout.tsx
- tsc --noEmit: 0 errors; expo export --platform ios: succeeded (79 assets, 5.2MB bundle)
- `react-native-reanimated` pinned to ~3.16.0 (v4 requires react-native-worklets — add in M07 when animations needed)

### Step M02 — Mobile Auth [PENDING]
- Long-lived JWT Bearer token (POST /auth/mobile/token issued via Step M03)
- expo-secure-store for token storage (Keychain/Keystore)
- Email sign-in + sign-up screens wired to existing `/auth/*` endpoints
- Google Sign In (expo-auth-session)
- Apple Sign In (expo-apple-authentication — required for iOS App Store)
- Biometric re-auth (expo-local-authentication) for returning sessions
- Auth state Zustand store + AuthProvider context
- Route guards (redirect to /auth/sign-in if unauthenticated for protected screens)

### Step M03 — Backend Mobile API Extensions [PENDING]
- `POST /api/v1/auth/mobile/token` — issue 30-day access token + refresh token pair
- `GET /api/v1/mobile/sync?last_sync=<ISO>` — incremental CMS page sync
- `POST /api/v1/mobile/device` — register FCM/APNs device token
- `DELETE /api/v1/mobile/device/{device_id}` — unregister on logout
- DB migration: `mobile_devices` table
- Backend tests: mobile token issuance, sync endpoint pagination, device registration
- All tests pass; full test suite regression-free

### Step M04 — CMS Offline Content Engine [PENDING]
- `expo-sqlite` database (`trekyatra.db`) with Drizzle ORM schema
- Tables: `cms_pages` (slug, title, body_json, page_type, hero_image_url, synced_at), `sync_meta` (last_sync_at)
- Sync service: fetch from `/mobile/sync`, upsert into SQLite, handle deleted slugs
- Background sync on app foreground (every 15 min if online)
- Content renderer: `<CMSContentRenderer>` component parses body_json block format into native components
- Offline indicator badge (shows when reading from local cache, no network)
- Trek guide download manager: manual "Download for offline" button per trek

### Step M05 — Trek Detail Screen [PENDING]
- `app/(tabs)/(home)/trek/[slug].tsx` — server fetch first, SQLite fallback
- Native tab bar: Guide | Packing | Permits | Costs (mirrors `/trek/[slug]/packing` etc.)
- Hero image (expo-image with blur placeholder)
- Table of contents (ScrollView anchor links via ref)
- Sticky CTA bar: "Plan with this trek" + "Save" buttons
- Native share sheet (expo-sharing + Linking) → shares `trekyatra.co.in/trek/{slug}`
- Offline save button → downloads guide + all 3 sub-pages to SQLite
- Operator inquiry deeplink to operators screen

---

## Phase 2 — Discovery Layer (Steps M06–M08)

### Step M06 — Home Screen + 4-State Personalisation [PENDING]
Full parity with web homepage personalisation. Client-side 4-state logic:
- **State A** (new logged-in): welcome banner + "Popular treks" feed
- **State B** (repeat logged-in): "Welcome back {name}" + last-viewed chips + personalized feed
- **State C** (new logged-out): generic hero + trending treks + no personalised section
- **State D** (repeat logged-out): "Continue exploring" + recently viewed row + anonymous recs

Components:
- `HomeWelcomeBanner` (States A + B)
- `TrendingTreksRow` (all states)
- `RecentlyViewedRow` (State D)
- `PersonalisedFeedSection` (States A + B + D)
- `SeasonalPicksRow`
- Pull-to-refresh
- Skeleton loading states per section

### Step M07 — Explore & Search [PENDING]
- Browse screen: infinite scroll grid of trek cards
- Filter bottom sheet: state, difficulty, duration, season, altitude (mirrors web explore filters)
- Facet counts from `/api/v1/treks/filter-facets`
- Search screen: text input + recent searches (AsyncStorage) + trending searches
- Fuzzy search via API `/api/v1/search/suggestions`
- Semantic search for long queries (`POST /api/v1/search/semantic`)
- Regional hubs screen (list of states → region page)
- Seasonal hubs screen (Winter/Monsoon/Summer/Spring)

### Step M08 — Trek Comparison [PENDING]
- Compare tab in browse: pick 2 treks from list
- Compare result screen: side-by-side attribute table (difficulty, duration, altitude, season, state, permits)
- Swipeable columns (one column per trek, swipe to compare)
- Save comparison (synced to `/api/v1/account/comparisons`)
- Saved comparisons list in Account tab

---

## Phase 3 — User & Commerce Layer (Steps M09–M13)

### Step M09 — Plan My Trek Wizard [PENDING]
Full parity with web `/plan` wizard (6 steps):
- Step 0: Intent selection (adventure / beginner / monsoon / family / solo / group)
- Step 1: Travel month selector (12-month grid + "Flexible" option)
- Step 2: Duration preference (1-2 days / 3-5 days / 6-8 days / 9+ days)
- Step 3: Fitness + experience sliders
- Step 4: Region preference (state multi-select)
- Step 5: Lead capture (name, email, phone — optional)
- Results screen: top 5 ranked treks with match score + category badges
- `POST /api/v1/plan/search` wired identically to web
- `POST /api/v1/leads` on form submit
- Event tracking: `plan_wizard_step_1` through `plan_wizard_completed` (same as web)

### Step M10 — User Account [PENDING]
- Account tab: dashboard with stats (saved count, completed count, downloads)
- Bookmarks (saved treks): synced to `GET/POST/DELETE /api/v1/account/saved`
- Downloads: list of purchased digital products with download button
- Enquiry history: trek planning leads submitted
- Account settings: name, email, profile photo (expo-image-picker)
- Language preference: English / Hindi (persisted in AsyncStorage + user profile)
- Notification preferences: per-category toggles
- Premium status card (upgrade CTA or subscription details)
- Sign out: clears secure store + unregisters device push token

### Step M11 — Operators Marketplace [PENDING]
- Operators list screen: region filter + search
- Operator detail screen: cover photo, description, specialities, reviews, certifications
- Inquiry form: name, email, phone, trek of interest, dates, group size
- `POST /api/v1/leads` with `lead_type: "operator_inquiry"`
- WhatsApp deep link: `whatsapp://send?phone={operator_phone}` (if operator provides it)
- Call CTA: `tel:{phone}` via `Linking.openURL()`

### Step M12 — Digital Products [PENDING]
- Product catalog screen: grid of downloadable products
- Product detail screen: description, preview pages, price
- Razorpay React Native SDK: payment sheet (UPI, cards, netbanking)
- `POST /api/v1/payments/checkout` → Razorpay order → webhook confirmation
- Download delivery: secure pre-signed URL from `/api/v1/orders/{id}/download`
- Purchased products stored locally (AsyncStorage list of purchased product IDs)

### Step M13 — Premium Subscription [PENDING]
- Subscription screen: feature comparison (free vs premium)
- `expo-in-app-purchases`: Apple monthly/annual products + Google Play billing
- Platform fee handling: IAP for iOS/Android store installs; Stripe web fallback for sideload
- `POST /api/v1/payments/iap/verify` — receipt verification (Apple StoreKit receipt / Google Play token)
- Premium content gating: blur overlay on gated trek sections with "Unlock with Premium" CTA
- Subscription status synced to user profile on login

---

## Phase 4 — Engagement + Analytics (Steps M14–M15)

### Step M14 — Push Notifications [PENDING]
- `expo-notifications` SDK setup (request permissions on onboarding)
- FCM token (Android) + APNs token (iOS) registration via `POST /api/v1/mobile/device`
- Notification categories:
  - `permit_alert` — permit window opens/closes for subscribed treks
  - `trek_condition` — trail condition change reported
  - `seasonal_alert` — best-season approaching for saved treks
  - `news_article` — new trek news published
  - `plan_followup` — follow-up on submitted Plan My Trek lead
- DB migration: `mobile_push_log` table; `trek_alerts` table extended with `delivery_channel`
- Celery task: `notifications.send_permit_alerts` (daily check)
- Celery task: `notifications.send_seasonal_alerts` (weekly)
- Admin panel extension: send push to segment from `/admin/cdp/segments`
- Notification inbox screen (local notification history from AsyncStorage)

### Step M15 — Mobile CDP Analytics [PENDING]
Mobile-adapted version of `lib/analytics.ts` for React Native:
- `MobileAnalyticsProvider` — wraps app, initialises session
- `trackEvent(category, event_name, properties)` — batches events, flushes on foreground/background
- Offline queue: events stored in SQLite when offline, flushed on reconnect
- Session management: start session on app foreground, end on background (AppState API)
- Behavior profile: `ty_behavior_v1` stored in AsyncStorage (same schema as web localStorage)
- DB migration: `platform` + `app_version` columns on `analytics_events` + `analytics_sessions`
- Events tracked: `app_open`, `trek_view`, `search_query`, `plan_wizard_step_N`, `trek_saved`, `trek_downloaded`, `push_notification_opened`, `screen_view`
- Admin CDP dashboards automatically show mobile events (platform filter added to Event Explorer)

---

## Phase 5 — Community Layer (Steps M16–M18)

### Step M16 — Trek Check-ins & History [PENDING]
- Check-in screen: confirm trek + completion date + duration + optional notes + rating (1–5 stars)
- `POST /api/v1/mobile/checkin` (DB: `user_trek_history` table)
- My Trek History screen: chronological timeline of completed treks
- Statistics: total treks, total days trekked, altitude accumulated, favourite state
- Trek badges: "First trek", "Himalayan Explorer" (≥5 Himalayan treks), "Monsoon Warrior", etc.
- Trek detail screen: shows "You've done this trek" banner for completed treks
- `user_trek_history` visible in Account → Trek History

### Step M17 — Trip Reports & Trail Conditions [PENDING]
- Trip report submit screen: trek selection + condition type (trail open/closed/challenging) + description + photo upload
- `expo-image-picker`: pick from gallery or camera
- Photo uploaded to object storage; URL stored in `trip_reports.photo_urls[]`
- `POST /api/v1/mobile/reports`
- Admin moderation queue: reports require approval before showing on trek page
- Trek detail screen: "Community Conditions" section showing latest 5 approved reports
- `GET /api/v1/mobile/reports/{slug}` (paginated)
- Reports feed per trek: timestamp, condition type badge, description, photo thumbnails, reporter username

### Step M18 — Trek Buddy Matching [PENDING]
- Find buddy screen: select trek + planned date range
- `GET /api/v1/mobile/buddy/match?slug=&date_from=` — returns list of trekkers with same plan
- Buddy profile card: username, experience level, treks completed, home city
- Send buddy request: `POST /api/v1/mobile/buddy/request`
- Incoming requests screen: accept / decline
- Privacy: phone/email NOT shown until both parties accept; show only username + trek history stats
- DB: `buddy_requests` table (requester_id, target_id, trek_slug, planned_date, status)
- Notification on buddy request received (`buddy_request` push category)

---

## Phase 6 — Contextual Intelligence (Steps M19–M20)

### Step M19 — Live Trek Conditions [PENDING]
- Trek conditions screen per trek: live weather widget + trail status + permit status + community report summary
- IMD (India Meteorological Department) open API integration (free tier) → weather for trek base camp coordinates
- Crowdsourced condition summary: derive trail_status from last 5 approved trip reports
- Permit status: cross-reference `trek_alerts` table for current permit window status
- DB: `trek_conditions` table (slug, weather_json, trail_status, permit_status, last_updated)
- Celery beat task: `conditions.refresh_all_treks` (every 6 hours)
- `GET /api/v1/mobile/conditions/{slug}` → returns combined condition object
- Trek detail screen: conditions widget pinned below hero image
- Push alert trigger: if trail_status changes from open → closed, push to all subscribers

### Step M20 — Nearby Treks (GPS) [PENDING]
- First-launch permission request: "Allow TrekYatra to use your location to suggest nearby treks"
- Background permission NOT required — only foreground location
- `expo-location.getCurrentPositionAsync()` → lat/lng
- `GET /api/v1/mobile/nearby?lat=&lng=&radius_km=100` → PostGIS-based query on trek base camp coordinates
- Nearby treks screen: list sorted by distance from current location + distance badge
- Home screen widget (State C + D): "Treks near you" section appears when location granted
- Offline fallback: if no location, show state-level suggestion based on saved treks

---

## Phase 7 — Content & Release (Steps M21–M22)

### Step M21 — News Feed + Multilingual (Hindi) [PENDING]
- News tab or section on Home: latest trek news articles (from `news_article` CMS pages)
- `GET /api/v1/public/news` → news list
- News article screen: same content as web `/news/[slug]` rendered natively
- Multilingual: language toggle in Settings (English / हिंदी)
- When Hindi selected: app fetches CMS pages from `page.translations.hi` field
- `CMSContentRenderer` renders Hindi body_json when locale = 'hi'
- OS locale detection on first launch: if device is set to Hindi, default to Hindi

### Step M22 — EAS Build, Store Submission, CI/CD, OTA, Sentry [PENDING]
- `eas.json` with 3 build profiles: `development`, `preview`, `production`
- `app.config.ts`: dynamic config (version, bundle ID, splash, icons, permissions)
- GitHub Actions:
  - PR check: `expo lint`, `tsc --noEmit`, unit tests
  - `main` merge: `eas update --branch main` (OTA push)
  - Release tag: `eas build --profile production --platform all` + `eas submit`
- Sentry init: `@sentry/react-native` + source map upload in EAS build hook
- PlayStore setup: internal → closed beta → open beta → production track
- TestFlight setup: internal group (team) → external group (beta testers)
- App Store Connect: app description, screenshots (6.7", 5.5", iPad), privacy labels
- Google Play: store listing, content rating questionnaire, data safety form

---

## Current Status

| Phase | Status |
|-------|--------|
| Foundation (M01–M05) | Pending — V4 website must stabilise first |
| Discovery (M06–M08) | Pending |
| User & Commerce (M09–M13) | Pending |
| Engagement & Analytics (M14–M15) | Pending |
| Community (M16–M18) | Pending |
| Contextual Intelligence (M19–M20) | Pending |
| Content & Release (M21–M22) | Pending |

**Current next step:** Gate check (prerequisites above). Begin M01 once prerequisites confirmed.
