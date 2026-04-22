from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_worker_health_returns_200():
    response = client.get("/api/v1/worker/health")
    assert response.status_code == 200


def test_worker_health_response_shape():
    response = client.get("/api/v1/worker/health")
    data = response.json()
    assert "status" in data
    assert "broker" in data
    assert "broker_url" in data


def test_worker_health_broker_connected():
    """Redis is running locally — broker must report ok."""
    response = client.get("/api/v1/worker/health")
    data = response.json()
    assert data["broker"] == "ok"
    assert data["status"] == "ok"


def test_worker_health_broker_url_uses_db1():
    """Broker URL must use Redis DB 1, separate from the main cache on DB 0."""
    response = client.get("/api/v1/worker/health")
    data = response.json()
    assert data["broker_url"].endswith("/1")
