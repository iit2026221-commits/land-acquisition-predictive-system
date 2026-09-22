"""Feature extraction from canonical backend project payloads."""

from __future__ import annotations

import pandas as pd

from .dataset import FEATURE_COLUMNS


def extract_features(payload: dict) -> pd.DataFrame:
    def value(snake: str, camel: str, default=None):
        return payload.get(snake, payload.get(camel, default))

    row = {
        "state_id": value("state_id", "stateId"),
        "district_id": value("district_id", "districtId"),
        "project_type": value("project_type", "projectType"),
        "land_area": value("land_area", "landArea"),
        "affected_families": value("affected_families", "affectedFamilies"),
        "acquisition_stage": value("acquisition_stage", "acquisitionStage"),
    }
    missing = [key for key, item in row.items() if item is None or item == ""]
    if missing:
        raise ValueError(f"Missing project fields: {', '.join(missing)}")
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)
