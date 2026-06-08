# TrekYatra Mobile App — Production Setup Log

> Tracks every platform, credential, and infrastructure decision for the mobile app.
> Reference alongside `docs/PRODUCTION_SETUP.md` (web platform setup).
> **DO NOT commit passwords, .p8 keys, or JSON credential files here.**
> Last updated: 2026-05-29

---

## Shared Infrastructure (from Web Platform)

The mobile app reuses the existing DigitalOcean backend — no new servers needed.

| Layer | Service | Status | Notes |
|-------|---------|--------|-------|
| Backend API | DO App Platform — `api` component | `[x]` HEALTHY | `https://api.trekyatra.co.in` |
| Database | Managed PostgreSQL 16 + pgvector — `trekyatra-db` | `[x]` HEALTHY | BLR1, same DB used by web |
| Cache | Managed Valkey 8 — `db-valkey-blr1-95254` | `[x]` HEALTHY | BLR1, same Redis used by web |
| Celery Worker | DO App Platform — `celery-worker` component | `[x]` HEALTHY | Extended with mobile Celery tasks |
| Celery Beat | DO App Platform — `celery-beat` component | `[x]` HEALTHY | Extended with mobile scheduled tasks |
| Object Storage | DO Spaces `trekyatra-media` (sgp1) | `[x]` PROVISIONED | Used for M17 trip report photos |

---

## New Env Vars Required (api component)

Add these in DigitalOcean → App Platform → trekyatra → api → Environment Variables.
These do NOT exist yet — must be added before the relevant mobile step is implemented.

| Env Var | Required By | How to Get | Notes | Status |
|---------|-------------|-----------|-------|--------|
| `MOBILE_TOKEN_EXPIRE_DAYS` | M03 | Set to `30` | Mobile JWT lifetime (days) | `[x]` DONE 2026-06-08 |
| `OPENWEATHERMAP_API_KEY` | M19 | openweathermap.org → API Keys | One Call API 3.0, free tier (1000 calls/day) | `[ ]` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | M14 FCM | Firebase Console → Project Settings → Service Accounts → Generate new private key | Store as encrypted DO env var; escape newlines in JSON |
| `APNS_KEY_ID` | M14 APNs | Apple Developer → Certificates, IDs & Profiles → Keys | 10-character string |
| `APNS_TEAM_ID` | M14 APNs | Apple Developer → Membership → Team ID | 10-character string |
| `APNS_KEY_PATH` | M14 APNs | Upload .p8 file; set path here or embed contents | Use EAS secrets for the .p8 file |
| `DO_SPACES_KEY` | M17 | DO → Spaces → Access Keys | Scoped to `trekyatra-media` bucket |
| `DO_SPACES_SECRET` | M17 | Same as above | Encrypted |
| `DO_SPACES_BUCKET` | M17 | `trekyatra-media` | Already provisioned |
| `DO_SPACES_REGION` | M17 | `sgp1` | Singapore CDN endpoint |
| `RAZORPAY_WEBHOOK_SECRET` | M12 | Razorpay Dashboard → Webhooks | For payment verification |

Add to `services/api/.env.example`:
```
OPENWEATHERMAP_API_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=
APNS_KEY_ID=
APNS_TEAM_ID=
APNS_KEY_PATH=
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_BUCKET=trekyatra-media
DO_SPACES_REGION=sgp1
RAZORPAY_WEBHOOK_SECRET=
```

---

## New Celery Scheduled Tasks (celery-beat restart required)

After each mobile step that adds a Celery task is deployed, the `celery-beat` component must be restarted in DO App Platform to pick up the new schedule.

| Task | Schedule | Added By | Status |
|------|----------|----------|--------|
| `notifications.send_permit_alerts` | Daily 08:00 IST | M14 | `[ ]` |
| `notifications.send_seasonal_alerts` | Weekly Monday 08:00 IST | M14 | `[ ]` |
| `buddies.expire_signals` | Daily 00:30 IST | M18 | `[ ]` |
| `conditions.refresh_trek_conditions` | Every 6h (00:30, 06:30, 12:30, 18:30) | M19 | `[ ]` |

**How to restart celery-beat on DO App Platform:**
1. DigitalOcean → Apps → trekyatra → Components → celery-beat
2. Actions → Restart component
3. After restart, tail logs and confirm `[tasks]` list includes new tasks

---

## EAS Build & Expo Setup

