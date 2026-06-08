# STEP-M03 — Backend Mobile API Extensions

**Status:** Done (2026-06-08)
**Phase:** Foundation
**Backend step:** Yes — new endpoints + DB migration
**Dependencies:** STEP-M02 (auth flow design), STEP-M01 (knows what device data to register)

---

## Scope

Extend the FastAPI backend with a mobile-specific namespace (`/api/v1/mobile/` and `/api/v1/auth/mobile/`). This step delivers the three lowest-level mobile infrastructure APIs that all subsequent steps depend on:

1. **Mobile token endpoint** — issue long-lived access + refresh token pair for Bearer auth
2. **Incremental CMS sync endpoint** — efficient delta sync for offline content (Step M04)
3. **Device registration endpoint** — store FCM/APNs push token per device (Step M14)

No frontend code in this step — pure backend.

---

## Files to Create

### Backend
| File | Purpose |
|------|---------|
| `services/api/app/api/routes/mobile.py` | Mobile router: sync, device registration, device deletion |
| `services/api/app/api/routes/auth_mobile.py` | Mobile auth: token issuance + refresh |
| `services/api/app/modules/mobile/models.py` | `MobileDevice` ORM model |
| `services/api/app/modules/mobile/service.py` | `register_device`, `unregister_device`, `get_sync_pages`, `issue_mobile_token` |
| `services/api/app/schemas/mobile.py` | Pydantic schemas: `DeviceIn`, `DeviceOut`, `SyncOut`, `MobileTokenIn`, `MobileTokenOut` |
| `services/api/alembic/versions/YYYYMMDD_0042_mobile_devices.py` | Migration: `mobile_devices` table |
| `services/api/tests/test_mobile_step_m03.py` | 6 backend tests |

### Files to Modify
| File | Change |
|------|--------|
| `services/api/app/api/router.py` | Register `mobile_router` + `auth_mobile_router` |
| `services/api/app/db/base.py` | Import `MobileDevice` model |
| `services/api/app/core/config.py` | Add `MOBILE_TOKEN_EXPIRE_DAYS = 30` setting |

---

## Database Migration: `mobile_devices`

```sql
CREATE TABLE mobile_devices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id   VARCHAR(128) UNIQUE NOT NULL,   -- client-generated UUID stored in SecureStore
    fcm_token   TEXT,                           -- Android Firebase token
    apns_token  TEXT,                           -- iOS APNs token
    platform    VARCHAR(16) NOT NULL,           -- 'android' | 'ios'
    app_version VARCHAR(32),
    os_version  VARCHAR(32),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mobile_devices_user_id   ON mobile_devices(user_id);
CREATE INDEX idx_mobile_devices_fcm_token ON mobile_devices(fcm_token) WHERE fcm_token IS NOT NULL;
```

---

## Endpoint Specifications

### `POST /api/v1/auth/mobile/token`

**Purpose:** Issue a long-lived access token + refresh token for mobile clients.

**Auth:** Requires existing valid session (cookie OR Bearer token from a previous sign-in).

**Request body:**
```json
{ "device_id": "uuid", "platform": "android" }
```

