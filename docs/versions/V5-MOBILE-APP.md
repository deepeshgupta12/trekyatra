# V5 — TrekYatra Mobile App
## Complete Scope, Architecture & Implementation Plan

**Status:** Planning — Implementation begins after V4 website stabilisation (Steps 00–67 complete)
**Last Updated:** 2026-05-29

---

## Prerequisites (Gate Check Before Starting V5)

All of the following must be confirmed before any mobile code is written:

- [x] V0–V4 complete (Steps 00–67 done and deployed)
- [x] All known bugs resolved (Step 66 regressions fixed)
- [x] Content pipeline running (≥50 published CMS trek guide pages)
- [x] Admin panel fully operational (operators, products, affiliate catalog seeded)
- [x] Production deployment live (trekyatra.co.in, DigitalOcean BLR1)
- [ ] Minimum 3 months of production traffic data available
- [ ] Google Search Console indexed (sitemap submitted — in progress)
- [ ] Apple Developer account created ($99/year)
- [ ] Google Play Console account created ($25 one-time)
- [ ] Firebase project created (FCM for Android, APNs cert for iOS)
- [ ] Expo account + EAS CLI set up

---

## Product Vision

A native mobile companion to the TrekYatra web platform targeting Indian trekkers on Android and iOS. The app provides **full feature parity with the website** plus four native-only capability pillars the web cannot deliver at quality:

1. **Offline-first content** — download trek guides to device; readable without signal on trail
2. **Push notifications** — permit window alerts, trek condition changes, seasonal advisories
3. **Contextual intelligence** — GPS-based nearby trek detection, live weather conditions
4. **Community layer** — trek check-ins, trip condition reports, trek buddy matching, photo sharing

The app is not a simplified version of the website. It is the full platform in a native shell with added native capabilities.

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React Native + Expo SDK 51+ | Shared TypeScript + component logic with Next.js; EAS Build/Update |
| Navigation | Expo Router v3 (file-based) | Mirrors Next.js App Router mental model |
| Styling | NativeWind v4 (Tailwind for RN) | Reuse Tailwind tokens from web design system |
| State | Zustand | Lightweight, TypeScript-first; one store per domain |
| Server state | TanStack Query (React Query) | Cache + background sync; same pattern as web |
| Offline DB | expo-sqlite (Drizzle ORM) | Trek content + behavior data; WAL mode for performance |
| Auth storage | expo-secure-store | JWT Bearer token; hardware-backed keystore on Android |
| Animations | react-native-reanimated v3 | Fluid native animations (gesture-driven) |
| Images | expo-image | Disk cache + progressive loading |
| Push | expo-notifications + FCM + APNs | Cross-platform push; Firebase for Android, Apple for iOS |
| Location | expo-location | GPS for nearby treks; background position optional |
| Camera | expo-image-picker | Photo sharing for trip reports |
| Biometric | expo-local-authentication | Touch ID / Face ID for returning users |
| Payments | Razorpay RN SDK + expo-in-app-purchases | Razorpay for digital products; IAP for subscriptions |
| Analytics | Custom CDP SDK (extends `lib/analytics.ts` pattern) | Mobile-adapted version of the web CDP SDK |
| Build | Expo EAS Build | Cloud builds for Android APK/AAB + iOS IPA |
| OTA updates | EAS Update | JS bundle pushes without store review |
| CI/CD | GitHub Actions + EAS | PR checks + automated build triggers |
| Crash reporting | Sentry (React Native SDK) | Error grouping + stack traces with source maps |
| Backend | Same FastAPI backend (services/api/) | Extended with mobile-specific endpoints |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 TrekYatra Mobile App                     │
│                 React Native + Expo Router               │
├─────────────────┬───────────────────────────────────────┤
│   Online Path   │          Offline Path                  │
│                 │                                        │
│  TanStack Query │   Drizzle ORM → expo-sqlite           │
│  (API → cache)  │   (Synced trek guides + behavior)     │
│                 │                                        │
└────────┬────────┴───────────────────────────────────────┘
         │
         │ Bearer token (Authorization: Bearer <jwt>)
         ▼
