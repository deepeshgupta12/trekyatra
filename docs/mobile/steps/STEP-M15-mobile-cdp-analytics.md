# STEP-M15 — Mobile CDP Analytics

**Status:** Pending
**Phase:** Engagement
**Dependencies:** STEP-M01 (foundation), STEP-M02 (auth), STEP-M03 (backend mobile extensions)
**Backend step:** Yes — DB migration (platform/app_version columns), no new tables

---

## Scope

Mobile-native analytics SDK that mirrors `lib/analytics.ts` from the web but adapts to React Native constraints: offline event queuing, AppState-based session management, SQLite event buffer, and flush-on-reconnect. All events flow to the same `analytics_events` and `analytics_sessions` tables in Postgres — no separate mobile pipeline. The CDP admin screens built in Steps 64–65 automatically reflect mobile traffic.

---

## Files to Create

### Mobile
| File | Purpose |
|------|---------|
| `apps/mobile/lib/analytics.ts` | Core analytics SDK — `trackEvent`, `trackScreen`, session management |
| `apps/mobile/lib/analyticsQueue.ts` | SQLite offline queue — buffer events, flush on reconnect |
| `apps/mobile/providers/AnalyticsProvider.tsx` | AppState listener, session lifecycle, app_open event |
| `apps/mobile/hooks/useAnalytics.ts` | `trackEvent`, `trackScreen` hooks with automatic screen context |

### Backend
| File | Purpose |
|------|---------|
| `services/api/alembic/versions/YYYYMMDD_0044_analytics_mobile_columns.py` | Migration: `platform` + `app_version` columns on `analytics_events` + `analytics_sessions` |
| `services/api/tests/test_cdp_mobile_m15.py` | Backend tests for mobile event ingest with platform column |

---

## DB Migration: Platform Columns

```sql
-- analytics_events
ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS platform VARCHAR(16) DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS app_version VARCHAR(16);

-- analytics_sessions
ALTER TABLE analytics_sessions
  ADD COLUMN IF NOT EXISTS platform VARCHAR(16) DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS app_version VARCHAR(16);
```

Existing web rows will have `platform = 'web'` (default). Mobile events pass `platform = 'ios'` or `platform = 'android'`.

---

## Analytics SDK

```typescript
// lib/analytics.ts
import { Platform } from 'react-native';
import { getAnonymousId, getUserId } from './identity';
import { api } from './api';
import { enqueueEvent, flushQueue } from './analyticsQueue';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const PLATFORM = Platform.OS; // 'ios' | 'android'

let _currentScreen = '';
let _sessionId: string | null = null;

export function setCurrentScreen(screen: string) {
  _currentScreen = screen;
}

export function setSessionId(id: string) {
  _sessionId = id;
}

export async function trackEvent(
  category: string,
  eventName: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  const payload = {
    event_category: category,
    event_name: eventName,
    properties,
    page_url: _currentScreen,
    platform: PLATFORM,
    app_version: APP_VERSION,
    anonymous_id: await getAnonymousId(),
    user_id: await getUserId(),
    session_id: _sessionId,
    ts: new Date().toISOString(),
  };

  try {
    await api.post('/analytics/event', payload);
  } catch {
    // Offline — buffer to SQLite queue
    await enqueueEvent(payload);
  }
}

export async function trackScreen(screenName: string): Promise<void> {
  setCurrentScreen(screenName);
  await trackEvent('navigation', 'screen_view', { screen: screenName });
}

// Convenience helpers matching web analytics.ts naming
export const trackTrekView = (slug: string, state?: string) =>
  trackEvent('engagement', 'trek_view', { trek_slug: slug, state });

export const trackSearch = (query: string, resultCount: number) =>
  trackEvent('engagement', 'search_query', { query, result_count: resultCount });

export const trackTrekSaved = (slug: string) =>
  trackEvent('engagement', 'trek_saved', { trek_slug: slug });

export const trackTrekDownloaded = (slug: string) =>
  trackEvent('engagement', 'trek_downloaded', { trek_slug: slug });

export const trackPushOpened = (category: string, trekSlug?: string) =>
  trackEvent('engagement', 'push_notification_opened', { category, trek_slug: trekSlug });

export const trackPlanWizardStep = (step: number, data?: Record<string, unknown>) =>
  trackEvent('conversion', `plan_wizard_step_${step}`, { step, ...data });

export const trackPlanWizardCompleted = (payload: Record<string, unknown>) =>
  trackEvent('conversion', 'plan_wizard_completed', payload);
```

