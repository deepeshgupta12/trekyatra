from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_current_admin
from app.db.session import get_db
from app.modules.cms.models import CMSPage
from app.modules.agents.seasonal_content.agent import SeasonalContentAgent, SEASON_META
from app.modules.agents.regional_content.agent import RegionalContentAgent
from app.modules.agents.cluster_content.agent import ClusterContentAgent
from app.modules.hubs.region_meta import REGIONS
from app.modules.hubs.category_meta import CATEGORIES, category_by_slug
from app.schemas.hubs import (
    HUB_PAGE_TYPES,
    ClusterCatalogItem,
    ClusterGenerateRequest,
    HubPageResponse,
    HubRegenerateRequest,
    HubRegenerateResponse,
    RegionCatalogItem,
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

    if hub_type == "regional_hub":
        # slug format: "regions/{region_slug}"
        region_slug = slug.split("/")[-1] if slug else None
        if not region_slug:
            raise HTTPException(status_code=422, detail=f"Cannot determine region from slug '{slug}'.")
        agent = RegionalContentAgent(db=db, region_slug=region_slug)
        result = agent.run(input_data={"region_slug": region_slug})
        if result.get("errors"):
            raise HTTPException(status_code=400, detail=result["errors"][0])
        page_id = result.get("output", {}).get("page_id")
        return HubRegenerateResponse(
            slug=result.get("output", {}).get("slug", slug),
            hub_type=hub_type,
            message=f"Regional hub '{region_slug}' regenerated successfully.",
            page_id=page_id,
        )

    if hub_type == "cluster_hub":
        # Trek Category hubs are ONLY the curated thematic categories (category_meta). Per-trek /
        # per-keyword-cluster trek-types pages are NOT allowed (they duplicate /trek/{slug} detail
        # pages and cannibalise SEO). Regenerate only when the slug is a curated category.
        seg = slug.split("/")[-1]
        if not category_by_slug(seg):
            raise HTTPException(
                status_code=422,
                detail=f"'{slug}' is not a curated Trek Category. Only the fixed categories "
                       f"({', '.join(c.slug for c in CATEGORIES)}) are supported.",
            )
        agent = ClusterContentAgent(db=db, category_slug=seg)
        result = agent.run(input_data={})
        if result.get("errors"):
            raise HTTPException(status_code=400, detail=result["errors"][0])
        out = result.get("output", {})
        return HubRegenerateResponse(
            slug=out.get("slug", slug), hub_type=hub_type,
            message="Trek Category hub regenerated successfully.", page_id=out.get("page_id"),
        )

    raise HTTPException(status_code=501, detail=f"Regeneration for hub_type='{hub_type}' is not supported.")


@router.get("/regions/catalog", response_model=list[RegionCatalogItem])
def region_catalog() -> list[RegionCatalogItem]:
    """Canonical region hubs available to generate — powers the admin
    'Generate Missing Regional Hubs' panel. Source: app.modules.hubs.region_meta.REGIONS."""
    return [
        RegionCatalogItem(slug=r.slug, name=r.name, hub_slug=f"regions/{r.slug}", country=r.country)
        for r in REGIONS
    ]


@router.get("/clusters/catalog", response_model=list[ClusterCatalogItem])
def cluster_catalog(db: Session = Depends(get_db)) -> list[ClusterCatalogItem]:
    """Trek Category hubs available to generate — powers 'Generate Missing Trek Category Hubs'.
    ONLY the curated thematic categories (category_meta.CATEGORIES). Keyword_cluster-sourced hubs
    were removed (2026-08-04): they are named per-trek and produced /trek-types/{trek} URLs that
    duplicate /trek/{slug} detail pages and harm SEO."""
    existing = {p.slug for p in db.scalars(select(CMSPage).where(CMSPage.page_type == "cluster_hub")).all()}
    return [
        ClusterCatalogItem(kind="category", key=c.slug, name=c.name,
                           hub_slug=f"trek-types/{c.slug}", has_page=f"trek-types/{c.slug}" in existing)
        for c in CATEGORIES
    ]


@router.post("/clusters/generate", response_model=HubRegenerateResponse)
def generate_cluster_hub(
    body: ClusterGenerateRequest,
    db: Session = Depends(get_db),
) -> HubRegenerateResponse:
    """Generate a Trek Category (cluster) hub from a CURATED category only."""
    if not body.category_slug or not category_by_slug(body.category_slug):
        raise HTTPException(
            status_code=422,
            detail=f"Provide a curated category_slug ({', '.join(c.slug for c in CATEGORIES)}).",
        )
    agent = ClusterContentAgent(db=db, category_slug=body.category_slug)
    result = agent.run(input_data={})
    if result.get("errors"):
        raise HTTPException(status_code=400, detail=result["errors"][0])
    out = result.get("output", {})
    return HubRegenerateResponse(
        slug=out.get("slug", ""), hub_type="cluster_hub",
        message="Trek Category hub generated successfully.", page_id=out.get("page_id"),
    )
