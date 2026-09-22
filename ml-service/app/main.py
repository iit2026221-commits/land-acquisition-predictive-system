"""FastAPI application for the land-acquisition prediction service."""

from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from .model_service import ModelUnavailableError, PredictionService, TrainingError

app = FastAPI(title="Land Acquisition ML Service", version="1.0.0")
service = PredictionService()


class PredictionInput(BaseModel):
    """Canonical project payload (camelCase aliases match the backend API)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    project_id: str = Field(alias="projectId", min_length=1)
    name: str = Field(min_length=1)
    state: str = Field(min_length=1)
    district: str = Field(min_length=1)
    project_type: str = Field(alias="projectType", min_length=1)
    land_area: float = Field(alias="landArea", ge=0)
    affected_families: int = Field(alias="affectedFamilies", ge=0)
    acquisition_stage: str = Field(alias="acquisitionStage", min_length=1)
    last_updated: str = Field(alias="lastUpdated", min_length=1)


class BatchPredictionInput(BaseModel):
    projects: list[PredictionInput] = Field(min_length=1, max_length=500)


@app.exception_handler(ModelUnavailableError)
async def model_unavailable(_: Request, exc: ModelUnavailableError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"error": {"code": "MODEL_UNAVAILABLE", "message": str(exc)}})


@app.exception_handler(TrainingError)
async def training_error(_: Request, exc: TrainingError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"error": {"code": "INSUFFICIENT_DATA", "message": str(exc)}})


@app.exception_handler(RequestValidationError)
async def request_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "INSUFFICIENT_DATA", "message": "Project payload is incomplete or invalid.",
                            "details": jsonable_encoder(exc.errors())}},
    )


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "model_available": service.is_available()}


@app.get("/model-info")
def model_info() -> dict[str, Any]:
    return service.model_info()


@app.post("/predict")
def predict(payload: PredictionInput) -> dict[str, Any]:
    return service.predict(payload.model_dump(by_alias=False))


@app.post("/predict-with-explanation")
def predict_with_explanation(payload: PredictionInput) -> dict[str, Any]:
    return service.predict_with_explanation(payload.model_dump(by_alias=False))


@app.post("/batch-predict")
def batch_predict(payload: BatchPredictionInput) -> dict[str, Any]:
    return {"results": [service.predict(item.model_dump(by_alias=False)) for item in payload.projects]}
