from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_db
from app.core.authorization import Permission, require_permission
from app.models.authorization import AuditLog

router = APIRouter()


@router.get("/status")
def admin_status(_: CurrentUser = Depends(require_permission(Permission.USER_READ))) -> dict[str, str]:
    return {"status": "ready"}


@router.get("/audit-log")
def audit_log(
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(require_permission(Permission.AUDIT_READ)),
) -> list[dict[str, object]]:
    return [
        {"id": item.id, "event": item.event, "user_id": item.user_id, "request_id": item.request_id, "resource_type": item.resource_type, "resource_id": item.resource_id, "created_at": item.created_at.isoformat()}
        for item in db.query(AuditLog).order_by(AuditLog.id.desc()).limit(100).all()
    ]