| Item | Value | Status |
|------|-------|--------|
| Expo account | expo.dev (owner: trekyatra) | `[ ]` |
| EAS project name | `trekyatra` | `[ ]` |
| EAS Project ID | Set from `eas init` output | `[ ]` |
| iOS bundle ID | `co.in.trekyatra.app` | `[ ]` |
| Android package | `co.in.trekyatra.app` | `[ ]` |
| EAS CLI version | >= 5.0.0 | `[ ]` |

### EAS Secrets (NOT git-committed)

Store these in EAS instead of git:

```bash
# Android Firebase config
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json

# iOS Firebase config
eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --type file --value ./GoogleServiceInfo.plist

# APNs auth key
eas secret:create --scope project --name APNS_AUTH_KEY --type file --value ./AuthKey_XXXXXXXXXX.p8
```

### GitHub Secrets (CI/CD)

Required in repo Settings → Secrets → Actions:

| Secret | Value source |
|--------|-------------|
| `EXPO_TOKEN` | expo.dev → Access Tokens |
| `EAS_PROJECT_ID` | From `eas.json` or `app.config.ts` output |
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.trekyatra.co.in` |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry → trekyatra-mobile → DSN |
| `GOOGLE_IOS_CLIENT_ID` | Firebase Console → Google Sign-In → iOS client ID |

---

## Apple Developer Setup

| Step | Action | Status |
|------|--------|--------|
| 1 | Create Apple Developer account at developer.apple.com ($99/year) | `[ ]` |
| 2 | Create App ID: `co.in.trekyatra.app` with capabilities: Sign In with Apple, Push Notifications, In-App Purchase | `[ ]` |
| 3 | Create APNs Auth Key (.p8) — download and store securely | `[ ]` |
| 4 | Register EAS distribution certificate via `eas credentials` | `[ ]` |
| 5 | Create App Store Connect record for TrekYatra | `[ ]` |
| 6 | Configure In-App Purchases: monthly (`trekyatra_premium_monthly`) + annual (`trekyatra_premium_annual`) | `[ ]` |
| 7 | Set up TestFlight: internal group (up to 25 dev team) + external beta (public) | `[ ]` |
| 8 | Privacy Nutrition Labels: Location (when in use, optional), Purchases, User Content (trip reports) | `[ ]` |
| 9 | Add `https://trekyatra.co.in/privacy` as Privacy Policy URL | `[ ]` |

---

## Google Play Setup

| Step | Action | Status |
|------|--------|--------|
| 1 | Create Play Console account ($25 one-time) | `[ ]` |
| 2 | Create app: package `co.in.trekyatra.app`, category Travel & Local, content rating Everyone | `[ ]` |
| 3 | Create service account JSON for EAS Submit (Actions → Manage Play Store keys) | `[ ]` |
| 4 | Configure In-App Products: same IDs as iOS (`trekyatra_premium_monthly`, `trekyatra_premium_annual`) | `[ ]` |
| 5 | Data Safety form: Location (coarse, optional), Purchases, User Content (trip reports + photos) | `[ ]` |
| 6 | Set up release tracks: Internal Testing → Closed Testing → Open Testing → Production | `[ ]` |
| 7 | Upload first APK/AAB to Internal Testing track manually before CI takes over | `[ ]` |

---

## Firebase Project Setup

| Step | Action | Status |
|------|--------|--------|
| 1 | Create Firebase project `trekyatra-mobile` at console.firebase.google.com | `[ ]` |
| 2 | Add Android app: package `co.in.trekyatra.app` | `[ ]` |
| 3 | Add iOS app: bundle `co.in.trekyatra.app` | `[ ]` |
| 4 | Enable Firebase Authentication: Google provider | `[ ]` |
| 5 | Enable Cloud Messaging (FCM) | `[ ]` |
| 6 | Download `google-services.json` (Android) → add as EAS secret | `[ ]` |
| 7 | Download `GoogleServiceInfo.plist` (iOS) → add as EAS secret | `[ ]` |
| 8 | Generate service account key (JSON) for backend FCM send → add as DO env var | `[ ]` |
| 9 | Configure OAuth redirect URIs: `https://trekyatra.co.in/auth/google` + deep link | `[ ]` |

---

## Sentry Setup

| Step | Action | Status |
|------|--------|--------|
| 1 | Create Sentry project `trekyatra-mobile` (React Native) | `[ ]` |
| 2 | Note DSN → add to EAS secrets + DO env var `EXPO_PUBLIC_SENTRY_DSN` | `[ ]` |
| 3 | Configure `sentry.config.ts` in `apps/mobile/` (M22) | `[ ]` |
| 4 | Source maps auto-uploaded during EAS Build via `@sentry/react-native/expo` plugin | `[ ]` |
| 5 | Set alert: email on crash-free rate < 99% in first 24h | `[ ]` |

