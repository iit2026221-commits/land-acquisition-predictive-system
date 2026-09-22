from datetime import date, datetime

from pydantic import BaseModel


class PortfolioMetrics(BaseModel):
    project_count: int
    total_land_area: float
    total_affected_families: int
    average_risk_score: float
    high_risk_count: int
    prediction_run_count: int


class RiskDistributionItem(BaseModel):
    risk_level: str
    project_count: int
    percentage: float


class GeographicAggregate(BaseModel):
    state: str
    district: str | None = None
    project_count: int
    total_land_area: float
    total_affected_families: int
    average_risk_score: float


class ProjectRanking(BaseModel):
    project_id: int
    project_name: str
    state: str | None = None
    district: str | None = None
    risk_score: float | None = None
    risk_level: str | None = None
    rank: int


class DataQualityResponse(BaseModel):
    project_count: int
    complete_project_count: int
    completeness_percentage: float
    missing_fields: dict[str, int]


class PredictionTrendItem(BaseModel):
    period: date
    run_count: int
    completed_count: int
    failed_count: int


class AnalyticsExportAudit(BaseModel):
    exported_at: datetime
    row_count: int
