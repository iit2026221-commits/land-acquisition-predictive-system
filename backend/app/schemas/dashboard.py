from pydantic import BaseModel


class DashboardResponse(BaseModel):
    project_count: int
    high_risk_count: int
    average_risk_score: float

