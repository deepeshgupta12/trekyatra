from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WeatherOut(BaseModel):
    temp_c: float | None = None
    feels_like_c: float | None = None
    humidity_pct: int | None = None
    wind_kph: float | None = None
    wmo_code: int | None = None
    label: str = "Unknown"
    icon: str = "cloud"


class ForecastDayOut(BaseModel):
    date: str
    wmo_code: int | None = None
    label: str
    temp_max_c: float | None = None
    temp_min_c: float | None = None


class ConditionOut(BaseModel):
    slug: str
    weather: WeatherOut | None = None
    forecast: list[ForecastDayOut] = []
    trail_status: str = "open"
    permit_status: str = "not_required"
    permit_notes: str | None = None
    condition_summary: str | None = None
    weather_updated_at: datetime | None = None
    last_updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SeedCoordinatesOut(BaseModel):
    seeded: int
    skipped: int


class SetCoordinateIn(BaseModel):
    lat: float
    lng: float


class ConditionAdminRow(BaseModel):
    slug: str
    title: str
    trek_base_lat: float | None = None
    trek_base_lng: float | None = None
    coords_seeded: bool
    trail_status: str | None = None
    permit_status: str | None = None
    last_updated_at: datetime | None = None
    weather_label: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ConditionsListOut(BaseModel):
    total: int
    seeded: int
    refreshed: int
    rows: list[ConditionAdminRow]
