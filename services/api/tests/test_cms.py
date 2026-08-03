"""Tests for Master CMS: CRUD, cache invalidation, publish flow."""
from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

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
    _extract_faq_section_raw,
    _parse_faqs_from_section,
)
from app.modules.content.models import ContentBrief, ContentDraft, KeywordCluster, PublishLog, TopicOpportunity
from app.schemas.cms import CMSPageCreate, CMSPagePatch

client = TestClient(app)


def _delete_new(db, model, pre_ids: list) -> None:
    """Delete rows created during a test, preserving pre-existing real data."""
    if pre_ids:
        db.execute(delete(model).where(model.id.not_in(pre_ids)))
    else:
        db.execute(delete(model))


@pytest.fixture(autouse=True)
def clean_state():
    # Snapshot all content table IDs to preserve real pipeline data
    with SessionLocal() as db:
        pre_cms = list(r[0] for r in db.execute(select(CMSPage.id)).all())
        pre_draft = list(r[0] for r in db.execute(select(ContentDraft.id)).all())
        pre_brief = list(r[0] for r in db.execute(select(ContentBrief.id)).all())
        pre_cluster = list(r[0] for r in db.execute(select(KeywordCluster.id)).all())
        pre_topic = list(r[0] for r in db.execute(select(TopicOpportunity.id)).all())
    yield
    with SessionLocal() as db:
        # FK-safe order: ContentBrief first (CASCADE → ContentDraft → PublishLog)
        _delete_new(db, ContentBrief, pre_brief)
        _delete_new(db, ContentDraft, pre_draft)  # safety: drafts without a brief
        _delete_new(db, CMSPage, pre_cms)
        _delete_new(db, KeywordCluster, pre_cluster)
        _delete_new(db, TopicOpportunity, pre_topic)
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
        before = len(list_pages(db, limit=10000))
        create_page(db, data=CMSPageCreate(slug="trek-a", page_type="trek_guide", title="Trek A"))
        create_page(db, data=CMSPageCreate(slug="trek-b", page_type="trek_guide", title="Trek B"))
        db.commit()
        pages = list_pages(db, limit=10000)
    assert len(pages) == before + 2


def test_list_pages_filters_by_status():
    with SessionLocal() as db:
        before_drafts = len(list_pages(db, status="draft", limit=10000))
        before_published = len(list_pages(db, status="published", limit=10000))
        create_page(db, data=CMSPageCreate(slug="draft-page", page_type="trek_guide", title="Draft", status="draft"))
        create_page(db, data=CMSPageCreate(slug="pub-page", page_type="trek_guide", title="Published", status="published"))
        db.commit()
        drafts = list_pages(db, status="draft", limit=10000)
        published = list_pages(db, status="published", limit=10000)
    assert len(drafts) == before_drafts + 1
    assert len(published) == before_published + 1


def test_list_pages_filters_by_trek_state_and_difficulty():
    with SessionLocal() as db:
        db.add(CMSPage(
            slug="filter-trek-a", page_type="trek_guide", title="Filter Trek A", status="published",
            trek_state="Uttarakhand", trek_difficulty="Moderate", trek_duration="6 Days",
        ))
        db.add(CMSPage(
            slug="filter-trek-b", page_type="trek_guide", title="Filter Trek B", status="published",
            trek_state="Himachal Pradesh", trek_difficulty="Easy", trek_duration="3 Days",
        ))
        db.commit()

        by_state = list_pages(db, trek_state="Uttarakhand", limit=10000)
        by_difficulty = list_pages(db, trek_difficulty="Easy", limit=10000)
        by_both = list_pages(db, trek_state="Uttarakhand", trek_difficulty="Moderate", limit=10000)
        by_mismatch = list_pages(db, trek_state="Uttarakhand", trek_difficulty="Easy", limit=10000)

    assert "filter-trek-a" in {p.slug for p in by_state}
    assert "filter-trek-b" not in {p.slug for p in by_state}
    assert "filter-trek-b" in {p.slug for p in by_difficulty}
    assert "filter-trek-a" in {p.slug for p in by_both}
    assert "filter-trek-a" not in {p.slug for p in by_mismatch}


