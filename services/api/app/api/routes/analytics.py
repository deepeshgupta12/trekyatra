from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.analytics.service import get_analytics_summary, track_affiliate_click
from app.modules.auth.dependencies import get_current_admin
from app.schemas.analytics import AffiliateClickCreate, AffiliateClickResponse, AnalyticsSummaryResponse

public_router = APIRouter(prefix="/track", tags=["analytics"])
admin_router = APIRouter(prefix="/admin/analytics", tags=["analytics"], dependencies=[Depends(get_current_admin)])


@public_router.post("/affiliate-click", response_model=AffiliateClickResponse, status_code=201)
def record_affiliate_click(
    body: AffiliateClickCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> AffiliateClickResponse:
    ua = request.headers.get("user-agent")
    click = track_affiliate_click(db, payload=body, user_agent=ua)
    return AffiliateClickResponse.model_validate(click)


@admin_router.get("/summary", response_model=AnalyticsSummaryResponse)
def analytics_summary(db: Session = Depends(get_db)) -> AnalyticsSummaryResponse:
    return get_analytics_summary(db)
