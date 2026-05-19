from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.analytics.service import get_analytics_summary, track_affiliate_click
from app.modules.auth.dependencies import get_current_admin
from app.modules.search import service as search_service
from app.schemas.analytics import AffiliateClickCreate, AffiliateClickResponse, AnalyticsSummaryResponse

public_router = APIRouter(prefix="/track", tags=["analytics"])
admin_router = APIRouter(prefix="/admin/analytics", tags=["analytics"], dependencies=[Depends(get_current_admin)])


class PageViewRequest(BaseModel):
    page_slug: str
    page_type: str | None = None
    session_id: str | None = None


@public_router.post("/affiliate-click", response_model=AffiliateClickResponse, status_code=201)
def record_affiliate_click(
    body: AffiliateClickCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> AffiliateClickResponse:
    ua = request.headers.get("user-agent")
    click = track_affiliate_click(db, payload=body, user_agent=ua)
    return AffiliateClickResponse.model_validate(click)


@public_router.post("/page-view", status_code=204)
def record_page_view(
    body: PageViewRequest,
    db: Session = Depends(get_db),
) -> None:
    """Fire-and-forget page view tracking for popularity signals."""
    if not body.page_slug.strip():
        return
    search_service.record_page_view(
        db,
        page_slug=body.page_slug,
        page_type=body.page_type,
        session_id=body.session_id,
    )


@admin_router.get("/summary", response_model=AnalyticsSummaryResponse)
def analytics_summary(db: Session = Depends(get_db)) -> AnalyticsSummaryResponse:
    return get_analytics_summary(db)
