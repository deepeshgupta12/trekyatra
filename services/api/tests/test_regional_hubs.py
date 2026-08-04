"""Regional hub generation — RegionalContentAgent + /admin/hubs regional wiring."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.main import app
from app.db.session import SessionLocal
from app.modules.cms.models import CMSPage
from app.modules.hubs.region_meta import REGIONS, region_by_slug, permit_copy

client = TestClient(app)


def _seed_trek(db, *, slug: str, trek_state: str, suitability: str = "Moderate", season: str = "May–Jun"):
    db.execute(delete(CMSPage).where(CMSPage.slug == slug))
    db.add(CMSPage(
        id=uuid.uuid4(), slug=slug, page_type="trek_guide", title=f"{slug} Trek",
        trek_name=f"{slug.title()} Trek", trek_state=trek_state, trek_suitability=suitability,
        trek_season=season, content_html="<p>x</p>", status="published",
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    ))
    db.commit()


def _mock_client(text: str = "A grounded intro paragraph about the region that is sufficiently long."):
    m = MagicMock()
    m.messages.create.return_value = MagicMock(content=[MagicMock(text=text)])
    return m


# ── TC-B01: backend region taxonomy is well-formed ──────────────────────────
def test_region_meta_catalog_shape():
    assert {r.slug for r in REGIONS} >= {"himachal", "uttarakhand", "nepal", "pakistan", "tibet"}
    for r in REGIONS:
        assert r.match_word and r.name and r.hero_image.startswith("/images/")
    assert permit_copy(region_by_slug("nepal"))["label"] == "Required"
    assert permit_copy(region_by_slug("himachal"))["label"] == "Varies by trek"


# ── TC-B02: region catalog endpoint ─────────────────────────────────────────
def test_api_region_catalog():
    resp = client.get("/api/v1/admin/hubs/regions/catalog")
    assert resp.status_code == 200
    slugs = {item["slug"] for item in resp.json()}
    assert {"pakistan", "nepal", "himachal"} <= slugs
    pak = next(i for i in resp.json() if i["slug"] == "pakistan")
    assert pak["hub_slug"] == "regions/pakistan"


# ── TC-B03: regional regenerate creates a published regional_hub with FAQs ───
def test_api_regenerate_regional_hub_creates_page():
    with SessionLocal() as db:
        db.execute(delete(CMSPage).where(CMSPage.slug == "regions/himachal"))
        db.commit()
        _seed_trek(db, slug="hp-test-trek", trek_state="Himachal Pradesh", suitability="Beginner")

    with patch("app.modules.agents.regional_content.agent.get_anthropic_client", return_value=_mock_client()):
        resp = client.post("/api/v1/admin/hubs/regions/himachal/regenerate", json={})
    assert resp.status_code == 200, resp.text
    assert resp.json()["hub_type"] == "regional_hub"

    from sqlalchemy import select
    with SessionLocal() as db:
        page = db.scalar(select(CMSPage).where(CMSPage.slug == "regions/himachal"))
        assert page is not None
        assert page.page_type == "regional_hub"
        assert page.status == "published"
        assert page.content_json and page.content_json.get("faqs")
        # A beginner trek was seeded → the beginner FAQ must be present
        assert any("beginner" in f["q"].lower() for f in page.content_json["faqs"])
        assert page.hero_image_url == region_by_slug("himachal").hero_image


# ── TC-B04: composite international trek_state folds into the right hub ──────
def test_api_regenerate_regional_hub_composite_state():
    with SessionLocal() as db:
        db.execute(delete(CMSPage).where(CMSPage.slug.in_(["regions/pakistan", "k2-test-trek"])))
        db.commit()
        _seed_trek(db, slug="k2-test-trek", trek_state="Gilgit-Baltistan, Pakistan")

    with patch("app.modules.agents.regional_content.agent.get_anthropic_client", return_value=_mock_client()):
        resp = client.post("/api/v1/admin/hubs/regions/pakistan/regenerate", json={})
    assert resp.status_code == 200, resp.text

    from sqlalchemy import select
    with SessionLocal() as db:
        page = db.scalar(select(CMSPage).where(CMSPage.slug == "regions/pakistan"))
        assert page is not None
        # count FAQ should report at least the 1 seeded Pakistan trek
        count_faq = next(f for f in page.content_json["faqs"] if "how many" in f["q"].lower())
        assert "1 trek" in count_faq["a"]


# ── TC-B05: unknown region slug → 400 ───────────────────────────────────────
def test_api_regenerate_regional_unknown_region():
    resp = client.post("/api/v1/admin/hubs/regions/atlantis/regenerate", json={})
    assert resp.status_code == 400
    assert "atlantis" in resp.json()["detail"].lower()
