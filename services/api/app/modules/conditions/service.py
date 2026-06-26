"""Live trek conditions service — weather (Open-Meteo) + trail/permit status."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.modules.cms.models import CMSPage
from app.modules.conditions.models import TrekCondition
from app.modules.conditions.schemas import ConditionOut, ForecastDayOut, SeedCoordinatesOut, WeatherOut
from app.modules.reports.models import TripReport

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Known trek base-camp coordinates (lat, lng)
# ---------------------------------------------------------------------------
TREK_COORDS: dict[str, tuple[float, float]] = {
    "kedarkantha": (31.0167, 78.2167),
    "hampta-pass": (32.2583, 77.1500),
    "roopkund": (30.2500, 79.7167),
    "valley-of-flowers": (30.7333, 79.5833),
    "sandakphu": (27.1500, 88.0000),
    "goecha-la": (27.7500, 88.3000),
    "pin-parvati": (31.7500, 77.6500),
    "nubra-valley": (34.8833, 77.5500),
    "markha-valley": (33.9167, 77.5500),
    "rupin-pass": (31.3333, 77.6667),
    "dayara-bugyal": (30.8833, 78.4167),
    "brahmatal-trek": (30.3167, 79.7500),
    "deoriatal-chandrashila": (30.5000, 79.1500),
    "chopta-tungnath": (30.4500, 79.2167),
    "har-ki-dun": (31.1000, 77.9000),
    "buran-ghati": (31.5167, 77.9833),
    "bali-pass": (31.2000, 78.3500),
    "tarsar-marsar": (34.0833, 75.0833),
    "kashmir-great-lakes": (34.2333, 75.1167),
    "kuari-pass": (30.3667, 79.5333),
    "nag-tibba": (30.4167, 78.2500),
    "phulara-ridge": (31.0000, 78.1500),
    "ali-bedni-bugyal": (30.2500, 79.5500),
    "dodital-darwa": (30.9000, 78.4667),
    "lamayuru-to-chilling": (34.2667, 76.7667),
    "stok-kangri": (34.0167, 77.5333),
    "chadar-trek": (33.9333, 77.2833),
    "pangong-lake": (33.7500, 78.6667),
    "beas-kund": (32.2167, 77.1833),
    "chandrakhani-pass": (32.0833, 77.1833),
    "kheerganga": (32.1167, 77.4500),
    "triund": (32.2667, 76.4000),
    "prashar-lake": (31.7667, 76.9667),
    "churdhar": (30.8833, 77.1833),
    "tirthan-valley": (31.6667, 77.3167),
    "sar-pass": (32.2500, 77.3833),
    "deo-tibba-base-camp": (32.2500, 77.2333),
    "chandratal-lake": (32.4833, 77.6167),
    "spiti-valley": (32.2500, 78.0000),
    "bhrigu-lake": (32.2667, 77.2833),
    "bijli-mahadev": (31.8333, 77.1167),
}

# ---------------------------------------------------------------------------
# WMO weather code lookup
# ---------------------------------------------------------------------------
_WMO: dict[int, tuple[str, str]] = {
    0: ("Clear Sky", "sun"),
    1: ("Mainly Clear", "sun"),
    2: ("Partly Cloudy", "cloud-sun"),
    3: ("Overcast", "cloud"),
    45: ("Fog", "cloud-fog"),
    48: ("Icy Fog", "cloud-fog"),
    51: ("Light Drizzle", "cloud-drizzle"),
    53: ("Drizzle", "cloud-drizzle"),
    55: ("Heavy Drizzle", "cloud-drizzle"),
    61: ("Light Rain", "cloud-rain"),
    63: ("Rain", "cloud-rain"),
    65: ("Heavy Rain", "cloud-rain"),
    71: ("Light Snow", "cloud-snow"),
    73: ("Snow", "cloud-snow"),
    75: ("Heavy Snow", "cloud-snow"),
    77: ("Snow Grains", "cloud-snow"),
    80: ("Rain Showers", "cloud-showers-heavy"),
    81: ("Rain Showers", "cloud-showers-heavy"),
    82: ("Heavy Showers", "cloud-showers-heavy"),
    85: ("Snow Showers", "cloud-snow"),
    86: ("Heavy Snow Showers", "cloud-snow"),
    95: ("Thunderstorm", "cloud-lightning"),
    96: ("Thunderstorm + Hail", "cloud-lightning"),
    99: ("Thunderstorm + Hail", "cloud-lightning"),
}

_MONTH_NAMES = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


def _wmo_label(code: int | None) -> tuple[str, str]:
    if code is None:
        return ("Unknown", "cloud")
    return _WMO.get(code, ("Unknown", "cloud"))


# ---------------------------------------------------------------------------
# Open-Meteo API
# ---------------------------------------------------------------------------
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


async def fetch_weather(lat: float, lng: float) -> dict[str, Any]:
    """Call Open-Meteo and return the raw JSON response."""
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min",
        "timezone": "auto",
        "forecast_days": 3,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(OPEN_METEO_URL, params=params)
        resp.raise_for_status()
        return resp.json()


def _parse_weather(weather_json: dict[str, Any]) -> tuple[WeatherOut, list[ForecastDayOut]]:
    """Parse Open-Meteo response into WeatherOut + ForecastDayOut list."""
    current = weather_json.get("current", {})
    wmo_code = current.get("weather_code")
    label, icon = _wmo_label(wmo_code)

    weather = WeatherOut(
        temp_c=current.get("temperature_2m"),
        feels_like_c=current.get("apparent_temperature"),
        humidity_pct=current.get("relative_humidity_2m"),
        wind_kph=current.get("wind_speed_10m"),
        wmo_code=wmo_code,
        label=label,
        icon=icon,
    )

    forecast: list[ForecastDayOut] = []
    daily = weather_json.get("daily", {})
    times = daily.get("time", [])
    codes = daily.get("weather_code", [])
    maxes = daily.get("temperature_2m_max", [])
    mins = daily.get("temperature_2m_min", [])

    for i, date_str in enumerate(times):
        code = codes[i] if i < len(codes) else None
        day_label, _ = _wmo_label(code)
        forecast.append(
            ForecastDayOut(
                date=date_str,
                wmo_code=code,
                label=day_label,
                temp_max_c=maxes[i] if i < len(maxes) else None,
                temp_min_c=mins[i] if i < len(mins) else None,
            )
        )

    return weather, forecast


# ---------------------------------------------------------------------------
# Status derivation
# ---------------------------------------------------------------------------
def derive_trail_status(page: CMSPage, db: Session) -> str:
    """Derive trail status from trek_is_unsafe_closed override + last 5 approved reports."""
    if page.trek_is_unsafe_closed:
        return "closed"

    reports = (
        db.query(TripReport)
        .filter(
            TripReport.trek_slug == page.slug,
            TripReport.status == "approved",
        )
        .order_by(TripReport.created_at.desc())
        .limit(5)
        .all()
    )

    if not reports:
        return "open"

    votes: dict[str, int] = {"open": 0, "caution": 0, "closed": 0}
    for r in reports:
        cond = (r.condition or "unknown").lower()
        if cond in votes:
            votes[cond] += 1

    if votes["closed"] >= 2:
        return "closed"
    if votes["caution"] >= 2:
        return "caution"
    return "open"


def derive_permit_status(page: CMSPage) -> str:
    """Derive permit status from trek_permit_required + current-month open window."""
    if not page.trek_permit_required:
        return "not_required"

    open_months: list[int] = page.trek_open_months or []
    if not open_months:
        return "required"

    current_month = datetime.now(timezone.utc).month
    if current_month in open_months:
        return "required"
    return "check_locally"


def build_condition_summary(
    weather: WeatherOut,
    trail_status: str,
    permit_status: str,
    trek_name: str,
) -> str:
    """Build a 1-2 sentence human-readable conditions summary."""
    parts: list[str] = []

    if weather.temp_c is not None:
        parts.append(
            f"Currently {weather.label.lower()} with {weather.temp_c:.0f}°C"
            f"{' at base camp' if trek_name else ''}."
        )

    trail_map = {
        "open": "Trail is open.",
        "caution": "Trail conditions require caution — check recent reports.",
        "closed": "Trail is currently closed or unsafe.",
    }
    parts.append(trail_map.get(trail_status, "Trail status unknown."))

    permit_map = {
        "not_required": "No permit required.",
        "required": "Permit required for this trek.",
        "check_locally": "Permit status — check locally before visiting.",
    }
    parts.append(permit_map.get(permit_status, ""))

    return " ".join(p for p in parts if p)


# ---------------------------------------------------------------------------
# Core refresh + get
# ---------------------------------------------------------------------------
async def refresh_trek_conditions(db: Session, slug: str) -> TrekCondition | None:
    """Fetch weather from Open-Meteo and upsert trek_conditions row for `slug`."""
    page = (
        db.query(CMSPage)
        .filter(CMSPage.slug == slug, CMSPage.page_type == "trek_guide")
        .first()
    )
    if not page:
        logger.warning("[conditions] slug %s not found", slug)
        return None

    lat = page.trek_base_lat
    lng = page.trek_base_lng
    if lat is None or lng is None:
        # Try TREK_COORDS fallback
        coords = TREK_COORDS.get(slug)
        if coords:
            lat, lng = coords
        else:
            logger.info("[conditions] no coords for slug %s — skipping", slug)
            return None

    now = datetime.now(timezone.utc)
    weather_json: dict[str, Any] | None = None
    weather_out: WeatherOut | None = None
    forecast: list[ForecastDayOut] = []

    try:
        weather_json = await fetch_weather(lat, lng)
        weather_out, forecast = _parse_weather(weather_json)
    except Exception as exc:
        logger.error("[conditions] weather fetch failed for %s: %s", slug, exc)

    trail_status = derive_trail_status(page, db)
    permit_status = derive_permit_status(page)
    trek_name = page.trek_name or page.title or slug
    permit_notes = page.trek_permit_notes

    summary = build_condition_summary(
        weather_out or WeatherOut(), trail_status, permit_status, trek_name
    )

    row = db.query(TrekCondition).filter(TrekCondition.slug == slug).first()
    if row is None:
        row = TrekCondition(slug=slug)
        db.add(row)

    if weather_json is not None:
        # Store parsed forecast alongside current so mobile can read it
        row.weather_json = {
            "current": weather_json.get("current", {}),
            "daily": weather_json.get("daily", {}),
            "forecast": [f.model_dump() for f in forecast],
        }
        row.weather_updated_at = now

    row.trail_status = trail_status
    row.permit_status = permit_status
    row.permit_notes = permit_notes
    row.condition_summary = summary
    row.trail_updated_at = now
    row.last_updated_at = now

    db.commit()
    db.refresh(row)
    return row


def get_trek_conditions(db: Session, slug: str) -> ConditionOut | None:
    """Return cached ConditionOut for a slug, or None if not yet populated."""
    row = db.query(TrekCondition).filter(TrekCondition.slug == slug).first()
    if not row:
        return None

    weather_out: WeatherOut | None = None
    forecast: list[ForecastDayOut] = []

    if row.weather_json:
        try:
            weather_out, forecast = _parse_weather(row.weather_json)
        except Exception:
            pass

    return ConditionOut(
        slug=row.slug,
        weather=weather_out,
        forecast=forecast,
        trail_status=row.trail_status,
        permit_status=row.permit_status,
        permit_notes=row.permit_notes,
        condition_summary=row.condition_summary,
        weather_updated_at=row.weather_updated_at,
        last_updated_at=row.last_updated_at,
    )


# ---------------------------------------------------------------------------
# Bulk refresh (called by Celery beat)
# ---------------------------------------------------------------------------
async def refresh_all_trek_conditions(db: Session) -> dict[str, int]:
    """Refresh weather for all published trek_guide pages that have coordinates."""
    pages = (
        db.query(CMSPage)
        .filter(CMSPage.page_type == "trek_guide", CMSPage.status == "published")
        .all()
    )

    processed = 0
    skipped = 0
    failed = 0

    for page in pages:
        slug = page.slug
        has_db_coords = page.trek_base_lat is not None and page.trek_base_lng is not None
        has_hardcoded = slug in TREK_COORDS
        if not has_db_coords and not has_hardcoded:
            skipped += 1
            continue
        try:
            result = await refresh_trek_conditions(db, slug)
            if result:
                processed += 1
            else:
                skipped += 1
        except Exception as exc:
            logger.error("[conditions] failed to refresh %s: %s", slug, exc)
            failed += 1

    logger.info(
        "[conditions] refresh_all done — processed=%d skipped=%d failed=%d",
        processed, skipped, failed,
    )
    return {"processed": processed, "skipped": skipped, "failed": failed}


# ---------------------------------------------------------------------------
# Seed coordinates from TREK_COORDS dict
# ---------------------------------------------------------------------------
def seed_trek_coordinates(db: Session) -> SeedCoordinatesOut:
    """Populate trek_base_lat/lng on cms_pages from the TREK_COORDS dict."""
    seeded = 0
    skipped = 0

    for slug, (lat, lng) in TREK_COORDS.items():
        page = (
            db.query(CMSPage)
            .filter(CMSPage.slug == slug, CMSPage.page_type == "trek_guide")
            .first()
        )
        if page is None:
            skipped += 1
            continue
        if page.trek_base_lat is not None and page.trek_base_lng is not None:
            skipped += 1
            continue
        page.trek_base_lat = lat
        page.trek_base_lng = lng
        seeded += 1

    if seeded:
        db.commit()

    return SeedCoordinatesOut(seeded=seeded, skipped=skipped)
