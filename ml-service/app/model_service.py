"""Training, persistence, evaluation, and inference for both ML tasks."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .dataset import CLASS_TARGET, FEATURE_COLUMNS, REGRESSION_TARGET, generate_synthetic_dataset, validate_dataset
from .features import extract_features

MODEL_VERSION = "1.0.0"
FEATURE_VERSION = "features-v1"
EXPLANATION_VERSION = "part7-v1"
SIGNIFICANT_DELAY_THRESHOLD_MONTHS = 5.0


class ModelUnavailableError(RuntimeError):
    pass


class TrainingError(ValueError):
    pass


def _pipeline(model):
    categorical = [c for c in FEATURE_COLUMNS if c not in ("land_area", "affected_families")]
    numeric = ["land_area", "affected_families"]
    return Pipeline([("preprocessor", ColumnTransformer([
        ("numeric", StandardScaler(), numeric),
        ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
    ])), ("model", model)])


def train_models(data: pd.DataFrame, output_dir: str | Path, random_state: int = 42) -> dict:
    try:
        validation = validate_dataset(data)
    except ValueError as exc:
        raise TrainingError(str(exc)) from exc
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    train, test = train_test_split(data, test_size=.2, random_state=random_state, stratify=data[CLASS_TARGET])
    classifier = _pipeline(LogisticRegression(max_iter=1000, random_state=random_state))
    regressor = _pipeline(RandomForestRegressor(n_estimators=150, random_state=random_state, n_jobs=1))
    classifier.fit(train[FEATURE_COLUMNS], train[CLASS_TARGET])
    regressor.fit(train[FEATURE_COLUMNS], train[REGRESSION_TARGET])
    class_pred = classifier.predict(test[FEATURE_COLUMNS])
    class_prob = classifier.predict_proba(test[FEATURE_COLUMNS])[:, 1]
    reg_pred = regressor.predict(test[FEATURE_COLUMNS])
    metrics = {
        "classification": {"accuracy": round(accuracy_score(test[CLASS_TARGET], class_pred), 4),
                           "precision": round(precision_score(test[CLASS_TARGET], class_pred, zero_division=0), 4),
                           "recall": round(recall_score(test[CLASS_TARGET], class_pred, zero_division=0), 4),
                           "f1": round(f1_score(test[CLASS_TARGET], class_pred, zero_division=0), 4),
                           "roc_auc": round(roc_auc_score(test[CLASS_TARGET], class_prob), 4),
                           "confusion_matrix": confusion_matrix(test[CLASS_TARGET], class_pred).tolist()},
        "regression": {"mae": round(mean_absolute_error(test[REGRESSION_TARGET], reg_pred), 4),
                       "rmse": round(mean_squared_error(test[REGRESSION_TARGET], reg_pred) ** 0.5, 4),
                       "r2": round(r2_score(test[REGRESSION_TARGET], reg_pred), 4)},
    }
    joblib.dump(classifier, out / "classification.joblib")
    joblib.dump(regressor, out / "regression.joblib")
    metadata = {"model_version": MODEL_VERSION, "model_type": "logistic-regression + random-forest-regressor",
                "feature_version": FEATURE_VERSION, "trained_at": datetime.now(timezone.utc).isoformat(),
                "dataset": {"label": "synthetic", "rows": validation.rows, "random_state": random_state},
                "features": FEATURE_COLUMNS, "metrics": metrics,
                "target_definition": {"name": "SIGNIFICANT_DELAY", "threshold_months": SIGNIFICANT_DELAY_THRESHOLD_MONTHS},
                "artifacts": ["classification.joblib", "regression.joblib"]}
    (out / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


class PredictionService:
    def __init__(self, artifact_dir: str | Path = "artifacts"):
        self.artifact_dir = Path(artifact_dir)
        self.classifier = self.regressor = None
        self.metadata = None
        self._load()

    def _load(self):
        try:
            self.classifier = joblib.load(self.artifact_dir / "classification.joblib")
            self.regressor = joblib.load(self.artifact_dir / "regression.joblib")
            self.metadata = json.loads((self.artifact_dir / "metadata.json").read_text(encoding="utf-8"))
        except (OSError, ValueError, EOFError, joblib.externals.loky.process_executor.TerminatedWorkerError):
            self.classifier = self.regressor = self.metadata = None

    def is_available(self):
        return self.classifier is not None and self.regressor is not None

    def model_info(self):
        return self.metadata or {"model_available": False, "model_version": None}

    def predict(self, payload: dict):
        if not self.is_available():
            raise ModelUnavailableError("No trained model artifacts are available; run the training CLI.")
        try:
            features = extract_features(payload)
        except ValueError as exc:
            raise TrainingError(str(exc)) from exc
        probability = float(self.classifier.predict_proba(features)[0, 1])
        months = max(0.0, float(self.regressor.predict(features)[0]))
        return {"project_id": payload.get("project_id", payload.get("projectId")),
                "model_version": self.metadata["model_version"], "delay_probability": round(probability, 4),
                "predicted_delay_months": round(months, 2),
                "predicted_risk_level": "CRITICAL" if probability >= .8 else "HIGH" if probability >= .6 else "MODERATE" if probability >= .3 else "LOW",
                "generated_at": datetime.now(timezone.utc).isoformat(), "prediction_status": "READY",
                "data_quality": "synthetic-model"}

    def predict_with_explanation(self, payload: dict):
        """Return a prediction and local, model-derived logistic drivers."""
        result = self.predict(payload)
        if self.classifier is None:
            raise ModelUnavailableError("The classification model is unavailable; explanations cannot be generated.")

        try:
            features = extract_features(payload)
            preprocessor = self.classifier.named_steps["preprocessor"]
            model = self.classifier.named_steps["model"]
            transformed = preprocessor.transform(features)
            values = transformed.toarray()[0] if hasattr(transformed, "toarray") else transformed[0]
            names = preprocessor.get_feature_names_out()
            coefficients = model.coef_[0]
        except (AttributeError, KeyError, IndexError, TypeError, ValueError) as exc:
            raise ModelUnavailableError("The classification model cannot provide explanations.") from exc

        labels = {
            "state_id": "State",
            "district_id": "District",
            "project_type": "Project type",
            "land_area": "Land area",
            "affected_families": "Affected families",
            "acquisition_stage": "Acquisition stage",
        }
        raw_values = features.iloc[0].to_dict()
        contributions = {feature: 0.0 for feature in FEATURE_COLUMNS}
        for name, coefficient, transformed_value in zip(names, coefficients, values):
            # ColumnTransformer names are "<transformer>__<feature>[_category]".
            encoded = name.split("__", 1)[-1]
            feature = next((item for item in FEATURE_COLUMNS
                            if encoded == item or encoded.startswith(f"{item}_")), encoded)
            if feature in contributions:
                contributions[feature] += float(coefficient) * float(transformed_value)

        drivers = []
        for feature, contribution in contributions.items():
            rounded = round(contribution, 6)
            drivers.append({
                "feature": feature,
                "label": labels.get(feature, feature.replace("_", " ").title()),
                "value": raw_values[feature],
                "contribution": rounded,
                "direction": "positive" if rounded > 0 else "negative" if rounded < 0 else "neutral",
                "impact": "increases risk" if rounded > 0 else "decreases risk" if rounded < 0 else "neutral",
            })
        drivers.sort(key=lambda item: (-abs(item["contribution"]), item["feature"]))
        top_drivers = drivers[:5]
        active = [item for item in top_drivers if item["direction"] != "neutral"]
        if active:
            summary = ("The highest-impact factors are "
                       + ", ".join(f"{item['label']} ({item['impact']})" for item in active)
                       + ".")
        else:
            summary = "No input features made a material contribution to the predicted risk."
        explanation = {
            "explanationVersion": EXPLANATION_VERSION,
            "summary": summary,
            "topDrivers": top_drivers,
            "drivers": drivers,
            "metadata": {
                "modelVersion": self.metadata.get("model_version"),
                "featureVersion": self.metadata.get("feature_version"),
                "method": "logistic coefficient × transformed feature value",
            },
        }
        return {**result, "explanationVersion": EXPLANATION_VERSION, "explanation": explanation}
