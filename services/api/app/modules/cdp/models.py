import uuid
from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.db.base_class import Base


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anonymous_id = Column(String(64), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    session_id = Column(String(64), nullable=True, index=True)
    event_category = Column(String(64), nullable=False)
    event_name = Column(String(128), nullable=False, index=True)
    event_value = Column(Float(), nullable=True)
    properties = Column(JSONB, nullable=False, default=dict)
    page_url = Column(Text(), nullable=True)
    page_title = Column(Text(), nullable=True)
    referrer = Column(Text(), nullable=True)
    utm_source = Column(String(128), nullable=True)
    utm_medium = Column(String(128), nullable=True)
    utm_campaign = Column(String(128), nullable=True)
    utm_term = Column(String(128), nullable=True)
    utm_content = Column(String(128), nullable=True)
    device_type = Column(String(32), nullable=True)
    browser = Column(String(64), nullable=True)
    os = Column(String(64), nullable=True)
    country = Column(String(64), nullable=True)
    city = Column(String(128), nullable=True)
    ip_hash = Column(String(64), nullable=True)
    consent_given = Column(Boolean(), nullable=False, default=False)
    is_internal = Column(Boolean(), nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AnalyticsSession(Base):
    __tablename__ = "analytics_sessions"

    id = Column(String(64), primary_key=True)
    anonymous_id = Column(String(64), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer(), nullable=True)
    page_count = Column(Integer(), nullable=False, default=0)
    event_count = Column(Integer(), nullable=False, default=0)
    landing_page = Column(Text(), nullable=True)
    exit_page = Column(Text(), nullable=True)
    utm_source = Column(String(128), nullable=True)
    utm_medium = Column(String(128), nullable=True)
    utm_campaign = Column(String(128), nullable=True)
    device_type = Column(String(32), nullable=True)
    browser = Column(String(64), nullable=True)
    country = Column(String(64), nullable=True)
    converted = Column(Boolean(), nullable=False, default=False)
    conversion_event = Column(String(128), nullable=True)
    extra = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserTrait(Base):
    __tablename__ = "user_traits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    anonymous_id = Column(String(64), nullable=True, index=True)
    total_sessions = Column(Integer(), nullable=False, default=0)
    total_events = Column(Integer(), nullable=False, default=0)
    total_page_views = Column(Integer(), nullable=False, default=0)
    first_seen_at = Column(DateTime(timezone=True), nullable=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    acquisition_source = Column(String(128), nullable=True)
    acquisition_medium = Column(String(128), nullable=True)
    acquisition_campaign = Column(String(128), nullable=True)
    preferred_trek_categories = Column(JSONB, nullable=False, default=list)
    viewed_treks = Column(JSONB, nullable=False, default=list)
    searched_queries = Column(JSONB, nullable=False, default=list)
    plan_wizard_started = Column(Boolean(), nullable=False, default=False)
    plan_wizard_completed = Column(Boolean(), nullable=False, default=False)
    signed_up_at = Column(DateTime(timezone=True), nullable=True)
    signed_in_count = Column(Integer(), nullable=False, default=0)
    device_types_used = Column(JSONB, nullable=False, default=list)
    countries = Column(JSONB, nullable=False, default=list)
    custom_traits = Column(JSONB, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AttributionTouchpoint(Base):
    __tablename__ = "attribution_touchpoints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anonymous_id = Column(String(64), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    session_id = Column(String(64), nullable=True)
    touchpoint_type = Column(String(32), nullable=False)
    channel = Column(String(64), nullable=True)
    utm_source = Column(String(128), nullable=True)
    utm_medium = Column(String(128), nullable=True)
    utm_campaign = Column(String(128), nullable=True)
    utm_term = Column(String(128), nullable=True)
    utm_content = Column(String(128), nullable=True)
    referrer = Column(Text(), nullable=True)
    landing_page = Column(Text(), nullable=True)
    conversion_event = Column(String(128), nullable=True)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    extra = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class GscPerformance(Base):
    __tablename__ = "gsc_performance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(Date(), nullable=False, index=True)
    page_url = Column(Text(), nullable=False)
    query = Column(Text(), nullable=False)
    country = Column(String(8), nullable=True)
    device = Column(String(16), nullable=True)
    clicks = Column(Integer(), nullable=False, default=0)
    impressions = Column(Integer(), nullable=False, default=0)
    ctr = Column(Float(), nullable=True)
    position = Column(Float(), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("date", "page_url", "query", "country", "device", name="uq_gsc_perf"),
    )


class EventDefinition(Base):
    __tablename__ = "event_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_name = Column(String(120), nullable=False, unique=True, index=True)
    event_category = Column(String(60), nullable=False, index=True)
    description = Column(Text(), nullable=True)
    properties = Column(JSONB, nullable=True)
    is_active = Column(Boolean(), nullable=False, default=True)
    is_test_only = Column(Boolean(), nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class CustomSegment(Base):
    __tablename__ = "custom_segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    description = Column(Text(), nullable=True)
    conditions = Column(JSONB, nullable=False, default=list)
    user_count = Column(Integer(), nullable=True, default=0)
    last_computed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CdpWebhookRule(Base):
    __tablename__ = "cdp_webhook_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=True)
    trigger_event = Column(String(120), nullable=False, index=True)
    condition = Column(JSONB, nullable=True)
    webhook_url = Column(Text(), nullable=False)
    is_active = Column(Boolean(), nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