---

## Database Migrations (Mobile Steps)

After each mobile step that includes a DB migration, run:
```bash
cd services/api && ../../.venv/bin/alembic upgrade head
```

Or via DigitalOcean App Platform → api component → Console tab:
```bash
alembic upgrade head
```

| Migration | Step | Tables/Columns Added | Status |
|-----------|------|---------------------|--------|
| `20260608_0042_mobile_devices.py` | M03 | `mobile_devices`, `cms_pages.deleted_at`, partial index | `[x]` DONE 2026-06-08 |
| `YYYYMMDD_0043_users_mobile_prefs.py` | M02 | `users.preferred_language`, `users.notification_prefs` | `[ ]` |
| `YYYYMMDD_0044_mobile_push_log.py` | M14 | `mobile_push_log`, `trek_alerts.delivery_channel` | `[ ]` |
| `YYYYMMDD_0045_mobile_analytics.py` | M15 | `analytics_events.platform/app_version`, `analytics_sessions.platform/device_model/os_version` | `[ ]` |
| `YYYYMMDD_0046_user_trek_history.py` | M16 | `user_trek_history`, `user_badges` | `[ ]` |
| `YYYYMMDD_0047_trip_reports_media.py` | M17 | `trip_reports`, `trek_media` | `[ ]` |
| `YYYYMMDD_0048_buddy_matching.py` | M18 | `buddy_signals`, `buddy_requests` | `[ ]` |
| `YYYYMMDD_0049_trek_conditions.py` | M19 | `trek_conditions` | `[ ]` |

> Migration file names follow the convention in `services/api/alembic/versions/`.
> Actual names assigned at implementation time.

---

## Cost Estimate (Monthly, Post-Launch)

| Service | Cost | Notes |
|---------|------|-------|
| DigitalOcean API + Workers (existing) | $48/month | Shared with web |
| DigitalOcean Managed DB (existing) | $15.15/month | Shared with web |
| DigitalOcean Managed Redis (existing) | $15/month | Shared with web |
| DO Spaces (`trekyatra-media`) | ~$5/month | 250GB storage + CDN |
| OpenWeatherMap API | $0 | Free tier (1000 calls/day) |
| Expo EAS (Build + Update) | $0–$29/month | Free tier 25 builds/month |
| Apple Developer Program | $99/year | ~$8.25/month |
| Google Play Console | $0 | One-time $25 already paid |
| Firebase (FCM) | $0 | FCM is free; Blaze plan only if Cloud Functions needed |
| Sentry | $0–$26/month | Free tier 5000 errors/month |
| **Total new mobile costs** | **~$10–45/month** | Depends on EAS plan and Sentry tier |

---

## OTA Update Policy

| Change Type | Deploy Via | Store Review? |
|------------|-----------|---------------|
| Bug fix — JS/TS only | `eas update --branch production` | No |
| New screen — JS/TS only | `eas update --branch production` | No |
| New native module / permission change | EAS Build + store submit | Yes (1–3 days iOS, 1–3 days Android) |
| New IAP product | App Store Connect + Play Console | Yes |
| Icon or splash change | EAS Build + store submit | Yes |
| App version bump (1.x.x → 1.y.0) | EAS Build + store submit | Yes |

`runtimeVersion.policy: "appVersion"` in `app.config.ts` — OTA updates only reach users on the same version string. Any version bump requires a full build.

---

## Rollback Procedure

### OTA rollback (JS crash after update):
```bash
# Find the previous update ID
eas update:list --branch production

# Roll back to previous update
eas update --branch production --rollback-to-target <previous_update_id>
```

### Full build rollback (binary crash):
1. DigitalOcean → App Platform → roll back `api` component if the crash is backend-caused
2. Revert the git commit and create a new EAS build
3. Submit to stores with `--latest` flag after build is ready

---

## Support Contact for Platform Issues

| Platform | Support Channel |
|----------|----------------|
| Apple App Store review | appstoreconnect.apple.com → Resolution Center |
| Google Play review | support.google.com/googleplay/android-developer |
| EAS Build issues | expo.dev → Support |
| DigitalOcean | cloud.digitalocean.com → Support ticket |
| Firebase FCM | firebase.google.com → Support |
