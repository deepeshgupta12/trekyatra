from __future__ import annotations
import logging
from datetime import date, timedelta
from uuid import UUID
from sqlalchemy import select, func, cast, Float
from sqlalchemy.orm import Session

from app.modules.revenue.models import RevenueAttribution, RevenueConfig, ExecutiveSummary
from app.modules.linking.models import Page
from app.modules.analytics.models import AffiliateClick
from app.modules.leads.models import LeadSubmission
from app.modules.content.models import KeywordCluster

logger = logging.getLogger(__name__)

DEFAULT_CONFIG = {
    "avg_cpc_inr": 3.0,
    "lead_value_inr": 500.0,
}


def _ensure_config(db: Session) -> dict[str, float]:
    out: dict[str, float] = {}
    for key, default in DEFAULT_CONFIG.items():
        row = db.scalar(select(RevenueConfig).where(RevenueConfig.key == key))
        if row is None:
            row = RevenueConfig(key=key, value_float=default)
            db.add(row)
            db.commit()
            db.refresh(row)
        out[key] = row.value_float
    return out


def get_config(db: Session) -> list[RevenueConfig]:
    return list(db.scalars(select(RevenueConfig).order_by(RevenueConfig.key)).all())


def get_config_by_key(db: Session, key: str) -> RevenueConfig | None:
    return db.scalar(select(RevenueConfig).where(RevenueConfig.key == key))


def update_config(db: Session, key: str, value_float: float) -> RevenueConfig:
    row = db.scalar(select(RevenueConfig).where(RevenueConfig.key == key))
    if row is None:
        row = RevenueConfig(key=key, value_float=value_float)
        db.add(row)
    else:
        row.value_float = value_float
    db.commit()
    db.refresh(row)
    return row


def aggregate_revenue(db: Session, period_start: date, period_end: date) -> int:
    cfg = _ensure_config(db)
    avg_cpc = cfg["avg_cpc_inr"]
    lead_val = cfg["lead_value_inr"]

    pages = list(db.scalars(select(Page)).all())
    count = 0
    for page in pages:
        d = period_start
        while d <= period_end:
            clicks = db.scalar(
                select(func.count()).select_from(AffiliateClick).where(
                    func.date(AffiliateClick.clicked_at) == d,
                    AffiliateClick.page_slug == page.slug,
                )
            ) or 0
            leads = db.scalar(
                select(func.count()).select_from(LeadSubmission).where(
                    func.date(LeadSubmission.created_at) == d,
                )
            ) or 0
            rev = (clicks * avg_cpc) + (leads * lead_val)

            existing = db.scalar(
                select(RevenueAttribution).where(
                    RevenueAttribution.page_id == page.id,
                    RevenueAttribution.date == d,
                )
            )
            if existing:
                existing.affiliate_clicks = clicks
                existing.lead_conversions = leads
                existing.estimated_revenue_inr = rev
                existing.page_type = page.page_type
                existing.cluster_id = page.cluster_id
            else:
                db.add(RevenueAttribution(
                    page_id=page.id,
                    date=d,
                    affiliate_clicks=clicks,
                    lead_conversions=leads,
                    estimated_revenue_inr=rev,
                    page_type=page.page_type,
                    cluster_id=page.cluster_id,
                ))
            count += 1
            d += timedelta(days=1)
    db.commit()
    return count


def revenue_by_cluster(db: Session) -> list[dict]:
    rows = db.execute(
        select(
            RevenueAttribution.cluster_id,
            KeywordCluster.name.label("cluster_name"),
            func.sum(RevenueAttribution.estimated_revenue_inr).label("total_revenue_inr"),
            func.sum(RevenueAttribution.affiliate_clicks).label("total_clicks"),
            func.sum(RevenueAttribution.lead_conversions).label("total_leads"),
        )
        .outerjoin(KeywordCluster, KeywordCluster.id == RevenueAttribution.cluster_id)
        .group_by(RevenueAttribution.cluster_id, KeywordCluster.name)
        .order_by(func.sum(RevenueAttribution.estimated_revenue_inr).desc())
    ).all()
    return [
        {
            "cluster_id": r.cluster_id,
            "cluster_name": r.cluster_name,
            "total_revenue_inr": float(r.total_revenue_inr or 0),
            "total_clicks": int(r.total_clicks or 0),
            "total_leads": int(r.total_leads or 0),
        }
        for r in rows
    ]


def revenue_by_page_type(db: Session) -> list[dict]:
    rows = db.execute(
        select(
            RevenueAttribution.page_type,
            func.sum(RevenueAttribution.estimated_revenue_inr).label("total_revenue_inr"),
            func.sum(RevenueAttribution.affiliate_clicks).label("total_clicks"),
            func.sum(RevenueAttribution.lead_conversions).label("total_leads"),
        )
        .group_by(RevenueAttribution.page_type)
        .order_by(func.sum(RevenueAttribution.estimated_revenue_inr).desc())
    ).all()
    return [
        {
            "page_type": r.page_type,
            "total_revenue_inr": float(r.total_revenue_inr or 0),
            "total_clicks": int(r.total_clicks or 0),
            "total_leads": int(r.total_leads or 0),
        }
        for r in rows
    ]


def decaying_pages(db: Session) -> list[dict]:
    today = date.today()
    last7_start = today - timedelta(days=7)
    prev7_start = today - timedelta(days=14)

    pages = list(db.scalars(select(Page)).all())
    result = []
    for page in pages:
        clicks_last = db.scalar(
            select(func.sum(RevenueAttribution.affiliate_clicks)).where(
                RevenueAttribution.page_id == page.id,
                RevenueAttribution.date >= last7_start,
                RevenueAttribution.date < today,
            )
        ) or 0
        clicks_prev = db.scalar(
            select(func.sum(RevenueAttribution.affiliate_clicks)).where(
                RevenueAttribution.page_id == page.id,
                RevenueAttribution.date >= prev7_start,
                RevenueAttribution.date < last7_start,
            )
        ) or 0
        if clicks_prev > 0 and clicks_last < clicks_prev:
            decay_pct = round((clicks_prev - clicks_last) / clicks_prev * 100, 1)
            result.append({
                "page_id": page.id,
                "page_type": page.page_type,
                "affiliate_clicks_last_7": int(clicks_last),
                "affiliate_clicks_prev_7": int(clicks_prev),
                "decay_pct": decay_pct,
            })
    result.sort(key=lambda x: x["decay_pct"], reverse=True)
    return result


def list_executive_summaries(db: Session) -> list[ExecutiveSummary]:
    return list(db.scalars(select(ExecutiveSummary).order_by(ExecutiveSummary.created_at.desc())).all())


def get_executive_summary(db: Session, week_label: str) -> ExecutiveSummary | None:
    return db.scalar(select(ExecutiveSummary).where(ExecutiveSummary.week_label == week_label))


def upsert_executive_summary(db: Session, week_label: str, content_md: str) -> ExecutiveSummary:
    row = get_executive_summary(db, week_label)
    if row is None:
        row = ExecutiveSummary(week_label=week_label, content_md=content_md)
        db.add(row)
    else:
        row.content_md = content_md
    db.commit()
    db.refresh(row)
    return row
