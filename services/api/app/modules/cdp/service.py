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


# ── Event catalog ─────────────────────────────────────────────────────────────

def get_event_catalog(db: Session) -> Dict[str, Any]:
    """Return distinct (event_name, event_category) pairs ordered by frequency."""
    rows = db.execute(
        text(
            """
            SELECT event_name, event_category, COUNT(*) AS cnt
            FROM analytics_events
            GROUP BY event_name, event_category
            ORDER BY cnt DESC
            LIMIT 100
            """
        )
    ).mappings().all()
    return {"events": [{"event_name": r["event_name"], "event_category": r["event_category"], "count": r["cnt"]} for r in rows]}


# ── Dynamic funnel ─────────────────────────────────────────────────────────────

def get_dynamic_funnel(
    db: Session,
    steps: List[Dict[str, Any]],
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    count_type: str = "unique_users",
) -> Dict[str, Any]:
    """Compute a sequential funnel from caller-defined steps."""
    date_conditions = []
    if date_from:
        date_conditions.append(f"created_at >= '{date_from}'::date")
    if date_to:
        date_conditions.append(f"created_at <= '{date_to}'::date + interval '1 day'")
    base_where = (" AND " + " AND ".join(date_conditions)) if date_conditions else ""

    step_results = []
    prev_count: Optional[int] = None
    for i, step in enumerate(steps):
        params: Dict[str, Any] = {"event_name": step["event_name"]}
        extra = ""
        if step.get("event_category"):
            extra += f" AND event_category = :cat_{i}"
            params[f"cat_{i}"] = step["event_category"]
        if step.get("event_value_min") is not None:
            extra += f" AND event_value >= :val_min_{i}"
            params[f"val_min_{i}"] = step["event_value_min"]
        if step.get("event_value_max") is not None:
            extra += f" AND event_value <= :val_max_{i}"
            params[f"val_max_{i}"] = step["event_value_max"]

        count = db.execute(
            text(
                f"""
                SELECT COUNT(DISTINCT anonymous_id)
                FROM analytics_events
                WHERE event_name = :event_name{base_where}{extra}
                """
            ),
            params,
        ).scalar() or 0

        drop_off = None
        if prev_count and prev_count > 0:
            drop_off = round((1 - count / prev_count) * 100, 1)
        step_results.append({
            "step": i + 1,
            "event_name": step["event_name"],
            "users": count,
            "drop_off_pct": drop_off,
        })
        prev_count = count

    overall = 0.0
    if step_results and step_results[0]["users"] > 0:
        overall = round(step_results[-1]["users"] / step_results[0]["users"] * 100, 2)

    return {
        "steps": step_results,
        "overall_conversion_pct": overall,
        "date_from": date_from,
        "date_to": date_to,
        "count_type": count_type,
    }


# ── Enhanced cohort retention heatmap ─────────────────────────────────────────

def get_cohort_heatmap(db: Session, max_weeks: int = 9) -> Dict[str, Any]:
    """Full N×M retention heatmap. Returns week 0–8 retention per cohort."""
    week_cases = " ".join(
        f"COUNT(DISTINCT CASE WHEN week_offset >= {w} AND week_offset < {w + 1} THEN anonymous_id END) AS w{w},"
        for w in range(max_weeks)
    ).rstrip(",")

    rows = db.execute(
        text(
            f"""
            WITH cohort_base AS (
                SELECT
                    anonymous_id,
                    date_trunc('week', MIN(started_at))::date AS cohort_week
                FROM analytics_sessions
                GROUP BY anonymous_id
            ),
            all_sessions AS (
                SELECT
                    s.anonymous_id,
                    cb.cohort_week,
                    EXTRACT(EPOCH FROM (date_trunc('week', s.started_at) - cb.cohort_week)) / 604800.0 AS week_offset
                FROM analytics_sessions s
                JOIN cohort_base cb ON s.anonymous_id = cb.anonymous_id
                WHERE cb.cohort_week >= NOW() - INTERVAL '12 weeks'
            ),
            retention AS (
                SELECT cohort_week,
                       {week_cases}
                FROM all_sessions
                GROUP BY cohort_week
            )
            SELECT * FROM retention ORDER BY cohort_week DESC LIMIT 12
            """
        )
    ).mappings().all()

    # Post-process: compute percentages, mark future cells
    from datetime import date as date_type
    today = datetime.now(timezone.utc).date()
    result = []
    for r in rows:
        cohort_week = r["cohort_week"]
        if hasattr(cohort_week, "date"):
            cohort_week = cohort_week.date()
        total = r.get("w0") or 0
        retention_cells = []
        for w in range(max_weeks):
            week_date = cohort_week + timedelta(weeks=w)
            if week_date > today:
                retention_cells.append({"week": w, "users": 0, "pct": -1.0})  # -1 = future
            else:
                cnt = r.get(f"w{w}") or 0
                pct = round(cnt / total * 100, 1) if total > 0 else 0.0
                retention_cells.append({"week": w, "users": cnt, "pct": pct})
        result.append({
            "cohort_week": cohort_week.isoformat() if hasattr(cohort_week, "isoformat") else str(cohort_week),
            "total_users": total,
            "retention": retention_cells,
        })
    return {"rows": result, "max_weeks": max_weeks}


# ── User activity timeline ─────────────────────────────────────────────────────

