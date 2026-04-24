"""Tests for Master CMS: CRUD, cache invalidation, publish flow."""
from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.session import SessionLocal
from app.main import app
from app.modules.cms.models import CMSPage
from app.modules.cms.service import (
    cache_invalidate,
    cache_invalidate_all,
    create_page,
    get_page_by_slug,
    list_pages,
    update_page,
    upsert_page_from_draft,
    _parse_sections_from_markdown,
    _extract_trek_facts_from_markdown,
)
from app.modules.content.models import ContentBrief, ContentDraft, KeywordCluster, PublishLog, TopicOpportunity
from app.schemas.cms import CMSPageCreate, CMSPagePatch

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state():
    with SessionLocal() as db:
        db.execute(delete(PublishLog))
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
        db.execute(delete(CMSPage))
        db.commit()
    yield
    with SessionLocal() as db:
        db.execute(delete(PublishLog))
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
        db.execute(delete(CMSPage))
        db.commit()


# ---------------------------------------------------------------------------
# Service layer tests
# ---------------------------------------------------------------------------

def test_create_page_and_get_by_slug():
    with SessionLocal() as db:
        page = create_page(db, data=CMSPageCreate(
            slug="kedarkantha",
            page_type="trek_guide",
            title="Kedarkantha Trek Guide",
            content_html="<p>Test content</p>",
        ))
        db.commit()
        fetched = get_page_by_slug(db, "kedarkantha")
    assert fetched is not None
    assert fetched.slug == "kedarkantha"
    assert fetched.title == "Kedarkantha Trek Guide"


def test_list_pages_returns_all():
    with SessionLocal() as db:
        create_page(db, data=CMSPageCreate(slug="trek-a", page_type="trek_guide", title="Trek A"))
        create_page(db, data=CMSPageCreate(slug="trek-b", page_type="trek_guide", title="Trek B"))
        db.commit()
        pages = list_pages(db)
    assert len(pages) == 2


def test_list_pages_filters_by_status():
    with SessionLocal() as db:
        create_page(db, data=CMSPageCreate(slug="draft-page", page_type="trek_guide", title="Draft", status="draft"))
        create_page(db, data=CMSPageCreate(slug="pub-page", page_type="trek_guide", title="Published", status="published"))
        db.commit()
        drafts = list_pages(db, status="draft")
        published = list_pages(db, status="published")
    assert len(drafts) == 1
    assert len(published) == 1


def test_update_page_sets_published_at_on_publish():
    with SessionLocal() as db:
        page = create_page(db, data=CMSPageCreate(slug="update-test", page_type="trek_guide", title="Update Test"))
        db.commit()
        assert page.published_at is None
        page = update_page(db, page=page, patch=CMSPagePatch(status="published"))
        db.commit()
        assert page.status == "published"
        assert page.published_at is not None


def test_get_page_by_slug_returns_none_for_missing():
    with SessionLocal() as db:
        result = get_page_by_slug(db, "nonexistent-slug-xyz")
    assert result is None


def _make_brief_and_draft(slug_suffix: str, draft_status: str = "approved") -> tuple[str, str]:
    """Create brief + draft via API and return (brief_id, draft_id)."""
    brief_r = client.post("/api/v1/briefs", json={
        "title": "Test Brief", "slug": f"brief-{slug_suffix}",
        "target_keyword": "test", "status": "approved",
    })
    assert brief_r.status_code == 201
    brief_id = brief_r.json()["id"]
    draft_r = client.post("/api/v1/drafts", json={
        "brief_id": brief_id, "title": "Trek Draft",
        "slug": f"trek-{slug_suffix}",
        "content_markdown": "## Content\nBody.", "status": draft_status,
    })
    assert draft_r.status_code == 201
    return brief_id, draft_r.json()["id"]


def test_upsert_creates_new_page():
    brief_id, draft_id = _make_brief_and_draft(uuid.uuid4().hex[:8])
    with SessionLocal() as db:
        from sqlalchemy import select as sa_select
        draft = db.scalar(sa_select(ContentDraft).where(ContentDraft.id == uuid.UUID(draft_id)))
        assert draft is not None
        cms_page = upsert_page_from_draft(db, draft=draft)
        db.commit()
        slug = cms_page.slug
        status = cms_page.status
    assert status == "published"
    assert slug is not None


