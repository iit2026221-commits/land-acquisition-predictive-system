from enum import StrEnum

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import CurrentUser, get_current_user
from app.models.authorization import AccessScope, ProjectAssignment


class Permission(StrEnum):
    PROJECT_CREATE = "project:create"
    PROJECT_READ = "project:read"
    PROJECT_UPDATE = "project:update"
    PROJECT_DELETE = "project:delete"
    PREDICTION_READ = "prediction:read"
    PREDICTION_CREATE = "prediction:create"
    PREDICTION_EXPLAIN = "prediction:explain"
    RISK_READ = "risk:read"
    DECISION_SUPPORT_READ = "decision_support:read"
    DECISION_SUPPORT_GENERATE = "decision_support:generate"
    RECOMMENDATION_READ = "recommendation:read"
    USER_READ = "user:read"
    USER_CREATE = "user:create"
    USER_UPDATE = "user:update"
    AUDIT_READ = "audit:read"
    ANALYTICS_READ = "analytics:read"
    ANALYTICS_EXPORT = "analytics:export"


ROLE_PERMISSIONS: dict[str, frozenset[Permission]] = {
    "system_administrator": frozenset(Permission),

    "project_administrator": frozenset({
        Permission.PROJECT_CREATE,
        Permission.PROJECT_READ,
        Permission.PROJECT_UPDATE,
        Permission.PREDICTION_READ,
        Permission.PREDICTION_CREATE,
        Permission.PREDICTION_EXPLAIN,
        Permission.RISK_READ,
        Permission.DECISION_SUPPORT_READ,
        Permission.DECISION_SUPPORT_GENERATE,
        Permission.RECOMMENDATION_READ,
        Permission.ANALYTICS_READ,
    }),

    "land_acquisition_officer": frozenset({
        Permission.PROJECT_READ,
        Permission.PROJECT_UPDATE,
        Permission.RISK_READ,
        Permission.DECISION_SUPPORT_READ,
        Permission.RECOMMENDATION_READ,
    }),

    "project_manager": frozenset({
        Permission.PROJECT_READ,
        Permission.PROJECT_UPDATE,
        Permission.PREDICTION_READ,
        Permission.PREDICTION_EXPLAIN,
        Permission.RISK_READ,
        Permission.DECISION_SUPPORT_READ,
        Permission.DECISION_SUPPORT_GENERATE,
        Permission.RECOMMENDATION_READ,
        Permission.ANALYTICS_READ,
    }),

    "legal_officer": frozenset({
        Permission.PROJECT_READ,
        Permission.RISK_READ,
        Permission.RECOMMENDATION_READ,
    }),

    "compensation_officer": frozenset({
        Permission.PROJECT_READ,
        Permission.RISK_READ,
        Permission.RECOMMENDATION_READ,
    }),

    "rr_officer": frozenset({
        Permission.PROJECT_READ,
        Permission.RISK_READ,
        Permission.RECOMMENDATION_READ,
    }),

    "senior_decision_maker": frozenset({
        Permission.PROJECT_READ,
        Permission.PREDICTION_READ,
        Permission.RISK_READ,
        Permission.DECISION_SUPPORT_READ,
        Permission.RECOMMENDATION_READ,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_EXPORT,
    }),

    "analyst": frozenset({
        Permission.PROJECT_READ,
        Permission.PREDICTION_READ,
        Permission.PREDICTION_EXPLAIN,
        Permission.RISK_READ,
        Permission.DECISION_SUPPORT_READ,
        Permission.RECOMMENDATION_READ,
        Permission.ANALYTICS_READ,
    }),

    "viewer": frozenset({
        Permission.PROJECT_READ,
        Permission.RISK_READ,
        Permission.DECISION_SUPPORT_READ,
    }),
}


def has_permission(user: CurrentUser, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(user.role, frozenset())


def require_permission(permission: Permission):
    def dependency(
        user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if not has_permission(user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PERMISSION_DENIED",
                    "message": f"Permission required: {permission.value}",
                },
            )
        return user

    return dependency


def can_access_project(
    user: CurrentUser,
    project_id: int,
    db: Session,
) -> bool:
    if user.role in {
        "system_administrator",
        "project_administrator",
        "senior_decision_maker",
    }:
        return True

    assignment = (
        db.query(ProjectAssignment)
        .filter_by(
            user_id=user.id,
            project_id=project_id,
        )
        .first()
    )

    if assignment:
        return True

    scopes = (
        db.query(AccessScope)
        .filter_by(
            user_id=user.id,
            scope_type="PROJECT",
            scope_value=str(project_id),
        )
        .all()
    )

    return bool(scopes)