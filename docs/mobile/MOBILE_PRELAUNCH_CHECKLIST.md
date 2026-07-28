# TrekYatra Mobile App — Pre-Launch Checklist

> This checklist gates the public release of the TrekYatra mobile app.
> Work through each section top-to-bottom. Nothing ships until every `[ ]` is `[x]`.
> Last updated: 2026-05-29

---

## SECTION A — Prerequisites (Gate Check)

| # | Item | Status | Notes |
|---|------|--------|-------|
| A01 | V0–V4 web platform fully stable (Steps 00–67 done and deployed) | `[x]` | |
| A02 | Production API live at `https://api.trekyatra.co.in` | `[x]` | BLR1 DigitalOcean App Platform |
| A03 | ≥50 trek guide CMS pages published and live | `[ ]` | Run content pipeline first |
| A04 | ≥3 months of production traffic data available | `[ ]` | V5 gate condition |
| A05 | Google Search Console indexed (sitemap submitted) | `[ ]` | |

---

## SECTION B — Platform Accounts & Credentials

| # | Item | Status | Notes |
|---|------|--------|-------|
| B01 | Apple Developer account created and active ($99/year) | `[ ]` | Required for TestFlight + App Store |
| B02 | Google Play Console account created ($25 one-time) | `[ ]` | |
| B03 | Firebase project created (`trekyatra-mobile`) | `[ ]` | Needed for FCM push (M14) |
| B04 | Firebase Android app registered (package: `in.co.trekyatra.app`) | `[ ]` | Download `google-services.json` |
| B05 | Firebase iOS app registered (bundle: `in.co.trekyatra.app`) | `[ ]` | Download `GoogleServiceInfo.plist` |
| B06 | Expo account created at expo.dev | `[ ]` | |
| B07 | EAS CLI installed and logged in (`eas login`) | `[ ]` | `npm install -g eas-cli` |
| B08 | EAS project created — note `EAS_PROJECT_ID` | `[ ]` | `eas init` in `apps/mobile/` |
| B09 | APNs Auth Key (.p8) generated in Apple Developer portal | `[ ]` | Upload via `eas credentials` |
| B10 | Google Sign-In client IDs created (OAuth 2.0) for iOS + Android | `[x]` | iOS client `445487374089-1qgsnnn3428nuf6qvtiff6bobmvfgvjr` (bundle `in.co.trekyatra.app`) wired into `eas.json` env as `EXPO_PUBLIC_GOOGLE_CLIENT_ID`; reversed scheme in app.config.ts |
| B11 | Razorpay production keys activated (not test mode) | `[ ]` | dashboard.razorpay.com |
| B12 | Apple IAP products created in App Store Connect (monthly + annual) | `[ ]` | Required before M13 implementation |
| B13 | Google Play IAP products created in Play Console | `[ ]` | Required before M13 implementation |
| B14 | Sentry project created (`trekyatra-mobile`) | `[ ]` | sentry.io |

---

## SECTION C — Backend / DigitalOcean Configuration

All env vars below must be set in DigitalOcean App Platform → `api` component environment variables. New Celery tasks require a deploy + celery-beat restart.

| # | Env Var / Action | Required By | Status | Notes |
|---|-----------------|-------------|--------|-------|
| C01 | `OPENWEATHERMAP_API_KEY` | M19 Live Conditions | `[ ]` | openweathermap.org → One Call API 3.0 (free tier) |
| C02 | `FIREBASE_SERVICE_ACCOUNT_JSON` (as file secret) | M14 FCM push | `[ ]` | Firebase Console → Service accounts → Generate key |
| C03 | `APNS_KEY_ID` | M14 APNs push | `[ ]` | Apple Developer → Keys → AuthKey .p8 |
| C04 | `APNS_TEAM_ID` | M14 APNs push | `[ ]` | Apple Developer → Membership → Team ID |
| C05 | `APNS_KEY_PATH` | M14 APNs push | `[ ]` | Path to .p8 file in EAS secrets or filesystem |
| C06 | `DO_SPACES_KEY` + `DO_SPACES_SECRET` | M17 photo uploads | `[ ]` | DO Spaces → `trekyatra-media` bucket (sgp1 region) |
| C07 | `DO_SPACES_BUCKET=trekyatra-media` + `DO_SPACES_REGION=sgp1` | M17 | `[ ]` | Bucket already provisioned |
| C08 | Celery beat: `notifications.send_permit_alerts` task registered | M14 | `[ ]` | Restart celery-beat after deploy |
| C09 | Celery beat: `notifications.send_seasonal_alerts` task registered | M14 | `[ ]` | Restart celery-beat after deploy |
| C10 | Celery beat: `buddies.expire_signals` task registered (daily 00:30) | M18 | `[ ]` | Restart celery-beat after deploy |
| C11 | Celery beat: `conditions.refresh_trek_conditions` task registered (6h) | M19 | `[ ]` | Restart celery-beat after deploy |
| C12 | `alembic upgrade head` run after each mobile step migration | All | `[ ]` | Via DO api component Console tab |
| C13 | `RAZORPAY_WEBHOOK_SECRET` set for mobile payment webhook | M12 | `[ ]` | Razorpay Dashboard → Webhooks |
| C14 | Health check: `GET /api/v1/health` returns 200 with all services healthy | All | `[ ]` | Confirm before each mobile build |

