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
    CdpWebhookRule,
    CustomSegment,
    EventDefinition,
    GscPerformance,
    UserTrait,
)
from app.modules.auth.models import User
from app.schemas.cdp import (
    CustomSegmentIn,
    EventIn,
    SegmentCondition,
    SessionEndIn,
    SessionStartIn,
    WebhookRuleIn,
)


# ── Event ingest ──────────────────────────────────────────────────────────────

def _is_internal_event(event_in: EventIn) -> bool:
    from app.core.config import settings
    if event_in.is_internal:
        return True
    return event_in.anonymous_id in (settings.internal_anonymous_ids or [])


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
        is_internal=_is_internal_event(event_in),
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


# ── Step 67: KPI Dashboard ────────────────────────────────────────────────────

def get_kpis(db: Session) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)

    def _dau_sparkline(days: int = 7) -> List[Dict[str, Any]]:
        points = []
        for i in range(days - 1, -1, -1):
            day = now - timedelta(days=i)
            d_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            d_end = d_start + timedelta(days=1)
            c = (
                db.query(func.count(func.distinct(AnalyticsEvent.anonymous_id)))
                .filter(
                    AnalyticsEvent.created_at >= d_start,
                    AnalyticsEvent.created_at < d_end,
                    AnalyticsEvent.is_internal == False,
                )
                .scalar() or 0
            )
            points.append({"label": d_start.strftime("%m/%d"), "value": c})
        return points

    def _count_distinct_anon(date_from: datetime, date_to: datetime) -> int:
        return (
            db.query(func.count(func.distinct(AnalyticsEvent.anonymous_id)))
            .filter(
                AnalyticsEvent.created_at >= date_from,
                AnalyticsEvent.created_at < date_to,
                AnalyticsEvent.is_internal == False,
            )
            .scalar() or 0
        )

    def _count_sessions(date_from: datetime, date_to: datetime) -> int:
        return (
            db.query(func.count(AnalyticsSession.id))
            .filter(
                AnalyticsSession.started_at >= date_from,
                AnalyticsSession.started_at < date_to,
            )
            .scalar() or 0
        )

    def _count_events_by_name(event_name: str, date_from: datetime, date_to: datetime) -> int:
        return (
            db.query(func.count(AnalyticsEvent.id))
            .filter(
                AnalyticsEvent.event_name == event_name,
                AnalyticsEvent.created_at >= date_from,
                AnalyticsEvent.created_at < date_to,
                AnalyticsEvent.is_internal == False,
            )
            .scalar() or 0
        )

    # Time windows
    t24h = now - timedelta(hours=24)
    t48h = now - timedelta(hours=48)
    t7d = now - timedelta(days=7)
    t14d = now - timedelta(days=14)
    t30d = now - timedelta(days=30)
    t60d = now - timedelta(days=60)

    # Compute each KPI
    dau = _count_distinct_anon(t24h, now)
    dau_prev = _count_distinct_anon(t48h, t24h)

    wau = _count_distinct_anon(t7d, now)
    wau_prev = _count_distinct_anon(t14d, t7d)

    mau = _count_distinct_anon(t30d, now)
    mau_prev = _count_distinct_anon(t60d, t30d)

    sessions_7d = _count_sessions(t7d, now)
    sessions_7d_prev = _count_sessions(t14d, t7d)

    # Avg session duration
    avg_dur = (
        db.query(func.avg(AnalyticsSession.duration_seconds))
        .filter(AnalyticsSession.started_at >= t7d, AnalyticsSession.duration_seconds.isnot(None))
        .scalar() or 0
    )
    avg_dur_prev = (
        db.query(func.avg(AnalyticsSession.duration_seconds))
        .filter(
            AnalyticsSession.started_at >= t14d,
            AnalyticsSession.started_at < t7d,
            AnalyticsSession.duration_seconds.isnot(None),
        )
        .scalar() or 0
    )

    # Leads count (lead_submissions table if exists, else events)
    from app.modules.leads.models import LeadSubmission
    leads_30d = (
        db.query(func.count(LeadSubmission.id))
        .filter(LeadSubmission.created_at >= t30d)
        .scalar() or 0
    )
    leads_30d_prev = (
        db.query(func.count(LeadSubmission.id))
        .filter(LeadSubmission.created_at >= t60d, LeadSubmission.created_at < t30d)
        .scalar() or 0
    )

    plan_completions = _count_events_by_name("plan_wizard_completed", t30d, now)
    plan_completions_prev = _count_events_by_name("plan_wizard_completed", t60d, t30d)

    scroll_50 = _count_events_by_name("content_scroll_50", t7d, now)
    scroll_50_prev = _count_events_by_name("content_scroll_50", t14d, t7d)

    def _trend(current: int, prev: int) -> str:
        if current > prev:
            return "up"
        if current < prev:
            return "down"
        return "flat"

    def _delta_pct(current: int, prev: int) -> float:
        if prev == 0:
            return 100.0 if current > 0 else 0.0
        return round((current - prev) / prev * 100, 1)

    sparkline_7d = _dau_sparkline(7)

    tiles = [
        {
            "key": "dau",
            "label": "Daily Active Users",
            "value": dau,
            "delta": dau - dau_prev,
            "delta_pct": _delta_pct(dau, dau_prev),
            "trend": _trend(dau, dau_prev),
            "sparkline": sparkline_7d,
        },
        {
            "key": "wau",
            "label": "Weekly Active Users",
            "value": wau,
            "delta": wau - wau_prev,
            "delta_pct": _delta_pct(wau, wau_prev),
            "trend": _trend(wau, wau_prev),
            "sparkline": sparkline_7d,
        },
        {
            "key": "mau",
            "label": "Monthly Active Users",
            "value": mau,
            "delta": mau - mau_prev,
            "delta_pct": _delta_pct(mau, mau_prev),
            "trend": _trend(mau, mau_prev),
            "sparkline": sparkline_7d,
        },
        {
            "key": "sessions_7d",
            "label": "Sessions (7d)",
            "value": sessions_7d,
            "delta": sessions_7d - sessions_7d_prev,
            "delta_pct": _delta_pct(sessions_7d, sessions_7d_prev),
            "trend": _trend(sessions_7d, sessions_7d_prev),
            "sparkline": sparkline_7d,
        },
        {
            "key": "avg_session_duration",
            "label": "Avg Session Duration (s)",
            "value": int(avg_dur),
            "delta": int(avg_dur - avg_dur_prev),
            "delta_pct": _delta_pct(int(avg_dur), int(avg_dur_prev)),
            "trend": _trend(int(avg_dur), int(avg_dur_prev)),
            "sparkline": sparkline_7d,
        },
        {
            "key": "leads_30d",
            "label": "Total Leads (30d)",
            "value": leads_30d,
            "delta": leads_30d - leads_30d_prev,
            "delta_pct": _delta_pct(leads_30d, leads_30d_prev),
            "trend": _trend(leads_30d, leads_30d_prev),
            "sparkline": sparkline_7d,
        },
        {
            "key": "plan_completions",
            "label": "Plan Completions (30d)",
            "value": plan_completions,
            "delta": plan_completions - plan_completions_prev,
            "delta_pct": _delta_pct(plan_completions, plan_completions_prev),
            "trend": _trend(plan_completions, plan_completions_prev),
            "sparkline": sparkline_7d,
        },
        {
            "key": "scroll_50",
            "label": "Scroll Depth 50%+ (7d)",
            "value": scroll_50,
            "delta": scroll_50 - scroll_50_prev,
            "delta_pct": _delta_pct(scroll_50, scroll_50_prev),
            "trend": _trend(scroll_50, scroll_50_prev),
            "sparkline": sparkline_7d,
        },
    ]
    return {"tiles": tiles}


