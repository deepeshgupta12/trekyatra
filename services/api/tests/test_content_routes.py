import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.db.session import SessionLocal
from app.main import app
from app.modules.content.models import ContentBrief, ContentDraft, KeywordCluster, TopicOpportunity

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_content_state() -> None:
    with SessionLocal() as db:
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
        db.commit()
    yield
    with SessionLocal() as db:
        db.execute(delete(ContentDraft))
        db.execute(delete(ContentBrief))
        db.execute(delete(KeywordCluster))
        db.execute(delete(TopicOpportunity))
        db.commit()


def test_create_and_list_topic() -> None:
    slug = f"kedarkantha-{uuid.uuid4().hex[:8]}"
    create_response = client.post(
        "/api/v1/topics",
        json={
            "title": "Kedarkantha winter opportunity",
            "slug": slug,
            "primary_keyword": "kedarkantha trek guide",
            "source": "search_console",
            "intent": "informational",
            "page_type": "trek_guide",
            "trend_score": 8.5,
            "urgency_score": 7.0,
            "status": "new",
            "notes": {"season": "winter"},
        },
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/v1/topics")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["slug"] == slug


def test_create_and_list_cluster() -> None:
    create_response = client.post(
        "/api/v1/clusters",
        json={
            "name": f"winter-treks-{uuid.uuid4().hex[:6]}",
            "primary_keyword": "best winter treks in india",
            "supporting_keywords": ["winter treks", "snow treks india"],
            "intent": "informational",
            "pillar_title": "Best Winter Treks in India",
            "status": "draft",
            "notes": {"priority": "high"},
        },
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/v1/clusters")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_create_brief_and_draft() -> None:
    topic_response = client.post(
        "/api/v1/topics",
        json={
            "title": "Hampta Pass permit angle",
            "slug": f"hampta-pass-{uuid.uuid4().hex[:8]}",
            "primary_keyword": "hampta pass permit guide",
        },
    )
    assert topic_response.status_code == 201
    topic_id = topic_response.json()["id"]

    cluster_response = client.post(
        "/api/v1/clusters",
        json={
            "name": f"permit-guides-{uuid.uuid4().hex[:6]}",
            "primary_keyword": "trek permit guide",
        },
    )
    assert cluster_response.status_code == 201
    cluster_id = cluster_response.json()["id"]

    brief_response = client.post(
        "/api/v1/briefs",
        json={
            "topic_opportunity_id": topic_id,
            "keyword_cluster_id": cluster_id,
            "title": "Hampta Pass Permit Guide",
            "slug": f"hampta-pass-permit-guide-{uuid.uuid4().hex[:6]}",
            "target_keyword": "hampta pass permit guide",
            "secondary_keywords": ["hampta pass permit cost"],
            "intent": "informational",
            "page_type": "permit_guide",
            "heading_outline": [{"h2": "Who needs a permit?"}],
            "faqs": [{"question": "Do I need a permit?", "answer": "Yes"}],
            "internal_link_targets": ["/treks/hampta-pass"],
            "schema_recommendations": ["FAQPage"],
            "monetization_notes": {"ads": "light"},
            "status": "draft",
        },
    )
    assert brief_response.status_code == 201
    brief_id = brief_response.json()["id"]

    draft_response = client.post(
        "/api/v1/drafts",
        json={
            "brief_id": brief_id,
            "title": "Hampta Pass Permit Guide Draft",
            "slug": f"hampta-pass-permit-guide-draft-{uuid.uuid4().hex[:6]}",
            "content_markdown": "## Permit overview\nThis is a long enough markdown body.",
            "excerpt": "Quick draft",
            "meta_title": "Hampta Pass Permit Guide",
            "meta_description": "Permit guide draft description",
            "version": 1,
            "confidence_score": 0.85,
            "status": "draft",
        },
    )
    assert draft_response.status_code == 201

    list_briefs = client.get("/api/v1/briefs")
    list_drafts = client.get("/api/v1/drafts")

    assert list_briefs.status_code == 200
    assert list_drafts.status_code == 200
    assert len(list_briefs.json()) == 1
    assert len(list_drafts.json()) == 1