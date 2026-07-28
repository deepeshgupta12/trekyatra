# STEP-M23 — Dynamic Version Controller + Force Update + OTA

**Status:** Done (2026-07-28)

## Goal
A server-controlled version gate so we can **force** or **soft-prompt** app updates and
flip a **maintenance kill-switch** without shipping a binary, plus **OTA** (EAS Update)
to push JS/asset fixes without App Store review.

## Files Created
- `services/api/app/modules/app_config/{__init__,models,service}.py` — `AppVersionConfig` model + semver compare + decision logic.
- `services/api/app/schemas/app_config.py` — `VersionGateDecision`, admin response/update.
- `services/api/app/api/routes/app_config.py` — public `GET /app/version-config`, admin `GET/PUT /admin/app/version-config`.
- `services/api/alembic/versions/20260728_0056_app_version_config.py` — table + seeded `ios` row.
- `services/api/tests/test_app_config.py` — 5 tests (semver, 4 decision states, fail-open, admin upsert).
- `apps/mobile/lib/version.ts` — fetch gate + soft-dismiss persistence.
- `apps/mobile/providers/VersionGateProvider.tsx` — boot/foreground check + overlay.
- `apps/mobile/components/version/UpdateGateOverlay.tsx` — force/soft/maintenance UI.
- `apps/web-next/lib/admin-app-version.ts` + `apps/web-next/app/(admin)/admin/app-version/page.tsx` — admin control page.

## Files Modified
- `services/api/app/db/base.py` (register model), `app/api/router.py` (register routers).
- `apps/mobile/app/_layout.tsx` (wrap with `VersionGateProvider`).
- `apps/mobile/app.config.ts` (`runtimeVersion` `appVersion`, `updates.url`, `buildNumber: "2"`), `eas.json` (`production`/`preview` channels).
- `apps/web-next/app/(admin)/admin/layout.tsx` (nav link).

## Behaviour
- **Decision order:** maintenance → force (version < min & force enabled) → soft (version < latest) → ok.
- **Fail-open:** endpoint unreachable or no config row → never blocks.
- **Force/maintenance:** non-dismissible modal → "Update Now" deep-links `https://apps.apple.com/app/id6795408094`.
- **Soft:** dismissible; remembered per `latest_version` (SecureStore).

## Validation
- Backend: 786 passed / 1 skipped (5 new). Mobile `tsc`: 0. `next build`: pass.
- Migration `0056` applied locally; seeds a permissive `ios` row (`min == latest == 1.0.0`).

## Notes
- OTA takes effect only from a build that already contains `expo-updates` → baked into the 1.0.0 (2) rebuild.
- Push a JS fix later with `eas update --branch production`.
- DO: `alembic upgrade head` applies `0056`. See `DO_RELEASE_RUNBOOK.md`.