┌─────────────────────────────────────────────────────────┐
│               FastAPI Backend (services/api/)            │
│                                                         │
│  Existing endpoints (auth, cms, treks, plan, leads)     │
│  + Mobile extensions:                                   │
│    POST /auth/mobile/token                              │
│    GET  /mobile/sync                                    │
│    POST /mobile/device                                  │
│    POST /mobile/push/send                               │
│    GET  /mobile/conditions/{slug}                       │
│    GET  /mobile/nearby                                  │
│    POST /mobile/checkin                                 │
│    POST /mobile/reports                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Complete Feature Parity Matrix — Web → Mobile

### Public Content

| Web Feature | Mobile Equivalent | Mobile Extra |
|-------------|------------------|--------------|
| Homepage (4-state personalisation) | Home screen (4-state: States A/B/C/D) | Bottom tab + pull-to-refresh |
| Explore (grid + filters) | Browse screen + filter sheet | Haptic filter feedback |
| Search (fuzzy + semantic) | Search screen + voice search | Voice input via expo-speech |
| Trek detail (`/trek/[slug]`) | Trek detail screen | Offline save button |
| Packing guide tab | Packing tab in trek detail | Downloadable checklist PDF |
| Permit guide tab | Permits tab | Push alert for permit window |
| Cost guide tab | Costs tab | — |
| Comparison tool | Compare screen | Swipe-based compare |
| Plan My Trek wizard (6 steps) | Native 6-step wizard | Full-screen step transitions |
| Operators listing + detail | Operators screen + detail | Call/WhatsApp direct link |
| Digital products | Product catalog + native payment | Razorpay payment sheet |
| Premium subscription | IAP subscription screen | Apple/Google IAP native |
| User account (bookmarks, downloads, etc.) | Account tab | Biometric login |
| Trek news feed | News tab | Push notification for new articles |
| Regional hubs | Regions screen | GPS auto-suggest nearest region |
| Seasonal hubs | Seasons tab | — |
| Hindi translations | Hindi locale (app-level language switch) | OS locale detection |
| Newsletter | Email newsletter subscribe form (Trail Letter) in Settings; push opt-in for news | — |
| Safety disclaimer | In-app safety banner on trek detail screen; full text accessible via Settings → Legal | — |
| Legal/Trust pages | Settings → Legal: Privacy Policy, Terms, Affiliate Disclosure (native web views or static screens) | — |

### Mobile-Native Only Features (No Web Equivalent)

| Feature | Step |
|---------|------|
| Offline trek guide download + reading without signal | M04, M05 |
| Push notifications (permit alerts, conditions, seasonal) | M14 |
| Trek check-ins (mark as completed, trek log) | M16 |
| Trip condition reports (crowdsourced trail updates) | M17 |
| Photo sharing on trek pages | M17 |
| Trek buddy matching | M18 |
| Live trek conditions (IMD weather + crowdsourced) | M19 |
| Nearby treks (GPS radius browse) | M20 |
| Biometric login (Touch ID / Face ID) | M02 |
| Native share sheet (share trek page to WhatsApp, Instagram) | M05 |
| AR compass / peak identification | M22 (optional Phase 5) |

---

## Screen Inventory (Complete)

### Tab Bar (5 tabs)
| Tab | Icon | Screen |
|-----|------|--------|
| Home | house | HomeScreen |
| Browse | compass | ExploreScreen |
| Plan | sparkles | PlanWizardScreen |
| Saved | bookmark | SavedScreen |
| Account | person | AccountScreen |

