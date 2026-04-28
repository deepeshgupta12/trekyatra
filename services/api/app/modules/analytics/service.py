from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.analytics.models import AffiliateClick
from app.modules.leads.models import LeadSubmission
from app.modules.linking.models import Page
from app.modules.newsletter.models import NewsletterSubscriber
from app.modules.pipeline.models import PipelineRun
from app.modules.agents.models import AgentRun
from app.schemas.analytics import AffiliateClickCreate, AnalyticsSummaryResponse


def track_affiliate_click(db: Session, payload: AffiliateClickCreate, user_agent: str | None = None) -> AffiliateClick:
    now = datetime.now(timezone.utc)
    click = AffiliateClick(
        id=uuid.uuid4(),
        page_slug=payload.page_slug,
        affiliate_program=payload.affiliate_program,
        affiliate_link_url=payload.affiliate_link_url,
        session_id=payload.session_id,
        clicked_at=now,
        created_at=now,
        user_agent=user_agent,
    )
    db.add(click)
    db.commit()
    db.refresh(click)
    return click


def get_analytics_summary(db: Session) -> AnalyticsSummaryResponse:
    cutoff_30d = datetime.now(timezone.utc) - timedelta(days=30)

    leads_last_30d = db.scalar(
        select(func.count(LeadSubmission.id)).where(LeadSubmission.created_at >= cutoff_30d)
    ) or 0

    affiliate_clicks_last_30d = db.scalar(
        select(func.count(AffiliateClick.id)).where(AffiliateClick.clicked_at >= cutoff_30d)
    ) or 0

    newsletter_subscribers_total = db.scalar(select(func.count(NewsletterSubscriber.id))) or 0

    pages_published_total = db.scalar(
        select(func.count(Page.id))
    ) or 0

    pipeline_runs_last_30d = db.scalar(
        select(func.count(PipelineRun.id)).where(PipelineRun.created_at >= cutoff_30d)
    ) or 0

    agent_runs_last_30d = db.scalar(
        select(func.count(AgentRun.id)).where(AgentRun.created_at >= cutoff_30d)
    ) or 0

    return AnalyticsSummaryResponse(
        leads_last_30d=leads_last_30d,
        affiliate_clicks_last_30d=affiliate_clicks_last_30d,
        newsletter_subscribers_total=newsletter_subscribers_total,
        pages_published_total=pages_published_total,
        pipeline_runs_last_30d=pipeline_runs_last_30d,
        agent_runs_last_30d=agent_runs_last_30d,
    )
