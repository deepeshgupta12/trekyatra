from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.admin.service import (
    summarize_briefs,
    summarize_clusters,
    summarize_dashboard,
    summarize_drafts,
    summarize_system,
    summarize_topics,
)
from app.schemas.admin import (
    CountSummary,
    DashboardSummaryResponse,
    SystemSummaryResponse,
    TopicSummary,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_admin_dashboard_summary(
    db: Session = Depends(get_db),
) -> DashboardSummaryResponse:
    return summarize_dashboard(db)


@router.get("/topics/summary", response_model=TopicSummary)
def get_admin_topics_summary(
    db: Session = Depends(get_db),
) -> TopicSummary:
    return summarize_topics(db)


@router.get("/clusters/summary", response_model=CountSummary)
def get_admin_clusters_summary(
    db: Session = Depends(get_db),
) -> CountSummary:
    return summarize_clusters(db)


@router.get("/briefs/summary", response_model=CountSummary)
def get_admin_briefs_summary(
    db: Session = Depends(get_db),
) -> CountSummary:
    return summarize_briefs(db)


@router.get("/drafts/summary", response_model=CountSummary)
def get_admin_drafts_summary(
    db: Session = Depends(get_db),
) -> CountSummary:
    return summarize_drafts(db)


@router.get("/system/summary", response_model=SystemSummaryResponse)
def get_admin_system_summary(
    db: Session = Depends(get_db),
) -> SystemSummaryResponse:
    return summarize_system(db)