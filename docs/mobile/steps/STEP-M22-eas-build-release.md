# STEP-M22 — EAS Build, CI/CD & App Store Release

**Status:** Pending
**Phase:** Infrastructure & Release
**Dependencies:** All STEP-M01 through STEP-M21 complete and verified

---

## Scope

Production release infrastructure for both iOS App Store and Google Play Store. EAS Build for cloud native builds. GitHub Actions CI/CD pipeline for automated build triggers and test runs. EAS Submit for automated store submissions. Sentry source maps for crash symbolication. App versioning strategy. OTA update policy using EAS Update. This is the final infrastructure step before public launch.

---

## Files to Create / Modify

| File | Purpose |
|------|---------|
| `apps/mobile/eas.json` | EAS Build profiles: development, preview, production |
| `apps/mobile/app.config.ts` | Dynamic Expo app config (replaces static app.json) |
| `apps/mobile/app.config.base.ts` | Shared config values referenced by app.config.ts |
| `.github/workflows/mobile-build.yml` | GitHub Actions CI: lint + test + EAS Build trigger |
| `.github/workflows/mobile-ota.yml` | GitHub Actions: EAS Update OTA push on merge to main |
| `apps/mobile/sentry.config.ts` | Sentry React Native configuration |
| `apps/mobile/scripts/bump-version.sh` | Version bump utility (patch/minor/major) |
| `docs/mobile/MOBILE_RELEASE_RUNBOOK.md` | Step-by-step release checklist |

---

## eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "enterpriseProvisioning": "adhoc"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "APP_ENV": "preview"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "enterpriseProvisioning": "app-store"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "dev@trekyatra.co.in",
        "ascAppId": "XXXXXXXXXX",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  },
  "update": {
    "channel": "production"
  }
}
```

---

## app.config.ts

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';
import baseConfig from './app.config.base';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ...baseConfig,
  name: 'TrekYatra',
  slug: 'trekyatra',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0c0e14',
  },
  ios: {
    bundleIdentifier: 'co.in.trekyatra.app',
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'TrekYatra uses your location to show treks near you.',
      NSCameraUsageDescription:
        'TrekYatra accesses your camera to add photos to trip reports.',
      NSPhotoLibraryUsageDescription:
        'TrekYatra accesses your photos to add images to trip reports.',
      NSFaceIDUsageDescription:
        'TrekYatra uses Face ID to sign you in quickly.',
    },
    googleServicesFile: './GoogleService-Info.plist',
    config: {
      googleSignIn: {
        reservedClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      },
    },
  },
  android: {
    package: 'co.in.trekyatra.app',
    googleServicesFile: './google-services.json',
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ],
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0c0e14',
    },
  },
  plugins: [
    ['expo-router', { origin: 'https://trekyatra.co.in' }],
    ['expo-font', { fonts: ['./assets/fonts/ClashDisplay-Variable.ttf'] }],
    ['expo-notifications', {
      icon: './assets/notification-icon.png',
      color: '#E85D2C',
    }],
    ['expo-location', {
      locationAlwaysAndWhenInUsePermission: false,
      locationWhenInUsePermission: 'Allow TrekYatra to use your location to find nearby treks.',
    }],
    ['@sentry/react-native/expo', {
      organization: 'trekyatra',
      project: 'trekyatra-mobile',
    }],
    'expo-apple-authentication',
    'expo-secure-store',
    'expo-local-authentication',
    'expo-in-app-purchases',
  ],
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.trekyatra.co.in',
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  },
  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 3000,
  },
  runtimeVersion: {
    policy: 'appVersion',  // OTA updates only within same appVersion
  },
});
```

---

## GitHub Actions: Build Pipeline

```yaml
# .github/workflows/mobile-build.yml
name: Mobile Build

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'
  pull_request:
    branches: [main]
    paths:
      - 'apps/mobile/**'
  workflow_dispatch:
    inputs:
      profile:
        description: 'EAS build profile'
        required: true
        default: 'preview'
        type: choice
        options: [development, preview, production]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/mobile/package-lock.json
      - run: cd apps/mobile && npm ci
      - run: cd apps/mobile && npx tsc --noEmit
      - run: cd apps/mobile && npm run lint

  eas-build:
    needs: lint-and-type-check
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/mobile/package-lock.json
      - run: npm install -g eas-cli
      - run: cd apps/mobile && npm ci
      - name: EAS Build
        run: cd apps/mobile && eas build --platform all --profile ${{ github.event.inputs.profile || 'preview' }} --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          EAS_PROJECT_ID: ${{ secrets.EAS_PROJECT_ID }}
          EXPO_PUBLIC_API_BASE_URL: ${{ secrets.EXPO_PUBLIC_API_BASE_URL }}
          EXPO_PUBLIC_SENTRY_DSN: ${{ secrets.EXPO_PUBLIC_SENTRY_DSN }}
          GOOGLE_IOS_CLIENT_ID: ${{ secrets.GOOGLE_IOS_CLIENT_ID }}
```

---

## GitHub Actions: OTA Updates

```yaml
# .github/workflows/mobile-ota.yml
name: Mobile OTA Update

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'

jobs:
  ota-update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/mobile/package-lock.json
      - run: npm install -g eas-cli
      - run: cd apps/mobile && npm ci
      - name: EAS Update — OTA push
        run: cd apps/mobile && eas update --branch production --message "Auto OTA: ${{ github.sha }}" --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          EAS_PROJECT_ID: ${{ secrets.EAS_PROJECT_ID }}
```

OTA updates push JS bundle changes without a full store review cycle. Native code changes (new plugins, new permissions) still require a full EAS Build + store review.

---

## Sentry Configuration

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/react-native';

