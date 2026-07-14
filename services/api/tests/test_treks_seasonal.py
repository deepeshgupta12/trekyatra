"""Tests for GET /api/v1/treks/seasonal (Step M06 mobile bugfix)."""
from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms import service as cms_service
from app.modules.cms.models import CMSPage
from app.modules.cms.service import create_page, update_page
from app.schemas.cms import CMSPageCreate, CMSPagePatch

client = TestClient(app)


def _make_published_trek(db, *, slug: str, season: str) -> CMSPage:
    page = create_page(db, data=CMSPageCreate(
        slug=slug,
        page_type="trek_guide",
        title=f"{slug} Trek Guide",
        content_html="<p>Test content</p>",
        status="published",
    ))
    page = update_page(db, page=page, patch=CMSPagePatch(trek_season=season))
    db.commit()
    return page


def _delete_new(db, pre_ids: list) -> None:
    if pre_ids:
        db.execute(delete(CMSPage).where(CMSPage.id.not_in(pre_ids)))
    else:
        db.execute(delete(CMSPage))


def test_seasonal_treks_matches_month():
    with SessionLocal() as db:
        pre_ids = list(r[0] for r in db.execute(select(CMSPage.id)).all())
        try:
            matching = _make_published_trek(db, slug="seasonal-test-match", season="Sep - Oct")
            non_matching = _make_published_trek(db, slug="seasonal-test-nomatch", season="Jan - Feb")

            # Use the service directly with a high limit to avoid the route's
            # limit<=20 cap, which other tests' leftover seasonal pages can exceed.
            pages = cms_service.get_seasonal_pages(db, month=9, limit=1000)
            slugs = [p.slug for p in pages]
            assert matching.slug in slugs
            assert non_matching.slug not in slugs
        finally:
            _delete_new(db, pre_ids)
            db.commit()


def test_seasonal_treks_excludes_pages_without_season():
    with SessionLocal() as db:
        pre_ids = list(r[0] for r in db.execute(select(CMSPage.id)).all())
        try:
            page = create_page(db, data=CMSPageCreate(
                slug="seasonal-test-noseason",
                page_type="trek_guide",
                title="No Season Trek Guide",
                content_html="<p>Test content</p>",
                status="published",
            ))
            db.commit()

            response = client.get("/api/v1/treks/seasonal?month=9")
            assert response.status_code == 200
            payload = response.json()
            slugs = [p["slug"] for p in payload]
            assert page.slug not in slugs
        finally:
            _delete_new(db, pre_ids)
            db.commit()


def test_seasonal_treks_wraparound_season():
    with SessionLocal() as db:
        pre_ids = list(r[0] for r in db.execute(select(CMSPage.id)).all())
        try:
            page = _make_published_trek(db, slug="seasonal-test-wraparound", season="Dec - Apr")

            response = client.get("/api/v1/treks/seasonal?month=1")
            assert response.status_code == 200
            payload = response.json()
            slugs = [p["slug"] for p in payload]
            assert page.slug in slugs
        finally:
            _delete_new(db, pre_ids)
            db.commit()


def test_seasonal_route_does_not_break_slug_route():
    # PT4 / Step 81: /{slug} now serves real CMS trek_guide pages. Create one and
    # confirm the dynamic route still resolves (not shadowed by /seasonal).
    with SessionLocal() as db:
        page = _make_published_trek(db, slug="slug-route-check", season="Jun - Sep")
        try:
            response = client.get(f"/api/v1/treks/{page.slug}")
            assert response.status_code == 200
            assert response.json()["slug"] == page.slug
        finally:
            db.query(CMSPage).filter(CMSPage.slug == "slug-route-check").delete(synchronize_session=False)
            db.commit()


def test_seasonal_route_does_not_break_filter_facets():
    response = client.get("/api/v1/treks/filter-facets")
    assert response.status_code == 200
    payload = response.json()
    for key in ("states", "difficulties", "seasons", "suitabilities", "durations"):
        assert key in payload


def test_seasonal_treks_default_month_is_current_month():
    response = client.get("/api/v1/treks/seasonal")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_seasonal_treks_respects_limit():
    response = client.get("/api/v1/treks/seasonal?limit=2")
    assert response.status_code == 200
    assert len(response.json()) <= 2
