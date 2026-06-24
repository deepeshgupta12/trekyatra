# Step M15 — Mobile CDP Analytics

**Status:** Done  
**Completed:** 2026-06-24  

---

## Scope

Send analytics events from the React Native app to the existing CDP backend (`POST /api/v1/analytics/event`, `POST /api/v1/analytics/events/batch`). Offline events are queued in SQLite and flushed on foreground. Sessions managed via AppState with a 15-minute background threshold.

---

## Files Created

| File | Purpose |
|------|---------|
| `services/api/alembic/versions/20260623_0047_analytics_mobile_columns.py` | Adds `platform`/`app_version` to `analytics_events` and `analytics_sessions` |
| `services/api/tests/test_cdp_mobile_m15.py` | 4 backend tests (TC-B-M15-01–04) |
| `apps/mobile/lib/identity.ts` | Anonymous ID (Crypto.randomUUID + SecureStore) + setUserId/getUserId |
| `apps/mobile/lib/analyticsQueue.ts` | SQLite offline queue (ty_analytics_queue.db) with enqueueEventSync/flushQueueSync |
| `apps/mobile/lib/analytics.ts` | trackEvent, trackScreen, flushOfflineQueue, 13 convenience helpers |
| `apps/mobile/providers/AnalyticsProvider.tsx` | AppState session mgmt, cold_start tracking, foreground flush |
| `apps/mobile/hooks/useAnalytics.ts` | useCallback-wrapped analytics helpers |

---

## Files Modified

| File | Change |
|------|--------|
| `services/api/app/modules/cdp/models.py` | platform/app_version on AnalyticsEvent + AnalyticsSession |
| `services/api/app/schemas/cdp.py` | platform/app_version optional on EventIn; BatchEventIn.events max_length 20→50 |
| `services/api/app/modules/cdp/service.py` | log_event passes platform/app_version to ORM |
| `services/api/tests/test_cdp.py` | test_batch_ingest_exceeds_limit updated to 51 events |
| `apps/mobile/app/_layout.tsx` | Wrapped in AnalyticsProvider |
| `apps/mobile/providers/AuthProvider.tsx` | setUserId(user.id) on login; setUserId(null) on sign-out |

---

## Backend Test Cases

Run: `PYTHONPATH=services/api .venv/bin/pytest services/api/tests/test_cdp_mobile_m15.py -v`

### TC-B-M15-01: test_mobile_event_platform_stored
Verifies: platform="ios" stored on AnalyticsEvent when sent in POST body

### TC-B-M15-02: test_web_event_defaults_platform_web
Verifies: AnalyticsEvent.platform defaults to "web" when platform omitted

### TC-B-M15-03: test_batch_event_ingest_via_api
Verifies: batch of 3 events → {"ingested": 3} 201 response

### TC-B-M15-04: test_batch_rejects_over_50_events
Verifies: batch of 51 events → 422 Unprocessable Entity

---

## Notes

- @react-native-community/netinfo not installed — queue flushes on AppState active event.
- expo-crypto Crypto.randomUUID() used for anonymous IDs and session IDs (nanoid not installed).
- BatchEventIn.events max_length bump 20→50 is backwards-compatible.
