# TrekYatra Mobile App — Implementation Plan
## V5 Step-by-Step Execution Plan

**Framework:** React Native + Expo Router v3  
**Backend:** FastAPI (services/api/) extended with mobile namespace  
**Last Updated:** 2026-06-22

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

### Step M02 — Mobile Auth [DONE — 2026-06-08]
- Long-lived JWT Bearer token via POST /auth/mobile/login + /signup (dedicated mobile endpoints)
- expo-secure-store for token storage (Keychain/Keystore) via authStorage.ts
- Email sign-in + sign-up screens with full form validation
- Google Sign In (expo-auth-session, ResponseType.Token implicit flow)
- Apple Sign In UI wired (backend endpoint deferred to M04)
- Biometric auth helpers (expo-local-authentication, used in M05+)
- Auth state Zustand store (setAuth, setLoading, clearAuth) + full AuthProvider context
- AuthGate in root _layout: onboarding check + auth-aware redirect
- Route guards on /saved and /account tabs
- tsc --noEmit: 0 errors

### Step M03 — Backend Mobile API Extensions [DONE — 2026-06-08]
- `POST /api/v1/auth/mobile/login` + `/signup` — dedicated email auth endpoints returning Bearer tokens
- `POST /api/v1/auth/mobile/token` — exchange web session for mobile token pair
- `POST /api/v1/auth/mobile/token/refresh` — refresh token → new access token
- `GET /api/v1/mobile/sync?last_sync=<ISO>` — incremental CMS page sync
- `POST /api/v1/mobile/device` — register FCM/APNs device token
- `DELETE /api/v1/mobile/device/{device_id}` — unregister on logout
- DB migration 20260608_0042: `mobile_devices` table + `cms_pages.deleted_at` + partial index
- `get_current_user_bearer` dependency for Authorization: Bearer auth
- 11 backend tests; all pass; full suite regression-free
- **Bugfix pass 2026-06-22**: Added `POST /api/v1/auth/mobile/google` (`MobileGoogleIn` schema → Google userinfo verify → `login_or_register_google_user` → `issue_mobile_token` → `MobileAuthOut`); `authApi.signInWithGoogle` replaced broken cookie-extraction approach with direct call to this endpoint

### Step M-DS1 — Mobile Design System Overhaul [DONE — 2026-06-10]
- Pine/Saffron/Sky/Earth/Mist/Paper brand tokens + dark mode (system + user toggle)
- ThemeProvider + useTheme() hook (NativeWind v4 setColorScheme, AsyncStorage persistence)
- 4-slide full-bleed photo carousel onboarding (onboarding-1–4.jpg)
- CustomTabBar with raised 56px saffron FAB Plan button; downloads tab hidden
- Auth screens (sign-in + sign-up) redesigned to light language with TrekYatra logo
- SafeArea, Button, Logo components all theme-aware
- Splash: Pine #1D3A2E; userInterfaceStyle: automatic
- tsc --noEmit: 0 errors

### Step M04 — CMS Offline Content Engine [DONE — 2026-06-10]
- `expo-sqlite` database (`trekyatra.db`) with Drizzle ORM schema
- Tables: `cms_pages` (slug, title, body_json, **content_html**, **content_json**, page_type, hero_image_url, synced_at, is_downloaded), `sync_meta` (last_sync_at, total_pages)
- **Bugfix pass 2026-06-22**: Added `content_html`/`content_json` to `db/schema.ts`; `db/client.ts` `initDb()` includes new columns in `CREATE TABLE` + `ALTER TABLE` migration loop for existing DBs; `useTrekDetail.ts` `mapPageToDb`/`mapDbToPage` cache and restore both fields — packing/permits/costs tabs now work offline
- Sync service (`services/syncService.ts`): fetch from `/mobile/sync`, upsert into SQLite, handle deleted slugs, pagination
- Background sync (`services/backgroundSync.ts`): AppState listener, 15-min throttle, token-aware
- `useSync` hook: isSyncing / lastSyncAt / syncProgress / triggerSync / refreshLastSync
- CMSContentRenderer + 8 block components: ParagraphBlock, HeadingBlock, ImageBlock, ListBlock, TableBlock, CalloutBlock, FAQBlock, AffiliateCardBlock
- Offline indicator badge `OfflineBadge` + toggle button `OfflineToggle`
- Downloads screen at `(tabs)/downloads.tsx`
- Zustand offlineStore: downloadedSlugs, download(), remove(), isDownloaded()
- Root `_layout.tsx` wired: initDb() + initBackgroundSync() + loadDownloaded()
- Packages: expo-sqlite ~56.0.4, drizzle-orm ^0.30.10, drizzle-kit ^0.20.18
- tsc --noEmit: 0 errors