### Stack Screens (from Home tab)
- `HomeScreen` — 4-state personalised feed
- `TrekDetailScreen` — full guide with tabs
- `TrekDetailPackingTab` — packing guide (offline)
- `TrekDetailPermitsTab` — permit guide + permit alert CTA
- `TrekDetailCostsTab` — cost breakdown
- `OperatorDetailScreen` — operator profile + inquiry
- `NewsArticleScreen` — trek news article
- `RegionScreen` — regional hub
- `SeasonScreen` — seasonal hub

### Stack Screens (from Browse tab)
- `ExploreScreen` — full grid with filters
- `SearchScreen` — fuzzy + semantic search
- `FilterSheet` — bottom sheet filter panel
- `CompareSelectScreen` — pick two treks
- `CompareResultScreen` — side-by-side table
- `RegionsListScreen` — all regions
- `SeasonsListScreen` — all seasons

### Stack Screens (from Plan tab)
- `PlanWizardScreen` — step 0: intent selection
- `PlanStep1Screen` – `PlanStep6Screen` — wizard steps
- `PlanResultsScreen` — top 5 trek recommendations
- `PlanLeadCaptureScreen` — operator inquiry form

### Stack Screens (from Saved tab)
- `SavedTreksScreen` — bookmarked treks
- `SavedComparisonsScreen` — saved comparison pairs
- `DownloadsScreen` — purchased digital products
- `OfflineContentScreen` — downloaded trek guides

### Stack Screens (from Account tab)
- `AccountDashboardScreen` — overview + stats
- `EnquiriesScreen` — lead history
- `PremiumScreen` — subscription status + upgrade
- `SettingsScreen` — profile, notifications, language, logout
- `DataPrivacyScreen` — DPDP data export + delete

### Auth Screens (unauthenticated)
- `WelcomeScreen` — onboarding carousel (3 slides)
- `SignInScreen` — email + Google + Apple Sign In
- `SignUpScreen` — email registration
- `OTPScreen` — OTP verification
- `ForgotPasswordScreen`
- `ResetPasswordScreen`

### Community Screens (Phase 4)
- `TrekCheckInScreen` — mark trek as done + log details
- `MyTrekHistoryScreen` — completed treks timeline
- `TripReportScreen` — submit condition report + photo
- `TripReportsListScreen` — crowdsourced reports for a trek
- `BuddyMatchScreen` — find trekking partners
- `BuddyRequestScreen` — send / manage buddy requests

### Contextual Screens (Phase 5)
- `NearbyTreksScreen` — GPS-aware trek suggestions
- `TrekConditionsScreen` — live weather + condition rollup
- `PermitAlertsScreen` — permit window tracker

### Notification Screens
- `NotificationInboxScreen` — all push notifications
- `NotificationPreferencesScreen` — per-category toggles

---

## Backend Extensions Required

### New API Endpoints

| Endpoint | Method | Purpose | Step |
|----------|--------|---------|------|
| `/api/v1/auth/mobile/token` | POST | Issue long-lived mobile JWT Bearer token (30-day expiry, refresh token pair) | M03 |
| `/api/v1/mobile/sync` | GET | Incremental CMS page sync since `?last_sync=` timestamp; returns changed pages + deleted slugs | M03 |
| `/api/v1/mobile/device` | POST | Register device for push (FCM token or APNs token, platform, app_version) | M03 |
| `/api/v1/mobile/device/{device_id}` | DELETE | Unregister device on logout | M03 |
| `/api/v1/mobile/push/send` | POST | Admin-triggered push to segment or device | M14 |
| `/api/v1/mobile/conditions/{slug}` | GET | Live conditions for a specific trek (weather + crowdsourced summary) | M19 |
| `/api/v1/mobile/nearby` | GET | Trek suggestions within radius of `?lat=&lng=&radius_km=` | M20 |
| `/api/v1/mobile/checkin` | POST | Log a completed trek (user_trek_history row) | M16 |
| `/api/v1/mobile/checkin` | GET | Get current user's trek history | M16 |
| `/api/v1/mobile/reports` | POST | Submit trip condition report + photo URL | M17 |
| `/api/v1/mobile/reports/{slug}` | GET | List condition reports for a trek (paginated) | M17 |
| `/api/v1/mobile/buddy/request` | POST | Send trek buddy match request | M18 |
| `/api/v1/mobile/buddy/requests` | GET | Incoming + outgoing buddy requests | M18 |
| `/api/v1/mobile/buddy/match` | GET | Find trekkers planning same trek `?slug=&date_from=` | M18 |