def test_list_pages_trek_state_substring_matches_composite_region():
    """International regions: a 'Nepal'/'Tibet' filter matches composite trek_state values; exact
    single-state filters are unaffected (nothing else contains 'Himachal Pradesh')."""
    with SessionLocal() as db:
        db.add(CMSPage(
            slug="everest-bc-x", page_type="trek_guide", title="Everest BC", status="published",
            trek_state="Koshi Province, Nepal / Tibet, China",
        ))
        db.add(CMSPage(
            slug="triund-region-x", page_type="trek_guide", title="Triund", status="published",
            trek_state="Himachal Pradesh",
        ))
        db.commit()
        nepal = {p.slug for p in list_pages(db, trek_state="Nepal", limit=10000)}
        tibet = {p.slug for p in list_pages(db, trek_state="Tibet", limit=10000)}
        himachal = {p.slug for p in list_pages(db, trek_state="Himachal Pradesh", limit=10000)}

    assert "everest-bc-x" in nepal and "triund-region-x" not in nepal
    assert "everest-bc-x" in tibet
    assert "triund-region-x" in himachal and "everest-bc-x" not in himachal


def test_list_pages_filters_by_trek_duration_range():
    with SessionLocal() as db:
        db.add(CMSPage(
            slug="filter-trek-short", page_type="trek_guide", title="Short Trek", status="published",
            trek_duration="2 Days",
        ))
        db.add(CMSPage(
            slug="filter-trek-long", page_type="trek_guide", title="Long Trek", status="published",
            trek_duration="10 Days",
        ))
        db.commit()

        short_range = list_pages(db, trek_duration_min=1, trek_duration_max=3, limit=10000)
        long_range = list_pages(db, trek_duration_min=8, trek_duration_max=12, limit=10000)

    assert "filter-trek-short" in {p.slug for p in short_range}
    assert "filter-trek-long" not in {p.slug for p in short_range}
    assert "filter-trek-long" in {p.slug for p in long_range}
    assert "filter-trek-short" not in {p.slug for p in long_range}


def test_get_page_returns_master_cms_trek_metadata():
    """STEP-M30 N07: trek-detail response must expose the full Master CMS trek metadata."""
    with SessionLocal() as db:
        db.add(CMSPage(
            slug="meta-trek", page_type="trek_guide", title="Meta Trek", status="published",
            content_html="<p>x</p>",
            trek_region="Garhwal Himalaya", trek_max_altitude_ft=15000,
            trek_duration_days_min=5, trek_duration_days_max=7,
            trek_best_months=[5, 6, 9], trek_permit_required=True,
            trek_budget_min=12000, trek_budget_max=18000, trek_crowd_level="moderate",
            trek_beginner_friendly=False, trek_solo_friendly=True, trek_family_friendly=False,
        ))
        db.commit()

    r = client.get("/api/v1/cms/pages/meta-trek")
    assert r.status_code == 200
    body = r.json()
    assert body["trek_region"] == "Garhwal Himalaya"
    assert body["trek_max_altitude_ft"] == 15000
    assert body["trek_best_months"] == [5, 6, 9]
    assert body["trek_budget_min"] == 12000 and body["trek_budget_max"] == 18000
    assert body["trek_crowd_level"] == "moderate"
    assert body["trek_solo_friendly"] is True and body["trek_beginner_friendly"] is False


def test_list_pages_excludes_content_html_but_detail_keeps_it():
    """Vitals fix: LIST endpoints drop the heavy content_html (cards never render the body); the
    single-page endpoint keeps it. content_json is retained (web reads trek_facts.altitude)."""
    with SessionLocal() as db:
        db.add(CMSPage(
            slug="light-list-trek", page_type="trek_guide", title="Light List Trek",
            status="published", content_html="<h1>BIG BODY</h1>",
            content_json={"trek_facts": {"altitude": "4500m"}},
        ))
        db.commit()

    r_list = client.get("/api/v1/cms/pages?page_type=trek_guide&status=published&limit=200")
    assert r_list.status_code == 200
    item = next(p for p in r_list.json() if p["slug"] == "light-list-trek")
    assert item["content_html"] == ""                      # heavy body blanked in the list
    assert item["content_json"]["trek_facts"]["altitude"] == "4500m"  # content_json kept
    assert item["title"] == "Light List Trek"

    r_detail = client.get("/api/v1/cms/pages/light-list-trek")
    assert r_detail.status_code == 200
    assert r_detail.json()["content_html"] == "<h1>BIG BODY</h1>"      # detail keeps the body