**Response:**
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 2592000
}
```

**Logic:**
- Verify existing session (same as `GET /auth/me`)
- Issue access token: 30-day expiry (vs 24h for web cookie tokens)
- Issue refresh token: 90-day expiry, stored in `mobile_devices.refresh_token_hash` (hashed)
- Return both tokens as JSON (no `Set-Cookie`)

**Refresh flow:**
```
POST /api/v1/auth/mobile/token/refresh
Body: { "refresh_token": "<jwt>", "device_id": "uuid" }
Response: { "access_token": "<new jwt>", "expires_in": 2592000 }
```

---

### `GET /api/v1/mobile/sync`

**Purpose:** Incremental CMS page sync for offline storage. Returns only pages that have changed since `last_sync`.

**Auth:** Bearer token required.

**Query params:**
```
?last_sync=2026-05-01T00:00:00Z    # ISO datetime; omit for full sync
&page_types=trek_guide,packing_list,permit_guide,cost_guide
&limit=100
&offset=0
```

**Response:**
```json
{
  "updated": [
    {
      "slug": "kedarkantha",
      "title": "Kedarkantha Trek Guide",
      "page_type": "trek_guide",
      "hero_image_url": "https://...",
      "trek_state": "Uttarakhand",
      "trek_difficulty": "Moderate",
      "trek_duration": "6 days",
      "trek_altitude": "12,500 ft",
      "trek_season": "Dec – Apr",
      "body_json": { ... },
      "seo_description": "...",
      "updated_at": "2026-05-28T10:00:00Z"
    }
  ],
  "deleted_slugs": ["old-trek-slug"],
  "sync_timestamp": "2026-05-29T12:00:00Z",
  "has_more": false,
  "total_updated": 3
}
```

**Logic:**
- Query `cms_pages` WHERE `status = 'published'` AND `updated_at > last_sync` (or all if no last_sync)
- Also return slugs of pages deleted since last_sync (need `deleted_at` column or tombstone table)
- Returns only fields needed for offline rendering (no admin-only fields)
- Pagination via `limit` + `offset` for large initial syncs

**Performance requirements:**
- Response must be < 500ms for incremental sync (≤50 changed pages)
- Add index: `CREATE INDEX idx_cms_pages_updated_at ON cms_pages(updated_at) WHERE status = 'published'`

---

### `POST /api/v1/mobile/device`

**Purpose:** Register or update a device's push notification token.

**Auth:** Bearer token required.

**Request body:**
```json
{
  "device_id": "client-generated-uuid",
  "platform": "android",
  "fcm_token": "fcm_token_string",
  "apns_token": null,
  "app_version": "1.0.0",
  "os_version": "Android 13"
}
```

**Response:**
```json
{ "id": "uuid", "device_id": "...", "created": true }
```

**Logic:**
- Upsert on `device_id` — update token if device already registered
- Link to `user_id` from Bearer token
- Update `last_seen` on every call

---

### `DELETE /api/v1/mobile/device/{device_id}`

**Purpose:** Unregister a device on sign-out (stops push delivery).

**Auth:** Bearer token required.

**Logic:** Soft delete (set `fcm_token = null`, `apns_token = null`) or hard delete by device_id + user_id match.

---

## Pydantic Schemas

```python
# schemas/mobile.py

class MobileTokenIn(BaseModel):
    device_id: str
    platform: str  # "android" | "ios"

class MobileTokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class DeviceIn(BaseModel):
    device_id: str
    platform: str  # "android" | "ios"
    fcm_token: Optional[str] = None
    apns_token: Optional[str] = None
    app_version: Optional[str] = None
    os_version: Optional[str] = None

class DeviceOut(BaseModel):
    id: str
    device_id: str
    created: bool

class SyncPageOut(BaseModel):
    slug: str
    title: str
    page_type: str
    hero_image_url: Optional[str]
    trek_state: Optional[str]
    trek_difficulty: Optional[str]
    trek_duration: Optional[str]
    trek_altitude: Optional[str]
    trek_season: Optional[str]
    body_json: Optional[dict]
    seo_description: Optional[str]
    updated_at: datetime

class SyncOut(BaseModel):
    updated: List[SyncPageOut]
    deleted_slugs: List[str]
    sync_timestamp: datetime
    has_more: bool
    total_updated: int