---

## Offline Event Queue (SQLite)

```typescript
// lib/analyticsQueue.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('analytics_queue.db');

// Create queue table on first open
db.transaction(tx => {
  tx.executeSql(`
    CREATE TABLE IF NOT EXISTS event_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )
  `);
});

export async function enqueueEvent(payload: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO event_queue (payload) VALUES (?)',
        [JSON.stringify(payload)],
        () => resolve(),
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export async function flushQueue(): Promise<void> {
  return new Promise((resolve) => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM event_queue ORDER BY id LIMIT 50', [], async (_, result) => {
        const rows = result.rows._array;
        if (rows.length === 0) { resolve(); return; }

        const ids = rows.map(r => r.id);
        const events = rows.map(r => JSON.parse(r.payload));

        try {
          await api.post('/analytics/events/batch', { events });
          db.transaction(tx2 => {
            tx2.executeSql(
              `DELETE FROM event_queue WHERE id IN (${ids.map(() => '?').join(',')})`,
              ids
            );
          });
        } catch {
          // Still offline — leave in queue
        }
        resolve();
      });
    });
  });
}
```

---

## Analytics Provider

```typescript
// providers/AnalyticsProvider.tsx
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { flushQueue, trackEvent, setSessionId } from '../lib/analytics';
import { useNetInfo } from '@react-native-community/netinfo';
import { nanoid } from 'nanoid/non-secure';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const netInfo = useNetInfo();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const sessionId = useRef<string>(nanoid());

  useEffect(() => {
    setSessionId(sessionId.current);
    trackEvent('engagement', 'app_open', { cold_start: true });

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        // App foregrounded — start new session + flush queue
        sessionId.current = nanoid();
        setSessionId(sessionId.current);
        trackEvent('engagement', 'app_open', { cold_start: false });
        flushQueue();
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, []);

  // Flush on network restore
  useEffect(() => {
    if (netInfo.isConnected) flushQueue();
  }, [netInfo.isConnected]);

  return <>{children}</>;
}
```

Wrap in `_layout.tsx` root layout:
```tsx
<AnalyticsProvider>
  <Stack />
</AnalyticsProvider>
```

---

## Session Management

Sessions are aligned with app open events, not arbitrary time windows:
- New session created on: cold start, app foreground after ≥15 minutes in background
- Session ID: `nanoid()` stored in ref — not persisted (intentional)
- `POST /analytics/session` called once per session:
```typescript
await api.post('/analytics/session', {
  session_id: sessionId,
  anonymous_id: await getAnonymousId(),
  platform: PLATFORM,
  app_version: APP_VERSION,
  referrer: 'mobile_app',
});
```

---

## Identity: Anonymous ID

```typescript
// lib/identity.ts
import * as SecureStore from 'expo-secure-store';
import { nanoid } from 'nanoid/non-secure';

let _cachedAnonymousId: string | null = null;
let _cachedUserId: string | null = null;

export async function getAnonymousId(): Promise<string> {
  if (_cachedAnonymousId) return _cachedAnonymousId;
  const stored = await SecureStore.getItemAsync('ty_anonymous_id');
  if (stored) { _cachedAnonymousId = stored; return stored; }
  const id = nanoid();
  await SecureStore.setItemAsync('ty_anonymous_id', id);
  _cachedAnonymousId = id;
  return id;
}

export async function getUserId(): Promise<string | null> {
  return _cachedUserId;
}

export function setUserId(id: string | null) {
  _cachedUserId = id;
}
```

Anonymous ID persists across app installs via `expo-secure-store` (Keychain/Keystore). Called from `AnalyticsProvider` at startup and on auth state change.

---

## Behavior Profile (AsyncStorage)

Mobile behavior profile mirrors the web `ty_behavior_v1` localStorage key exactly:

