from fastapi import APIRouter, Depends
from app.api.deps import CurrentUser
from app.core.authorization import Permission, require_permission
from app.services.ml_service import get_ml_status

router = APIRouter()


@router.get("/status")
def ml_status(_: CurrentUser = Depends(require_permission(Permission.PREDICTION_READ))) -> dict[str, object]:
    return get_ml_status()
