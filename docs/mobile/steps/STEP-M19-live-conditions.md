# STEP-M19 — Live Trail Conditions

**Status:** Pending
**Phase:** Engagement
**Dependencies:** STEP-M03 (backend extensions), STEP-M05 (trek detail — conditions shown there), STEP-M17 (trip reports feed into conditions)
**Backend step:** Yes — new DB table (`trek_conditions`), IMD weather API integration, Celery refresh task

---

## Scope

Real-time (6-hourly) trail condition cards on Trek Detail screens. Combines two data sources: IMD (India Meteorological Department) weather API for objective weather data, and crowdsourced condition rollup from approved trip reports (STEP-M17). Together they produce a `composite_status` (open / caution / closed) for each trek with a last-updated timestamp. Condition data is cached in `trek_conditions` table — never fetched live in the request path.

---

## Files to Create

### Backend
| File | Purpose |
|------|---------|
| `services/api/alembic/versions/YYYYMMDD_0048_trek_conditions.py` | Migration: `trek_conditions` table |
| `services/api/app/modules/conditions/models.py` | ORM: `TrekCondition` |
| `services/api/app/modules/conditions/schemas.py` | Pydantic: `TrekConditionOut` |
| `services/api/app/modules/conditions/service.py` | Service: `get_condition`, `refresh_condition`, `compute_composite_status` |
| `services/api/app/modules/conditions/weather_client.py` | IMD/OpenWeatherMap API client |
| `services/api/app/worker/tasks/conditions.py` | Celery task: `refresh_trek_conditions` |
| `services/api/app/api/routes/conditions.py` | `GET /public/treks/{slug}/conditions` |
| `services/api/tests/test_conditions_m19.py` | Backend condition tests |

### Mobile
| File | Purpose |
|------|---------|
| `apps/mobile/components/conditions/ConditionCard.tsx` | Condition summary card for Trek Detail |
| `apps/mobile/components/conditions/WeatherStrip.tsx` | Horizontal weather metrics strip |
| `apps/mobile/hooks/useConditions.ts` | Fetch conditions for a trek |

---

## Database: `trek_conditions`

```sql
CREATE TABLE trek_conditions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trek_slug           VARCHAR(200) NOT NULL UNIQUE,
    composite_status    VARCHAR(32) NOT NULL DEFAULT 'unknown',  -- open | caution | closed | unknown
    weather_source      VARCHAR(32),   -- 'imd' | 'openweathermap'
    weather_temp_c      NUMERIC(5,1),
    weather_condition   VARCHAR(100),  -- "Partly cloudy", "Heavy snowfall"
    weather_wind_kmh    NUMERIC(5,1),
    weather_visibility  VARCHAR(32),   -- "Good", "Poor"
    weather_fetched_at  TIMESTAMPTZ,
    report_status       VARCHAR(32),   -- latest crowdsourced condition from trip_reports
    report_count        INTEGER DEFAULT 0,
    report_last_at      TIMESTAMPTZ,
    advisory            TEXT,          -- manual override advisory text (set by admin)
    next_refresh_at     TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conditions_trek_slug ON trek_conditions(trek_slug);
```

---

## Composite Status Logic

```python
# service.py
def compute_composite_status(
    weather_condition: str,
    weather_wind_kmh: float,
    weather_visibility: str,
    report_status: str | None,
    advisory: str | None,
) -> str:
    """
    Priority: manual advisory > trip report status > weather-derived status
    """
    if advisory:
        # Admin has set an explicit advisory — always use it
        if 'closed' in advisory.lower():
            return 'closed'
        if 'caution' in advisory.lower():
            return 'caution'

    # Trip report consensus takes precedence over weather
    if report_status == 'closed':
        return 'closed'
    if report_status == 'caution':
        return 'caution'

    # Weather-derived heuristics
    if weather_wind_kmh and weather_wind_kmh > 60:
        return 'caution'
    if weather_condition and any(k in weather_condition.lower() for k in ['blizzard', 'heavy snow', 'cyclone']):
        return 'closed'
    if weather_visibility == 'Very Poor':
        return 'caution'

    # Report says open or no signal
    if report_status == 'open':
        return 'open'

    return 'unknown'
```

---

## Weather Client

```python
# weather_client.py
import httpx
from app.core.config import settings

class OpenWeatherClient:
    """OpenWeatherMap free tier — One Call API 3.0"""
    BASE = "https://api.openweathermap.org/data/3.0/onecall"

    async def get_for_coords(self, lat: float, lon: float) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                self.BASE,
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": settings.OPENWEATHERMAP_API_KEY,
                    "units": "metric",
                    "exclude": "minutely,hourly,alerts",
                },
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            current = data["current"]
            return {
                "temp_c": current["temp"],
                "condition": current["weather"][0]["description"].title(),
                "wind_kmh": round(current["wind_speed"] * 3.6, 1),
                "visibility": "Good" if current.get("visibility", 10000) > 5000 else "Poor",
                "source": "openweathermap",
            }
```