---

## SECTION D — App Build & EAS Setup

| # | Item | Status | Notes |
|---|------|--------|-------|
| D01 | `apps/mobile/eas.json` created with dev/preview/production profiles | `[ ]` | M22 — confirm bundle ID matches App Store Connect exactly |
| D02 | `apps/mobile/app.config.ts` dynamic config created | `[ ]` | M22 |
| D03 | **`expo-notifications` plugin added to `plugins` array in `app.config.ts`** | `[ ]` | **BLOCKING** — without this, APNs entitlements are NOT in the native binary even if `expo-notifications` package is installed |
| D04 | **`expo-updates` package installed** (`npx expo install expo-updates`) | `[ ]` | **BLOCKING for OTA** — not in `package.json` yet; required for `eas update` |
| D05 | **`runtimeVersion.policy: "appVersion"` set in `app.config.ts`** | `[ ]` | Required alongside `expo-updates` for OTA channels |
| D06 | **Splash screen image created** (1284×2778 PNG) and referenced as `splash.image` in `app.config.ts` | `[ ]` | Currently only `splash.backgroundColor` is set — native splash will be blank dark screen |
| D07 | **`PrivacyInfo.xcprivacy` privacy manifest created** in `apps/mobile/ios/TrekYatra/` | `[ ]` | **Required by Apple since May 2024** for all new submissions. Must declare API reasons for: `NSLocationWhenInUseUsageDescription`, `NSFaceIDUsageDescription`, `NSUserDefaults` (expo-secure-store), file timestamp APIs (expo-local-authentication). Rejection guaranteed without this. |
| D08 | **Sentry package version aligned to Expo SDK 56** (`@sentry/react-native ~6.x` not `~7.11.0`) | `[ ]` | Current `~7.11.0` is mismatched — may cause build failures and symbolication issues |
| D09 | **`ascAppId` and `appleTeamId` populated in `eas.json`** | `[x]` | ascAppId=6795408094, appleTeamId=CQ3B698U57, appleId=guyshazam12@gmail.com |
| D10 | **Bundle ID RECONCILED ✅ (2026-07-28)** — all files now use `in.co.trekyatra.app` (app.config.ts iOS+Android, checklist Sections B/E, PRODUCTION_SETUP). Final before ASC registration. | `[x]` | Bundle ID cannot be changed after App Store Connect registration |
| D11 | `google-services.json` (Android) added as EAS secret (NOT git-committed) | `[ ]` | `eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file` |
| D12 | `GoogleServiceInfo.plist` (iOS) added as EAS secret | `[ ]` | Same command, `--name GOOGLE_SERVICE_INFO_PLIST` |
| D13 | APNs Auth Key (.p8) uploaded via `eas credentials` | `[ ]` | `eas credentials` → iOS → Push Notification Key |
| D14 | iOS distribution certificate generated via `eas credentials` | `[x]` | 2026-07-28 — cert serial 5D09C0BC7AB8B417C1BDD0C40A9459F9, provisioning profile GQKKXBS28J (EAS-managed, exp 2027-07-28) |
| D15 | Android keystore generated (production signing) via EAS | `[ ]` | `eas credentials` → Android → Keystore |
| D16 | GitHub secrets set: `EXPO_TOKEN`, `EAS_PROJECT_ID`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SENTRY_DSN`, `GOOGLE_IOS_CLIENT_ID` | `[ ]` | M22 |
| D17 | Development build installs on physical Android device | `[ ]` | `eas build --profile development --platform android` |
| D18 | Development build installs on iOS simulator or physical device | `[ ]` | `eas build --profile development --platform ios` |
| D19 | Preview build distributed to internal testers via TestFlight | `[x]` | 2026-07-28 — **production**-profile build 1.0.0 (build 1, EAS id 63e74c2a) submitted to ASC (app 6795408094) via `eas submit`; ASC API key LR3772ZFCB stored on EAS. Processing → TestFlight |
| D20 | Preview build distributed to internal testers via Play Internal Testing | `[ ]` | `eas build --profile preview --platform android` + `eas submit` |

---

## SECTION E — App Store Setup

### Apple App Store Connect
| # | Item | Status |
|---|------|--------|
| E01 | App record created: Bundle ID `in.co.trekyatra.app` | `[x]` (Apple ID 6795408094, name "TrekYatra") |
| E02 | App Category: Travel | `[ ]` |
| E03 | Age Rating: 4+ | `[ ]` |
| E04 | Privacy Nutrition Labels: Location (when in use), Purchases, User Content (reports) | `[ ]` |
| E05 | In-App Purchases configured (monthly + annual subscription product IDs) | `[ ]` |
| E06 | Screenshots prepared: 6.7" iPhone + 6.1" iPhone | `[ ]` |
| E07 | App Preview video (optional) | `[ ]` |
| E08 | TestFlight: internal testers invited → external beta group created | `[ ]` |
| E09 | Privacy Policy URL added: `https://trekyatra.co.in/privacy` | `[ ]` |
| E10 | Support URL added: `https://trekyatra.co.in/contact` | `[ ]` |

