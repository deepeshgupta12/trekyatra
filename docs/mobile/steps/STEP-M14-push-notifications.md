# STEP-M14 — Push Notifications

**Status:** Pending
**Phase:** Engagement
**Dependencies:** STEP-M03 (device registration endpoint), STEP-M02 (auth), STEP-M10 (notification preferences)
**Backend step:** Yes — new DB table, Celery tasks, push send service

---

## Scope

Full push notification infrastructure. FCM (Firebase Cloud Messaging) for Android and APNs for iOS. Five notification categories covering the core value propositions that differentiate the app from the website: permit window alerts, trek condition changes, seasonal advisories, news articles, and plan follow-ups.

---

## Files to Create

### Backend
| File | Purpose |
|------|---------|
| `services/api/app/modules/notifications/service.py` | Push send service: `send_push`, `send_batch_push`, `send_to_segment` |
| `services/api/app/modules/notifications/push_provider.py` | FCM HTTP v1 API + APNs HTTP/2 client |
| `services/api/app/worker/tasks/notifications.py` | Celery tasks: permit alerts, seasonal alerts, news alerts |
| `services/api/app/api/routes/admin_push.py` | Admin endpoint: POST /admin/push/send (send to segment) |
| `services/api/alembic/versions/YYYYMMDD_0043_push_log.py` | Migration: `mobile_push_log` table |
| `services/api/tests/test_notifications_m14.py` | Backend notification tests |

### Mobile
| File | Purpose |
|------|---------|
| `apps/mobile/services/notificationService.ts` | Request permissions, register token, handle foreground/background/quit notifications |
| `apps/mobile/app/notifications.tsx` | Notification inbox screen |
| `apps/mobile/components/notifications/NotificationRow.tsx` | Notification list item |
| `apps/mobile/hooks/useNotifications.ts` | Permission status, token, local notification history |

---

## Database: `mobile_push_log`

```sql
CREATE TABLE mobile_push_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id   UUID REFERENCES mobile_devices(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    body        TEXT,
    data        JSONB,
    category    VARCHAR(64),  -- permit_alert | trek_condition | seasonal | news | plan_followup
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    status      VARCHAR(32) DEFAULT 'sent',   -- sent | delivered | failed
    error       TEXT
);
CREATE INDEX idx_push_log_device_id ON mobile_push_log(device_id);
CREATE INDEX idx_push_log_sent_at ON mobile_push_log(sent_at DESC);
```

---

## Notification Categories

| Category | Trigger | Example |
|----------|---------|---------|
| `permit_alert` | Permit window opens or closes for a trek in user's saved list | "Kedarkantha permit window opens tomorrow! Book your slot." |
| `trek_condition` | Trail condition report changes trek status open→closed or closed→open | "Rupin Pass trail: CLOSED due to heavy snowfall (reported 2h ago)" |
| `seasonal_alert` | Best season approaching for a trek in user's saved list | "Best time to do Hampta Pass is June–Sep. Just 3 weeks away!" |
| `news_article` | New trek news article published for a trek user has viewed | "New: Kedarkantha trek — permit quota increased for Dec 2026" |
| `plan_followup` | 48h after Plan My Trek lead submitted with no operator response | "Still planning your trek? Browse more operators →" |

---

## Push Send Service

```python
# modules/notifications/push_provider.py
import httpx

class FCMProvider:
    """Firebase Cloud Messaging HTTP v1 API"""
    def __init__(self, credentials_json: str):
        self.project_id = ...
        self._access_token = None

    async def send(self, fcm_token: str, title: str, body: str, data: dict) -> bool:
        payload = {
            "message": {
                "token": fcm_token,
                "notification": {"title": title, "body": body},
                "data": {k: str(v) for k, v in data.items()},
                "android": {"priority": "high"},
            }
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://fcm.googleapis.com/v1/projects/{self.project_id}/messages:send",
                json=payload,
                headers={"Authorization": f"Bearer {await self._get_access_token()}"},
            )
            return resp.status_code == 200

class APNsProvider:
    """Apple Push Notification service (HTTP/2)"""
    async def send(self, apns_token: str, title: str, body: str, data: dict) -> bool:
        # Use httpx with HTTP/2 support + APNs cert/key
        ...
```

