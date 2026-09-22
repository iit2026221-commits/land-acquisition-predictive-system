def test_prediction_workflow_stores_and_lists_history(client, monkeypatch):
    from app.services import prediction_workflow

    monkeypatch.setattr(
        prediction_workflow,
        "request_prediction",
        lambda _path, _payload: {
            "project_id": "LA-TEST-001",
            "model_version": "1.0.0",
            "delay_probability": 0.72,
            "predicted_delay_months": 6.4,
            "predicted_risk_level": "HIGH",
            "generated_at": "2026-09-08T00:00:00Z",
            "prediction_status": "READY",
            "data_quality": "STRONG",
            "explanation": {"explanationVersion": "1.0.0", "summary": "Synthetic test", "topDrivers": [], "drivers": [], "metadata": {"method": "test"}},
        },
    )
    login = client.post("/api/v1/auth/login", json={"username": "analyst", "password": "analyst123"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    payload = {
        "projectId": "LA-TEST-001", "name": "Test project", "state": "Rajasthan", "stateId": "rj",
        "district": "Alwar", "districtId": "rj-alw", "projectType": "Road", "landArea": 10,
        "affectedFamilies": 12, "acquisitionStage": "Compensation", "lastUpdated": "2026-09-08",
    }
    response = client.post("/api/v1/predictions/project/LA-TEST-001/run", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["run_id"]
    history = client.get("/api/v1/predictions/project/LA-TEST-001/history", headers=headers)
    assert history.status_code == 200
    assert history.json()[0]["status"] == "READY"
