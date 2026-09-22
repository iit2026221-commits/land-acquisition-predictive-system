from fastapi.testclient import TestClient

from app.main import app


def test_login_and_permission_boundary():
    with TestClient(app) as client:
        response = client.post("/api/v1/auth/login", json={"username": "viewer", "password": "viewer123"})
        assert response.status_code == 200
        token = response.json()["access_token"]
        assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).json()["role"] == "viewer"
        headers = {"Authorization": f"Bearer {token}"}
        assert client.get("/api/v1/projects", headers=headers).status_code == 200
        assert client.post("/api/v1/projects", json={"name": "Denied"}, headers=headers).status_code == 403


def test_protected_endpoint_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/v1/projects")
        assert response.status_code == 401
        assert response.headers["X-Request-ID"]
