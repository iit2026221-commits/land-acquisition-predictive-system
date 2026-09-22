from fastapi import APIRouter, Depends
from app.api.deps import CurrentUser, get_db
from app.core.authorization import Permission, can_access_project, require_permission
from app.models.prediction_run import PredictionRun
from app.schemas.prediction import PredictionHistoryItem
from app.services.prediction_workflow import run_prediction
from fastapi import Request
from sqlalchemy.orm import Session

from app.schemas.prediction import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services.ml_service import request_prediction

router = APIRouter()


@router.post("", response_model=PredictionResponse)
def predict(payload: PredictionRequest, _: CurrentUser = Depends(require_permission(Permission.PREDICTION_CREATE))) -> PredictionResponse:
    return request_prediction("/predict", payload.model_dump(by_alias=True))


@router.post("/project/{project_id}", response_model=PredictionResponse)
def predict_project(project_id: str, payload: PredictionRequest, db: Session = Depends(get_db), user: CurrentUser = Depends(require_permission(Permission.PREDICTION_CREATE))) -> PredictionResponse:
    if payload.project_id != project_id:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="Project ID in path and payload must match.")
    if project_id.isdigit() and not can_access_project(user, int(project_id), db):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail={"code": "PROJECT_ACCESS_DENIED", "message": "You do not have access to this project."})
    return request_prediction("/predict", payload.model_dump(by_alias=True))


@router.post("/project/{project_id}/explain")
def explain_project(project_id: str, payload: PredictionRequest, db: Session = Depends(get_db), user: CurrentUser = Depends(require_permission(Permission.PREDICTION_EXPLAIN))) -> dict:
    if payload.project_id != project_id:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="Project ID in path and payload must match.")
    if project_id.isdigit() and not can_access_project(user, int(project_id), db):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail={"code": "PROJECT_ACCESS_DENIED", "message": "You do not have access to this project."})
    return request_prediction("/predict-with-explanation", payload.model_dump(by_alias=True))


@router.post("/project/{project_id}/run", response_model=PredictionResponse)
def run_project_prediction(
    project_id: str,
    payload: PredictionRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_permission(Permission.PREDICTION_CREATE)),
) -> dict:
    if payload.project_id != project_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Project ID in path and payload must match.")
    if project_id.isdigit() and not can_access_project(user, int(project_id), db):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail={"code": "PROJECT_ACCESS_DENIED", "message": "You do not have access to this project."})
    return run_prediction(db, payload=payload.model_dump(by_alias=True), project_ref=project_id, project_id=int(project_id) if project_id.isdigit() else None, user_id=user.id, request_id=request.state.request_id)


@router.get("/project/{project_id}/history", response_model=list[PredictionHistoryItem])
def prediction_history(
    project_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_permission(Permission.PREDICTION_READ)),
) -> list[PredictionRun]:
    if project_id.isdigit() and not can_access_project(user, int(project_id), db):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail={"code": "PROJECT_ACCESS_DENIED", "message": "You do not have access to this project."})
    return list(db.query(PredictionRun).filter_by(project_ref=project_id, requested_by=user.id).order_by(PredictionRun.id.desc()).limit(25).all())


@router.post("/batch", response_model=BatchPredictionResponse)
def predict_batch(payload: BatchPredictionRequest, _: CurrentUser = Depends(require_permission(Permission.PREDICTION_CREATE))) -> BatchPredictionResponse:
    response = request_prediction(
        "/batch-predict",
        {"projects": [project.model_dump(by_alias=True) for project in payload.projects]},
    )
    return response