def test_list_pages_filters_by_trek_suitability():
    with SessionLocal() as db:
        db.add(CMSPage(
            slug="suit-trek-family", page_type="trek_guide", title="Family Trek", status="published",
            trek_suitability="Families, Beginners",
        ))
        db.add(CMSPage(
            slug="suit-trek-experts", page_type="trek_guide", title="Expert Trek", status="published",
            trek_suitability="Experienced trekkers",
        ))
        db.commit()

        # Substring match (mirrors the web Explore .includes filter)
        families = list_pages(db, trek_suitability="Families", limit=10000)
        experts = list_pages(db, trek_suitability="Experienced", limit=10000)

    assert "suit-trek-family" in {p.slug for p in families}
    assert "suit-trek-experts" not in {p.slug for p in families}
    assert "suit-trek-experts" in {p.slug for p in experts}
    assert "suit-trek-family" not in {p.slug for p in experts}


def test_list_pages_no_filters_unchanged():
    with SessionLocal() as db:
        before = len(list_pages(db, limit=10000))
        after = len(list_pages(db, status=None, page_type=None, trek_state=None, limit=10000))
    assert before == after


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

def test_api_list_pages_returns_list():
    r = client.get("/api/v1/cms/pages")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_api_list_pages_filters_by_trek_state():
    client.post("/api/v1/cms/pages", json={
        "slug": "api-filter-trek", "page_type": "trek_guide", "title": "API Filter Trek",
        "status": "published",
    })
    client.patch("/api/v1/cms/pages/api-filter-trek", json={"trek_state": "Sikkim", "trek_difficulty": "Difficult"})
    r = client.get("/api/v1/cms/pages", params={"trek_state": "Sikkim", "trek_difficulty": "Difficult"})
    assert r.status_code == 200
    slugs = {p["slug"] for p in r.json()}
    assert "api-filter-trek" in slugs

    r_mismatch = client.get("/api/v1/cms/pages", params={"trek_state": "Sikkim", "trek_difficulty": "Easy"})
    assert "api-filter-trek" not in {p["slug"] for p in r_mismatch.json()}


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
    # The error now says "No markdown source found" since the page has no brief_id and no content
    assert "no-brief-page" in r.json()["detail"]


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


def test_extract_trek_facts_permits_required_format():
    """'Permit Required: Yes — ...' must map to permits field."""
    md = "**Permit Required:** Yes — Churdhar Wildlife Sanctuary entry permit"
    facts = _extract_trek_facts_from_markdown(md)
    assert "permits" in facts
    assert "Yes" in facts["permits"]


def test_extract_trek_facts_nearest_base_villages():
    """'Nearest Base Villages: Nohradhar / Sarahan *(Note:...)*' — base extracted, note stripped."""
    md = "**Nearest Base Villages:** Nohradhar / Sarahan *(Note: Sarahan here refers to the village near Nohradhar)*"
    facts = _extract_trek_facts_from_markdown(md)
    assert "base" in facts
    assert "Nohradhar" in facts["base"]
    # Note text should be stripped
    assert "Note:" not in facts["base"]


def test_parse_faqs_from_section_bold_format():
    """Bold-question / paragraph-answer format parsed into [{q, a}] list."""
    md = (
        "**What is the altitude?**\n"
        "The peak is at 3,647 m above sea level.\n\n"
        "**Can beginners do this trek?**\n"
        "Yes, but prior fitness training is recommended."
    )
    faqs = _parse_faqs_from_section(md)
    assert len(faqs) == 2
    assert faqs[0]["q"] == "What is the altitude?"
    assert "3,647" in faqs[0]["a"]
    assert faqs[1]["q"] == "Can beginners do this trek?"
    assert "fitness" in faqs[1]["a"]


def test_extract_faq_section_raw():
    """FAQ section extracted by heading; content before next H2 returned."""
    md = (
        "## Some other section\n"
        "Content here.\n\n"
        "## Frequently Asked Questions About the Trek\n"
        "**Q1?**\nAnswer 1.\n\n"
        "**Q2?**\nAnswer 2.\n\n"
        "## Safety Tips\n"
        "Safety content."
    )
    raw = _extract_faq_section_raw(md)
    assert "Q1?" in raw
    assert "Answer 1" in raw
    assert "Safety Tips" not in raw


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