### Google Play Console
| # | Item | Status |
|---|------|--------|
| E11 | App record created: Package `in.co.trekyatra.app` | `[ ]` |
| E12 | App Category: Travel & Local | `[ ]` |
| E13 | Content Rating: Everyone | `[ ]` |
| E14 | In-App Products configured (product IDs matching M13) | `[ ]` |
| E15 | Data Safety form: Location (coarse, optional), Purchases, User Content | `[ ]` |
| E16 | Screenshots: phone screenshots for all screen types | `[ ]` |
| E17 | Internal Testing track → Closed Testing → Open Testing pipeline set up | `[ ]` |
| E18 | Service account JSON for EAS Submit created and saved | `[ ]` |

---

## SECTION F — Step Implementation Gate

Each step below must be implemented, tested, and all verification TCs passed before the step is closed.

| Step | Title | Status | Gate |
|------|-------|--------|------|
| M01 | Expo bootstrap + navigation + design system | `[ ]` | `npx expo export --platform all` passes |
| M02 | Mobile auth | `[ ]` | Email + Google + Apple sign-in work on device |
| M03 | Backend mobile API extensions | `[ ]` | All backend tests pass; sync endpoint functional |
| M04 | CMS offline engine | `[ ]` | Trek guide readable in airplane mode |
| M05 | Trek detail screen | `[ ]` | Full CMS trek page renders natively + offline |
| M06 | Home screen + personalisation | `[ ]` | 4-state logic verified on device |
| M07 | Explore & search | `[ ]` | Filters + semantic search functional |
| M08 | Trek comparison | `[ ]` | 2-trek and 3-trek comparison both work |
| M09 | Plan My Trek wizard | `[ ]` | Full 6-step wizard → recommendation results |
| M10 | User account | `[ ]` | All account screens + newsletter subscribe |
| M11 | Operators marketplace | `[ ]` | Listing, detail, inquiry form submits lead |
| M12 | Digital products | `[ ]` | Razorpay payment sheet → download delivered |
| M13 | Premium subscription | `[ ]` | IAP subscription on both platforms |
| M14 | Push notifications | `[ ]` | Test permit alert push received on device |
| M15 | Mobile CDP analytics | `[~]` | Infra done (M15). **Instrumentation completed 2026-07-28:** auto `screen_view` on every route (AnalyticsProvider `usePathname`), `device_model`+`os_version` on every event (expo-device, in `properties`), and wired `trek_view`/`trek_shared`/`trek_saved`/`search`/`operator_inquiry`. `plan_wizard_step`+`plan_wizard_completed` (via `WizardStepLayout` + `results.tsx`) and `trek_downloaded` (via `offlineStore.download`) now wired too. **Remaining (blocked/deferred only):** `news_article_viewed` (waits on M21 mobile news screen — not built), `push_opened` (deferred with push v1.1), product/premium events (iOS-removed). Verify in admin CDP → Event Explorer filtered `platform=ios`. **Analytics-layer hardening (2026-07-28):** (a) screen names **normalized to route patterns** (`/trek/[slug]`) via `useSegments` — concrete path kept in `properties.path` (fixes cardinality); (b) **server session lifecycle** — `AnalyticsProvider` now calls `/analytics/session/start` (with `platform`/`app_version`/`device_model`/`os_version`; migration `20260728_0055` added the 2 session columns) + `/session/end`, so mobile sessions + cohort/retention reports populate; (c) **analytics consent** opt-out toggle in Settings (`lib/consent.ts`, gates ALL events + sessions). **UTM/install attribution DEFERRED to v1.1** — no UTM source reaches the app without Universal Links (deferred); backend `session/start` already accepts `utm_*` so it's ready. 29 CDP tests pass; mobile tsc 0. |
| M16 | Trek check-ins & history | `[ ]` | Check-in recorded + badge awarded |
| M17 | Trip reports & photos | `[ ]` | Report submitted + photo uploaded + moderation queue |
| M18 | Trek buddy matching | `[ ]` | Signal posted + buddy match found + request sent |
| M19 | Live trek conditions | `[ ]` | Weather widget shows on trek detail; celery job runs |
| M20 | Nearby treks | `[ ]` | GPS location used; nearby treks displayed |
| M21 | News feed + multilingual | `[ ]` | Hindi content renders in Hindi locale |
| M22 | EAS Build + store submission | `[ ]` | Production build submitted to both stores |
| — | **OTP / Forgot Password / Reset Password screens** | `[ ]` | Listed in V5 screen inventory — not yet implemented; auth is email + Google only |

