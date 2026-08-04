from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_current_admin
from app.db.session import get_db
from app.modules.cms.models import CMSPage
from app.modules.agents.seasonal_content.agent import SeasonalContentAgent, SEASON_META
from app.modules.agents.regional_content.agent import RegionalContentAgent
from app.modules.agents.cluster_content.agent import ClusterContentAgent, _slugify
from app.modules.content.models import KeywordCluster
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
        # Regenerate an EXISTING cluster hub — resolve its source (curated category or keyword_cluster)
        # from the stored page. New ones are created via POST /admin/hubs/clusters/generate.
        if not page:
            raise HTTPException(status_code=404, detail="Cluster hub page not found; use 'Generate' to create it.")
        cj = page.content_json if isinstance(page.content_json, dict) else {}
        cat_slug = cj.get("category_slug")
        seg = slug.split("/")[-1]
        if cat_slug and category_by_slug(cat_slug):
            agent = ClusterContentAgent(db=db, category_slug=cat_slug)
        elif page.cluster_id:
            agent = ClusterContentAgent(db=db, cluster_id=str(page.cluster_id))
        elif category_by_slug(seg):
            agent = ClusterContentAgent(db=db, category_slug=seg)
        else:
            raise HTTPException(status_code=422, detail="Cannot determine this hub's source (category or keyword cluster).")
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
    Combines the curated category taxonomy (category_meta.CATEGORIES) with any pipeline
    keyword_clusters (both, per the 2026-08-04 decision)."""
    existing = {p.slug for p in db.scalars(select(CMSPage).where(CMSPage.page_type == "cluster_hub")).all()}
    items: list[ClusterCatalogItem] = []
    for c in CATEGORIES:
        hub_slug = f"trek-types/{c.slug}"
        items.append(ClusterCatalogItem(kind="category", key=c.slug, name=c.name,
                                        hub_slug=hub_slug, has_page=hub_slug in existing))
    for kc in db.scalars(select(KeywordCluster).order_by(KeywordCluster.name)).all():
        hub_slug = f"trek-types/{_slugify(kc.name)}"
        items.append(ClusterCatalogItem(kind="cluster", key=str(kc.id), name=kc.name,
                                        hub_slug=hub_slug, has_page=hub_slug in existing))
    return items


@router.post("/clusters/generate", response_model=HubRegenerateResponse)
def generate_cluster_hub(
    body: ClusterGenerateRequest,
    db: Session = Depends(get_db),
) -> HubRegenerateResponse:
    """Generate a Trek Category (cluster) hub from a curated category OR a keyword_cluster."""
    if body.category_slug:
        agent = ClusterContentAgent(db=db, category_slug=body.category_slug)
    elif body.cluster_id:
        agent = ClusterContentAgent(db=db, cluster_id=body.cluster_id)
    else:
        raise HTTPException(status_code=422, detail="Provide category_slug or cluster_id.")
    result = agent.run(input_data={})
    if result.get("errors"):
        raise HTTPException(status_code=400, detail=result["errors"][0])
    out = result.get("output", {})
    return HubRegenerateResponse(
        slug=out.get("slug", ""), hub_type="cluster_hub",
        message="Trek Category hub generated successfully.", page_id=out.get("page_id"),
    )
