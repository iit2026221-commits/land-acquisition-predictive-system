import json

from sqlalchemy.orm import Session

from app.models.authorization import AuditLog


def record_event(
    db: Session,
    *,
    event: str,
    request_id: str,
    user_id: int | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: dict[str, object] | None = None,
) -> AuditLog:
    entry = AuditLog(
        event=event,
        request_id=request_id,
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        details=json.dumps(details, separators=(",", ":")) if details else None,
    )
    db.add(entry)
    db.commit()
    return entry