### New Database Tables

| Table | Purpose | Step |
|-------|---------|------|
| `mobile_devices` | Device push token registry (device_id, user_id, fcm_token, apns_token, platform, app_version, created_at, last_seen) | M03 |
| `mobile_push_log` | Push notification send log (id, device_id, title, body, data, sent_at, status, error) | M14 |
| `user_trek_history` | Completed trek log (id, user_id, trek_slug, completed_date, duration_days, notes, rating, created_at) | M16 |
| `trip_reports` | Crowdsourced condition reports (id, user_id, trek_slug, condition_type, description, trail_open, photo_urls[], created_at, moderation_status) | M17 |
| `trek_media` | User-uploaded photos attached to trek pages (id, user_id, trek_slug, photo_url, caption, approved, created_at) | M17 |
| `buddy_signals` | Trek buddy intent signals (id, user_id, trek_slug, month_year "2026-06", group_size, experience, active, expires_at, UNIQUE user+trek+month) | M18 |
| `buddy_requests` | Trek buddy match requests (id, sender_id, receiver_id, signal_id, message, status: pending/accepted/rejected, UNIQUE sender+signal) | M18 |
| `trek_conditions` | Live condition cache (trek_slug, weather_json, crowdsource_summary, trail_status, permit_status, last_updated) | M19 |
| `user_badges` | User achievement badges (id, user_id, badge_key UNIQUE per user: first_trek/five_treks/ten_treks/himalayan_starter, awarded_at) | M16 |

### Extended Existing Tables

| Table | Extension | Step |
|-------|-----------|------|
| `users` | Add `preferred_language` (en/hi), `notification_prefs` JSONB | M02 |
| `analytics_events` | Add `platform` column (web/android/ios), `app_version` | M15 |
| `analytics_sessions` | Add `platform`, `device_model`, `os_version` | M15 |
| `trek_alerts` | Add `delivery_channel` (push/email), activate push delivery | M14 |

---

## Design System (Mobile)

### Colour Tokens (same as web, NativeWind mapping)
```
background:     #0c0e14   (web: bg-[#0c0e14])
surface:        #14161f   (web: bg-[#14161f])
border:         rgba(255,255,255,0.10)
accent:         hsl(22 92% 54%)   (brand orange)
pine:           hsl(162 50% 42%)  (success green)
text-primary:   #ffffff
text-secondary: rgba(255,255,255,0.70)
text-muted:     rgba(255,255,255,0.40)
```

### Typography
```
Display:  Playfair Display  (web font-display — loaded via expo-font)
Body:     Inter             (system font fallback on Android)
Mono:     JetBrains Mono    (for code/log displays)
```

### Component Library
All native components mirror web variants:
- `TrekCard` → native card (same data shape)
- `Button` → native pressable with haptic feedback
- `Badge` → status badge (same colour map)
- `SearchBar` → native text input + clear + voice
- `FilterSheet` → bottom sheet (gorhom/bottom-sheet)
- `OfflineBadge` → indicator for downloaded content
- `ProgressBar` → wizard step progress

---

## Platform Setup Checklist

| Item | Details |
|------|---------|
| Apple Developer Account | $99/year — required for TestFlight + App Store |
| Google Play Console | $25 one-time — required for Play Store |
| Firebase Project | FCM for Android push + Analytics |
| APNs Certificate | Via Apple Developer → Certificates, Identifiers & Profiles |
| Expo Account | expo.dev — required for EAS Build/Update |
| EAS CLI | `npm install -g eas-cli` + `eas login` |
| Bundle IDs | iOS: `co.in.trekyatra.app` / Android: `co.in.trekyatra.app` |
| App icons | 1024×1024 (iOS) + adaptive icon (Android) |
| Splash screen | 1284×2778 (iPhone 14 Pro Max) reference |