### Step M05 — Trek Detail Screen [DONE — 2026-06-10]
- `app/(tabs)/(home)/trek/[slug].tsx` — server fetch first, SQLite fallback
- Native tab bar: Guide | Packing | Permits | Costs (mirrors `/trek/[slug]/packing` etc.)
- Hero image (expo-image with blur placeholder + LinearGradient overlay)
- TrekMetaStrip: duration/altitude/difficulty/season chips
- TrekStickyBar: "Plan with this trek" + Save button (auth-gated)
- Native share sheet → shares `trekyatra.co.in/trek/{slug}`
- Offline badge when serving from SQLite cache
- Safety disclaimer nudge for Challenging/Difficult treks
- Behavior profile tracking: recordTrekView() on mount
- Related treks horizontal row via TrekRelatedRow
- TrekCard component (shared with M06)
- `lib/mobileApi.ts`: Bearer-token API client with auto-refresh
- `lib/behaviorProfile.ts`: AsyncStorage ty_behavior_v1 read/write
- expo-image + expo-linear-gradient installed
- (home) route group Stack layout for back-navigation context
- tsc --noEmit: 0 errors

---

## Phase 2 — Discovery Layer (Steps M06–M08)

### Step M06 — Home Screen + 4-State Personalisation [DONE — 2026-06-10]
Full parity with web homepage personalisation. Client-side 4-state logic:
- **State A** (new logged-in): welcome banner + "Popular treks" feed
- **State B** (repeat logged-in): "Welcome back {name}" + last-viewed chips + personalized feed
- **State C** (new logged-out): trending + regions + seasonal only (no banner/feed)
- **State D** (repeat logged-out): recently viewed row + anonymous recs

Components delivered:
- `HomeWelcomeBannerA` + `HomeWelcomeBannerB` (States A + B)
- `HomeTrendingSection` (all states, heading adapts per state)
- `RegionsRow` (all states — 8 region chips)
- `SeasonalPicksRow` (all states — current month auto-selected)
- `RecentlyViewedRow` (State D only)
- `PersonalisedFeedSection` (States A + B + D — 2×3 feed grid)
- `HomeSkeleton` (pulse animation loading state)
- `useBehaviorProfile` hook (reads ty_behavior_v1 from AsyncStorage)
- `useHomeData` hook (parallel TanStack useQueries: trending + seasonal + recs)
- Pull-to-refresh, skeleton loading states per section
- tsc --noEmit: 0 errors

### Step M07a — Browse Tab (grid, filters, regions/seasons, basic search) [DONE — 2026-06-12]
- Browse screen: infinite scroll grid of trek cards (`app/(tabs)/browse.tsx`)
- Filter bottom sheet: state, difficulty, duration_min/max, season filters — wired to `GET /api/v1/cms/pages` extended filter params
- Backend: `list_pages()` extended with `trek_state`, `trek_difficulty`, `trek_season`, `trek_duration_min/max` query params + integer day-count extraction via `regexp_replace`; 4 new backend tests
- `RegionsRow` (M06) + `SeasonalPicksRow` (M06) wired as interactive filter shortcuts
- tsc ✓ zero errors