def test_upsert_updates_existing_page():
    brief_id, draft_id = _make_brief_and_draft(uuid.uuid4().hex[:8])
    with SessionLocal() as db:
        from sqlalchemy import select as sa_select
        draft = db.scalar(sa_select(ContentDraft).where(ContentDraft.id == uuid.UUID(draft_id)))
        assert draft is not None
        # Pre-create a CMS page with same slug
        existing = CMSPage(slug=draft.slug, page_type="trek_guide", title="Old Title", content_html="old", status="draft")
        db.add(existing)
        db.commit()
        db.refresh(draft)
        cms_page = upsert_page_from_draft(db, draft=draft)
        db.commit()
        title = cms_page.title
        status = cms_page.status
    assert title == "Trek Draft"
    assert status == "published"


# ---------------------------------------------------------------------------
# Cache invalidation (smoke — Redis may not be running in test env)
# ---------------------------------------------------------------------------

def test_cache_invalidate_swallows_redis_errors():
    with patch("app.modules.cms.service._redis", side_effect=Exception("Redis down")):
        cache_invalidate(["any-slug"])  # must not raise


def test_cache_invalidate_all_swallows_redis_errors():
    with patch("app.modules.cms.service._redis", side_effect=Exception("Redis down")):
        cache_invalidate_all()  # must not raise


# ---------------------------------------------------------------------------
# API route tests
# ---------------------------------------------------------------------------

def test_api_list_pages_empty():
    r = client.get("/api/v1/cms/pages")
    assert r.status_code == 200
    assert r.json() == []


def test_api_create_page_201():
    r = client.post("/api/v1/cms/pages", json={
        "slug": "har-ki-dun", "page_type": "trek_guide",
        "title": "Har Ki Dun", "content_html": "<p>Body</p>",
    })
    assert r.status_code == 201
    assert r.json()["slug"] == "har-ki-dun"


def test_api_create_page_409_on_duplicate_slug():
    client.post("/api/v1/cms/pages", json={"slug": "dup-slug", "page_type": "trek_guide", "title": "First"})
    r = client.post("/api/v1/cms/pages", json={"slug": "dup-slug", "page_type": "trek_guide", "title": "Second"})
    assert r.status_code == 409


def test_api_get_page_200():
    client.post("/api/v1/cms/pages", json={"slug": "get-test", "page_type": "trek_guide", "title": "Get Test"})
    r = client.get("/api/v1/cms/pages/get-test")
    assert r.status_code == 200
    assert r.json()["title"] == "Get Test"


def test_api_get_page_404():
    r = client.get("/api/v1/cms/pages/does-not-exist")
    assert r.status_code == 404


def test_api_patch_page_200():
    client.post("/api/v1/cms/pages", json={"slug": "patch-test", "page_type": "trek_guide", "title": "Original"})
    r = client.patch("/api/v1/cms/pages/patch-test", json={"title": "Updated"})
    assert r.status_code == 200
    assert r.json()["title"] == "Updated"


def test_api_delete_page_204():
    client.post("/api/v1/cms/pages", json={"slug": "delete-test", "page_type": "trek_guide", "title": "To Delete"})
    r = client.delete("/api/v1/cms/pages/delete-test")
    assert r.status_code == 204
    assert client.get("/api/v1/cms/pages/delete-test").status_code == 404


def test_api_cache_invalidate_single():
    with patch("app.modules.cms.service.cache_invalidate") as mock_inv:
        r = client.post("/api/v1/cms/cache/invalidate", json={"slug": "kedarkantha"})
    assert r.status_code == 200
    assert r.json()["invalidated"] == ["kedarkantha"]


def test_api_cache_invalidate_all():
    with patch("app.modules.cms.service.cache_invalidate_all") as mock_all:
        r = client.post("/api/v1/cms/cache/invalidate", json={"scope": "all"})
    assert r.status_code == 200
    assert r.json()["invalidated"] == ["*"]


def test_api_cache_invalidate_empty_body_400():
    r = client.post("/api/v1/cms/cache/invalidate", json={})
    assert r.status_code == 400


def test_api_reparse_sections_422_when_no_brief_id():
    client.post("/api/v1/cms/pages", json={
        "slug": "no-brief-page", "page_type": "trek_guide", "title": "No Brief",
    })
    r = client.post("/api/v1/cms/pages/no-brief-page/reparse-sections")
    assert r.status_code == 422
    assert "brief_id" in r.json()["detail"]


# ---------------------------------------------------------------------------
# Section parser unit tests
# ---------------------------------------------------------------------------

