from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, field_validator


class MobileSignInIn(BaseModel):
    email: str
    password: str
    device_id: str
    platform: str  # "android" | "ios"


class MobileSignUpIn(BaseModel):
    email: str
    password: str
    full_name: str | None = None
    device_id: str
    platform: str  # "android" | "ios"


class MobileAuthOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    email: str | None
    full_name: str | None


class MobileTokenIn(BaseModel):
    device_id: str
    platform: str  # "android" | "ios"

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        if v not in ("android", "ios"):
            raise ValueError("platform must be 'android' or 'ios'")
        return v


class MobileTokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class MobileRefreshIn(BaseModel):
    refresh_token: str
    device_id: str


class MobileAccessOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class MobileGoogleIn(BaseModel):
    access_token: str   # Google OAuth access token from expo-auth-session
    device_id: str
    platform: str       # "android" | "ios"

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        if v not in ("android", "ios"):
            raise ValueError("platform must be 'android' or 'ios'")
        return v


class MobileAppleIn(BaseModel):
    identity_token: str           # Apple identity token (JWT) from expo-apple-authentication
    full_name: str | None = None  # Apple only returns the name on the FIRST sign-in
    device_id: str
    platform: str                 # "android" | "ios"

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        if v not in ("android", "ios"):
            raise ValueError("platform must be 'android' or 'ios'")
        return v


class DeviceIn(BaseModel):
    device_id: str
    platform: str  # "android" | "ios"
    fcm_token: Optional[str] = None
    apns_token: Optional[str] = None
    app_version: Optional[str] = None
    os_version: Optional[str] = None

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        if v not in ("android", "ios"):
            raise ValueError("platform must be 'android' or 'ios'")
        return v


class DeviceOut(BaseModel):
    id: str
    device_id: str
    created: bool


class SyncPageOut(BaseModel):
    slug: str
    title: str
    page_type: str
    hero_image_url: Optional[str] = None
    trek_state: Optional[str] = None
    trek_difficulty: Optional[str] = None
    trek_duration: Optional[str] = None
    trek_altitude: Optional[str] = None
    trek_season: Optional[str] = None
    body_json: Optional[Dict[str, Any]] = None
    seo_description: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class SyncOut(BaseModel):
    updated: List[SyncPageOut]
    deleted_slugs: List[str]
    sync_timestamp: datetime
    has_more: bool
    total_updated: int


# ── Trek Check-in (M16) ───────────────────────────────────────────────────────

class CheckinIn(BaseModel):
    trek_slug: str
    trek_title: Optional[str] = None
    completion_date: date
    duration_days: Optional[int] = None
    rating: Optional[int] = None  # 1–5
    notes: Optional[str] = None
    trek_state: Optional[str] = None
    max_altitude_ft: Optional[int] = None


class CheckinOut(BaseModel):
    id: uuid.UUID
    trek_slug: str
    trek_title: Optional[str] = None
    completion_date: date
    duration_days: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    trek_state: Optional[str] = None
    max_altitude_ft: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TrekHistoryStatsOut(BaseModel):
    total_treks: int
    total_days: int
    states_visited: List[str]
    favourite_state: Optional[str]
    badges: List[str]


# ── Nearby Treks (M20) ────────────────────────────────────────────────────────

class NearbyTrekOut(BaseModel):
    slug: str
    distance_km: float
    name: Optional[str] = None
    difficulty: Optional[str] = None
    state: Optional[str] = None
    hero_image_url: Optional[str] = None
    trek_duration: Optional[str] = None
    trek_altitude: Optional[str] = None
    trek_season: Optional[str] = None


class NearbyTreksOut(BaseModel):
    treks: List[NearbyTrekOut]
    user_lat: float
    user_lon: float