### Step M07b — Advanced Search (semantic, voice, recent, trending) [DONE — 2026-06-14]
- Search screen: text input + `GET /api/v1/search/trending` trending chips + recent searches (AsyncStorage)
- Semantic search: long queries → `POST /api/v1/search/semantic`
- Voice search: `expo-speech` mic input → search query
- Search log: `POST /api/v1/search/log` on result tap (no new backend — all routes pre-existed)
- tsc ✓ zero errors

### Step M07c — Region Tabs with Trek Cards [DONE — 2026-06-14]
- `RegionsRow` chips converted to selectable tabs (Himachal Pradesh default active, saffron active style mirrors `DifficultyTabsSection`)
- Trek card rows rendered per selected region using `GET /api/v1/cms/pages?trek_state=<region>`
- tsc ✓ zero errors

### Step M08 — Trek Comparison (full attribute table + saved comparisons) [DONE — 2026-06-18]
- Compare flow: pick 2 treks → side-by-side attribute table (budget, permit, difficulty, altitude, duration, season, crowd, solo/family/beginner-friendly)
- Winner badges per attribute row (highlights better trek per field)
- Save comparison button (auth-gated, `POST /api/v1/account/comparisons`)
- `saved.tsx` converted to stack: `saved/_layout.tsx` + `saved/index.tsx` + `saved/comparisons.tsx` (saved comparisons list with delete)
- `useComparisons` hook (list/save/delete via TanStack Query)
- `accountApi` + `apiDelete` added to `mobileApi.ts`
- tsc ✓ zero errors

---

## Phase 3 — User & Commerce Layer (Steps M09–M13)

### Step M09 — Plan My Trek Wizard [DONE — 2026-06-18]
Full 6-step native wizard replacing single-scroll `plan-my-trek.tsx`:
- `plan/_layout.tsx` (Stack navigator) + `plan/index.tsx` (hero intro + 6-step preview)
- `plan/step-1.tsx`–`step-5.tsx`: intent / month / duration / fitness+experience / region
- `plan/step-6.tsx`: lead capture (skippable) → `POST /api/v1/leads/operator-help`
- `plan/results.tsx`: ranked trek cards with match score, auth-gate, retry
- `planWizardStore.ts` (Zustand — 7 fields + reset)
- 9 components in `components/plan/`: `WizardProgress`, `WizardStepLayout`, `IntentSelector`, `MonthSelector`, `DurationSelector`, `FitnessSliders`, `RegionSelector`, `LeadCaptureForm`, `PlanResultCard`
- `leadsApi` + `OperatorHelpLeadPayload` added to `mobileApi.ts`
- `CategoryHubRow` "Plan a trek" route fixed; stale `plan-my-trek` refs removed
- `plan-my-trek.tsx` DELETED; old `plan.tsx` DELETED; replaced by `plan/` Stack
- tsc ✓ zero errors

### Step M10 — User Account [DONE — 2026-06-19]
Full account management tab:
- `account/_layout.tsx` (Stack navigator); placeholder `account.tsx` DELETED
- `account/index.tsx`: ProfileHeader + AccountDashboard (stats strip + 6 menu rows) + sign-out
- `account/saved.tsx`: `GET /api/v1/account/bookmarks`; Alert-confirm remove per bookmark
- `account/downloads.tsx`: `GET /api/v1/account/downloads`; download URL via `Linking.openURL`
- `account/enquiries.tsx`: `GET /api/v1/auth/me/leads`
- `account/premium.tsx`: feature list + "coming soon" placeholder
- `account/settings.tsx`: name edit (`PATCH /api/v1/auth/me`), EN/हिंदी language toggle (AsyncStorage `app_language`), biometric toggle (AsyncStorage), notifications link, Trail Letter newsletter (`POST /api/v1/newsletter/subscribe`), legal links (Linking.openURL), sign-out
- `account/notifications.tsx`: 6 per-category notification toggles stored in AsyncStorage `notification_prefs`
- `account/privacy.tsx`: DPDP data export (`GET /api/v1/auth/me/data-export` via Linking) + `DELETE /api/v1/auth/me/data` with Alert confirm
- 5 new components: `ProfileHeader`, `AccountDashboard`, `SavedTrekCard`, `DownloadItem`, `EnquiryCard`
- `hooks/useAccount.ts`: `useSavedTreks`, `useDownloads`, `useAccountMe`, `useNewsletter`
- `mobileApi.ts`: `apiPatch`, new types (`BookmarkResponse`, `DownloadResponse`, `UserMeResponse`, `NewsletterSubscribeResponse`), extended `accountApi`, `newsletterApi`, `authMeApi`
- tsc ✓ zero errors