```

---

## Backend Tests (`test_mobile_step_m03.py`)

| Test ID | Test Name | Verifies |
|---------|-----------|---------|
| TC-B-M03-01 | `test_mobile_token_issuance` | POST /auth/mobile/token returns access + refresh tokens |
| TC-B-M03-02 | `test_mobile_token_refresh` | POST /auth/mobile/token/refresh with valid refresh token returns new access token |
| TC-B-M03-03 | `test_device_registration` | POST /mobile/device registers device and returns created=true |
| TC-B-M03-04 | `test_device_upsert_updates_token` | Second POST /mobile/device with same device_id updates fcm_token |
| TC-B-M03-05 | `test_device_deletion` | DELETE /mobile/device/{id} clears push tokens |
| TC-B-M03-06 | `test_sync_endpoint_returns_pages` | GET /mobile/sync returns updated pages list with correct structure |
| TC-B-M03-07 | `test_sync_incremental_after_timestamp` | GET /mobile/sync?last_sync=<future> returns empty updated list |
| TC-B-M03-08 | `test_sync_requires_auth` | GET /mobile/sync without token returns 401 |

---

## Run Tests
```bash
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/test_mobile_step_m03.py -v
PYTHONPATH=services/api .venv/bin/pytest services/api/tests/ -v  # no regressions
```

---

## Notes

- The existing `/api/v1/auth/*` endpoints use HttpOnly cookies for web sessions. Mobile must use Bearer tokens. The auth middleware must be extended to check `Authorization: Bearer <token>` header in addition to cookies.
- The `body_json` field in SyncOut is the raw CMS content block format. Step M04 will write a React Native renderer for this format.
- For the initial sync (no `last_sync` param), the response may be large. The client should call with `limit=100` and loop until `has_more = false`.
- Add `deleted_at` column to `cms_pages` table in this migration to support deleted slug tracking in sync response.

## Implementation Completed (2026-06-08)

### Files Created
| File | Purpose |
|------|---------|
| `services/api/app/modules/mobile/__init__.py` | Module init |
| `services/api/app/modules/mobile/models.py` | MobileDevice ORM model (user_id FK, device_id UNIQUE, fcm_token, apns_token, platform, refresh_token_hash) |
| `services/api/app/modules/mobile/service.py` | mobile_login, mobile_signup, issue_mobile_token, refresh_mobile_token, register_device, unregister_device, get_sync_pages |
| `services/api/app/schemas/mobile.py` | MobileSignInIn, MobileSignUpIn, MobileAuthOut, MobileTokenIn/Out, MobileRefreshIn, MobileAccessOut, DeviceIn/Out, SyncPageOut, SyncOut |
| `services/api/app/api/routes/auth_mobile.py` | POST /auth/mobile/login, POST /auth/mobile/signup, POST /auth/mobile/token, POST /auth/mobile/token/refresh |
| `services/api/app/api/routes/mobile.py` | GET /mobile/sync, POST /mobile/device, DELETE /mobile/device/{device_id} |
| `services/api/alembic/versions/20260608_0042_mobile_devices.py` | Creates mobile_devices table; adds deleted_at to cms_pages; adds partial index on cms_pages(updated_at) WHERE status='published' |
| `services/api/tests/test_mobile_step_m03.py` | 11 tests — all pass |

### Files Modified
| File | Change |
|------|--------|
| `services/api/app/api/router.py` | Registered auth_mobile_router (prefix=/auth/mobile) and mobile_router (prefix=/mobile) |
| `services/api/app/db/base.py` | Added MobileDevice import and __all__ entry |
| `services/api/app/core/config.py` | Added mobile_token_expire_days: int = 30 |
| `services/api/app/core/security.py` | Added create_mobile_access_token, create_mobile_refresh_token, parse_mobile_refresh_token |
| `services/api/app/modules/auth/dependencies.py` | Added get_current_user_bearer (checks Authorization: Bearer header, validates typ=="mobile_access") |
| `services/api/app/modules/cms/models.py` | Added deleted_at: Mapped[datetime | None] column |

### Test Results
- 11/11 new tests pass
- Pre-existing 4 failures (test_refresh isolation, test_brief_agent, test_rbac) — confirmed pre-existing, not caused by M03

### New Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/auth/mobile/login` | None | Email+password sign in → MobileAuthOut |
| POST | `/api/v1/auth/mobile/signup` | None | Email+password registration → MobileAuthOut (201) |
| POST | `/api/v1/auth/mobile/token` | Cookie/Bearer | Exchange session → mobile Bearer token pair |
| POST | `/api/v1/auth/mobile/token/refresh` | None | Refresh token → new access token |
| GET | `/api/v1/mobile/sync` | Bearer | Incremental CMS page sync |
| POST | `/api/v1/mobile/device` | Bearer | Register/update device push token |
| DELETE | `/api/v1/mobile/device/{device_id}` | Bearer | Unregister device |

### Token Types
- `mobile_access`: 30-day JWT (typ="mobile_access"), used as Bearer token in all mobile API calls
- `mobile_refresh`: 90-day JWT (typ="mobile_refresh"), hash stored in mobile_devices.refresh_token_hash
