from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_current_admin
from app.db.session import get_db
from app.modules.newsletter import service as newsletter_service
from app.modules.newsletter.models import NewsletterCampaign
from app.schemas.newsletter import (
    GenerateCampaignResponse,
    NewsletterCampaignResponse,
    RepurposeResponse,
    SendCampaignResponse,
    SocialSnippetResponse,
)

router = APIRouter(prefix="/admin/newsletter", tags=["newsletter-admin"])


def _campaign_to_response(c: NewsletterCampaign) -> NewsletterCampaignResponse:
    return NewsletterCampaignResponse(
        id=c.id,
        week_label=c.week_label,
        subject=c.subject,
        preview_text=c.preview_text,
        body_html=c.body_html,
        status=c.status,
        sent_at=c.sent_at,
        created_at=c.created_at,
    )


@router.post("/generate", response_model=GenerateCampaignResponse)
def generate_newsletter(
    _: Annotated[dict, Depends(get_current_admin)],
    db: Session = Depends(get_db),
) -> GenerateCampaignResponse:
    from app.modules.agents.newsletter.agent import NewsletterAgent
    agent = NewsletterAgent(db=db)
    result = agent.run(input_data={})

    if result.get("errors"):
        raise HTTPException(status_code=400, detail=result["errors"][0])

    out = result.get("output", {})
    campaign_id = out.get("campaign_id")
    if not campaign_id:
        raise HTTPException(status_code=500, detail="Newsletter generation failed")

    return GenerateCampaignResponse(
        campaign_id=uuid.UUID(campaign_id),
        week_label=out.get("week_label", ""),
        subject=out.get("newsletter", {}).get("subject", ""),
        message="Newsletter campaign draft created successfully",
    )


@router.get("", response_model=list[NewsletterCampaignResponse])
def list_campaigns(
    _: Annotated[dict, Depends(get_current_admin)],
    db: Session = Depends(get_db),
    status: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[NewsletterCampaignResponse]:
    campaigns = newsletter_service.list_campaigns(db, status=status, limit=limit)
    return [_campaign_to_response(c) for c in campaigns]


@router.get("/{campaign_id}", response_model=NewsletterCampaignResponse)
def get_campaign(
    campaign_id: uuid.UUID,
    _: Annotated[dict, Depends(get_current_admin)],
    db: Session = Depends(get_db),
) -> NewsletterCampaignResponse:
    campaign = newsletter_service.get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return _campaign_to_response(campaign)


@router.post("/{campaign_id}/send", response_model=SendCampaignResponse)
def send_campaign(
    campaign_id: uuid.UUID,
    _: Annotated[dict, Depends(get_current_admin)],
    db: Session = Depends(get_db),
) -> SendCampaignResponse:
    campaign = newsletter_service.get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status == "sent":
        raise HTTPException(status_code=409, detail="Campaign already sent")

    result = newsletter_service.send_campaign(db, campaign_id)
    if not result.get("sent"):
        raise HTTPException(status_code=400, detail=result.get("reason", "Send failed"))

    return SendCampaignResponse(
        campaign_id=campaign_id,
        status="sent",
        message=f"Campaign sent via {result.get('platform', 'configured platform')}",
    )


@router.get("/snippets/list", response_model=list[SocialSnippetResponse])
def list_snippets(
    _: Annotated[dict, Depends(get_current_admin)],
    db: Session = Depends(get_db),
    platform: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[SocialSnippetResponse]:
    snippets = newsletter_service.list_snippets(db, platform=platform, limit=limit)
    return [
        SocialSnippetResponse(
            id=s.id,
            page_id=s.page_id,
            platform=s.platform,
            copy=s.copy,
            copy_title=s.copy_title,
            status=s.status,
            created_at=s.created_at,
        )
        for s in snippets
    ]


# Pages-namespaced route for repurposing
pages_router = APIRouter(prefix="/admin/pages", tags=["newsletter-admin"])


@pages_router.post("/{slug}/repurpose", response_model=RepurposeResponse)
def repurpose_page(
    slug: str,
    _: Annotated[dict, Depends(get_current_admin)],
    db: Session = Depends(get_db),
) -> RepurposeResponse:
    from app.modules.agents.social_repurpose.agent import SocialRepurposeAgent
    agent = SocialRepurposeAgent(db=db, page_slug=slug)
    result = agent.run(input_data={"slug": slug})

    if result.get("errors"):
        raise HTTPException(status_code=400, detail=result["errors"][0])

    snippet_ids_raw = result.get("output", {}).get("snippet_ids", [])
    return RepurposeResponse(
        page_slug=slug,
        snippets_created=len(snippet_ids_raw),
        snippet_ids=[uuid.UUID(s) for s in snippet_ids_raw],
    )