### Step M11 — Operators Marketplace [DONE — 2026-06-22]
- Operators listing: search + 6 region chips (`GET /api/v1/operators?region=`); `OperatorCard` (GlassSurface, initials avatar, rating, region, speciality slugs)
- Operator detail: hero initials card, about, trek portfolio chips (→ trek detail), trek_types tags, reviews (`GET /api/v1/operators/{slug}/reviews`), fixed CTA bar
- `OperatorInquirySheet` modal: name/email/phone/trek_interest/message → `POST /api/v1/inquiries`; success state with confirmation copy
- Call CTA: `Linking.openURL(tel:{phone})` when `operator.phone` available
- `useOperators`, `useOperatorDetail`, `useOperatorReviews`, `useSubmitInquiry` hooks
- `operatorsApi` namespace + types added to `mobileApi.ts`; `Operator.region: string[]` bug fixed
- Browse `_layout.tsx` extended with `operators` + `operators/[slug]` Stack.Screen entries
- Note: WhatsApp button omitted — `OperatorPublicResponse` has no `whatsapp` field
- tsc ✓ zero errors | No backend changes (all endpoints pre-existed)

### Step M12 — Digital Products [DONE]
- Product catalog screen: grid of downloadable products
- Product detail screen: description, preview pages, price
- Razorpay React Native SDK: payment sheet (UPI, cards, netbanking)
- `POST /api/v1/payments/checkout` → Razorpay order → webhook confirmation
- Download delivery: secure pre-signed URL from `/api/v1/orders/{id}/download`
- Purchased products stored locally (AsyncStorage list of purchased product IDs)

### Step M13 — Premium Subscription [DONE]
- Subscription screen: feature comparison + plan cards (monthly/annual) + subscribe button + restore + web fallback
- `react-native-iap@15.3.2` (NitroModules) — `expo-in-app-purchases` deprecated in SDK 56
- `iapService.ts`: `initIAP`, `fetchSubscriptionProducts`, `purchaseSubscription`, `getRestoredPurchases`, `getReceiptData` using v15 `fetchProducts`/`requestPurchase` API
- `usePremium.ts`: hook with `purchaseUpdatedListener` → backend verify → `queryClient.invalidateQueries`; test mode (no credentials) → backend direct call
- Backend: `POST /api/v1/subscriptions/iap/verify` + `POST /api/v1/subscriptions/iap/restore`; test mode activates premium when `APPLE_IAP_SHARED_SECRET`/`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` not set
- `GatedContentOverlay` component: `BlurView` + lock icon + "Unlock Premium" CTA
- `PremiumFeatureList`: free vs premium comparison table
- `SubscribeButton`: status-aware (idle/purchasing/verifying/done/error)
- Note: IAP purchase sheet only works on real device + App Store Connect product setup (M22); simulator uses test mode backend path
- tsc ✓ zero errors; 6 new backend tests (TC-B16–B21); 698 backend tests pass

---

## Phase 4 — Engagement + Analytics (Steps M14–M15)

### Step M14 — Push Notifications [DONE]
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

### Step M15 — Mobile CDP Analytics [DONE]
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

### Step M16 — Trek Check-ins & History [DONE]
- Check-in screen: confirm trek + completion date + duration + optional notes + rating (1–5 stars)
- `POST /api/v1/mobile/checkin` (DB: `user_trek_history` table)
- My Trek History screen: chronological timeline of completed treks
- Statistics: total treks, total days trekked, altitude accumulated, favourite state
- Trek badges: "First trek", "Himalayan Explorer" (≥5 Himalayan treks), "Monsoon Warrior", etc.
- Trek detail screen: shows "You've done this trek" banner for completed treks
- `user_trek_history` visible in Account → Trek History

