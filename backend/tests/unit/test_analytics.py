from fastapi.testclient import TestClient

from app.main import app


def _token(client: TestClient, email: str) -> str:
    password = {"admin@landiq.demo": "admin123", "viewer@landiq.demo": "viewer123"}[email]
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_analytics_requires_permission() -> None:
    with TestClient(app) as client:
        token = _token(client, "viewer@landiq.demo")
        response = client.get("/api/v1/analytics/portfolio", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403


def test_analytics_portfolio_and_export_are_authorized() -> None:
    with TestClient(app) as client:
        token = _token(client, "admin@landiq.demo")
        headers = {"Authorization": f"Bearer {token}"}
        portfolio = client.get("/api/v1/analytics/portfolio", headers=headers)
        assert portfolio.status_code == 200
        assert {"project_count", "average_risk_score"} <= portfolio.json().keys()
        export = client.get("/api/v1/analytics/export", headers=headers)
        assert export.status_code == 200
        assert export.headers["content-type"].startswith("text/csv")
        assert "project_id" in export.text
