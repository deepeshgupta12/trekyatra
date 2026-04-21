from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_treks_returns_all() -> None:
    response = client.get("/api/v1/treks")
    assert response.status_code == 200
    payload = response.json()
    assert "treks" in payload
    assert "total" in payload
    assert payload["total"] == len(payload["treks"])
    assert payload["total"] > 0

    trek = payload["treks"][0]
    for field in ("slug", "name", "region", "state", "duration", "altitude", "difficulty", "season", "description", "beginner"):
        assert field in trek


def test_list_treks_beginner_filter() -> None:
    response = client.get("/api/v1/treks?beginner=true")
    assert response.status_code == 200
    payload = response.json()
    assert all(t["beginner"] is True for t in payload["treks"])
    assert payload["total"] > 0


def test_list_treks_non_beginner_filter() -> None:
    response = client.get("/api/v1/treks?beginner=false")
    assert response.status_code == 200
    payload = response.json()
    assert all(t["beginner"] is False for t in payload["treks"])


def test_list_treks_state_filter() -> None:
    response = client.get("/api/v1/treks?state=Uttarakhand")
    assert response.status_code == 200
    payload = response.json()
    assert all(t["state"] == "Uttarakhand" for t in payload["treks"])
    assert payload["total"] > 0


def test_list_treks_difficulty_filter() -> None:
    response = client.get("/api/v1/treks?difficulty=Moderate")
    assert response.status_code == 200
    payload = response.json()
    assert all(t["difficulty"] == "Moderate" for t in payload["treks"])
    assert payload["total"] > 0


def test_get_trek_by_slug() -> None:
    response = client.get("/api/v1/treks/kedarkantha")
    assert response.status_code == 200
    payload = response.json()
    assert payload["slug"] == "kedarkantha"
    assert payload["name"] == "Kedarkantha"
    assert payload["beginner"] is True


def test_get_trek_not_found() -> None:
    response = client.get("/api/v1/treks/nonexistent-trek")
    assert response.status_code == 404
    assert response.json()["detail"] == "Trek not found"
