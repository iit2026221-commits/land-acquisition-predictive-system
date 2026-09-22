from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.project import Project
from app.models.risk_score import RiskScore
from app.schemas.dashboard import DashboardResponse


router = APIRouter()


@router.get(
    "",
    response_model=DashboardResponse,
)
def dashboard(
    db: Session = Depends(get_db),
) -> DashboardResponse:
    """
    Public read-only dashboard.

    Authentication is not required because this dashboard
    displays demonstration portfolio information only.
    Administrative operations remain protected by the
    authorization layer.
    """
    projects = db.query(Project).all()

    project_ids = [
        project.id
        for project in projects
    ]

    scores = (
        db.query(RiskScore)
        .filter(
            RiskScore.project_id.in_(project_ids)
        )
        .all()
        if project_ids
        else []
    )

    return DashboardResponse(
        project_count=len(projects),
        high_risk_count=sum(
            score.risk_level.lower() == "high"
            for score in scores
        ),
        average_risk_score=round(
            sum(score.score for score in scores)
            / len(scores),
            2,
        )
        if scores
        else 0,
    )