### Step M17 — Trip Reports & Trail Conditions [DONE — 2026-06-24]
- `apps/mobile/lib/mobileApi.ts`: `apiUploadFile<T>` export added (multipart FormData, no Content-Type override)
- `apps/mobile/hooks/useReports.ts` (NEW): `useReports` hook — paginated fetch, submit, photo upload, delete, reload
- `apps/mobile/components/reports/ConditionSummaryBanner.tsx` (NEW): Condition bars, report count, last-report date
- `apps/mobile/components/reports/TripReportCard.tsx` (NEW): Report card + gallery trigger
- `apps/mobile/components/reports/PhotoGallery.tsx` (NEW): Modal full-screen FlatList viewer
- `apps/mobile/components/reports/PhotoPicker.tsx` (NEW): expo-image-picker + resize + upload
- `apps/mobile/components/reports/AddReportSheet.tsx` (NEW): Slide-up form Modal (condition radio, body with char counter)
- `apps/mobile/components/trek/TrekTabBar.tsx`: `TrekTab` type extended with `"reports"`; TABS array gains `{ key: "reports", label: "Trail" }` — 5th tab on trek detail screen
- `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx`: "Trail" tab with ConditionSummaryBanner + TripReportCard list + AddReportSheet
- `expo-image-picker@~56.0.18` + `expo-image-manipulator@~56.0.19` added
- Backend: STEP-78 (shared — `trip_reports` + `trek_media` tables; moderation API; DO Spaces upload)

### Step M18 — Trek Buddy Matching [DONE — 2026-06-25]
- `hooks/useBuddies.ts` — `buddyApi` namespace, `useTrekBuddies` + `useBuddyRequests` hooks, full TypeScript interfaces (SignalOut, BuddyRequestOut, ChatMessageOut, TrekkerProfileOut)
- `components/buddy/BuddySignalSheet.tsx` — pageSheet modal: month picker, group-size chips, experience toggle, notes; onSubmit calls `buddyApi.createSignal`
- `components/buddy/BuddyListCard.tsx` — privacy-safe card (display_name, month, experience, notes, group_size); inline connect flow with optional message
- `components/buddy/BuddyRequestSheet.tsx` — received/sent tabs, pending count badge, accept/decline actions, "Open Chat →" for accepted pairs
- `components/buddy/BuddyChatScreen.tsx` — pageSheet Modal, FlatList message bubbles, 10s polling, KeyboardAvoidingView, send on Enter
- `components/buddy/TrekkerProfileModal.tsx` — formSheet modal: avatar/name/bio/trek_count/experience/planning context/privacy notice/connect CTA
- `app/(tabs)/(home)/trek/[slug].tsx` — buddy count block in guide tab; "I'm planning this trek" CTA → BuddySignalSheet; "Browse N trekkers" → BuddyListCard list; TrekkerProfileModal + BuddyChatScreen modals wired
- `app/(tabs)/account/index.tsx` — "Trek Buddy Requests" nav row → BuddyRequestSheet → BuddyChatScreen for accepted pairs
- Privacy model: display_name = "FirstName L." in signal list; profile accessed via signal_id UUID (not guessable); email/phone NOT shown — shared only after mutual accept
- Backend: STEP-79 (shared — `buddy_signals`, `buddy_requests`, `buddy_chat_messages` tables; 10 API routes; `buddies.expire_signals` Celery beat task)
- `npx tsc --noEmit` ✅ zero errors

---

## Phase 6 — Contextual Intelligence (Steps M19–M20)

