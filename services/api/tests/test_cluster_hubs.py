"""Trek Category (cluster) hubs — curated taxonomy generation + category trek matching."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.main import app
from app.db.session import SessionLocal
from app.modules.cms.models import CMSPage
from app.modules.hubs.category_meta import CATEGORIES, category_by_slug

client = TestClient(app)


def _seed_trek(db, *, slug, suitability="Moderate", duration="6 days", themes=None, best_months=None):
    db.execute(delete(CMSPage).where(CMSPage.slug == slug))
    db.add(CMSPage(
        id=uuid.uuid4(), slug=slug, page_type="trek_guide", title=f"{slug} Trek",
        trek_name=f"{slug} Trek", status="published", content_html="<p>x</p>",
        trek_suitability=suitability, trek_duration=duration, trek_themes=themes, trek_best_months=best_months,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    ))
    db.commit()


def _mock_client(text="A grounded intro paragraph about the category that is long enough to pass."):
    m = MagicMock()
    m.messages.create.return_value = MagicMock(content=[MagicMock(text=text)])
    return m


# ── TC-B01: curated taxonomy is well-formed ─────────────────────────────────
def test_category_taxonomy():
    slugs = {c.slug for c in CATEGORIES}
    assert {"beginner-friendly-treks", "weekend-treks", "high-altitude-treks", "lake-treks", "snow-treks", "family-treks"} <= slugs
    assert category_by_slug("lake-treks")


# ── TC-B02: cluster catalog lists curated categories with has_page flags ────
def test_cluster_catalog_endpoint():
    resp = client.get("/api/v1/admin/hubs/clusters/catalog")
    assert resp.status_code == 200
    cats = [i for i in resp.json() if i["kind"] == "category"]
    keys = {c["key"] for c in cats}
    assert "beginner-friendly-treks" in keys
    ben = next(c for c in cats if c["key"] == "beginner-friendly-treks")
    assert ben["hub_slug"] == "trek-types/beginner-friendly-treks"


# ── TC-B03: /treks/by-cluster?category= matches by predicate ────────────────
def test_by_category_predicate_match():
    with SessionLocal() as db:
        _seed_trek(db, slug="ben-cat-trek", suitability="Beginner-friendly")
        _seed_trek(db, slug="hard-cat-trek", suitability="Difficult", duration="12 days")
    ben = {t["slug"] for t in client.get("/api/v1/treks/by-cluster?category=beginner-friendly-treks&limit=50").json()}
    assert "ben-cat-trek" in ben and "hard-cat-trek" not in ben


def test_by_category_weekend_duration():
    with SessionLocal() as db:
        _seed_trek(db, slug="wknd-trek", suitability="Moderate", duration="2 days")
        _seed_trek(db, slug="long-trek", suitability="Moderate", duration="9 days")
    wknd = {t["slug"] for t in client.get("/api/v1/treks/by-cluster?category=weekend-treks&limit=50").json()}
    assert "wknd-trek" in wknd and "long-trek" not in wknd


# ── TC-B04: generate a curated cluster hub (mock LLM) ───────────────────────
def test_generate_cluster_hub_category():
    with SessionLocal() as db:
        db.execute(delete(CMSPage).where(CMSPage.slug == "trek-types/lake-treks"))
        db.commit()
        _seed_trek(db, slug="lake-cat-trek", themes=["High Altitude Lake"])

    with patch("app.modules.agents.cluster_content.agent.get_anthropic_client", return_value=_mock_client()):
        resp = client.post("/api/v1/admin/hubs/clusters/generate", json={"category_slug": "lake-treks"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["hub_type"] == "cluster_hub"

    with SessionLocal() as db:
        page = db.scalar(select(CMSPage).where(CMSPage.slug == "trek-types/lake-treks"))
        assert page is not None and page.page_type == "cluster_hub" and page.status == "published"
        assert page.content_json.get("category_slug") == "lake-treks"
        assert page.content_json.get("faqs")


# ── TC-B05: generate for an unknown category → 422 (curated-only validation) ─
def test_generate_cluster_unknown_category():
    resp = client.post("/api/v1/admin/hubs/clusters/generate", json={"category_slug": "nope-treks"})
    assert resp.status_code == 422


# ── TC-B06: keyword_cluster generation is REMOVED (cluster_id rejected) ──────
def test_generate_cluster_by_cluster_id_rejected():
    resp = client.post("/api/v1/admin/hubs/clusters/generate", json={"cluster_id": "some-uuid"})
    assert resp.status_code == 422  # cluster_id is no longer accepted; curated category required


def test_cluster_catalog_is_curated_only():
    resp = client.get("/api/v1/admin/hubs/clusters/catalog")
    assert resp.status_code == 200
    assert all(i["kind"] == "category" for i in resp.json())


def test_generate_cluster_missing_params_422():
    resp = client.post("/api/v1/admin/hubs/clusters/generate", json={})
    assert resp.status_code == 422
