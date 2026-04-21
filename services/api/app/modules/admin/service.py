from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.content.models import (
    ContentBrief,
    ContentDraft,
    KeywordCluster,
    TopicOpportunity,
)
from app.schemas.admin import (
    CountSummary,
    DashboardSummaryResponse,
    SystemSummaryResponse,
    TopicSummary,
    WordPressConfigSummary,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _recent_threshold(days: int = 7) -> datetime:
    return _utc_now() - timedelta(days=days)


def _count_total(db: Session, model: type) -> int:
    statement = select(func.count()).select_from(model)
    return int(db.scalar(statement) or 0)


def _count_recent(db: Session, model: type, days: int = 7) -> int:
    statement = (
        select(func.count())
        .select_from(model)
        .where(model.created_at >= _recent_threshold(days))
    )
    return int(db.scalar(statement) or 0)


def _latest_created_at(db: Session, model: type) -> datetime | None:
    statement = select(func.max(model.created_at)).select_from(model)
    return db.scalar(statement)


def _status_breakdown(db: Session, model: type) -> dict[str, int]:
    statement = (
        select(model.status, func.count())
        .select_from(model)
        .group_by(model.status)
        .order_by(model.status.asc())
    )
    rows = db.execute(statement).all()
    return {
        str(status or "unknown"): int(count)
        for status, count in rows
    }


def _topic_source_breakdown(db: Session) -> dict[str, int]:
    statement = (
        select(TopicOpportunity.source, func.count())
        .select_from(TopicOpportunity)
        .group_by(TopicOpportunity.source)
        .order_by(TopicOpportunity.source.asc())
    )
    rows = db.execute(statement).all()
    return {
        str(source or "unknown"): int(count)
        for source, count in rows
    }


def summarize_topics(db: Session) -> TopicSummary:
    return TopicSummary(
        total=_count_total(db, TopicOpportunity),
        by_status=_status_breakdown(db, TopicOpportunity),
        by_source=_topic_source_breakdown(db),
        recent_count=_count_recent(db, TopicOpportunity),
        latest_created_at=_latest_created_at(db, TopicOpportunity),
    )


def summarize_clusters(db: Session) -> CountSummary:
    return CountSummary(
        total=_count_total(db, KeywordCluster),
        by_status=_status_breakdown(db, KeywordCluster),
        recent_count=_count_recent(db, KeywordCluster),
        latest_created_at=_latest_created_at(db, KeywordCluster),
    )


def summarize_briefs(db: Session) -> CountSummary:
    return CountSummary(
        total=_count_total(db, ContentBrief),
        by_status=_status_breakdown(db, ContentBrief),
        recent_count=_count_recent(db, ContentBrief),
        latest_created_at=_latest_created_at(db, ContentBrief),
    )


def summarize_drafts(db: Session) -> CountSummary:
    return CountSummary(
        total=_count_total(db, ContentDraft),
        by_status=_status_breakdown(db, ContentDraft),
        recent_count=_count_recent(db, ContentDraft),
        latest_created_at=_latest_created_at(db, ContentDraft),
    )


def summarize_wordpress_config() -> WordPressConfigSummary:
    return WordPressConfigSummary(
        base_url=settings.wordpress_base_url,
        rest_api_base_url=settings.wordpress_rest_base_url,
        credentials_configured=settings.wordpress_credentials_configured,
        timeout_seconds=settings.wordpress_timeout_seconds,
        verify_ssl=settings.wordpress_verify_ssl,
    )


def summarize_system(db: Session) -> SystemSummaryResponse:
    database_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        database_status = "error"

    return SystemSummaryResponse(
        api_status="ok",
        database_status=database_status,
        environment=settings.app_env,
        wordpress=summarize_wordpress_config(),
        generated_at=_utc_now(),
    )


def summarize_dashboard(db: Session) -> DashboardSummaryResponse:
    return DashboardSummaryResponse(
        topics=summarize_topics(db),
        clusters=summarize_clusters(db),
        briefs=summarize_briefs(db),
        drafts=summarize_drafts(db),
        wordpress=summarize_wordpress_config(),
        generated_at=_utc_now(),
    )