# ── Table-format fact extraction ──────────────────────────────────────────────

def test_extract_trek_facts_table_duration():
    """Table row '| **Duration** | 7 days |' must be extracted correctly."""
    md = "| **Duration** | 7 days (standard) · 9 days (acclimatisation variant) |\n| **Difficulty** | Difficult |"
    facts = _extract_trek_facts_from_markdown(md)
    assert "duration" in facts
    assert "7 days" in facts["duration"]


def test_extract_trek_facts_table_altitude():
    md = "| **Maximum Altitude** | ~5,400 m / 17,700 ft (Gauri Pass) |"
    facts = _extract_trek_facts_from_markdown(md)
    assert "altitude" in facts
    assert "5,400" in facts["altitude"]


def test_extract_trek_facts_table_difficulty():
    md = "| **Difficulty** | Difficult |"
    facts = _extract_trek_facts_from_markdown(md)
    assert "difficulty" in facts
    assert "Difficult" in facts["difficulty"]


def test_extract_trek_facts_table_season():
    md = "| **Best Season** | May–June · September–October |"
    facts = _extract_trek_facts_from_markdown(md)
    assert "season" in facts
    assert "May" in facts["season"]


def test_extract_trek_facts_table_permits():
    md = "| **Permits Required** | Kedarnath Wildlife Sanctuary forest permit |"
    facts = _extract_trek_facts_from_markdown(md)
    assert "permits" in facts
    assert "Kedarnath" in facts["permits"]


def test_extract_trek_facts_table_base():
    md = "| **Base Camp / Last Village** | Gauri Kund (1,982 m) |"
    facts = _extract_trek_facts_from_markdown(md)
    assert "base" in facts
    assert "Gauri Kund" in facts["base"]


def test_season_heading_not_captured_as_fact():
    """'## What Is the Best Time to Do the X Trek?' must NOT be captured as season fact."""
    md = "## What Is the Best Time to Do the Gauri Pass Trek?\n\nMay–June and September–October are ideal."
    facts = _extract_trek_facts_from_markdown(md)
    # Season should not be extracted from a heading (no colon → no key:value match)
    if "season" in facts:
        # If extracted, value should be the actual season text, not the heading tail
        assert "to Do" not in facts["season"]


# ── H3-format FAQ parsing ──────────────────────────────────────────────────────

def test_parse_faqs_from_section_h3_format():
    """H3-heading questions ('### Question?\\nAnswer') parsed correctly."""
    md = (
        "### How difficult is the Gauri Pass trek?\n"
        "The trek is rated Difficult and requires prior high-altitude experience.\n\n"
        "### What permits are required?\n"
        "A Kedarnath Wildlife Sanctuary forest permit is mandatory."
    )
    faqs = _parse_faqs_from_section(md)
    assert len(faqs) == 2
    assert "How difficult" in faqs[0]["q"]
    assert "Difficult" in faqs[0]["a"]
    assert "permit" in faqs[1]["a"].lower()


def test_parse_faqs_mixed_formats():
    """Both H3 and bold formats in the same section are parsed without loss."""
    md = (
        "### First question?\n"
        "Answer to first question.\n\n"
        "**Second question?**\n"
        "Answer to second question."
    )
    faqs = _parse_faqs_from_section(md)
    assert len(faqs) == 2


def test_clear_non_completed_pipeline_runs():
    """DELETE /admin/pipeline/runs/clear removes failed/cancelled runs only."""
    # Seed a completed run and a failed run
    from app.modules.pipeline import service as ps
    with SessionLocal() as db:
        completed = ps.create_pipeline_run(db, start_stage="trend_discovery", end_stage="publish", input_data={})
        db.commit()
        # Manually mark one as failed
        failed = ps.create_pipeline_run(db, start_stage="trend_discovery", end_stage="publish", input_data={})
        failed.status = "failed"
        db.commit()

    r = client.delete("/api/v1/admin/pipeline/runs/clear")
    assert r.status_code == 200
    data = r.json()
    assert data["deleted_runs"] >= 1  # the failed run deleted

    with SessionLocal() as db:
        from app.modules.pipeline.models import PipelineRun
        from sqlalchemy import select as sa_select
        remaining = db.scalars(sa_select(PipelineRun)).all()
        statuses = {r.status for r in remaining}
        # Only completed runs should persist
        assert "failed" not in statuses