Trek coordinates (lat/lon) must be available in the trek data. Add `lat` and `lon` columns to the CMS trek page schema or the static trek list — required to call the weather API.

---

## Celery Task: Refresh Conditions

```python
# worker/tasks/conditions.py

@celery_app.task(name="conditions.refresh_trek_conditions")
def refresh_trek_conditions():
    """Every 6 hours: refresh weather + recompute composite status for all active treks"""
    ...
```

Beat schedule:
```python
"refresh_trek_conditions": {
    "task": "conditions.refresh_trek_conditions",
    "schedule": crontab(hour="*/6", minute=30),  # 00:30, 06:30, 12:30, 18:30
},
```

Refreshes all treks where `next_refresh_at < now()` or record is missing. After weather fetch, calls `compute_composite_status` and upserts `trek_conditions`.

---

## Mobile: Condition Card

```
[ConditionCard]
──────────────────────────────
● OPEN                    Updated 2h ago
─
  🌡 4°C   💨 18 km/h   ☁ Partly Cloudy
  👁 Good visibility
──────────────────────────────
  5 recent reports: 80% Open · 20% Caution
  "Trail is in good shape. Snow starts at base camp."
──────────────────────────────
```

Status colours:
- `open` → pine green `text-pine` / `bg-pine/10`
- `caution` → amber `text-amber-400` / `bg-amber-400/10`
- `closed` → red `text-red-400` / `bg-red-400/10`
- `unknown` → muted `text-white/50` / `bg-white/5`

---

## API Response

```json
{
  "trek_slug": "kedarkantha",
  "composite_status": "open",
  "weather": {
    "temp_c": 4.2,
    "condition": "Partly Cloudy",
    "wind_kmh": 18.0,
    "visibility": "Good",
    "fetched_at": "2026-05-29T06:30:00Z"
  },
  "reports": {
    "status": "open",
    "count": 5,
    "last_at": "2026-05-27T14:00:00Z",
    "summary": "Trail is in good shape. Snow starts at base camp."
  },
  "advisory": null,
  "updated_at": "2026-05-29T06:30:00Z"
}
```

---

## Environment Variables

Add to `services/api/.env.example`:
```
OPENWEATHERMAP_API_KEY=your_key_here
```

Add to `services/api/app/core/config.py`:
```python
OPENWEATHERMAP_API_KEY: str = ""
```

---

## Backend Tests

| Test ID | Verifies |
|---------|---------|
| TC-B-M19-01 | `test_get_condition_returns_unknown_for_new_trek` — 200 with composite_status=unknown |
| TC-B-M19-02 | `test_composite_status_closed_on_blizzard` — weather with "Blizzard" → composite=closed |
| TC-B-M19-03 | `test_composite_status_report_overrides_weather` — report=closed beats good weather |
| TC-B-M19-04 | `test_advisory_overrides_all` — manual advisory=closed beats report=open |
| TC-B-M19-05 | `test_weather_client_mock` — mocked OpenWeatherMap response parsed correctly |
| TC-B-M19-06 | `test_refresh_task_upserts_condition` — after task run, trek_conditions row created/updated |

---

## Verification (Manual)

1. **TC-M19-01**: Trek detail shows ConditionCard with status badge and weather strip
2. **TC-M19-02**: "Updated Xh ago" timestamp is recent (within 6h of last Celery run)
3. **TC-M19-03**: Trip reports count and consensus visible below weather strip
4. **TC-M19-04**: Admin sets advisory "CLOSED — avalanche risk" → trek shows CLOSED status
5. **TC-M19-05**: Trek with no weather data shows "Unknown" status gracefully

---

## Notes

- OpenWeatherMap free tier: 1,000 calls/day. With ~50 active treks × 4 refreshes/day = 200 calls/day — well within free tier
- IMD API is preferred for India-specific data but lacks a reliable JSON endpoint; OpenWeatherMap is the practical choice
- Trek coordinates (lat/lon) for the weather API: add to the static trek list (`apps/web-next/lib/treks.ts`) and to the CMS page schema. This is a prerequisite for STEP-M19 — must be done during M19 implementation
- `advisory` field can be set directly in the DB by admin or via a future admin UI endpoint. Admin can type "CLOSED — heavy snowfall reported" and it immediately overrides the computed status
- The `trek_conditions` table is the single source of truth — the mobile app never calls OpenWeatherMap directly
