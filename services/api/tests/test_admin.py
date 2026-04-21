import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _create_topic() -> str:
    slug = f"admin-topic-{uuid.uuid4().hex[:8]}"
    response = client.post(
        "/api/v1/topics",
        json={
            "title": "Admin topic seed",
            "slug": slug,
            "primary_keyword": "admin topic keyword",
            "source": "search_console",
            "intent": "informational",
            "page_type": "trek_guide",
            "trend_score": 8.0,
            "urgency_score": 7.0,
            "status": "new",
            "notes": {"seed": True},
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_cluster() -> str:
    name = f"admin-cluster-{uuid.uuid4().hex[:8]}"
    response = client.post(
        "/api/v1/clusters",
        json={
            "name": name,
            "primary_keyword": "best winter treks",
            "supporting_keywords": ["winter treks", "snow treks"],
            "intent": "informational",
            "pillar_title": "Best Winter Treks",
            "status": "draft",
            "notes": {"seed": True},
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_brief(topic_id: str, cluster_id: str) -> str:
    slug = f"admin-brief-{uuid.uuid4().hex[:8]}"
    response = client.post(
        "/api/v1/briefs",
        json={
            "topic_opportunity_id": topic_id,
            "keyword_cluster_id": cluster_id,
            "title": "Admin brief seed",
            "slug": slug,
            "target_keyword": "kedarkantha trek guide",
            "secondary_keywords": ["kedarkantha itinerary"],
            "intent": "informational",
            "page_type": "trek_guide",
            "heading_outline": [{"h2": "Overview"}],
            "faqs": [{"question": "When to go?", "answer": "Winter"}],
            "internal_link_targets": ["/kedarkantha"],
            "schema_recommendations": ["FAQPage"],
            "monetization_notes": {"lead": "plan-my-trek"},
            "status": "draft",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create_draft(brief_id: str) -> str:
    slug = f"admin-draft-{uuid.uuid4().hex[:8]}"
    response = client.post(
        "/api/v1/drafts",
        json={
            "brief_id": brief_id,
            "title": "Admin draft seed",
            "slug": slug,
            "content_markdown": "This is a sufficiently long markdown body for the admin draft seed.",
            "excerpt": "Short excerpt",
            "meta_title": "Admin Draft Meta",
            "meta_description": "Admin draft meta description.",
            "version": 1,
            "confidence_score": 0.82,
            "status": "draft",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_admin_dashboard_summary() -> None:
    topic_id = _create_topic()
    cluster_id = _create_cluster()
    brief_id = _create_brief(topic_id, cluster_id)
    _create_draft(brief_id)

    response = client.get("/api/v1/admin/dashboard/summary")
    assert response.status_code == 200

    payload = response.json()
    assert "topics" in payload
    assert "clusters" in payload
    assert "briefs" in payload
    assert "drafts" in payload
    assert "wordpress" in payload
    assert "generated_at" in payload

    assert payload["topics"]["total"] >= 1
    assert payload["clusters"]["total"] >= 1
    assert payload["briefs"]["total"] >= 1
    assert payload["drafts"]["total"] >= 1


def test_admin_topics_summary() -> None:
    response = client.get("/api/v1/admin/topics/summary")
    assert response.status_code == 200

    payload = response.json()
    assert "total" in payload
    assert "by_status" in payload
    assert "by_source" in payload
    assert "recent_count" in payload
    assert "latest_created_at" in payload


def test_admin_briefs_summary() -> None:
    response = client.get("/api/v1/admin/briefs/summary")
    assert response.status_code == 200

    payload = response.json()
    assert "total" in payload
    assert "by_status" in payload
    assert "recent_count" in payload
    assert "latest_created_at" in payload


def test_admin_drafts_summary() -> None:
    response = client.get("/api/v1/admin/drafts/summary")
    assert response.status_code == 200

    payload = response.json()
    assert "total" in payload
    assert "by_status" in payload
    assert "recent_count" in payload
    assert "latest_created_at" in payload


def test_admin_system_summary() -> None:
    response = client.get("/api/v1/admin/system/summary")
    assert response.status_code == 200

    payload = response.json()
    assert payload["api_status"] == "ok"
    assert payload["database_status"] in {"ok", "error"}
    assert "environment" in payload
    assert "wordpress" in payload
    assert "generated_at" in payload