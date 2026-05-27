"""CDP service — event ingest, session management, identity stitching, analytics queries."""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.modules.cdp.models import (
    AnalyticsEvent,
    AnalyticsSession,
    AttributionTouchpoint,
    GscPerformance,
    UserTrait,
)
from app.modules.auth.models import User
from app.schemas.cdp import EventIn, SessionEndIn, SessionStartIn


# ── Event ingest ──────────────────────────────────────────────────────────────

def log_event(db: Session, event_in: EventIn, user_id: Optional[uuid.UUID] = None) -> AnalyticsEvent:
    event = AnalyticsEvent(
        anonymous_id=event_in.anonymous_id,
        user_id=user_id,
        session_id=event_in.session_id,
        event_category=event_in.event_category,
        event_name=event_in.event_name,
        event_value=event_in.event_value,
        properties=event_in.properties,
        page_url=event_in.page_url,
        page_title=event_in.page_title,
        referrer=event_in.referrer,
        utm_source=event_in.utm_source,
        utm_medium=event_in.utm_medium,
        utm_campaign=event_in.utm_campaign,
        utm_term=event_in.utm_term,
        utm_content=event_in.utm_content,
        device_type=event_in.device_type,
        browser=event_in.browser,
        os=event_in.os,
        country=event_in.country,
        city=event_in.city,
        consent_given=event_in.consent_given,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def batch_log_events(
    db: Session, events: List[EventIn], user_id: Optional[uuid.UUID] = None
) -> int:
    rows = [
        AnalyticsEvent(
            anonymous_id=e.anonymous_id,
            user_id=user_id,
            session_id=e.session_id,
            event_category=e.event_category,
            event_name=e.event_name,
            event_value=e.event_value,
            properties=e.properties,
            page_url=e.page_url,
            page_title=e.page_title,
            referrer=e.referrer,
            utm_source=e.utm_source,
            utm_medium=e.utm_medium,
            utm_campaign=e.utm_campaign,
            utm_term=e.utm_term,
            utm_content=e.utm_content,
            device_type=e.device_type,
            browser=e.browser,
            os=e.os,
            country=e.country,
            city=e.city,
            consent_given=e.consent_given,
        )
        for e in events
    ]
    db.add_all(rows)
    db.commit()
    return len(rows)


# ── Session management ────────────────────────────────────────────────────────

def start_session(db: Session, session_in: SessionStartIn) -> AnalyticsSession:
    session_id = f"s_{uuid.uuid4().hex}"
    session = AnalyticsSession(
        id=session_id,
        anonymous_id=session_in.anonymous_id,
        landing_page=session_in.landing_page,
        utm_source=session_in.utm_source,
        utm_medium=session_in.utm_medium,
        utm_campaign=session_in.utm_campaign,
        device_type=session_in.device_type,
        browser=session_in.browser,
        country=session_in.country,
    )
    db.add(session)
    # Record first-touch attribution
    if session_in.utm_source or session_in.utm_medium:
        existing = (
            db.query(AttributionTouchpoint)
            .filter(AttributionTouchpoint.anonymous_id == session_in.anonymous_id)
            .order_by(AttributionTouchpoint.created_at)
            .first()
        )
        touchpoint_type = "first_touch" if not existing else "assist"
        tp = AttributionTouchpoint(
            anonymous_id=session_in.anonymous_id,
            session_id=session_id,
            touchpoint_type=touchpoint_type,
            channel=_classify_channel(session_in.utm_source, session_in.utm_medium),
            utm_source=session_in.utm_source,
            utm_medium=session_in.utm_medium,
            utm_campaign=session_in.utm_campaign,
            landing_page=session_in.landing_page,
        )
        db.add(tp)
    db.commit()
    db.refresh(session)
    return session


def end_session(db: Session, session_end: SessionEndIn) -> Optional[AnalyticsSession]:
    session = db.query(AnalyticsSession).filter(AnalyticsSession.id == session_end.session_id).first()
    if not session:
        return None
    session.ended_at = datetime.now(timezone.utc)
    session.exit_page = session_end.exit_page
    session.page_count = session_end.page_count
    session.event_count = session_end.event_count
    session.duration_seconds = session_end.duration_seconds
    session.converted = session_end.converted
    session.conversion_event = session_end.conversion_event
    if session_end.converted and session_end.conversion_event:
        # Record last-touch on conversion
        tp = AttributionTouchpoint(
            anonymous_id=session.anonymous_id,
            user_id=session.user_id,
            session_id=session.id,
            touchpoint_type="last_touch",
            channel=_classify_channel(session.utm_source, session.utm_medium),
            utm_source=session.utm_source,
            utm_medium=session.utm_medium,
            utm_campaign=session.utm_campaign,
            conversion_event=session_end.conversion_event,
            converted_at=datetime.now(timezone.utc),
        )
        db.add(tp)
    db.commit()
    db.refresh(session)
    return session


# ── Identity stitching ────────────────────────────────────────────────────────

def stitch_identity(db: Session, anonymous_id: str, user_id: uuid.UUID) -> None:
    """Backfill user_id onto all events and sessions for this anonymous_id."""
    db.query(AnalyticsEvent).filter(
        AnalyticsEvent.anonymous_id == anonymous_id,
        AnalyticsEvent.user_id.is_(None),
    ).update({"user_id": user_id})
    db.query(AnalyticsSession).filter(
        AnalyticsSession.anonymous_id == anonymous_id,
        AnalyticsSession.user_id.is_(None),
    ).update({"user_id": user_id})
    db.query(AttributionTouchpoint).filter(
        AttributionTouchpoint.anonymous_id == anonymous_id,
        AttributionTouchpoint.user_id.is_(None),
    ).update({"user_id": user_id})
    _upsert_user_trait_user_id(db, anonymous_id, user_id)
    db.commit()


def _upsert_user_trait_user_id(db: Session, anonymous_id: str, user_id: uuid.UUID) -> None:
    trait = db.query(UserTrait).filter(UserTrait.anonymous_id == anonymous_id).first()
    if trait:
        trait.user_id = user_id
    else:
        trait = UserTrait(anonymous_id=anonymous_id, user_id=user_id)
        db.add(trait)


# ── User profile ──────────────────────────────────────────────────────────────

def get_user_profile(db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    traits = db.query(UserTrait).filter(UserTrait.user_id == user_id).first()
    recent_events = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.user_id == user_id)
        .order_by(AnalyticsEvent.created_at.desc())
        .limit(50)
        .all()
    )
    sessions = (
        db.query(AnalyticsSession)
        .filter(AnalyticsSession.user_id == user_id)
        .order_by(AnalyticsSession.started_at.desc())
        .limit(20)
        .all()
    )
    touchpoints = (
        db.query(AttributionTouchpoint)
        .filter(AttributionTouchpoint.user_id == user_id)
        .order_by(AttributionTouchpoint.created_at)
        .all()
    )
    return {
        "user": user,
        "traits": traits,
        "recent_events": recent_events,
        "sessions": sessions,
        "touchpoints": touchpoints,
    }