---

## SECTION G — Testing

| # | Test | Status | Command |
|---|------|--------|---------|
| G01 | All new backend pytest tests pass | `[ ]` | `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v` |
| G02 | Frontend `next build` unaffected by mobile backend additions | `[ ]` | `cd apps/web-next && npm run build` |
| G03 | `npx expo export --platform all` succeeds | `[ ]` | No TypeScript errors |
| G04 | EAS Preview build installs and runs on physical Android device | `[ ]` | |
| G05 | EAS Preview build installs and runs on iOS simulator + physical device | `[ ]` | |
| G06 | All 22 step verification TCs manually checked | `[ ]` | |
| G07 | Sentry crash report captured and symbolicated | `[ ]` | Throw a test exception, check Sentry |
| G08 | OTA update received by installed app after `eas update` | `[ ]` | |
| G09 | Payment flow tested end-to-end on both platforms (test mode) | `[ ]` | |
| G10 | Push notification received end-to-end on both platforms | `[ ]` | |

---

## SECTION H — Known Gaps (Mobile)

These are known limitations at V5 launch — acceptable for initial release:

| # | Gap | Impact | Plan |
|---|-----|--------|------|
| MZ01 | AR compass / peak identification | Low | Phase 6+ |
| MZ02 | Elasticsearch search (using API fuzzy + semantic for now) | Low | Post-launch |
| MZ03 | Saved comparisons offline cache | Low | Post-launch |
| MZ04 | Marathi (mr) locale in app | Low | Post-launch |
| MZ05 | Razorpay webhook — fully manual verify until webhook endpoint confirmed | Medium | Before M12 impl |
| MZ06 | Background location for trail tracking | Medium | Phase 6+ (privacy concerns) |
| MZ07 | PostGIS-based nearby query (using Haversine in Python for V5) | Low | Post-launch |
| MZ08 | Buddy chat uses 10-second polling (not WebSocket) | Low | Acceptable for V5; WebSocket upgrade post-launch |
| MZ09 | `user_badges` table not a separate DB table — badge logic embedded in service layer | Low | Post-launch refactor if needed |

---

## SECTION I — Go / No-Go Decision

Sign-off required from the product owner before the app is submitted to App Store / Play Store:

| # | Sign-off Item | Status |
|---|--------------|--------|
| I01 | All Section F step gates passed | `[ ]` |
| I02 | All Section G tests pass | `[ ]` |
| I03 | All Section B platform accounts active | `[ ]` |
| I04 | All Section C env vars set in DigitalOcean | `[ ]` |
| I05 | Store listings reviewed and approved by product owner | `[ ]` |
| I06 | Privacy policy and data safety forms reviewed by product owner | `[ ]` |
| I07 | Crash-free rate >99% in 24h post-preview-build testing | `[ ]` |