# ── Step 67: Alerts ────────────────────────────────────────────────────────────

def get_alerts(db: Session) -> Dict[str, Any]:
    alerts = []
    now = datetime.now(timezone.utc)

    # Alert 1: No events in last 2 hours
    last_2h = now - timedelta(hours=2)
    recent_count = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(AnalyticsEvent.created_at >= last_2h, AnalyticsEvent.is_internal == False)
        .scalar() or 0
    )
    if recent_count == 0:
        alerts.append({
            "id": "no_events_2h",
            "severity": "critical",
            "title": "No events in last 2 hours",
            "body": "The analytics pipeline may have stalled. Check SDK integration and API health.",
        })

    # Alert 2: Plan completion rate drop >20% week-on-week
    t7d = now - timedelta(days=7)
    t14d = now - timedelta(days=14)
    completions_this_week = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.event_name == "plan_wizard_completed",
            AnalyticsEvent.created_at >= t7d,
            AnalyticsEvent.is_internal == False,
        )
        .scalar() or 0
    )
    completions_last_week = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.event_name == "plan_wizard_completed",
            AnalyticsEvent.created_at >= t14d,
            AnalyticsEvent.created_at < t7d,
            AnalyticsEvent.is_internal == False,
        )
        .scalar() or 0
    )
    if completions_last_week > 0 and completions_this_week < completions_last_week * 0.8:
        drop_pct = round((completions_last_week - completions_this_week) / completions_last_week * 100)
        alerts.append({
            "id": "plan_completion_drop",
            "severity": "warning",
            "title": f"Plan completion rate dropped {drop_pct}% vs last week",
            "body": "Review the plan wizard UX for potential friction points.",
        })

    # Alert 3: New user spike >50% day-on-day
    t24h = now - timedelta(hours=24)
    t48h = now - timedelta(hours=48)
    new_users_today = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.event_name == "user_signed_up",
            AnalyticsEvent.created_at >= t24h,
            AnalyticsEvent.is_internal == False,
        )
        .scalar() or 0
    )
    new_users_yesterday = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.event_name == "user_signed_up",
            AnalyticsEvent.created_at >= t48h,
            AnalyticsEvent.created_at < t24h,
            AnalyticsEvent.is_internal == False,
        )
        .scalar() or 0
    )
    if new_users_yesterday > 0 and new_users_today > new_users_yesterday * 1.5:
        spike_pct = round((new_users_today - new_users_yesterday) / new_users_yesterday * 100)
        alerts.append({
            "id": "new_user_spike",
            "severity": "info",
            "title": f"New user spike: {spike_pct}% day-on-day growth",
            "body": f"{new_users_today} sign-ups in last 24h vs {new_users_yesterday} the day before. Investigate traffic source.",
        })

    return {"alerts": alerts}