def get_user_activity(
    db: Session,
    email: str,
    page: int = 1,
    page_size: int = 50,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Return paginated event timeline for a user looked up by email."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None

    trait = db.query(UserTrait).filter(UserTrait.user_id == user.id).first()
    anonymous_id = trait.anonymous_id if trait else None

    query = db.query(AnalyticsEvent).filter(
        (AnalyticsEvent.user_id == user.id) |
        (AnalyticsEvent.anonymous_id == anonymous_id if anonymous_id else False)
    )
    if date_from:
        query = query.filter(AnalyticsEvent.created_at >= date_from)
    if date_to:
        query = query.filter(AnalyticsEvent.created_at <= date_to)

    total = query.count()
    events = (
        query.order_by(AnalyticsEvent.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "email": user.email,
        "full_name": user.full_name,
        "anonymous_id": anonymous_id,
        "user_id": str(user.id),
        "signed_up_at": trait.signed_up_at if trait else None,
        "total_events": total,
        "events": [
            {
                "id": str(e.id),
                "event_category": e.event_category,
                "event_name": e.event_name,
                "properties": e.properties,
                "page_url": e.page_url,
                "page_title": e.page_title,
                "created_at": e.created_at,
            }
            for e in events
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


# ── Expanded segments ──────────────────────────────────────────────────────────

SEGMENTS = [
    {
        "name": "Active Explorers",
        "description": "Viewed 3+ treks in the last 30 days",
        "criteria_label": "trek_viewed ≥ 3 · last 30 days",
        "filter_criteria": {"event_name": "trek_viewed", "min_count": 3, "days": 30},
    },
    {
        "name": "Plan Starters",
        "description": "Started but did not complete the Plan My Trek wizard",
        "criteria_label": "plan_wizard_started · NOT plan_wizard_completed",
        "filter_criteria": {"started": "plan_wizard_started", "not_completed": "plan_wizard_completed"},
    },
    {
        "name": "New Signups (7d)",
        "description": "Signed up in the last 7 days",
        "criteria_label": "user_signed_up · last 7 days",
        "filter_criteria": {"event_name": "user_signed_up", "days": 7},
    },
    {
        "name": "Organic Search Visitors",
        "description": "Acquired via organic search (utm_medium = organic)",
        "criteria_label": "acquisition_medium = organic",
        "filter_criteria": {"acquisition_medium": "organic"},
    },
    {
        "name": "High Engagement",
        "description": "Had a session with 10+ events",
        "criteria_label": "session event_count ≥ 10",
        "filter_criteria": {"min_session_events": 10},
    },
    {
        "name": "Returning Visitors",
        "description": "Visited the site 2 or more times (sessions)",
        "criteria_label": "total_sessions ≥ 2",
        "filter_criteria": {"min_sessions": 2},
    },
    {
        "name": "Mobile-First Users",
        "description": "All recorded sessions from a mobile device",
        "criteria_label": "device_type = mobile",
        "filter_criteria": {"device_type": "mobile"},
    },
    {
        "name": "Plan Wizard Completors",
        "description": "Completed the full Plan My Trek wizard at least once",
        "criteria_label": "plan_wizard_completed = true",
        "filter_criteria": {"event_name": "plan_wizard_completed", "days": 365},
    },
    {
        "name": "Content Readers",
        "description": "Read 3+ news or guide articles",
        "criteria_label": "news_article_viewed ≥ 3 · all time",
        "filter_criteria": {"event_name": "news_article_viewed", "min_count": 3, "days": 365},
    },
    {
        "name": "Search-Engaged",
        "description": "Used the search feature at least once",
        "criteria_label": "search_performed ≥ 1",
        "filter_criteria": {"event_name": "search_performed", "days": 365},
    },
]


def get_segments(db: Session) -> Dict[str, Any]:
    segments_with_counts = []
    now = datetime.now(timezone.utc)
    for seg in SEGMENTS:
        criteria = seg["filter_criteria"]
        count = 0
        try:
            if "event_name" in criteria and "days" in criteria and "min_count" not in criteria:
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
            elif "event_name" in criteria and "min_count" in criteria:
                cutoff = now - timedelta(days=criteria.get("days", 365))
                count = (
                    db.execute(
                        text(
                            """
                            SELECT COUNT(*) FROM (
                                SELECT anonymous_id
                                FROM analytics_events
                                WHERE event_name = :en AND created_at >= :cutoff
                                GROUP BY anonymous_id
                                HAVING COUNT(*) >= :min_c
                            ) sub
                            """
                        ),
                        {"en": criteria["event_name"], "cutoff": cutoff, "min_c": criteria["min_count"]},
                    ).scalar()
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
            elif "min_sessions" in criteria:
                count = (
                    db.query(func.count(UserTrait.id))
                    .filter(UserTrait.total_sessions >= criteria["min_sessions"])
                    .scalar()
                    or 0
                )
            elif "device_type" in criteria:
                count = (
                    db.query(func.count(func.distinct(AnalyticsSession.anonymous_id)))
                    .filter(AnalyticsSession.device_type == criteria["device_type"])
                    .scalar()
                    or 0
                )
            elif "started" in criteria:
                started_ids = {
                    r[0] for r in db.query(AnalyticsEvent.anonymous_id)
                    .filter(AnalyticsEvent.event_name == criteria["started"])
                    .all()
                }
                completed_ids = {
                    r[0] for r in db.query(AnalyticsEvent.anonymous_id)
                    .filter(AnalyticsEvent.event_name == criteria["not_completed"])
                    .all()
                }
                count = len(started_ids - completed_ids)
        except Exception:
            count = 0
        segments_with_counts.append({
            **seg,
            "user_count": count,
        })
    return {"segments": segments_with_counts}


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