export function initSentry(): void {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: __DEV__,
    environment: process.env.APP_ENV ?? 'production',
    tracesSampleRate: 0.2,
    attachScreenshot: true,
    enableAutoSessionTracking: true,
  });
}
```

Call `initSentry()` at the top of `_layout.tsx` root layout. Sentry source maps uploaded automatically during EAS Build via the `@sentry/react-native/expo` plugin.

---

## App Versioning Strategy

| Version Component | Meaning | When to bump |
|-------------------|---------|-------------|
| `version` in app.config.ts | User-visible (1.0.0) | Every release |
| `buildNumber` (iOS) | App Store build number | Every EAS build (auto-increment) |
| `versionCode` (Android) | Play Store version code | Every EAS build (auto-increment) |
| OTA update | JS bundle only | Every main branch merge with mobile changes |

`autoIncrement: true` in `eas.json` production profile handles build numbers automatically.

Version bump script:
```bash
# scripts/bump-version.sh
#!/bin/bash
# Usage: ./bump-version.sh patch|minor|major
TYPE=$1
# Use semver or manual bump in app.config.ts + package.json
```

---

## App Store Setup Checklist

### Apple App Store Connect
- [ ] Create App record: Bundle ID `co.in.trekyatra.app`
- [ ] Configure App Category: Travel
- [ ] Set Age Rating: 4+
- [ ] Configure In-App Purchases (STEP-M13 product IDs)
- [ ] Privacy Nutrition Labels: Location (when in use), Purchases, User Content (reports)
- [ ] Screenshots: 6.7" iPhone + 6.1" iPhone + 12.9" iPad Pro (optional)
- [ ] App Preview video (optional)
- [ ] Configure TestFlight: internal testers → external beta → public release

### Google Play Console
- [ ] Create App record: Package `co.in.trekyatra.app`
- [ ] App Category: Travel & Local
- [ ] Content Rating: Everyone
- [ ] Configure In-App Products (STEP-M13 product IDs)
- [ ] Data Safety form: Location (coarse, optional), Purchases, User Content
- [ ] Screenshots: phone + 7" tablet (optional)
- [ ] Set up Internal Testing → Closed Testing → Open Testing → Production

---

## Required Secrets (GitHub + EAS)

| Secret | Where | Value |
|--------|-------|-------|
| `EXPO_TOKEN` | GitHub Secrets | EAS personal access token |
| `EAS_PROJECT_ID` | GitHub Secrets + .env | From Expo dashboard |
| `EXPO_PUBLIC_API_BASE_URL` | GitHub Secrets | `https://api.trekyatra.co.in` |
| `EXPO_PUBLIC_SENTRY_DSN` | GitHub Secrets | From Sentry project |
| `GOOGLE_IOS_CLIENT_ID` | GitHub Secrets | From Firebase console |

Add to `apps/mobile/.env.local.example`:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
EXPO_PUBLIC_SENTRY_DSN=
EAS_PROJECT_ID=
GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_RAZORPAY_KEY=
```

---

## OTA Update Policy

| Change Type | Deploy via | Review required |
|------------|-----------|----------------|
| Bug fix in JS/TS only | EAS Update (OTA) | No |
| New screen (JS/TS only) | EAS Update (OTA) | No |
| New native module / permission | EAS Build + store submit | Yes (App Store: 1-3 days) |
| New IAP product | App Store Connect only | Yes |
| Icon / splash change | EAS Build + store submit | Yes |

Runtime version policy: `appVersion` — OTA updates only deploy to users on the same `version` string. A version bump forces a full build.

---

## Release Runbook (MOBILE_RELEASE_RUNBOOK.md outline)

1. **Pre-release checklist**
   - All STEP-M01–M21 tests passing
   - Backend API deployed to production
   - Firebase google-services.json + GoogleService-Info.plist committed (not in git — use EAS secrets)
   - APNs Auth Key (.p8) uploaded to EAS
   - All IAP products created + approved in App Store Connect + Play Console

2. **Build production binaries**
   ```bash
   cd apps/mobile
   eas build --platform all --profile production
   ```

3. **Submit to stores**
   ```bash
   eas submit --platform all --profile production
   ```

4. **Monitor crash-free rate in Sentry** — target >99.5% in first 24h

5. **OTA rollback procedure** — if critical JS crash:
   ```bash
   eas update --branch production --rollback-to-target <previous_update_id>
   ```

---

## Verification

1. **TC-M22-01**: `eas build --profile development` succeeds for both platforms
2. **TC-M22-02**: Development build installs on physical device via Expo Dev Client
3. **TC-M22-03**: `eas update --branch production` pushes OTA; app receives update on next launch
4. **TC-M22-04**: GitHub Actions `mobile-build.yml` passes on PR to main
5. **TC-M22-05**: Sentry crash report captured and symbolicated after test exception thrown
6. **TC-M22-06**: Preview build distributed to internal testers via TestFlight / Play Internal Testing
7. **TC-M22-07**: `eas submit` successfully uploads build to App Store Connect + Play Console

---

## Notes

- `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) must NEVER be committed to git — they contain Firebase API keys. Use EAS secrets: `eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file`
- APNs Auth Key (.p8) upload: `eas credentials` → iOS → Distribution Certificate + Push Notification Key
- Apple App Store review typically takes 1–3 days. Submit at least 1 week before target launch date
- Google Play review for new apps: 3–7 days. Allow extra time for first submission
- `eas.json` `autoIncrement: true` handles build number bumps automatically — do NOT manually increment `ios.buildNumber` or `android.versionCode` in app.config.ts
- The `runtimeVersion.policy: "appVersion"` setting means any OTA update only reaches users who have the same `version` string — protects against JS/native ABI mismatch
- Keep `apps/mobile/node_modules/` and `.expo/` in `.gitignore`; EAS Cloud installs dependencies on their servers
