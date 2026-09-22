from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_db
from app.core.authorization import (
    Permission,
    can_access_project,
    require_permission,
)
from app.models.authorization import ProjectAssignment
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.analytics_service import authorized_projects


router = APIRouter()


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(
        require_permission(Permission.PROJECT_CREATE)
    ),
) -> Project:
    project = Project(**payload.model_dump())

    db.add(project)
    db.commit()
    db.refresh(project)

    db.add(
        ProjectAssignment(
            user_id=user.id,
            project_id=project.id,
        )
    )

    db.commit()

    return project


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
) -> Project:
    """
    Public read-only project details.

    Authentication is intentionally not required here.
    Editing and creation remain protected elsewhere.
    """
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "PROJECT_NOT_FOUND",
                "message": "Project was not found.",
            },
        )

    return project


@router.get(
    "",
    response_model=list[ProjectResponse],
)
def list_projects(
    db: Session = Depends(get_db),
) -> list[Project]:
    """
    Public read-only project portfolio.

    This is intentionally available without authentication
    for the demonstration dashboard.
    """
    return list(
        authorized_projects(db, None)
        .order_by(Project.id.desc())
        .all()
    )