---

## CI/CD & Release Pipeline

```
PR opened
  → GitHub Actions: lint + type-check + unit tests
  → EAS Build (preview profile): Android APK only

PR merged to main
  → EAS Update: OTA push to existing installs (JS only)
  → EAS Build (staging profile): Android AAB + iOS IPA (internal TestFlight)

Release tag (v*.*.*)
  → EAS Build (production profile): Android AAB + iOS IPA
  → EAS Submit: auto-submit to Play Store (internal track) + TestFlight (external)
  → Manual review + promote to production
```

---

## Implementation Steps Summary

| Step | Title | Phase | Backend? | DB Changes? |
|------|-------|-------|----------|-------------|
| M01 | Expo bootstrap + navigation + design system | Foundation | No | No |
| M02 | Mobile auth — Bearer token, secure storage, biometric | Foundation | Yes (minor) | users table extension |
| M03 | Backend mobile API extensions — sync, device registration | Foundation | Yes (major) | mobile_devices table |
| M04 | CMS offline engine — SQLite schema, sync service, content renderer | Foundation | No (uses M03) | No (device-side SQLite) |
| M05 | Trek detail screen — CMS rendering, packing/permits/costs tabs, offline + share | Content | No | No |
| M06 | Home screen — 4-state personalisation, trending, recently viewed, welcome | Discovery | No | No |
| M07 | Explore & search — browse grid, facet filters, fuzzy + semantic search | Discovery | No | No |
| M08 | Trek comparison — compare screen, saved comparisons, attribute table | Discovery | No | No |
| M09 | Plan My Trek wizard — 6-step native, scoring results, lead capture | Planning | No | No |
| M10 | User account — bookmarks, downloads, enquiries, settings, premium | Account | No | No |
| M11 | Operators marketplace — listing, detail, inquiry form | Commerce | No | No |
| M12 | Digital products — catalog, Razorpay payment sheet, download delivery | Commerce | No | No |
| M13 | Premium subscription — IAP (Apple/Google) + Stripe web fallback, gating | Commerce | Yes (minor) | No |
| M14 | Push notifications — FCM + APNs, permit alerts, seasonal, conditions | Engagement | Yes (major) | mobile_push_log, trek_alerts extension |
| M15 | Mobile CDP analytics — event SDK, session management, behavior profile | Analytics | Yes (minor) | analytics_events/sessions extension |
| M16 | Trek check-ins & history — mark done, trek log timeline, badges | Community | Yes | user_trek_history table |
| M17 | Trip reports & trail conditions — user-generated reports, photo sharing | Community | Yes | trip_reports, trek_media tables |
| M18 | Trek buddy matching — connect by trek + date, buddy request flow | Community | Yes | buddy_requests table |
| M19 | Live trek conditions — IMD weather feed, crowdsourced rollup, permit status | Intelligence | Yes | trek_conditions table |
| M20 | Nearby treks — GPS detection, location-aware browse, radius filter | Intelligence | Yes (minor) | No |
| M21 | News feed + multilingual — Hindi locale, locale-aware CMS rendering | Content | No | No |
| M22 | EAS Build, store submission, CI/CD, OTA updates, crash reporting (Sentry) | Release | No | No |

---

## Milestone Targets

| Milestone | Target (from kickoff) |
|-----------|-----------------------|
| V5 kickoff decision | After V4 stable + ≥3 months traffic data |
| M01–M05 Foundation complete (internal alpha) | Month 1.5 |
| M06–M10 Core feature parity (internal beta) | Month 3 |
| M11–M15 Commerce + Analytics (closed beta) | Month 4.5 |
| M16–M18 Community layer (open beta — TestFlight + Play Store internal) | Month 6 |
| M19–M20 Contextual intelligence (Play Store open beta) | Month 8 |
| M21–M22 Full release (App Store + Play Store public) | Month 10 |
| Post-launch community growth + Phase 5 features | Month 12+ |

