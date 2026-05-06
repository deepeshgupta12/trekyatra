from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.dependencies import get_current_admin
from app.modules.cms import service as cms_service
from app.modules.cms.models import CMSPage
from app.modules.agents.translation.agent import translate_page, SUPPORTED_LANGUAGES
from app.schemas.translation import TranslateRequest, TranslateResponse

router = APIRouter(tags=["translation"])

_admin = Depends(get_current_admin)


@router.post(
    "/admin/cms/{slug}/translate",
    response_model=TranslateResponse,
    dependencies=[_admin],
)
def trigger_translation(
    slug: str,
    body: TranslateRequest,
    db: Session = Depends(get_db),
) -> TranslateResponse:
    if body.target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported target_language '{body.target_language}'. "
                   f"Supported: {list(SUPPORTED_LANGUAGES.keys())}",
        )

    source = cms_service.get_page_by_slug(db, slug)
    if not source:
        raise HTTPException(status_code=404, detail=f"CMS page '{slug}' not found.")

    # Return existing translation if already done
    existing_translations: dict = source.translations or {}
    existing_id = existing_translations.get(body.target_language)
    if existing_id:
        existing_page = db.get(CMSPage, uuid.UUID(existing_id))
        if existing_page:
            return TranslateResponse(
                source_slug=slug,
                target_language=body.target_language,
                page_id=str(existing_page.id),
                page_slug=existing_page.slug,
                message=f"Translation already exists as '{existing_page.slug}'.",
                fallback=False,
            )

    # Run translation agent
    result = translate_page(source.title, source.content_html, body.target_language)
    is_fallback = result.get("fallback") == "true"

    # Create translated CMSPage (draft status — requires admin review before publish)
    new_slug = f"{slug}-{body.target_language}"
    # If slug already exists, make unique
    candidate = new_slug
    counter = 2
    while cms_service.get_page_by_slug(db, candidate):
        candidate = f"{new_slug}-{counter}"
        counter += 1
    new_slug = candidate

    new_page = CMSPage(
        slug=new_slug,
        page_type=source.page_type,
        title=result["title"],
        content_html=result["content_html"],
        content_json=source.content_json,
        status="draft",
        seo_title=source.seo_title,
        seo_description=source.seo_description,
        seo_meta=source.seo_meta,
        hero_image_url=source.hero_image_url,
        language=body.target_language,
        source_page_id=source.id,
        brief_id=source.brief_id,
        cluster_id=source.cluster_id,
    )
    db.add(new_page)
    db.flush()  # get new_page.id before updating source

    # Update source page translations map
    existing_translations[body.target_language] = str(new_page.id)
    source.translations = existing_translations

    db.commit()
    db.refresh(new_page)

    return TranslateResponse(
        source_slug=slug,
        target_language=body.target_language,
        page_id=str(new_page.id),
        page_slug=new_slug,
        message=(
            f"Translation draft created as '{new_slug}'. "
            + ("Rule-based fallback used — ANTHROPIC_API_KEY not set." if is_fallback else "Review and publish via /admin/cms.")
        ),
        fallback=is_fallback,
    )
