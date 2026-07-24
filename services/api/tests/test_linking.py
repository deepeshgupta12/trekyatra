"""Tests for the internal linking engine — sync, related pages, orphans, anchors, leads admin."""
from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uid() -> str:
    return str(uuid.uuid4())[:8]


# ---------------------------------------------------------------------------
# POST /admin/links/sync
# ---------------------------------------------------------------------------

def test_sync_pages_returns_200():
    resp = client.post("/api/v1/admin/links/sync")
    assert resp.status_code == 200
    data = resp.json()
    assert "synced" in data
    assert isinstance(data["synced"], int)
    assert "message" in data


# ---------------------------------------------------------------------------
# GET /links/suggestions/{slug}
# ---------------------------------------------------------------------------

def test_related_pages_unknown_slug_returns_empty():
    resp = client.get("/api/v1/links/suggestions/nonexistent-slug-xyz")
    assert resp.status_code == 200
    assert resp.json() == []


def test_related_pages_limit_param_accepted():
    resp = client.get("/api/v1/links/suggestions/nonexistent-slug-xyz?limit=3")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# GET /admin/links/orphans
# ---------------------------------------------------------------------------

def test_orphans_returns_200():
    resp = client.get("/api/v1/admin/links/orphans")
    assert resp.status_code == 200
    data = resp.json()
    assert "pages" in data
    assert "count" in data
    assert isinstance(data["pages"], list)
    assert data["count"] == len(data["pages"])


# ---------------------------------------------------------------------------
# GET /admin/links/anchors/{slug}
# ---------------------------------------------------------------------------

def test_anchors_unknown_slug_returns_empty():
    resp = client.get("/api/v1/admin/links/anchors/nonexistent-slug-xyz")
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# GET /admin/leads
# ---------------------------------------------------------------------------

def test_list_leads_returns_200():
    resp = client.get("/api/v1/admin/leads")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_list_leads_after_submit():
    payload = {
        "name": "Linking Test User",
        "email": f"linking_{_uid()}@example.com",
        "trek_interest": "Hampta Pass",
        "source_page": "/trek/hampta-pass",
    }
    client.post("/api/v1/leads", json=payload)
    resp = client.get("/api/v1/admin/leads")
    assert resp.status_code == 200
    emails = [l["email"] for l in resp.json()]
    assert payload["email"] in emails


def test_list_leads_status_filter():
    resp = client.get("/api/v1/admin/leads?status=new")
    assert resp.status_code == 200
    for lead in resp.json():
        assert lead["status"] == "new"


# ---------------------------------------------------------------------------
# PATCH /admin/leads/{id}
# ---------------------------------------------------------------------------