---

## Celery Beat Tasks

```python
# worker/tasks/notifications.py

@celery_app.task(name="notifications.send_permit_alerts")
def send_permit_alerts():
    """Daily: check trek_alerts for upcoming permit windows; push to subscribed users"""
    ...

@celery_app.task(name="notifications.send_seasonal_alerts")
def send_seasonal_alerts():
    """Weekly Monday: check saved treks against current month; push seasonal CTA"""
    ...

@celery_app.task(name="notifications.send_news_alerts")
def send_news_alerts():
    """After new news_article CMS page published: push to users who viewed that trek"""
    ...
```

Beat schedule:
```python
"send_permit_alerts": {"task": "notifications.send_permit_alerts", "schedule": crontab(hour=9, minute=0)},
"send_seasonal_alerts": {"task": "notifications.send_seasonal_alerts", "schedule": crontab(day_of_week=1, hour=10, minute=0)},
```

---

## Mobile Permission Request Flow

```typescript
// services/notificationService.ts
import * as Notifications from 'expo-notifications';

export async function requestPushPermission(): Promise<string | null> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  // Also get FCM/APNs native token
  const { data: nativeToken } = await Notifications.getDevicePushTokenAsync();

  // Register with backend
  await api.post('/mobile/device', {
    device_id: await getDeviceId(),
    platform: Platform.OS,
    fcm_token: Platform.OS === 'android' ? nativeToken : null,
    apns_token: Platform.OS === 'ios' ? nativeToken : null,
  });

  return token;
}
```

Permission is requested on second app open (not first — avoids immediate permission prompt that users dismiss).

---

## Notification Handling

```typescript
// Foreground notification: show in-app banner
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Tap on notification (background/quit): deep link
Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;
  if (data.trek_slug) router.push(`/trek/${data.trek_slug}`);
  if (data.screen === 'plan') router.push('/plan');
});
```

---

## Notification Inbox Screen

- Local notifications stored in AsyncStorage `notification_inbox` (last 50)
- Listed newest first with category badge, title, body, timestamp
- Tap notification: deeplinks to the relevant screen
- Mark all read: clears badge count (`Notifications.setBadgeCountAsync(0)`)

---

## Admin: Send Push to Segment

`POST /api/v1/admin/push/send`:
```json
{
  "segment_id": "uuid",        // from CDP segments
  "title": "...",
  "body": "...",
  "data": { "trek_slug": "kedarkantha" },
  "category": "seasonal_alert"
}
```

Triggers Celery task to send to all devices belonging to users in segment.

---

## Backend Tests

| Test ID | Verifies |
|---------|---------|
| TC-B-M14-01 | `test_send_push_single_device` — FCM send mock returns success |
| TC-B-M14-02 | `test_send_batch_push` — batch of 10 devices, all succeed |
| TC-B-M14-03 | `test_push_log_created_on_send` — push_log row inserted after send |
| TC-B-M14-04 | `test_permit_alert_task_queries_correct_treks` — only treks with open permit windows |
| TC-B-M14-05 | `test_notification_not_sent_if_user_opted_out` — respects notification_prefs |

---

## Verification (Manual)

1. **TC-M14-01**: First push permission prompt appears on second app open
2. **TC-M14-02**: Accept permission → device registered in admin → `mobile_devices` table row visible
3. **TC-M14-03**: Admin sends test push to device → notification received in foreground (in-app banner)
4. **TC-M14-04**: Tap notification when app in background → deeplinks to correct screen
5. **TC-M14-05**: Turn off "Permit alerts" in settings → no permit push received
6. **TC-M14-06**: Notification inbox shows received notifications with timestamps
7. **TC-M14-07**: Badge count shows unread count; opening inbox clears badge

---

## Notes

- Firebase project must have `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) added to the app
- APNs requires a production certificate (.p12) or Auth Key (.p8) from Apple Developer
- Push notifications require a physical device or dev build — they do NOT work in Expo Go
- FCM HTTP v1 API replaced legacy FCM API (deprecated June 2024) — use v1 API from the start
