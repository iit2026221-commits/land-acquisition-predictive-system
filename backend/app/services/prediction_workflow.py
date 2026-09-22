import json
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.prediction_run import PredictionRun
from app.services.audit_service import record_event
from app.services.ml_service import request_prediction


def run_prediction(
    db: Session,
    *,
    payload: dict,
    project_ref: str,
    user_id: int,
    request_id: str,
    project_id: int | None = None,
) -> dict:
    existing = (
        db.query(PredictionRun)
        .filter_by(project_ref=project_ref, requested_by=user_id, request_id=request_id)
        .first()
    )
    if existing and existing.response_json:
        response = json.loads(existing.response_json)
        response.update(request_id=request_id, run_id=existing.id)
        return response

    run = PredictionRun(
        project_ref=project_ref,
        project_id=project_id,
        requested_by=user_id,
        request_id=request_id,
        status="RUNNING",
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    record_event(db, event="PREDICTION_REQUESTED", request_id=request_id, user_id=user_id, resource_type="project", resource_id=project_ref, details={"run_id": run.id})
    try:
        response = request_prediction("/predict-with-explanation", payload)
        run.status = str(response.get("prediction_status", "COMPLETED"))
        run.model_version = response.get("model_version")
        run.response_json = json.dumps(response)
        run.completed_at = datetime.utcnow()
        db.commit()
        response.update(request_id=request_id, run_id=run.id)
        record_event(db, event="PREDICTION_COMPLETED", request_id=request_id, user_id=user_id, resource_type="project", resource_id=project_ref, details={"run_id": run.id, "model_version": run.model_version, "status": run.status})
        return response
    except HTTPException as exc:
        run.status = "FAILED"
        run.error_code = "ML_SERVICE_UNAVAILABLE"
        run.completed_at = datetime.utcnow()
        db.commit()
        record_event(db, event="PREDICTION_FAILED", request_id=request_id, user_id=user_id, resource_type="project", resource_id=project_ref, details={"run_id": run.id, "status": exc.status_code})
        raise
