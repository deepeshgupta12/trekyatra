from fastapi.testclient import TestClient

from app.main import app
from app.modules.wordpress.client import WordPressClientError
from app.schemas.wordpress import (
    WordPressCheckResult,
    WordPressConnectionTestResponse,
)

client = TestClient(app)


def test_wordpress_health_reports_configuration() -> None:
    response = client.get("/api/v1/wordpress/health")

    assert response.status_code == 200
    data = response.json()
    assert data["base_url"].startswith("http")
    assert data["rest_api_base_url"].endswith("/wp-json")


def test_wordpress_test_connection_success(monkeypatch) -> None:
    from app.api.routes import wordpress as wordpress_route

    def fake_connection_test() -> WordPressConnectionTestResponse:
        return WordPressConnectionTestResponse(
            base_url="http://localhost:8080",
            public_api=WordPressCheckResult(
                attempted=True,
                ok=True,
                endpoint="http://localhost:8080/wp-json",
                status_code=200,
                message="OK",
                payload_preview={"name": "TrekYatra WP"},
            ),
            authenticated_api=WordPressCheckResult(
                attempted=True,
                ok=True,
                endpoint="http://localhost:8080/wp-json/wp/v2/users/me",
                status_code=200,
                message="OK",
                payload_preview={"id": 1, "name": "admin"},
            ),
        )

    monkeypatch.setattr(
        wordpress_route,
        "run_wordpress_connection_test",
        fake_connection_test,
    )

    response = client.post("/api/v1/wordpress/test-connection")

    assert response.status_code == 200
    data = response.json()
    assert data["public_api"]["ok"] is True
    assert data["authenticated_api"]["attempted"] is True


def test_wordpress_test_connection_failure_maps_to_502(monkeypatch) -> None:
    from app.api.routes import wordpress as wordpress_route

    def fake_connection_test() -> WordPressConnectionTestResponse:
        raise WordPressClientError("Unable to connect to WordPress endpoint /wp-json")

    monkeypatch.setattr(
        wordpress_route,
        "run_wordpress_connection_test",
        fake_connection_test,
    )

    response = client.post("/api/v1/wordpress/test-connection")

    assert response.status_code == 502
    assert "Unable to connect to WordPress endpoint /wp-json" in response.json()["detail"]