def list_users(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    source: Optional[str] = None,
) -> Dict[str, Any]:
    query = db.query(
        UserTrait,
        User.email,
        User.full_name,
    ).outerjoin(User, UserTrait.user_id == User.id)

    if source:
        query = query.filter(UserTrait.acquisition_source == source)
    if search:
        query = query.filter(User.email.ilike(f"%{search}%"))

    total = query.count()
    rows = (
        query.order_by(UserTrait.last_seen_at.desc().nullslast())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    users = [
        {
            "user_id": r.UserTrait.user_id,
            "anonymous_id": r.UserTrait.anonymous_id,
            "email": r.email,
            "full_name": r.full_name,
            "total_sessions": r.UserTrait.total_sessions,
            "total_events": r.UserTrait.total_events,
            "first_seen_at": r.UserTrait.first_seen_at,
            "last_seen_at": r.UserTrait.last_seen_at,
            "acquisition_source": r.UserTrait.acquisition_source,
            "signed_up_at": r.UserTrait.signed_up_at,
        }
        for r in rows
    ]
    return {"users": users, "total": total, "page": page, "page_size": page_size}


# ── Funnel analysis ───────────────────────────────────────────────────────────

FUNNELS: Dict[str, List[str]] = {
    "trek_discovery_to_signup": [
        "page_view",
        "trek_viewed",
        "plan_wizard_started",
        "plan_wizard_completed",
        "user_signed_up",
    ],
    "search_to_conversion": [
        "search_performed",
        "trek_viewed",
        "plan_wizard_started",
        "user_signed_up",
    ],
    "news_to_engagement": [
        "news_article_viewed",
        "trek_viewed",
        "user_signed_up",
    ],
}


def get_funnel(
    db: Session,
    name: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    steps = FUNNELS.get(name)
    if not steps:
        return {"error": f"Unknown funnel: {name}"}

    filters = []
    if date_from:
        filters.append(f"created_at >= '{date_from}'::date")
    if date_to:
        filters.append(f"created_at <= '{date_to}'::date + interval '1 day'")
    where = ("AND " + " AND ".join(filters)) if filters else ""

    step_results = []
    prev_users: Optional[int] = None
    for i, event_name in enumerate(steps):
        count = db.execute(
            text(
                f"""
                SELECT COUNT(DISTINCT anonymous_id)
                FROM analytics_events
                WHERE event_name = :event_name {where}
                """
            ),
            {"event_name": event_name},
        ).scalar() or 0
        drop_off = None
        if prev_users and prev_users > 0:
            drop_off = round((1 - count / prev_users) * 100, 1)
        step_results.append(
            {"step": i + 1, "event_name": event_name, "users": count, "drop_off_pct": drop_off}
        )
        prev_users = count

    overall = 0.0
    if step_results and step_results[0]["users"] > 0:
        overall = round(step_results[-1]["users"] / step_results[0]["users"] * 100, 2)

    return {
        "name": name,
        "steps": step_results,
        "overall_conversion_pct": overall,
        "date_from": date_from,
        "date_to": date_to,
    }


# ── Cohort retention ──────────────────────────────────────────────────────────

def get_cohorts(db: Session) -> Dict[str, Any]:
    rows = db.execute(
        text(
            """
            WITH cohort_base AS (
                SELECT
                    anonymous_id,
                    date_trunc('week', MIN(started_at))::date AS cohort_week
                FROM analytics_sessions
                GROUP BY anonymous_id
            ),
            retention AS (
                SELECT
                    cb.cohort_week,
                    COUNT(DISTINCT cb.anonymous_id) AS total_users,
                    COUNT(DISTINCT CASE
                        WHEN s.started_at >= cb.cohort_week + interval '7 days'
                         AND s.started_at <  cb.cohort_week + interval '14 days'
                        THEN s.anonymous_id END) AS retained_week1,
                    COUNT(DISTINCT CASE
                        WHEN s.started_at >= cb.cohort_week + interval '14 days'
                         AND s.started_at <  cb.cohort_week + interval '21 days'
                        THEN s.anonymous_id END) AS retained_week2,
                    COUNT(DISTINCT CASE
                        WHEN s.started_at >= cb.cohort_week + interval '28 days'
                         AND s.started_at <  cb.cohort_week + interval '35 days'
                        THEN s.anonymous_id END) AS retained_week4
                FROM cohort_base cb
                LEFT JOIN analytics_sessions s ON s.anonymous_id = cb.anonymous_id
                GROUP BY cb.cohort_week
            )
            SELECT * FROM retention ORDER BY cohort_week DESC LIMIT 12
            """
        )
    ).mappings().all()
    return {"rows": [dict(r) for r in rows]}


# ── Event stream ──────────────────────────────────────────────────────────────

def get_event_stream(
    db: Session,
    page: int = 1,
    page_size: int = 100,
    event_name: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    query = db.query(AnalyticsEvent)
    if event_name:
        query = query.filter(AnalyticsEvent.event_name == event_name)
    if category:
        query = query.filter(AnalyticsEvent.event_category == category)
    total = query.count()
    events = (
        query.order_by(AnalyticsEvent.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"events": events, "total": total}


# ── Segments ──────────────────────────────────────────────────────────────────

SEGMENTS = [
    {
        "name": "Active Explorers",
        "description": "Users who viewed 3+ treks in the last 30 days",
        "filter_criteria": {"event_name": "trek_viewed", "min_count": 3, "days": 30},
    },
    {
        "name": "Plan Starters",
        "description": "Users who started but did not complete the Plan Wizard",
        "filter_criteria": {"started": "plan_wizard_started", "not_completed": "plan_wizard_completed"},
    },
    {
        "name": "New Signups (7d)",
        "description": "Users who signed up in the last 7 days",
        "filter_criteria": {"event_name": "user_signed_up", "days": 7},
    },
    {
        "name": "Organic Search Visitors",
        "description": "Users acquired via organic search",
        "filter_criteria": {"acquisition_medium": "organic"},
    },
    {
        "name": "High Engagement",
        "description": "Users with 10+ events in a single session",
        "filter_criteria": {"min_session_events": 10},
    },
]


def get_segments(db: Session) -> Dict[str, Any]:
    segments_with_counts = []
    now = datetime.now(timezone.utc)
    for seg in SEGMENTS:
        criteria = seg["filter_criteria"]
        count = 0
        try:
            if "event_name" in criteria and "days" in criteria:
                cutoff = now - timedelta(days=criteria["days"])
                count = (
                    db.query(func.count(func.distinct(AnalyticsEvent.anonymous_id)))
                    .filter(
                        AnalyticsEvent.event_name == criteria["event_name"],
                        AnalyticsEvent.created_at >= cutoff,
                    )
                    .scalar()
                    or 0
                )
            elif "acquisition_medium" in criteria:
                count = (
                    db.query(func.count(UserTrait.id))
                    .filter(UserTrait.acquisition_medium == criteria["acquisition_medium"])
                    .scalar()
                    or 0
                )
            elif "min_session_events" in criteria:
                count = (
                    db.query(func.count(func.distinct(AnalyticsSession.anonymous_id)))
                    .filter(AnalyticsSession.event_count >= criteria["min_session_events"])
                    .scalar()
                    or 0
                )
        except Exception:
            count = 0
        segments_with_counts.append({**seg, "user_count": count})
    return {"segments": segments_with_counts}


# ── GSC ───────────────────────────────────────────────────────────────────────

def get_gsc_data(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    page_size: int = 100,
) -> Dict[str, Any]:
    query = db.query(GscPerformance)
    if date_from:
        query = query.filter(GscPerformance.date >= date_from)
    if date_to:
        query = query.filter(GscPerformance.date <= date_to)
    total = query.count()
    rows = (
        query.order_by(GscPerformance.date.desc(), GscPerformance.clicks.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"rows": rows, "total": total, "date_from": date_from, "date_to": date_to}


# ── User traits refresh ───────────────────────────────────────────────────────

def refresh_user_traits(db: Session, anonymous_id: str) -> UserTrait:
    """Recompute trait aggregates for a single anonymous_id."""
    events = db.query(AnalyticsEvent).filter(AnalyticsEvent.anonymous_id == anonymous_id).all()
    sessions = db.query(AnalyticsSession).filter(AnalyticsSession.anonymous_id == anonymous_id).all()

    trait = db.query(UserTrait).filter(UserTrait.anonymous_id == anonymous_id).first()
    if not trait:
        trait = UserTrait(anonymous_id=anonymous_id)
        db.add(trait)

    trait.total_events = len(events)
    trait.total_sessions = len(sessions)
    trait.total_page_views = sum(1 for e in events if e.event_name == "page_view")
    trait.last_seen_at = max((e.created_at for e in events), default=None)
    trait.first_seen_at = min((e.created_at for e in events), default=None)
    trait.viewed_treks = list({
        e.properties.get("trek_slug") for e in events
        if e.event_name == "trek_viewed" and e.properties.get("trek_slug")
    })
    trait.searched_queries = list({
        e.properties.get("query") for e in events
        if e.event_name == "search_performed" and e.properties.get("query")
    })[:50]
    trait.plan_wizard_started = any(e.event_name == "plan_wizard_started" for e in events)
    trait.plan_wizard_completed = any(e.event_name == "plan_wizard_completed" for e in events)

    device_types = list({e.device_type for e in events if e.device_type})
    countries = list({e.country for e in events if e.country})
    trait.device_types_used = device_types
    trait.countries = countries

    first_session = min(sessions, key=lambda s: s.started_at, default=None)
    if first_session:
        trait.acquisition_source = first_session.utm_source
        trait.acquisition_medium = first_session.utm_medium
        trait.acquisition_campaign = first_session.utm_campaign

    db.commit()
    db.refresh(trait)
    return trait


# ── Helpers ───────────────────────────────────────────────────────────────────

def _classify_channel(utm_source: Optional[str], utm_medium: Optional[str]) -> str:
    if not utm_medium:
        return "direct"
    medium = utm_medium.lower()
    if medium in ("organic", "search"):
        return "organic_search"
    if medium in ("cpc", "paid", "ppc"):
        return "paid_search"
    if medium == "email":
        return "email"
    if medium in ("social", "social-media"):
        return "social"
    if medium == "referral":
        return "referral"
    return utm_medium


def hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:32]
