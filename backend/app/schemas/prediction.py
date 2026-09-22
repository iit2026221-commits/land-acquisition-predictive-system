from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    project_id: str = Field(alias="projectId", min_length=1)
    name: str = Field(min_length=1)
    state: str = Field(min_length=1)
    state_id: str = Field(alias="stateId", min_length=1)
    district: str = Field(min_length=1)
    district_id: str = Field(alias="districtId", min_length=1)
    project_type: str = Field(alias="projectType", min_length=1)
    land_area: float = Field(alias="landArea", ge=0)
    affected_families: int = Field(alias="affectedFamilies", ge=0)
    acquisition_stage: str = Field(alias="acquisitionStage", min_length=1)
    last_updated: str = Field(alias="lastUpdated", min_length=1)


class PredictionResponse(BaseModel):
    project_id: str
    model_version: str
    delay_probability: float = Field(ge=0, le=1)
    predicted_delay_months: float = Field(ge=0)
    predicted_risk_level: str
    generated_at: datetime
    prediction_status: str
    data_quality: str
    message: str | None = None
    request_id: str | None = None
    run_id: int | None = None


class PredictionHistoryItem(BaseModel):
    id: int
    project_ref: str
    status: str
    model_version: str | None
    request_id: str
    created_at: datetime
    completed_at: datetime | None


class BatchPredictionRequest(BaseModel):
    projects: list[PredictionRequest] = Field(min_length=1, max_length=500)


class BatchPredictionResponse(BaseModel):
    results: list[PredictionResponse]