def test_parser_faqs_not_in_why_this_trek():
    """'Frequently Asked Questions About the X Trek' must map to faqs, not why_this_trek."""
    md = ("Intro paragraph.\n\n"
          "## Route Overview\nRoute content.\n\n"
          "## Frequently Asked Questions About the Churdhar Trek\n"
          "**Q: Is it hard?** A: Moderate.")
    sections = _parse_sections_from_markdown(md)
    assert "faqs" in sections, "faqs section missing"
    assert "route_overview" in sections
    # FAQs content must NOT appear in why_this_trek
    why = sections.get("why_this_trek", "")
    assert "Is it hard" not in why


def test_parser_h3_is_content_not_boundary():
    """H3 headings must be captured as section content, not reset the active section."""
    md = ("## What Is the Best Time to Do This Trek\n"
          "### May – June (Pre-Monsoon)\nWarm, dry, great views.\n"
          "### September – October (Post-Monsoon)\nClear skies.")
    sections = _parse_sections_from_markdown(md)
    assert "best_time" in sections
    best = sections["best_time"]
    assert "Pre-Monsoon" in best or "Warm" in best, "H3 sub-heading content lost"
    assert "Post-Monsoon" in best or "Clear skies" in best, "Second H3 content lost"


def test_parser_difficult_matches_difficulty_section():
    """'How Difficult Is the Trek?' must map to difficulty, not be dropped."""
    md = ("## How Difficult Is the Churdhar Trek\n"
          "This trek is moderately difficult and requires fitness.")
    sections = _parse_sections_from_markdown(md)
    assert "difficulty" in sections, "difficulty section not parsed from 'difficult' heading"


def test_parser_key_facts_maps_to_why_this_trek():
    """'What Are the Key Facts About X?' must map to why_this_trek."""
    md = ("## What Are the Key Facts About Churdhar Peak\n"
          "Duration: 5 days. Altitude: 3647m.")
    sections = _parse_sections_from_markdown(md)
    assert "why_this_trek" in sections


def test_parser_h1_intro_captured():
    """Content after H1 and before first H2 must be captured as why_this_trek."""
    md = ("# Trek Title\n"
          "This is an introductory paragraph about the trek.\n\n"
          "## Route Overview\nRoute details here.")
    sections = _parse_sections_from_markdown(md)
    assert "why_this_trek" in sections
    assert "introductory" in sections["why_this_trek"]


def test_extract_trek_facts_duration():
    md = "**Duration:** 5 to 6 days / 4 to 5 nights\n**Difficulty:** Moderate"
    facts = _extract_trek_facts_from_markdown(md)
    assert "duration" in facts
    assert "5" in facts["duration"]


def test_extract_trek_facts_difficulty():
    md = "**Difficulty Level:** Moderate to Difficult\n**Base Village:** Nohradhar"
    facts = _extract_trek_facts_from_markdown(md)
    assert "difficulty" in facts
    assert "Moderate" in facts["difficulty"]


def test_extract_trek_facts_altitude():
    md = "**Maximum Altitude:** 3,647 m (11,965 ft)"
    facts = _extract_trek_facts_from_markdown(md)
    assert "altitude" in facts
    assert "3,647" in facts["altitude"] or "3647" in facts["altitude"]


def test_api_reparse_sections_200_populates_sections():
    suffix = uuid.uuid4().hex[:8]
    # Create brief + draft with section-containing markdown
    brief_r = client.post("/api/v1/briefs", json={
        "title": "Reparse Brief", "slug": f"brief-{suffix}",
        "target_keyword": "test", "status": "approved",
    })
    assert brief_r.status_code == 201
    brief_id = brief_r.json()["id"]
    md = ("Intro paragraph about why this trek is special.\n\n"
          "## Route Overview\nThe route starts at Nohradhar and climbs steadily.\n\n"
          "## FAQs\n**Q: Can beginners do this?** A: Yes.")
    draft_r = client.post("/api/v1/drafts", json={
        "brief_id": brief_id, "title": "Trek Draft",
        "slug": f"trek-{suffix}", "content_markdown": md, "status": "draft",
    })
    assert draft_r.status_code == 201
    # Create CMS page linked to the brief
    page_r = client.post("/api/v1/cms/pages", json={
        "slug": f"trek-{suffix}", "page_type": "trek_guide",
        "title": "Trek Page", "brief_id": brief_id,
    })
    assert page_r.status_code == 201
    r = client.post(f"/api/v1/cms/pages/trek-{suffix}/reparse-sections")
    assert r.status_code == 200
    data = r.json()
    assert data["content_json"] is not None
    sections = data["content_json"].get("sections", {})
    assert "why_this_trek" in sections
    assert "route_overview" in sections
