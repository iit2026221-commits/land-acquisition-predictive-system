import json

import pytest

from app.dataset import generate_synthetic_dataset, validate_dataset
from app.features import extract_features
from app.model_service import ModelUnavailableError, PredictionService, TrainingError, train_models


def _payload():
    return {
        "project_id": "p1", "state_id": "state-a", "district_id": "district-1",
        "project_type": "rail", "land_area": 12.5, "affected_families": 8,
        "acquisition_stage": "award", "last_updated": "2025-01-01",
    }


def test_generator_is_reproducible_and_labelled():
    first = generate_synthetic_dataset(40)
    second = generate_synthetic_dataset(40)
    assert first.equals(second)
    assert validate_dataset(first).rows == 40


def test_feature_extraction_supports_canonical_aliases():
    features = extract_features({
        "stateId": "state-a", "districtId": "district-1", "projectType": "rail",
        "landArea": 12.5, "affectedFamilies": 8, "acquisitionStage": "award",
        "lastUpdated": "2025-01-01",
    })
    assert features.iloc[0]["land_area"] == 12.5


def test_training_persists_metadata_and_predicts(tmp_path):
    metadata = train_models(generate_synthetic_dataset(80), tmp_path)
    assert metadata["dataset"]["label"] == "synthetic"
    assert json.loads((tmp_path / "metadata.json").read_text())["model_version"] == "1.0.0"
    result = PredictionService(tmp_path).predict(_payload())
    assert 0 <= result["delay_probability"] <= 1


def test_missing_fields_are_rejected():
    with pytest.raises(ValueError, match="Missing project fields"):
        extract_features({"state": "State A"})


def test_explanation_orders_drivers_and_exposes_model_contributions(tmp_path):
    train_models(generate_synthetic_dataset(100), tmp_path)
    explanation = PredictionService(tmp_path).predict_with_explanation(_payload())["explanation"]
    drivers = explanation["topDrivers"]
    assert explanation["explanationVersion"] == "part7-v1"
    assert drivers == sorted(drivers, key=lambda item: -abs(item["contribution"]))
    assert all({"label", "value", "direction", "contribution"} <= set(item) for item in drivers)
    assert any(item["direction"] == "positive" for item in explanation["drivers"])
    assert any(item["direction"] == "negative" for item in explanation["drivers"])


def test_explanation_missing_input_is_structured_error(tmp_path):
    train_models(generate_synthetic_dataset(80), tmp_path)
    with pytest.raises(TrainingError, match="Missing project fields"):
        PredictionService(tmp_path).predict_with_explanation({"state": "State A"})


def test_explanation_model_unavailable_is_safe(tmp_path):
    service = PredictionService(tmp_path)
    with pytest.raises(ModelUnavailableError, match="trained model artifacts"):
        service.predict_with_explanation(_payload())