```typescript
// lib/behaviorProfile.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrekViewEntry {
  slug: string;
  region: string;  // state name (e.g. "Uttarakhand")
  difficulty: string;
  season: string;
  ts: number;
}

export interface BehaviorProfile {
  recentlyViewed: TrekViewEntry[];
  searchHistory: string[];
  intentSignals: string[];
}

const KEY = 'ty_behavior_v1';

export async function getBehaviorProfile(): Promise<BehaviorProfile> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { recentlyViewed: [], searchHistory: [], intentSignals: [] };
  return JSON.parse(raw);
}

export async function recordTrekView(entry: TrekViewEntry): Promise<void> {
  const profile = await getBehaviorProfile();
  const filtered = profile.recentlyViewed.filter(e => e.slug !== entry.slug);
  const updated = [entry, ...filtered].slice(0, 20);
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...profile, recentlyViewed: updated }));
}

export async function recordSearch(query: string): Promise<void> {
  const profile = await getBehaviorProfile();
  const filtered = profile.searchHistory.filter(q => q !== query);
  const updated = [query, ...filtered].slice(0, 10);
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...profile, searchHistory: updated }));
}
```

---

## Backend: Batch Event Endpoint

Add to `services/api/app/api/routes/analytics.py`:

```python
@router.post("/events/batch")
async def ingest_batch_events(
    payload: BatchEventsIn,
    db: AsyncSession = Depends(get_db),
):
    """Mobile offline queue flush — insert up to 50 buffered events"""
    for event in payload.events[:50]:
        await cdp_service.track_event(db, event)
    return {"accepted": len(payload.events[:50])}
```

The existing `POST /analytics/event` endpoint already accepts `platform` and `app_version` — just ensure those fields are present in the Pydantic schema and persisted to the ORM.

---

## Events Tracked (Full List)

| Event Name | Category | Trigger | Properties |
|-----------|----------|---------|------------|
| `app_open` | engagement | App launch / foreground | `cold_start` |
| `screen_view` | navigation | Every screen mount | `screen` |
| `trek_view` | engagement | Trek detail opened | `trek_slug`, `state` |
| `search_query` | engagement | Search submitted | `query`, `result_count` |
| `trek_saved` | engagement | Bookmark tapped | `trek_slug` |
| `trek_downloaded` | engagement | Offline download | `trek_slug` |
| `push_notification_opened` | engagement | Notification tap | `category`, `trek_slug` |
| `plan_wizard_step_1..5` | conversion | Wizard step advance | `step`, step data |
| `plan_wizard_completed` | conversion | Wizard submitted | full payload |
| `operator_inquiry_sent` | conversion | Inquiry form submit | `operator_slug` |
| `product_purchased` | conversion | Razorpay success | `product_id`, `price` |
| `premium_subscribed` | conversion | IAP purchase | `product_id`, `platform` |
| `trek_comparison_viewed` | engagement | Compare screen | `slug_a`, `slug_b` |
| `buddy_request_sent` | engagement | Buddy match request | `trek_slug` |
| `checkin_created` | engagement | Trek check-in | `trek_slug`, `date` |

---

## Backend Tests

| Test ID | Verifies |
|---------|---------|
| TC-B-M15-01 | `test_mobile_event_platform_column` — event posted with `platform=android` persisted correctly |
| TC-B-M15-02 | `test_batch_event_ingest` — POST /analytics/events/batch with 5 events returns 200 + accepted=5 |
| TC-B-M15-03 | `test_batch_capped_at_50` — batch of 60 events only inserts 50 |
| TC-B-M15-04 | `test_platform_column_migration` — analytics_events and analytics_sessions have platform column after migration |

---

## Verification (Manual)

1. **TC-M15-01**: Open app cold → `app_open` event in CDP event stream (`/admin/cdp/activity`)
2. **TC-M15-02**: Navigate to any trek → `trek_view` event appears with `platform=ios/android`
3. **TC-M15-03**: Put device in airplane mode → tap a trek → come back online → `trek_view` event appears (was queued offline)
4. **TC-M15-04**: Walk Plan My Trek wizard → 5 step events + `plan_wizard_completed` in CDP timeline
5. **TC-M15-05**: CDP User Activity screen — look up test user email → see mobile events with platform badge

---

## Notes

- `expo-sqlite` uses the deprecated synchronous API in SDK 51; upgrade to `expo-sqlite/next` (async) is scheduled for M04+ where it's already in use — reuse the same DB instance
- Anonymous ID must persist across app updates (SecureStore survives updates on iOS; on Android consider `expo-application` `getAndroidId()` as backup if Keystore is cleared)
- Do NOT request `ACCESS_FINE_LOCATION` for analytics — use coarse region from trek views only
- Batch endpoint must be rate-limited at the API gateway level (50 events per call, max 1 call per 30s per device)
