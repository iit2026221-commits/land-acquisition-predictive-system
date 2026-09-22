from datetime import date, datetime

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_db
from app.core.authorization import Permission, require_permission
from app.schemas.analytics import (DataQualityResponse, GeographicAggregate, PortfolioMetrics,
                                    PredictionTrendItem, ProjectRanking, RiskDistributionItem)
from app.services.analytics_service import (data_quality, export_rows, geographic_aggregation, portfolio_metrics,
                                             prediction_trends, rankings, risk_distribution)
from app.services.audit_service import record_event

router = APIRouter()
read_user = Depends(require_permission(Permission.ANALYTICS_READ))


@router.get("/portfolio", response_model=PortfolioMetrics)
@router.get("/portfolio-metrics", response_model=PortfolioMetrics, include_in_schema=False)
def portfolio(db: Session = Depends(get_db), user: CurrentUser = read_user):
    return portfolio_metrics(db, user)


@router.get("/risk-distribution", response_model=list[RiskDistributionItem])
@router.get("/risk", response_model=list[RiskDistributionItem], include_in_schema=False)
def distribution(db: Session = Depends(get_db), user: CurrentUser = read_user):
    return risk_distribution(db, user)


@router.get("/geography", response_model=list[GeographicAggregate])
@router.get("/state-district", response_model=list[GeographicAggregate], include_in_schema=False)
def geography(db: Session = Depends(get_db), user: CurrentUser = read_user,
              by_district: bool = Query(True)):
    return geographic_aggregation(db, user, by_district=by_district)


@router.get("/rankings", response_model=list[ProjectRanking])
@router.get("/project-rankings", response_model=list[ProjectRanking], include_in_schema=False)
def project_rankings(db: Session = Depends(get_db), user: CurrentUser = read_user,
                     limit: int = Query(20, ge=1, le=100)):
    return rankings(db, user, limit)


@router.get("/data-quality", response_model=DataQualityResponse)
def quality(db: Session = Depends(get_db), user: CurrentUser = read_user):
    return data_quality(db, user)


@router.get("/prediction-history", response_model=list[PredictionTrendItem])
def history(db: Session = Depends(get_db), user: CurrentUser = read_user,
            since: date | None = None, until: date | None = None):
    return prediction_trends(db, user, since, until)


@router.get("/export")
def export(request: Request, db: Session = Depends(get_db),
           user: CurrentUser = Depends(require_permission(Permission.ANALYTICS_EXPORT))):
    content, count = export_rows(db, user)
    record_event(db, event="analytics_export", request_id=request.state.request_id, user_id=user.id,
                 resource_type="analytics", details={"row_count": count, "format": "csv"})
    return StreamingResponse(iter([content]), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=analytics.csv"})