### Step M19 — Live Trek Conditions [DONE — 2026-06-26]
- **Weather API**: Open-Meteo (`api.open-meteo.com`) — free, no API key, 10k calls/day; endpoint: `GET /api/v1/public/treks/{slug}/conditions`
- `apps/mobile/hooks/useConditions.ts` (NEW): `ConditionOut`/`WeatherOut`/`ForecastDayOut` TypeScript interfaces; `useConditions(slug)` hook — async API fetch + `AsyncStorage` cache with 6h TTL (`conditions_${slug}`); 404→null graceful (trek has no coords); offline fallback to cache; `fromCache` flag for UI banner
- `apps/mobile/components/trek/ConditionsWidget.tsx` (NEW): Inline compact widget in guide tab — WMO emoji + current temp + humidity/wind details row + 3-day horizontal ScrollView forecast cards + trail status badge + permit status badge + "Details →" link; hidden when data is null
- `apps/mobile/components/conditions/LiveConditionsScreen.tsx` (NEW): Full-screen overlay (StyleSheet.absoluteFill) — current weather card (emoji + big temp + feels-like/humidity/wind), 3-day forecast cards, trail status card (colour-coded + description), permit card (notes), condition summary card, pull-to-refresh RefreshControl, offline "Cached data" banner, last-updated timestamp
- `apps/mobile/app/(tabs)/(home)/trek/[slug].tsx`: `conditionsDetailVisible` state; `<ConditionsWidget>` rendered in guide tab between TrekAskAI and Buddy section; `<LiveConditionsScreen>` rendered as StyleSheet.absoluteFill overlay with zIndex:100 when visible
- All status values colour-coded: open=green, caution=amber, closed=red; permit_required=amber, not_required=grey, check_locally=blue; all status blocks have descriptive text for accessibility
- Backend: STEP-80 (shared — `trek_conditions` table, Open-Meteo integration, `conditions.refresh_all` Celery beat every 6h)
- `npx tsc --noEmit` ✅ zero errors

### Step M20 — Nearby Treks (GPS) [DONE — 2026-06-29]
- expo-location foreground permission + 30-min AsyncStorage cache (`lib/location.ts`)
- `GET /api/v1/mobile/nearby?lat=&lon=&radius_km=200&limit=10` — haversine (stdlib math, no PostGIS needed for 41-trek catalog), imports `TREK_COORDS` from conditions/service.py
- `NearbyTreksStrip` horizontal card strip with distance badge — wired on Home + Browse screens
- Denied state: tappable "Enable location" banner opens iOS/Android Settings
- `NSLocationWhenInUseUsageDescription` + expo-location plugin added to `app.config.ts`
- Web: `NearbyTreksSection` client component on `/explore` page (geolocation API, same endpoint)
- 5 backend tests pass; `next build` clean; `npx tsc --noEmit` clean

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
| Foundation (M01–M05) | ✓ DONE (M01, M02, M03, M-DS1, M04, M05 complete) |
| Discovery (M06–M08) | ✓ DONE (M06, M07a, M07b, M07c, M08 complete) |
| User & Commerce (M09–M13) | M09 ✓ Done — M10 ✓ Done — M11 ✓ Done — M12 ✓ Done — M13 ✓ Done |
| Engagement & Analytics (M14–M15) | M14 ✓ Done — M15 ✓ Done |
| Community (M16–M18) | M16 ✓ Done — M17 ✓ Done — M18 ✓ Done |
| Contextual Intelligence (M19–M20) | M19 ✓ Done — M20 ✓ Done |
| Content & Release (M21–M22) | Pending |

**Bugfix Pass 2 (2026-06-23) — DONE:** Cross-platform behavior sync (`behavior_profile` column + GET/PUT endpoints + mobile `pullAndMergeBehaviorProfile` on login + web `pullAndMergeBehaviorProfileFromBackend` on login + `syncBehaviorProfileToBackend` on trek view when authenticated); Go Premium saffron entry in AppDrawer; Explore FilterChips prominent saffron pill.

**Step M14 (2026-06-23) — DONE:** Push notifications — FCM/APNs providers (test mode), `mobile_push_log` table, permit/seasonal/news Celery tasks, admin send route, notification inbox screen, 2nd-open permission prompt, badge count, deeplink tap handler. 707 backend tests pass; tsc ✓; next build ✓.