---

## Key Decisions Locked

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React Native + Expo | Shared TS/component logic with web; fastest path to both platforms |
| Navigation | Expo Router v3 | File-based, mirrors Next.js App Router; deep linking built in |
| Styling | NativeWind v4 | Reuse all Tailwind tokens from web design system |
| Shared logic | Copy and adapt `lib/*.ts` files | `behavior-tracker.ts`, `analytics.ts`, type definitions reused directly |
| Backend | Same FastAPI backend | Extend with mobile namespace; no separate backend service |
| Offline DB | expo-sqlite + Drizzle ORM | Best performance on both platforms; WAL mode; Drizzle for type-safe queries |
| Auth tokens | expo-secure-store | Hardware-backed; Keychain on iOS, Keystore on Android |
| Push | Expo Notifications + FCM/APNs | Single SDK for both platforms; Expo handles token registration |
| Payments | Razorpay for digital products, IAP for subscriptions | Razorpay works cross-platform for one-time; IAP required for App Store subscriptions |
| Analytics | Extend web CDP SDK | Same `analytics_events` table; add `platform` column; same admin CDP dashboards |
| Minimum OS | Android 10+ (API 29), iOS 15+ | Covers 90%+ of Indian Android market; iOS 15 = ~85% active iOS devices |
| CI/CD | EAS Build + GitHub Actions | Cloud builds; no self-hosted runner needed |

---

## Step Docs Index

All mobile step specifications live in `docs/mobile/steps/`:

| File | Step Title |
|------|-----------|
| `STEP-M01-foundation-bootstrap.md` | Expo project bootstrap, navigation, design system |
| `STEP-M02-mobile-auth.md` | Mobile auth — Bearer token, secure storage, Google, biometric |
| `STEP-M03-backend-mobile-extensions.md` | Backend mobile APIs — sync endpoint, device registration |
| `STEP-M04-offline-content-engine.md` | CMS offline engine — SQLite, incremental sync, content renderer |
| `STEP-M05-trek-detail-screen.md` | Trek detail — full CMS, tabbed guides, offline, share |
| `STEP-M06-home-screen-personalisation.md` | Home screen — 4-state personalisation |
| `STEP-M07-explore-search.md` | Explore & search — browse, filters, semantic search |
| `STEP-M08-trek-comparison.md` | Trek comparison — compare screen, saved pairs |
| `STEP-M09-plan-my-trek-wizard.md` | Plan My Trek — 6-step native wizard |
| `STEP-M10-user-account.md` | User account — bookmarks, downloads, settings |
| `STEP-M11-operators-marketplace.md` | Operators — listing, detail, inquiry |
| `STEP-M12-digital-products.md` | Digital products — catalog, Razorpay, downloads |
| `STEP-M13-premium-subscription.md` | Premium — IAP subscriptions, content gating |
| `STEP-M14-push-notifications.md` | Push notifications — FCM/APNs, permit alerts |
| `STEP-M15-mobile-cdp-analytics.md` | Mobile CDP analytics SDK |
| `STEP-M16-trek-checkins-history.md` | Trek check-ins — log, timeline, badges |
| `STEP-M17-trip-reports-photos.md` | Trip reports — condition updates, photo sharing |
| `STEP-M18-trek-buddy-matching.md` | Trek buddy matching — community connect |
| `STEP-M19-live-conditions.md` | Live trek conditions — IMD weather, crowdsource |
| `STEP-M20-nearby-treks-gps.md` | Nearby treks — GPS detection, location browse |
| `STEP-M21-news-multilingual.md` | News feed + Hindi locale |
| `STEP-M22-eas-build-release.md` | EAS Build, store submission, CI/CD, Sentry |