def test_patch_lead_status_to_contacted():
    payload = {
        "name": "Patch Test",
        "email": f"patch_{_uid()}@example.com",
        "trek_interest": "Valley of Flowers",
        "source_page": "/trek/valley-of-flowers",
    }
    create_resp = client.post("/api/v1/leads", json=payload)
    assert create_resp.status_code == 201
    lead_id = create_resp.json()["id"]

    patch_resp = client.patch(f"/api/v1/admin/leads/{lead_id}", json={"status": "contacted"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "contacted"


def test_patch_lead_status_invalid():
    payload = {
        "name": "Invalid Status",
        "email": f"invalid_{_uid()}@example.com",
        "trek_interest": "Roopkund",
        "source_page": "/trek/roopkund",
    }
    create_resp = client.post("/api/v1/leads", json=payload)
    lead_id = create_resp.json()["id"]
    resp = client.patch(f"/api/v1/admin/leads/{lead_id}", json={"status": "nonexistent"})
    assert resp.status_code == 422


def test_patch_lead_status_nonexistent_id():
    fake_id = str(uuid.uuid4())
    resp = client.patch(f"/api/v1/admin/leads/{fake_id}", json={"status": "contacted"})
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Lead response includes status field
# ---------------------------------------------------------------------------

def test_lead_response_includes_status():
    payload = {
        "name": "Status Field Test",
        "email": f"status_{_uid()}@example.com",
        "trek_interest": "Bali Pass",
        "source_page": "/trek/bali-pass",
    }
    resp = client.post("/api/v1/leads", json=payload)
    assert resp.status_code == 201
    assert resp.json()["status"] == "new"


# ---------------------------------------------------------------------------
# news_article exclusion (Bug fix — news must not enter the trek linking graph)
# ---------------------------------------------------------------------------

def test_news_article_excluded_from_linking_graph():
    from datetime import datetime, timezone
    from app.db.session import SessionLocal
    from app.modules.cms.models import CMSPage
    from app.modules.linking.models import Page
    from app.modules.linking.service import sync_pages_from_cms, _EXCLUDED_FROM_LINKING

    assert "news_article" in _EXCLUDED_FROM_LINKING
    db = SessionLocal()
    slug = f"news-excl-{_uid()}"
    try:
        now = datetime.now(timezone.utc)
        db.add(CMSPage(slug=slug, title="News X", page_type="news_article", status="published",
                       content_html="", language="en", published_at=now, created_at=now, updated_at=now))
        db.commit()
        sync_pages_from_cms(db)
        db.commit()
        # The published news article must NOT have been synced into the linking Page table.
        assert db.query(Page).filter(Page.slug == slug).count() == 0
    finally:
        db.query(Page).filter(Page.slug == slug).delete(synchronize_session=False)
        db.query(CMSPage).filter(CMSPage.slug == slug).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_get_related_pages_excludes_mistyped_news():
    """A news_article mis-typed as trek_guide in the linking graph must NOT leak into a
    trek's related list — get_related_pages filters on the REAL CMS page_type. Isolated in
    a dedicated cluster so it only sees these rows (dev DB has many trek_guide pages)."""
    from datetime import datetime, timezone
    import uuid as _uuid
    from app.db.session import SessionLocal
    from app.modules.cms.models import CMSPage
    from app.modules.content.models import KeywordCluster
    from app.modules.linking.models import Page
    from app.modules.linking.service import get_related_pages

    db = SessionLocal()
    now = datetime.now(timezone.utc)
    src, sib, news = f"rel-src-{_uid()}", f"rel-sib-{_uid()}", f"rel-news-{_uid()}-2026-07"
    slugs = [src, sib, news]
    cluster = KeywordCluster(name=f"rel-cluster-{_uid()}", primary_keyword="rel test",
                             supporting_keywords=[], status="active", created_at=now, updated_at=now)
    db.add(cluster); db.flush()
    cid = cluster.id
    try:
        src_cms = CMSPage(slug=src, title="Src Trek", page_type="trek_guide", status="published", content_html="", language="en", published_at=now, created_at=now, updated_at=now)
        sib_cms = CMSPage(slug=sib, title="Sibling Trek", page_type="trek_guide", status="published", content_html="", language="en", published_at=now, created_at=now, updated_at=now)
        news_cms = CMSPage(slug=news, title="Some News", page_type="news_article", status="published", content_html="", language="en", published_at=now, created_at=now, updated_at=now)
        db.add_all([src_cms, sib_cms, news_cms]); db.flush()
        # Linking rows in the SAME cluster — ALL typed trek_guide (news mis-typed, as the default did)
        db.add(Page(id=_uuid.uuid4(), slug=src, title="Src Trek", page_type="trek_guide", published_at=now, cluster_id=cid, cms_page_id=src_cms.id, indexed_at=now, created_at=now))
        db.add(Page(id=_uuid.uuid4(), slug=sib, title="Sibling Trek", page_type="trek_guide", published_at=now, cluster_id=cid, cms_page_id=sib_cms.id, indexed_at=now, created_at=now))
        db.add(Page(id=_uuid.uuid4(), slug=news, title="Some News", page_type="trek_guide", published_at=now, cluster_id=cid, cms_page_id=news_cms.id, indexed_at=now, created_at=now))
        db.commit()
        rslugs = [p.slug for p in get_related_pages(db, slug=src, limit=20)]
        assert sib in rslugs        # real sibling trek IS returned (same cluster)
        assert news not in rslugs   # mis-typed news EXCLUDED (real CMS type = news_article)
    finally:
        db.query(Page).filter(Page.slug.in_(slugs)).delete(synchronize_session=False)
        db.query(CMSPage).filter(CMSPage.slug.in_(slugs)).delete(synchronize_session=False)
        db.query(KeywordCluster).filter(KeywordCluster.id == cid).delete(synchronize_session=False)
        db.commit(); db.close()
