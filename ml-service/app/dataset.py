"""Dataset loading, synthetic data generation, and validation utilities."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "state_id",
    "district_id",
    "project_type",
    "land_area",
    "affected_families",
    "acquisition_stage",
]

CLASS_TARGET = "delay_risk"
REGRESSION_TARGET = "delay_months"


@dataclass(frozen=True)
class DatasetValidation:
    rows: int
    features: list[str]
    targets: list[str]


def load_csv_dataset(csv_path: str) -> pd.DataFrame:
    """Load and validate a labelled land-acquisition dataset from CSV."""
    data = pd.read_csv(csv_path)

    # Remove accidental whitespace from column names.
    data.columns = data.columns.str.strip()

    # Convert numeric columns to proper numeric types.
    numeric_columns = [
        "land_area",
        "affected_families",
        CLASS_TARGET,
        REGRESSION_TARGET,
    ]

    for column in numeric_columns:
        data[column] = pd.to_numeric(data[column], errors="coerce")

    # Validate the dataset.
    validate_dataset(data)

    return data


def generate_synthetic_dataset(
    n_samples: int = 500,
    random_state: int = 42,
) -> pd.DataFrame:
    """Create a reproducible labelled synthetic dataset."""
    if n_samples < 20:
        raise ValueError("n_samples must be at least 20")

    rng = np.random.default_rng(random_state)

    states = np.array([
        "state-a",
        "state-b",
        "state-c",
        "state-d",
    ])

    stages = np.array([
        "notification",
        "negotiation",
        "award",
        "possession",
    ])

    types = np.array([
        "highway",
        "rail",
        "irrigation",
        "industrial",
    ])

    state = rng.choice(states, n_samples)
    stage = rng.choice(
        stages,
        n_samples,
        p=[0.3, 0.3, 0.25, 0.15],
    )

    project_type = rng.choice(types, n_samples)

    area = np.round(
        rng.lognormal(4.1, 0.65, n_samples),
        2,
    )

    families = rng.poisson(
        np.maximum(2, area * 0.8)
    ).astype(int)

    day = rng.integers(1, 365, n_samples)

    stage_risk = np.select(
        [
            stage == "notification",
            stage == "negotiation",
        ],
        [
            1.5,
            0.8,
        ],
        default=0,
    )

    raw = (
        0.015 * families
        + 0.025 * area
        + stage_risk
        + rng.normal(0, 0.8, n_samples)
    )

    months = np.round(
        np.clip(raw, 0, 24),
        2,
    )

    risk = (months >= 5).astype(int)

    return pd.DataFrame({
        "state_id": state,
        "district_id": np.char.add(
            "district-",
            rng.integers(1, 13, n_samples).astype(str),
        ),
        "project_type": project_type,
        "land_area": area,
        "affected_families": families,
        "acquisition_stage": stage,
        "last_updated": [
            f"2025-{(d // 31) + 1:02d}-{(d % 28) + 1:02d}"
            for d in day
        ],
        CLASS_TARGET: risk,
        REGRESSION_TARGET: months,
    })


def validate_dataset(data: pd.DataFrame) -> DatasetValidation:
    """Validate the structure and values of a training dataset."""
    required = set(
        FEATURE_COLUMNS
        + [
            CLASS_TARGET,
            REGRESSION_TARGET,
        ]
    )

    missing = required.difference(data.columns)

    if missing:
        raise ValueError(
            f"Dataset missing required columns: "
            f"{', '.join(sorted(missing))}"
        )

    if data.empty:
        raise ValueError("Dataset must contain at least one row")

    columns_to_check = FEATURE_COLUMNS + [
        CLASS_TARGET,
        REGRESSION_TARGET,
    ]

    if data[columns_to_check].isnull().any().any():
        raise ValueError("Dataset contains missing values")

    numeric = [
        "land_area",
        "affected_families",
        CLASS_TARGET,
        REGRESSION_TARGET,
    ]

    if not np.isfinite(
        data[numeric].to_numpy(dtype=float)
    ).all():
        raise ValueError(
            "Dataset contains non-finite numeric values"
        )

    if not set(data[CLASS_TARGET].unique()).issubset({0, 1}):
        raise ValueError(
            "delay_risk must contain only 0 and 1"
        )

    if data[CLASS_TARGET].nunique() < 2:
        raise ValueError(
            "delay_risk must contain both classes"
        )

    return DatasetValidation(
        len(data),
        FEATURE_COLUMNS.copy(),
        [
            CLASS_TARGET,
            REGRESSION_TARGET,
        ],
    )
