# STEP-80 — Live Trek Conditions (Backend + Web)

## Status: Done

## Scope
Add real-time weather data (Open-Meteo) + trail/permit status to every trek detail page, refreshed every 6 hours via Celery beat. This covers the backend module, API, Celery task, and the Next.js widget.

## Tech Choices (confirmed)
- **Weather API**: Open-Meteo (`api.open-meteo.com`) — free, no API key, 10k calls/day, excellent Himalayan accuracy
- **Trek coordinates**: DB columns (`trek_base_lat`, `trek_base_lng` Float nullable on `cms_pages`) — Option B
- **Cache layer**: `trek_conditions` Postgres table — weather JSON + derived statuses, refreshed every 6 hours

## DB Changes

### New columns on `cms_pages`
| Column | Type | Notes |
|--------|------|-------|
| `trek_base_lat` | Float nullable | Trek base-camp latitude |
| `trek_base_lng` | Float nullable | Trek base-camp longitude |

### New table: `trek_conditions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `slug` | varchar(255) unique+indexed | Trek slug FK (by slug, not page ID) |
| `weather_json` | JSONB | Raw Open-Meteo response (current + 3-day forecast) |
| `trail_status` | varchar(30) | open / caution / closed |
| `permit_status` | varchar(30) | not_required / required / check_locally |
| `permit_notes` | text nullable | From `trek_permit_notes` on `cms_pages` |
| `condition_summary` | text nullable | 1-2 sentence human-readable summary |
| `weather_updated_at` | timestamptz | When Open-Meteo was last hit |
| `trail_updated_at` | timestamptz | When trail status was last derived |
| `last_updated_at` | timestamptz | Overall cache timestamp |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

## Migration
File: `services/api/alembic/versions/20260626_0051_trek_conditions_and_coords.py`

## Backend Module: `services/api/app/modules/conditions/`
- `__init__.py`
- `models.py` — `TrekCondition` ORM
- `schemas.py` — `WeatherOut`, `Forecast3DayItem`, `ConditionOut`
- `service.py`:
  - `TREK_COORDS: dict[str, tuple[float, float]]` — hardcoded lat/lng for known treks
  - `seed_trek_coordinates(db)` — populates `trek_base_lat`/`trek_base_lng` from `TREK_COORDS`
  - `fetch_weather(lat, lng) -> dict` — async httpx call to Open-Meteo
  - `derive_trail_status(page, reports) -> str` — votes on last 5 approved trip reports; respects `trek_is_unsafe_closed` hard override
  - `derive_permit_status(page) -> str` — from `trek_permit_required` + current month in `trek_open_months`
  - `build_condition_summary(weather, trail, permit) -> str` — human-readable sentence
  - `refresh_trek_conditions(db, slug) -> TrekCondition` — fetches weather + derives statuses + upserts row
  - `get_trek_conditions(db, slug) -> ConditionOut | None` — returns cached row (or None if no coords)
  - `refresh_all_trek_conditions(db)` — iterates all published trek_guide pages with coords; called by Celery

## API Routes: `services/api/app/api/routes/conditions.py`
- `GET /api/v1/public/treks/{slug}/conditions` — returns `ConditionOut` (or 204 if no coords)
- `POST /api/v1/admin/conditions/{slug}/refresh` — admin triggers immediate refresh; returns `ConditionOut`
- `POST /api/v1/admin/conditions/seed-coordinates` — seeds lat/lng from `TREK_COORDS` dict

## Celery Task: `services/api/app/worker/tasks/conditions.py`
- Task name: `conditions.refresh_all`
- Beat schedule: every 6 hours (`21600` seconds)

## Web Frontend
- `apps/web-next/lib/conditions.ts` — `fetchConditions(slug)` API client
- `apps/web-next/components/trek/LiveConditionsWidget.tsx` — displays weather + trail + permit status in card UI
- Wired into `apps/web-next/app/(public)/trek/[slug]/page.tsx` above the trail-conditions section

## Files Created
- `services/api/alembic/versions/20260626_0051_trek_conditions_and_coords.py`
- `services/api/app/modules/conditions/__init__.py`
- `services/api/app/modules/conditions/models.py`
- `services/api/app/modules/conditions/schemas.py`
- `services/api/app/modules/conditions/service.py`
- `services/api/app/api/routes/conditions.py`
- `services/api/app/worker/tasks/conditions.py`
- `services/api/tests/test_conditions_m19.py`
- `apps/web-next/lib/conditions.ts`
- `apps/web-next/components/trek/LiveConditionsWidget.tsx`

## Files Modified
- `services/api/app/modules/cms/models.py` — add `trek_base_lat`, `trek_base_lng`
- `services/api/app/db/base.py` — register `TrekCondition`
- `services/api/app/api/router.py` — include conditions routes
- `services/api/app/worker/celery_app.py` — include conditions task + beat entry
- `apps/web-next/app/(public)/trek/[slug]/page.tsx` — add `LiveConditionsWidget`

## Notes
- Open-Meteo WMO codes are used to map weather to human labels (Clear / Partly Cloudy / Overcast / Drizzle / Rain / Snow / Thunderstorm)
- Trail status: last 5 approved trip reports majority vote; `trek_is_unsafe_closed = True` always overrides to "closed"
- Permit status: derived from `trek_permit_required` + current month vs `trek_open_months` array
- Treks with no lat/lng data return 204 from the conditions endpoint; widget renders nothing
- Admin can manually add coords via the admin trek-data edit page (future step) or via `seed-coordinates` endpoint