def test_clear_non_completed_agent_runs():
    """DELETE /admin/agent-runs/clear removes non-completed agent runs."""
    from app.modules.agents.models import AgentRun
    from app.modules.agents import service as agent_svc

    with SessionLocal() as db:
        run_id = agent_svc.start_run(db, "trend_discovery", {"test": True})
        db.commit()  # this creates a "running" run

    r = client.delete("/api/v1/admin/agent-runs/clear")
    assert r.status_code == 200
    assert r.json()["deleted"] >= 1


# ── Fact-check claim PATCH ────────────────────────────────────────────────────

def _make_draft_claim(draft_id: str, flagged: bool = True) -> str:
    """Create a DraftClaim directly via DB and return claim id."""
    from app.modules.content.models import DraftClaim as DC
    import uuid as _uuid
    from datetime import datetime, timezone
    claim_id = _uuid.uuid4()
    with SessionLocal() as db:
        claim = DC(
            id=claim_id,
            draft_id=_uuid.UUID(draft_id),
            claim_text="The summit altitude is 4,200 m.",
            claim_type="altitude",
            confidence_score=0.55,
            flagged_for_review=flagged,
            created_at=datetime.now(timezone.utc),
        )
        db.add(claim)
        db.commit()
    return str(claim_id)


def test_patch_fact_check_claim_mark_verified():
    """PATCH /admin/fact-check/claims/{id} with flagged_for_review=false unflags claim."""
    _, draft_id = _make_brief_and_draft(uuid.uuid4().hex[:8])
    claim_id = _make_draft_claim(draft_id, flagged=True)
    r = client.patch(f"/api/v1/admin/fact-check/claims/{claim_id}",
                     json={"flagged_for_review": False})
    assert r.status_code == 200
    data = r.json()
    assert data["flagged_for_review"] is False
    assert data["id"] == claim_id


def test_patch_fact_check_claim_404():
    """PATCH with unknown UUID returns 404."""
    fake_id = str(uuid.uuid4())
    r = client.patch(f"/api/v1/admin/fact-check/claims/{fake_id}",
                     json={"flagged_for_review": False})
    assert r.status_code == 404


# ── Flagged-marker stripping ──────────────────────────────────────────────────

def test_flagged_marker_stripped_from_sections():
    """'*(flagged for verification)*' markers must be stripped from section HTML."""
    md = ("## Route Overview\n"
          "The route covers 4,200 m *(flagged for verification)* of altitude gain. "
          "Stream crossings are highest in June. *(flagged for verification — verify timing)*")
    sections = _parse_sections_from_markdown(md)
    assert "route_overview" in sections
    html = sections["route_overview"]
    assert "flagged" not in html.lower(), f"Flagged marker not stripped: {html}"


def test_flagged_bracket_marker_stripped():
    """'[flagged for verification — rates vary]' bracket form must be stripped."""
    md = ("## Cost and Budget\n"
          "Trek costs around ₹15,000 [flagged for verification — rates vary by season].")
    sections = _parse_sections_from_markdown(md)
    assert "cost_estimate" in sections
    html = sections["cost_estimate"]
    assert "flagged" not in html.lower(), f"Bracket marker not stripped: {html}"


def test_medical_heading_maps_to_safety():
    """'## Medical Considerations at High Altitude' must map to safety section."""
    md = "## Medical Considerations at High Altitude\nAcclimatisation is mandatory above 3,500 m."
    sections = _parse_sections_from_markdown(md)
    assert "safety" in sections, "medical heading should map to safety section"


def test_financial_heading_maps_to_cost():
    """'## Financial Planning for the Trek' must map to cost_estimate section."""
    md = "## Financial Planning for the Trek\nBudget ₹25,000–₹40,000 depending on group size."
    sections = _parse_sections_from_markdown(md)
    assert "cost_estimate" in sections, "financial heading should map to cost_estimate section"
