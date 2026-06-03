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
| B04 | Firebase Android app registered (package: `co.in.trekyatra.app`) | `[ ]` | Download `google-services.json` |
| B05 | Firebase iOS app registered (bundle: `co.in.trekyatra.app`) | `[ ]` | Download `GoogleServiceInfo.plist` |
| B06 | Expo account created at expo.dev | `[ ]` | |
| B07 | EAS CLI installed and logged in (`eas login`) | `[ ]` | `npm install -g eas-cli` |
| B08 | EAS project created — note `EAS_PROJECT_ID` | `[ ]` | `eas init` in `apps/mobile/` |
| B09 | APNs Auth Key (.p8) generated in Apple Developer portal | `[ ]` | Upload via `eas credentials` |
| B10 | Google Sign-In client IDs created (OAuth 2.0) for iOS + Android | `[ ]` | Firebase Console → Authentication |
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
| D01 | `apps/mobile/eas.json` created with dev/preview/production profiles | `[ ]` | M22 — `co.in.trekyatra.app` bundle ID |
| D02 | `apps/mobile/app.config.ts` dynamic config created | `[ ]` | M22 |
| D03 | `google-services.json` (Android) added as EAS secret (NOT git-committed) | `[ ]` | `eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file` |
| D04 | `GoogleServiceInfo.plist` (iOS) added as EAS secret | `[ ]` | Same command, `--name GOOGLE_SERVICE_INFO_PLIST` |
| D05 | APNs Auth Key (.p8) uploaded via `eas credentials` | `[ ]` | `eas credentials` → iOS → Push Notification Key |
| D06 | iOS distribution certificate generated via `eas credentials` | `[ ]` | EAS manages this automatically in auto-signing mode |
| D07 | Android keystore generated (production signing) via EAS | `[ ]` | `eas credentials` → Android → Keystore |
| D08 | GitHub secrets set: `EXPO_TOKEN`, `EAS_PROJECT_ID`, `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SENTRY_DSN`, `GOOGLE_IOS_CLIENT_ID` | `[ ]` | M22 |
| D09 | Development build installs on physical Android device | `[ ]` | `eas build --profile development --platform android` |
| D10 | Development build installs on iOS simulator or physical device | `[ ]` | `eas build --profile development --platform ios` |
| D11 | Preview build distributed to internal testers via TestFlight | `[ ]` | `eas build --profile preview --platform ios` + `eas submit` |
| D12 | Preview build distributed to internal testers via Play Internal Testing | `[ ]` | `eas build --profile preview --platform android` + `eas submit` |

---

## SECTION E — App Store Setup

### Apple App Store Connect
| # | Item | Status |
|---|------|--------|
| E01 | App record created: Bundle ID `co.in.trekyatra.app` | `[ ]` |
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
| E11 | App record created: Package `co.in.trekyatra.app` | `[ ]` |
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
| M15 | Mobile CDP analytics | `[ ]` | Events appear in admin CDP → Event Explorer |
| M16 | Trek check-ins & history | `[ ]` | Check-in recorded + badge awarded |
| M17 | Trip reports & photos | `[ ]` | Report submitted + photo uploaded + moderation queue |
| M18 | Trek buddy matching | `[ ]` | Signal posted + buddy match found + request sent |
| M19 | Live trek conditions | `[ ]` | Weather widget shows on trek detail; celery job runs |
| M20 | Nearby treks | `[ ]` | GPS location used; nearby treks displayed |
| M21 | News feed + multilingual | `[ ]` | Hindi content renders in Hindi locale |
| M22 | EAS Build + store submission | `[ ]` | Production build submitted to both stores |

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
