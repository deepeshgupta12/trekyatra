from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_current_admin
from app.db.session import get_db
from app.modules.cms.models import CMSPage
from app.modules.agents.seasonal_content.agent import SeasonalContentAgent, SEASON_META
from app.schemas.hubs import (
    HUB_PAGE_TYPES,
    HubPageResponse,
    HubRegenerateRequest,
    HubRegenerateResponse,
)

router = APIRouter(
    prefix="/admin/hubs",
    tags=["hubs"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[HubPageResponse])
def list_hubs(
    hub_type: str | None = None,
    db: Session = Depends(get_db),
) -> list[CMSPage]:
    """List all hub pages (seasonal, cluster, regional). Optionally filter by hub_type."""
    if hub_type and hub_type not in HUB_PAGE_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"hub_type must be one of: {sorted(HUB_PAGE_TYPES)}",
        )

    q = select(CMSPage).where(CMSPage.page_type.in_(HUB_PAGE_TYPES))
    if hub_type:
        q = q.where(CMSPage.page_type == hub_type)
    q = q.order_by(CMSPage.updated_at.desc())
    return list(db.scalars(q).all())


@router.post("/{slug:path}/regenerate", response_model=HubRegenerateResponse)
def regenerate_hub(
    slug: str,
    body: HubRegenerateRequest | None = None,
    db: Session = Depends(get_db),
) -> HubRegenerateResponse:
    """Trigger content regeneration for a hub page by slug."""
    page = db.scalar(select(CMSPage).where(CMSPage.slug == slug))

    # Determine season from slug or request body
    season_slug: str | None = None
    hub_type = "unknown"

    if page:
        hub_type = page.page_type
        if page.page_type == "seasonal_hub":
            # slug format: "seasons/{season}"
            parts = slug.split("/")
            season_slug = parts[-1] if parts else None
    else:
        # Page doesn't exist yet — infer type from slug prefix
        if slug.startswith("seasons/"):
            hub_type = "seasonal_hub"
            season_slug = slug.split("/")[-1]
        elif slug.startswith("trek-types/"):
            hub_type = "cluster_hub"
        elif slug.startswith("regions/"):
            hub_type = "regional_hub"

    if hub_type == "seasonal_hub":
        if not season_slug or season_slug not in SEASON_META:
            raise HTTPException(
                status_code=422,
                detail=f"Cannot determine season from slug '{slug}'. "
                       f"Valid season slugs: {list(SEASON_META.keys())}",
            )
        agent = SeasonalContentAgent(db=db, season_slug=season_slug)
        result = agent.run(input_data={"season_slug": season_slug})
        if result.get("errors"):
            raise HTTPException(status_code=400, detail=result["errors"][0])
        page_id = result.get("output", {}).get("page_id")
        return HubRegenerateResponse(
            slug=slug,
            hub_type=hub_type,
            message=f"Seasonal hub '{season_slug}' regenerated successfully.",
            page_id=page_id,
        )

    # cluster_hub and regional_hub: content generation uses existing CMS pipeline
    # (ContentWritingAgent or manual) — return 501 stub for now
    raise HTTPException(
        status_code=501,
        detail=f"Regeneration for hub_type='{hub_type}' is managed via the publish pipeline. "
               "Trigger a new pipeline run with the matching cluster/region brief.",
    )