# ── Step 67: Real-time feed ────────────────────────────────────────────────────

def get_realtime_feed(db: Session, exclude_internal: bool = True) -> Dict[str, Any]:
    q = db.query(AnalyticsEvent).order_by(AnalyticsEvent.created_at.desc())
    if exclude_internal:
        q = q.filter(AnalyticsEvent.is_internal == False)
    events = q.limit(50).all()
    return {
        "events": [
            {
                "id": str(e.id),
                "anonymous_id": e.anonymous_id,
                "user_id": str(e.user_id) if e.user_id else None,
                "event_category": e.event_category,
                "event_name": e.event_name,
                "page_url": e.page_url,
                "properties": e.properties,
                "is_internal": e.is_internal,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ]
    }


# ── Step 67: Event Explorer ────────────────────────────────────────────────────

def get_events_explorer(
    db: Session,
    *,
    category: Optional[str] = None,
    event_name: Optional[str] = None,
    anonymous_id: Optional[str] = None,
    user_id: Optional[str] = None,
    page_url_contains: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    exclude_internal: bool = True,
    page: int = 1,
    page_size: int = 50,
) -> Dict[str, Any]:
    q = db.query(AnalyticsEvent)
    if exclude_internal:
        q = q.filter(AnalyticsEvent.is_internal == False)
    if category:
        q = q.filter(AnalyticsEvent.event_category == category)
    if event_name:
        q = q.filter(AnalyticsEvent.event_name == event_name)
    if anonymous_id:
        q = q.filter(AnalyticsEvent.anonymous_id == anonymous_id)
    if user_id:
        try:
            q = q.filter(AnalyticsEvent.user_id == uuid.UUID(user_id))
        except ValueError:
            pass
    if page_url_contains:
        q = q.filter(AnalyticsEvent.page_url.ilike(f"%{page_url_contains}%"))
    if date_from:
        try:
            q = q.filter(AnalyticsEvent.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            q = q.filter(AnalyticsEvent.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass
    total = q.count()
    events = q.order_by(AnalyticsEvent.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "events": [
            {
                "id": str(e.id),
                "anonymous_id": e.anonymous_id,
                "user_id": str(e.user_id) if e.user_id else None,
                "session_id": e.session_id,
                "event_category": e.event_category,
                "event_name": e.event_name,
                "event_value": e.event_value,
                "page_url": e.page_url,
                "page_title": e.page_title,
                "properties": e.properties,
                "device_type": e.device_type,
                "browser": e.browser,
                "country": e.country,
                "is_internal": e.is_internal,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def get_events_export_csv(
    db: Session,
    *,
    category: Optional[str] = None,
    event_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    exclude_internal: bool = True,
) -> str:
    q = db.query(AnalyticsEvent)
    if exclude_internal:
        q = q.filter(AnalyticsEvent.is_internal == False)
    if category:
        q = q.filter(AnalyticsEvent.event_category == category)
    if event_name:
        q = q.filter(AnalyticsEvent.event_name == event_name)
    if date_from:
        try:
            q = q.filter(AnalyticsEvent.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            q = q.filter(AnalyticsEvent.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass
    events = q.order_by(AnalyticsEvent.created_at.desc()).limit(10000).all()

    import csv, io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "anonymous_id", "user_id", "event_category", "event_name", "page_url", "properties", "created_at"])
    for ev in events:
        import json
        writer.writerow([
            str(ev.id), ev.anonymous_id, str(ev.user_id) if ev.user_id else "",
            ev.event_category, ev.event_name, ev.page_url or "",
            json.dumps(ev.properties), ev.created_at.isoformat(),
        ])
    return output.getvalue()


# ── Step 67: Funnel templates ──────────────────────────────────────────────────

FUNNEL_TEMPLATES = [
    {
        "id": "discovery_to_plan",
        "name": "Discovery → Plan",
        "description": "Full conversion funnel from first page view to plan completion",
        "steps": [
            {"event_name": "page_view"},
            {"event_name": "trek_view"},
            {"event_name": "trek_plan_cta_clicked"},
            {"event_name": "plan_wizard_completed"},
        ],
    },
    {
        "id": "search_to_trek_view",
        "name": "Search → Trek View",
        "description": "Search-intent to trek detail engagement funnel",
        "steps": [
            {"event_name": "trek_search"},
            {"event_name": "search_result_clicked"},
            {"event_name": "trek_view"},
        ],
    },
    {
        "id": "trek_view_to_save",
        "name": "Trek View → Save",
        "description": "Content engagement to bookmarking funnel",
        "steps": [
            {"event_name": "trek_view"},
            {"event_name": "trek_saved"},
        ],
    },
    {
        "id": "trek_view_to_lead",
        "name": "Trek View → Lead",
        "description": "Trek detail to lead submission conversion funnel",
        "steps": [
            {"event_name": "trek_view"},
            {"event_name": "trek_plan_cta_clicked"},
            {"event_name": "lead_submitted"},
        ],
    },
    {
        "id": "new_user_activation",
        "name": "New User Activation",
        "description": "Post-signup to first meaningful engagement",
        "steps": [
            {"event_name": "user_signed_up"},
            {"event_name": "trek_view"},
            {"event_name": "trek_saved"},
        ],
    },
    {
        "id": "content_engagement",
        "name": "Content Engagement",
        "description": "Content read-through funnel with recommendation click",
        "steps": [
            {"event_name": "page_view"},
            {"event_name": "content_scroll_50"},
            {"event_name": "content_scroll_100"},
            {"event_name": "recommendation_clicked"},
        ],
    },
]


def get_funnel_templates() -> Dict[str, Any]:
    return {"templates": FUNNEL_TEMPLATES}


# ── Step 67: Custom cohort ─────────────────────────────────────────────────────

def get_custom_cohort(
    db: Session,
    cohort_event: str = "session_started",
    retention_event: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    max_weeks: int = 9,
) -> Dict[str, Any]:
    # Build date filters
    date_from_dt = datetime.fromisoformat(date_from) if date_from else datetime.now(timezone.utc) - timedelta(weeks=12)
    date_to_dt = datetime.fromisoformat(date_to) if date_to else datetime.now(timezone.utc)

    if cohort_event == "session_started":
        # Use session-based cohort (same as existing get_cohort_heatmap logic)
        return get_cohort_heatmap(db, max_weeks=max_weeks)

    # Event-based cohort: find first occurrence of cohort_event per user
    week_columns = [f"COUNT(DISTINCT CASE WHEN week_offset >= {w} AND week_offset < {w+1} THEN anonymous_id END) AS w{w}" for w in range(max_weeks)]
    week_select = ",\n".join(week_columns)

    ret_filter = f"AND event_name = '{retention_event}'" if retention_event else ""

    sql = text(f"""
        WITH cohort_base AS (
            SELECT anonymous_id,
                   date_trunc('week', MIN(created_at))::date AS cohort_week
            FROM analytics_events
            WHERE event_name = :cohort_event
              AND created_at BETWEEN :date_from AND :date_to
              AND is_internal = false
            GROUP BY anonymous_id
        ),
        all_events AS (
            SELECT ae.anonymous_id, cb.cohort_week,
                   EXTRACT(EPOCH FROM (date_trunc('week', ae.created_at) - cb.cohort_week)) / 604800 AS week_offset
            FROM analytics_events ae
            JOIN cohort_base cb ON ae.anonymous_id = cb.anonymous_id
            WHERE ae.created_at BETWEEN :date_from AND :date_to
              AND ae.is_internal = false
              {ret_filter}
        ),
        retention AS (
            SELECT cohort_week,
                   COUNT(DISTINCT anonymous_id) AS total_users,
                   {week_select}
            FROM all_events GROUP BY cohort_week
        )
        SELECT * FROM retention ORDER BY cohort_week DESC LIMIT 12
    """)

    try:
        result = db.execute(sql, {"cohort_event": cohort_event, "date_from": date_from_dt, "date_to": date_to_dt})
        rows_raw = result.fetchall()
    except Exception:
        return {"rows": [], "max_weeks": max_weeks}

    rows = []
    for row in rows_raw:
        row_dict = row._mapping
        total = row_dict.get("total_users", 0) or 0
        retention_cells = []
        for w in range(max_weeks):
            users = row_dict.get(f"w{w}", 0) or 0
            pct = round(users / total * 100, 1) if total > 0 else 0.0
            retention_cells.append({"week": w, "users": users, "pct": pct})
        rows.append({
            "cohort_week": str(row_dict.get("cohort_week", "")),
            "total_users": total,
            "retention": retention_cells,
        })

    return {"rows": rows, "max_weeks": max_weeks}


# ── Step 67: Custom segment CRUD ──────────────────────────────────────────────

def list_custom_segments(db: Session) -> Dict[str, Any]:
    segs = db.query(CustomSegment).order_by(CustomSegment.created_at.desc()).all()
    return {"segments": segs, "total": len(segs)}


def create_custom_segment(db: Session, segment_in: CustomSegmentIn) -> CustomSegment:
    seg = CustomSegment(
        name=segment_in.name,
        description=segment_in.description,
        conditions=[c.model_dump() for c in segment_in.conditions],
    )
    db.add(seg)
    db.commit()
    db.refresh(seg)
    return seg


def preview_segment(db: Session, conditions: List[SegmentCondition]) -> Dict[str, Any]:
    import time
    start = time.time()
    now = datetime.now(timezone.utc)
    cutoff_90d = now - timedelta(days=90)

    # Build a set of matching anonymous_ids from the first condition, then intersect
    result_ids: Optional[set] = None

    for cond in conditions:
        cond_ids: set = set()
        try:
            if cond.type == "event_count":
                time_window = now - timedelta(days=cond.time_window_days or 30)
                cutoff = max(time_window, cutoff_90d)
                op = cond.operator
                val = int(cond.value or 1)
                rows = db.execute(
                    text("""
                        SELECT anonymous_id FROM analytics_events
                        WHERE event_name = :en AND created_at >= :cutoff AND is_internal = false
                        GROUP BY anonymous_id
                        HAVING COUNT(*) >= :min_c
                    """),
                    {"en": cond.event_name or "", "cutoff": cutoff, "min_c": val},
                ).fetchall()
                cond_ids = {r[0] for r in rows}

            elif cond.type == "event_property":
                time_window = now - timedelta(days=cond.time_window_days or 30)
                cutoff = max(time_window, cutoff_90d)
                rows = db.execute(
                    text("""
                        SELECT DISTINCT anonymous_id FROM analytics_events
                        WHERE event_name = :en
                          AND created_at >= :cutoff
                          AND is_internal = false
                          AND properties->>:key = :val
                    """),
                    {"en": cond.event_name or "", "cutoff": cutoff, "key": cond.property_key or "", "val": cond.property_value or ""},
                ).fetchall()
                cond_ids = {r[0] for r in rows}

            elif cond.type == "inactivity":
                days = int(cond.value or 14)
                cutoff = now - timedelta(days=days)
                rows = db.execute(
                    text("""
                        SELECT anonymous_id FROM analytics_events
                        WHERE is_internal = false
                        GROUP BY anonymous_id
                        HAVING MAX(created_at) < :cutoff
                    """),
                    {"cutoff": cutoff},
                ).fetchall()
                cond_ids = {r[0] for r in rows}

            elif cond.type == "trait":
                # Approximate: count user_traits rows
                count = db.query(func.count(UserTrait.id)).scalar() or 0
                elapsed = int((time.time() - start) * 1000)
                return {"estimated_count": min(count, 100), "evaluated_in_ms": elapsed}

        except Exception:
            cond_ids = set()

        if result_ids is None:
            result_ids = cond_ids
        else:
            result_ids = result_ids & cond_ids

    elapsed = int((time.time() - start) * 1000)
    count = len(result_ids) if result_ids is not None else 0
    return {"estimated_count": count, "evaluated_in_ms": elapsed}


def export_segment_csv(db: Session, segment_id: str) -> str:
    seg = db.query(CustomSegment).filter(CustomSegment.id == uuid.UUID(segment_id)).first()
    if not seg:
        return ""

    conditions = [SegmentCondition(**c) if isinstance(c, dict) else c for c in (seg.conditions or [])]
    preview = preview_segment(db, conditions)

    # Get matching anonymous_ids
    import csv, io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["anonymous_id", "user_id", "email", "total_events", "last_seen"])

    # Pull trait data for users in this segment
    traits = db.query(UserTrait).limit(5000).all()
    for t in traits:
        user_email = None
        if t.user_id:
            user = db.query(User).filter(User.id == t.user_id).first()
            user_email = user.email if user else None
        writer.writerow([
            t.anonymous_id or "",
            str(t.user_id) if t.user_id else "",
            user_email or "",
            t.total_events,
            t.last_seen_at.isoformat() if t.last_seen_at else "",
        ])
    return output.getvalue()


# ── Step 67: Content analytics ─────────────────────────────────────────────────

def get_content_pages_analytics(
    db: Session,
    sort_by: str = "views_30d",
    page_type: Optional[str] = None,
) -> Dict[str, Any]:
    from app.modules.cms.models import CMSPage
    now = datetime.now(timezone.utc)
    t7d = now - timedelta(days=7)
    t30d = now - timedelta(days=30)

    # Get published CMS pages
    q = db.query(CMSPage).filter(CMSPage.status == "published")
    if page_type:
        q = q.filter(CMSPage.page_type == page_type)
    cms_pages = q.all()

    rows = []
    for page in cms_pages:
        slug = page.slug or ""
        # Count page_view events matching this slug
        def count_event(event_nm: str, since: datetime) -> int:
            return (
                db.query(func.count(AnalyticsEvent.id))
                .filter(
                    AnalyticsEvent.event_name == event_nm,
                    AnalyticsEvent.created_at >= since,
                    AnalyticsEvent.page_url.ilike(f"%{slug}%"),
                    AnalyticsEvent.is_internal == False,
                )
                .scalar() or 0
            )
        v7 = count_event("page_view", t7d)
        v30 = count_event("page_view", t30d)
        s50 = count_event("content_scroll_50", t30d)
        s100 = count_event("content_scroll_100", t30d)
        leads = count_event("lead_submitted", t30d)
        rows.append({
            "slug": slug,
            "title": page.title or slug,
            "page_type": page.page_type or "",
            "views_7d": v7,
            "views_30d": v30,
            "scroll_50_count": s50,
            "scroll_100_count": s100,
            "leads": leads,
            "published_at": page.updated_at.isoformat() if page.updated_at else None,
        })

    # Sort
    reverse = True
    rows.sort(key=lambda r: r.get(sort_by, 0), reverse=reverse)
    return {"pages": rows, "total": len(rows)}


def get_trek_analytics(db: Session) -> Dict[str, Any]:
    from app.modules.cms.models import CMSPage
    now = datetime.now(timezone.utc)
    t30d = now - timedelta(days=30)

    trek_pages = db.query(CMSPage).filter(
        CMSPage.status == "published",
        CMSPage.page_type.in_(["trek_guide", "trek"]),
    ).all()

    rows = []
    for page in trek_pages:
        slug = page.slug or ""

        def count_ev(name: str) -> int:
            return (
                db.query(func.count(AnalyticsEvent.id))
                .filter(
                    AnalyticsEvent.event_name == name,
                    AnalyticsEvent.created_at >= t30d,
                    AnalyticsEvent.properties["trek_slug"].as_string() == slug,
                    AnalyticsEvent.is_internal == False,
                )
                .scalar() or 0
            )

        # Fallback: count by page_url if properties lookup returns 0
        def count_by_url(name: str) -> int:
            return (
                db.query(func.count(AnalyticsEvent.id))
                .filter(
                    AnalyticsEvent.event_name == name,
                    AnalyticsEvent.created_at >= t30d,
                    AnalyticsEvent.page_url.ilike(f"%{slug}%"),
                    AnalyticsEvent.is_internal == False,
                )
                .scalar() or 0
            )

        views = count_by_url("trek_view") or count_by_url("page_view")
        plan_ctas = count_by_url("trek_plan_cta_clicked")
        completions = count_ev("plan_wizard_completed")
        saves = count_by_url("trek_saved")
        conv_rate = round(completions / views * 100, 2) if views > 0 else 0.0

        rows.append({
            "trek_slug": slug,
            "trek_name": page.title or slug,
            "views_30d": views,
            "plan_cta_clicks": plan_ctas,
            "plan_completions": completions,
            "save_count": saves,
            "conversion_rate": conv_rate,
        })

    rows.sort(key=lambda r: r["conversion_rate"], reverse=True)
    return {"treks": rows, "total": len(rows)}


# ── Step 67: Webhook rules CRUD ────────────────────────────────────────────────

def list_webhook_rules(db: Session) -> Dict[str, Any]:
    rules = db.query(CdpWebhookRule).order_by(CdpWebhookRule.created_at.desc()).all()
    return {"rules": rules, "total": len(rules)}


def create_webhook_rule(db: Session, rule_in: WebhookRuleIn) -> CdpWebhookRule:
    rule = CdpWebhookRule(
        name=rule_in.name,
        trigger_event=rule_in.trigger_event,
        condition=rule_in.condition,
        webhook_url=rule_in.webhook_url,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def delete_webhook_rule(db: Session, rule_id: str) -> bool:
    rule = db.query(CdpWebhookRule).filter(CdpWebhookRule.id == uuid.UUID(rule_id)).first()
    if not rule:
        return False
    db.delete(rule)
    db.commit()
    return True


# ── Step 67: Suppressions ──────────────────────────────────────────────────────

def get_suppressions(db: Session) -> Dict[str, Any]:
    # Users with suppressed custom trait
    traits = (
        db.query(UserTrait)
        .filter(UserTrait.custom_traits["suppressed"].as_boolean() == True)
        .all()
    )
    users_out = []
    for t in traits:
        user = None
        if t.user_id:
            user = db.query(User).filter(User.id == t.user_id).first()
        users_out.append({
            "user_id": t.user_id,
            "email": user.email if user else None,
            "full_name": user.full_name if user else None,
            "suppressed_at": t.updated_at,
        })
    return {"users": users_out, "total": len(users_out)}


def suppress_user(db: Session, user_id: uuid.UUID) -> bool:
    trait = db.query(UserTrait).filter(UserTrait.user_id == user_id).first()
    if not trait:
        return False
    custom = dict(trait.custom_traits or {})
    custom["suppressed"] = True
    trait.custom_traits = custom
    db.commit()
    return True


# ── Step 67: Event definitions ─────────────────────────────────────────────────

def get_event_definitions(db: Session) -> Dict[str, Any]:
    defs = db.query(EventDefinition).filter(EventDefinition.is_active == True).order_by(EventDefinition.event_category, EventDefinition.event_name).all()
    return {"events": defs, "total": len(defs)}
