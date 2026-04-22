from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db
from app.modules.agents import service as agent_service

client = TestClient(app)


# ── discover-trends ───────────────────────────────────────────────────────────

def test_discover_trends_returns_agent_run_id():
    with patch("app.worker.tasks.agent_tasks.discover_trends_task.apply_async") as mock_task:
        mock_task.return_value = MagicMock()
        response = client.post(
            "/api/v1/admin/agents/discover-trends",
            json={"seed_topics": ["kedarkantha trek", "brahmatal trek guide"]},
        )
    assert response.status_code == 200
    data = response.json()
    assert "agent_run_id" in data
    assert isinstance(data["agent_run_id"], int)
    assert data["status"] == "running"


def test_discover_trends_dispatches_celery_task():
    with patch("app.worker.tasks.agent_tasks.discover_trends_task.apply_async") as mock_task:
        mock_task.return_value = MagicMock()
        client.post(
            "/api/v1/admin/agents/discover-trends",
            json={"seed_topics": ["himalayan trek packing list"]},
        )
    mock_task.assert_called_once()


# ── cluster-keywords ──────────────────────────────────────────────────────────

def test_cluster_keywords_returns_agent_run_id():
    db = next(get_db())
    try:
        # pre-create a trend_discovery run to get a valid run_id; use its id as a fake topic_id
        # (the endpoint only needs valid UUIDs for topic_ids, verified by the agent, not API)
        with patch("app.worker.tasks.agent_tasks.cluster_keywords_task.apply_async") as mock_task:
            mock_task.return_value = MagicMock()
            response = client.post(
                "/api/v1/admin/agents/cluster-keywords",
                json={"topic_ids": ["00000000-0000-0000-0000-000000000001"]},
            )
    finally:
        db.close()

    assert response.status_code == 200
    data = response.json()
    assert "agent_run_id" in data
    assert data["status"] == "running"


def test_cluster_keywords_dispatches_celery_task():
    with patch("app.worker.tasks.agent_tasks.cluster_keywords_task.apply_async") as mock_task:
        mock_task.return_value = MagicMock()
        client.post(
            "/api/v1/admin/agents/cluster-keywords",
            json={"topic_ids": ["00000000-0000-0000-0000-000000000002"]},
        )
    mock_task.assert_called_once()


# ── GET /admin/agent-runs/{id} ────────────────────────────────────────────────

def test_get_agent_run_returns_record():
    db = next(get_db())
    try:
        run = agent_service.start_run(db, "trend_discovery", {"seed_topics": ["test"]})
        response = client.get(f"/api/v1/admin/agent-runs/{run.id}")
    finally:
        db.close()

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == run.id
    assert data["agent_type"] == "trend_discovery"
    assert data["status"] == "running"


def test_get_agent_run_not_found():
    response = client.get("/api/v1/admin/agent-runs/999999")
    assert response.status_code == 404


# ── TrendDiscoveryAgent unit test (mocked LLM) ───────────────────────────────

def test_trend_discovery_agent_with_mocked_llm():
    import json
    from app.modules.agents.trend_discovery.agent import TrendDiscoveryAgent

    mock_topics = [
        {
            "title": "Kedarkantha Winter Trek Complete Guide",
            "primary_keyword": "kedarkantha winter trek",
            "slug": "kedarkantha-winter-trek-guide",
            "trend_score": 0.9,
            "urgency_score": 0.7,
            "page_type": "trek_guide",
            "intent": "informational",
            "source": "agent_trend_discovery",
            "notes": {"rationale": "High search volume, seasonal"},
        }
    ]

    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=json.dumps(mock_topics))]

    db = next(get_db())
    try:
        with patch("anthropic.Anthropic") as mock_client_cls, \
             patch("app.core.config.settings.anthropic_api_key", "sk-test"):
            mock_client = MagicMock()
            mock_client_cls.return_value = mock_client
            mock_client.messages.create.return_value = mock_message

            agent = TrendDiscoveryAgent(db=db)
            result = agent.run(
                {"seed_topics": ["kedarkantha winter trek"]},
                run_id=0,
            )

        assert "output" in result
        assert result["output"]["count"] >= 1
    finally:
        db.close()


# ── KeywordClusterAgent unit test (mocked LLM) ───────────────────────────────

def test_keyword_cluster_agent_no_topics_returns_error():
    from app.modules.agents.keyword_cluster.agent import KeywordClusterAgent

    db = next(get_db())
    try:
        agent = KeywordClusterAgent(db=db)
        result = agent.run({"topic_ids": []}, run_id=0)
        assert result.get("errors")
    finally:
        db.close()