**Go for submission:** All I01–I07 must be `[x]` before `eas submit --platform all --profile production`.

---

## iOS Launch-Readiness Audit — 2026-07-21 (code-grounded)

Full audit of `apps/mobile/` + backend + DO for the first iOS App Store submission. Product features M01–M20 are built; the **release-engineering layer (M22) is unstarted** and there are hard compliance + config gates. Every item traces to a file.

### 🔴 BLOCKERS (App Store rejection or broken app)
- **[3.1.1] Digital products sold via Razorpay on iOS** — `hooks/usePurchase.ts` ("Buy & Download ₹x", `app/(tabs)/browse/products/[slug].tsx`). Must be StoreKit IAP or removed from the iOS build.
- **[3.1.1] Premium subscription runs in test-mode** — `services/iapService.ts` stub + `hooks/usePremium.ts` grants premium with fake receipt `test_receipt_no_iap_credentials`; `react-native-iap` not installed. Wire real StoreKit IAP + server receipt validation.
- **[3.1.1] "Subscribe via website" external link** in paywall — `app/(tabs)/account/premium.tsx` `Linking.openURL(".../premium")`. Anti-steering; remove from iOS.
- **[4.8] Sign in with Apple stubbed** ("coming soon") while Google sign-in is live — `providers/AuthProvider.tsx` throws; M04 Apple backend endpoint missing. Must implement + enable.
- **Prod API URL not in build config** — resolved only from `.env.local` (gitignored); `eas.json` has no `env` block → cloud EAS prod build inlines `http://localhost:8000` (`lib/mobileApi.ts`, `authApi.ts`, `syncService.ts`). App can't reach backend. Move `EXPO_PUBLIC_*` to EAS env/secrets.
- **`eas.json submit.production.ios` missing `ascAppId` + `appleTeamId`** (empty) → `eas submit` fails.
- **EAS `projectId` empty** (`app.config.ts` `EXPO_PROJECT_ID ?? ""`) → no project binding; run `eas init`.
- **App icon 500×500 with alpha** — Apple requires 1024×1024, no alpha. Binary validation fails.
- **APNs entitlement `aps-environment = development`** — must be `production` for store build.
- **Cloudflare `enhanced_threat_control` may 403 the native app** — challenges non-browser clients on `api.trekyatra.co.in`; existing bypass only covers `www/api`, not the `api.` subdomain the app uses. VERIFY on a real device/TestFlight build.
- **M22 release engineering unstarted** — Apple Developer account, ASC app record, APNs `.p8` key, EAS creds, screenshots, privacy labels all pending.
- **Bundle-ID inconsistency** — code `in.co.trekyatra.app` vs docs `co.in.trekyatra.app` vs backend APNs default `co.trekyatra.app`. Reconcile BEFORE ASC registration (irreversible).

### 🟠 IMPORTANT (rejection risk / broken features)
- Backend prod env unset: `APNS_KEY_ID/TEAM_ID/KEY_P8` (push disabled), `APPLE_IAP_SHARED_SECRET` (IAP test-mode grants premium without receipt check), `DO_SPACES_*` (media ephemeral).
- Universal Links not configured (no `associated-domains`/`applinks:`) → shared `https://trekyatra.co.in/trek/...` links open Safari, not the app.
- Confirm the mobile Bearer-auth backend fix is actually deployed on prod.
- `PrivacyInfo.xcprivacy` `NSPrivacyCollectedDataTypes` empty despite collecting email/location/purchases/analytics — fill to match privacy labels.
- Generic Camera/Photo-Library permission strings ("$(PRODUCT_NAME)") — replace with real copy.
- Sentry disabled in prod (DSN only in `.env.local`) + `@sentry/react-native 7.11` vs Expo SDK 56 alignment.
- Smoke-test mobile-only Bearer routes on device (`/auth/mobile/*`, `/mobile/sync`, `/mobile/device`).

### 🟢 NICE-TO-HAVE
- OTA (`expo-updates` + `runtimeVersion`) not configured; branded splash image missing; remove unused iOS keys (`NSLocationAlways*`, `NSMotion`, dev Bonjour); `autoIncrement` build number; FCM creds (Android parity); rate-limit `/auth/mobile/*`; M21 (News + Hindi) still pending (feature, not blocker).

**Highest-leverage decision:** the monetization model (StoreKit-IAP-only on iOS resolves the top 3 blockers but is the largest code effort) — decide before starting M22.