**Step M15 (2026-06-24) — DONE:** Mobile CDP analytics — `platform`+`app_version` columns on `analytics_events`/`analytics_sessions` (migration 20260623_0047); `lib/identity.ts` (anon ID via Crypto.randomUUID + SecureStore); `lib/analyticsQueue.ts` (SQLite offline queue); `lib/analytics.ts` (trackEvent/trackScreen + 13 convenience helpers + flushOfflineQueue); `providers/AnalyticsProvider.tsx` (AppState session mgmt, 15min threshold, cold_start flag); `hooks/useAnalytics.ts`; AuthProvider wires `setUserId` on login/logout. 4 new backend tests; 719/721 pass (2 pre-existing refresh ordering failures); tsc ✓; next build ✓.

**Step M16 (2026-06-24) — DONE:** Trek check-ins & history — `user_trek_history` table (migration 20260623_0048, 3 indexes); `UserTrekHistory` ORM; `CheckinIn`/`CheckinOut`/`TrekHistoryStatsOut` schemas; service layer (`create_checkin`, `get_user_history`, `has_user_done_trek`, `get_history_stats` + 6 badge rules); 4 API routes (`POST/GET /api/v1/mobile/checkin`, `/stats`, `/done/{slug}`); `hooks/useCheckin.ts`; `components/account/TrekHistoryCard.tsx`; `components/account/CheckinSheet.tsx` (modal bottom sheet, star rating, date/duration/notes); `app/(tabs)/account/history.tsx` (stats + badges + chronological list); `app/(tabs)/(home)/trek/[slug].tsx` wired with "I did this trek" CTA + "You've done this trek ✓" banner + CheckinSheet; `AccountDashboard` Trek History entry added. 8 new backend tests; 719/721 pass; tsc ✓; next build ✓.

**Step M17 (2026-06-24) — DONE:** Trip reports + photo gallery — 5th "Trail" tab on TrekDetailScreen, `useReports` hook, `ConditionSummaryBanner`/`TripReportCard`/`PhotoGallery`/`PhotoPicker`/`AddReportSheet` components, expo-image-picker + expo-image-manipulator resize (1920px, 3-photo limit). `npx tsc --noEmit` ✅ zero errors. Shared backend: STEP-78.

**Step M18 (2026-06-25) — DONE:** Trek buddy matching — `useBuddies.ts` hook, BuddySignalSheet + BuddyListCard + BuddyRequestSheet + BuddyChatScreen + TrekkerProfileModal components; buddy block in guide tab + account Buddy Requests row; privacy masking ("FirstName L."), signal UUID-scoped profile. `npx tsc --noEmit` ✅ zero errors. Shared backend: STEP-79.

**Step M19 (2026-06-26) — DONE:** Live trek conditions — `useConditions.ts` (AsyncStorage 6h TTL cache, offline fallback), `ConditionsWidget.tsx` (inline: WMO emoji, temp, forecast horizontal scroll, trail/permit badges), `LiveConditionsScreen.tsx` (full-screen overlay: weather card + 3-day forecast + trail/permit cards + summary + pull-to-refresh); wired in trek detail guide tab. `npx tsc --noEmit` ✅ zero errors. Shared backend: STEP-80.

**Step M20 (2026-06-29) — DONE:** GPS nearby treks — `lib/location.ts` (foreground permission + 30-min AsyncStorage cache), `hooks/useNearbyTreks.ts` (React Query wrapper), `NearbyTreksStrip.tsx` (horizontal card strip + permission denied banner); wired on Home + Browse screens; `app.config.ts` iOS infoPlist + expo-location plugin; backend: haversine service + `GET /api/v1/mobile/nearby` + 5 tests; web: `NearbyTreksSection.tsx` on /explore. `npx tsc --noEmit` ✅ zero errors. `next build` ✅ clean.

**Current next step:** M21 — News Feed + Multilingual (Hindi).
