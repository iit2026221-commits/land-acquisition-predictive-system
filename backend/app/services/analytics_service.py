import csv
import io
from collections import defaultdict
from datetime import date

from sqlalchemy.orm import Session

from app.models.authorization import AccessScope, ProjectAssignment
from app.models.prediction_run import PredictionRun
from app.models.project import Project
from app.models.risk_score import RiskScore
from app.core.security import CurrentUser


GLOBAL_ROLES = {
    "system_administrator",
    "project_administrator",
    "senior_decision_maker",
}

QUALITY_FIELDS = (
    "name",
    "state",
    "district",
    "project_type",
    "land_area",
    "affected_families",
    "acquisition_stage",
)


def authorized_projects(
    db: Session,
    user: CurrentUser | None = None,
):
    """
    Return projects visible to the current user.

    Anonymous users can view the demonstration project portfolio.
    Authenticated users are restricted according to their role,
    assignments, and access scopes.
    """
    query = db.query(Project)

    # Public read-only access for the demonstration environment.
    if user is None:
        return query

    if user.role in GLOBAL_ROLES:
        return query

    assigned = db.query(ProjectAssignment.project_id).filter(
        ProjectAssignment.user_id == user.id
    )

    scoped = db.query(AccessScope.scope_value).filter(
        AccessScope.user_id == user.id,
        AccessScope.scope_type == "PROJECT",
    )

    ids = {row[0] for row in assigned.all()} | {
        row[0] for row in scoped.all()
    }

    project_ids = [
        int(value)
        for value in ids
        if str(value).isdigit()
    ]

    if project_ids:
        return query.filter(Project.id.in_(project_ids))

    return query.filter(Project.id == -1)


def _project_ids(
    db: Session,
    user: CurrentUser | None = None,
) -> list[int]:
    return [
        row[0]
        for row in authorized_projects(db, user)
        .with_entities(Project.id)
        .all()
    ]


def portfolio_metrics(
    db: Session,
    user: CurrentUser | None = None,
) -> dict:
    projects = authorized_projects(db, user).all()
    ids = [project.id for project in projects]

    scores = (
        db.query(RiskScore)
        .filter(RiskScore.project_id.in_(ids))
        .all()
        if ids
        else []
    )

    runs = (
        db.query(PredictionRun)
        .filter(
            (PredictionRun.project_id.in_(ids))
            | (
                PredictionRun.project_ref.in_(
                    [str(i) for i in ids]
                )
            )
        )
        .count()
        if ids
        else 0
    )

    return {
        "project_count": len(projects),
        "total_land_area": round(
            sum(p.land_area or 0 for p in projects),
            2,
        ),
        "total_affected_families": sum(
            p.affected_families or 0
            for p in projects
        ),
        "average_risk_score": round(
            sum(s.score for s in scores) / len(scores),
            2,
        )
        if scores
        else 0,
        "high_risk_count": sum(
            s.risk_level.lower() == "high"
            for s in scores
        ),
        "prediction_run_count": runs,
    }


def risk_distribution(
    db: Session,
    user: CurrentUser | None = None,
) -> list[dict]:
    ids = _project_ids(db, user)

    scores = (
        db.query(RiskScore)
        .filter(RiskScore.project_id.in_(ids))
        .all()
        if ids
        else []
    )

    counts = defaultdict(int)

    for score in scores:
        counts[score.risk_level] += 1

    total = len(scores)

    return [
        {
            "risk_level": level,
            "project_count": count,
            "percentage": round(
                count * 100 / total,
                2,
            )
            if total
            else 0,
        }
        for level, count in sorted(counts.items())
    ]


def geographic_aggregation(
    db: Session,
    user: CurrentUser | None = None,
    *,
    by_district: bool = True,
) -> list[dict]:
    projects = authorized_projects(db, user).all()

    project_ids = [p.id for p in projects]

    scores = (
        {
            score.project_id: score.score
            for score in db.query(RiskScore)
            .filter(RiskScore.project_id.in_(project_ids))
            .all()
        }
        if projects
        else {}
    )

    groups = defaultdict(list)

    for project in projects:
        key = (
            project.state or "Unknown",
            project.district if by_district else None,
        )
        groups[key].append(project)

    return [
        {
            "state": state,
            "district": district,
            "project_count": len(items),
            "total_land_area": round(
                sum(p.land_area or 0 for p in items),
                2,
            ),
            "total_affected_families": sum(
                p.affected_families or 0
                for p in items
            ),
            "average_risk_score": round(
                sum(
                    scores[p.id]
                    for p in items
                    if p.id in scores
                )
                / len(
                    [
                        p
                        for p in items
                        if p.id in scores
                    ]
                ),
                2,
            )
            if any(p.id in scores for p in items)
            else 0,
        }
        for (state, district), items in sorted(groups.items())
    ]


def rankings(
    db: Session,
    user: CurrentUser | None = None,
    limit: int = 20,
) -> list[dict]:
    projects = authorized_projects(db, user).all()

    score_rows = (
        db.query(RiskScore)
        .filter(
            RiskScore.project_id.in_(
                [p.id for p in projects]
            )
        )
        .all()
        if projects
        else []
    )

    scores = {}

    for score in score_rows:
        if (
            score.project_id not in scores
            or score.created_at > scores[score.project_id].created_at
        ):
            scores[score.project_id] = score

    ordered = sorted(
        projects,
        key=lambda p: (
            scores[p.id].score
            if p.id in scores
            else -1
        ),
        reverse=True,
    )[:limit]

    return [
        {
            "project_id": p.id,
            "project_name": p.name,
            "state": p.state,
            "district": p.district,
            "risk_score": (
                scores[p.id].score
                if p.id in scores
                else None
            ),
            "risk_level": (
                scores[p.id].risk_level
                if p.id in scores
                else None
            ),
            "rank": index,
        }
        for index, p in enumerate(ordered, 1)
    ]


def data_quality(
    db: Session,
    user: CurrentUser | None = None,
) -> dict:
    projects = authorized_projects(db, user).all()

    missing = {
        field: sum(
            getattr(p, field) is None
            or getattr(p, field) == ""
            for p in projects
        )
        for field in QUALITY_FIELDS
    }

    complete = sum(
        not any(
            getattr(p, field) is None
            or getattr(p, field) == ""
            for field in QUALITY_FIELDS
        )
        for p in projects
    )

    return {
        "project_count": len(projects),
        "complete_project_count": complete,
        "completeness_percentage": round(
            complete * 100 / len(projects),
            2,
        )
        if projects
        else 0,
        "missing_fields": missing,
    }


def prediction_trends(
    db: Session,
    user: CurrentUser | None = None,
    since: date | None = None,
    until: date | None = None,
) -> list[dict]:
    ids = _project_ids(db, user)

    if not ids:
        return []

    query = db.query(PredictionRun).filter(
        (PredictionRun.project_id.in_(ids))
        | (
            PredictionRun.project_ref.in_(
                [str(i) for i in ids]
            )
        )
    )

    if since:
        query = query.filter(
            PredictionRun.created_at >= since
        )

    if until:
        query = query.filter(
            PredictionRun.created_at < until
        )

    groups = defaultdict(list)

    for run in query.all():
        groups[run.created_at.date()].append(run)

    return [
        {
            "period": period,
            "run_count": len(items),
            "completed_count": sum(
                r.status.lower()
                in {"completed", "success", "succeeded"}
                for r in items
            ),
            "failed_count": sum(
                r.status.lower()
                in {"failed", "error"}
                for r in items
            ),
        }
        for period, items in sorted(groups.items())
    ]


def export_rows(
    db: Session,
    user: CurrentUser | None = None,
) -> tuple[str, int]:
    projects = authorized_projects(db, user).all()

    scores = (
        {
            s.project_id: s
            for s in db.query(RiskScore)
            .filter(
                RiskScore.project_id.in_(
                    [p.id for p in projects]
                )
            )
            .all()
        }
        if projects
        else {}
    )

    output = io.StringIO()

    writer = csv.DictWriter(
        output,
        fieldnames=[
            "project_id",
            "project_name",
            "state",
            "district",
            "project_type",
            "land_area",
            "affected_families",
            "acquisition_stage",
            "risk_score",
            "risk_level",
        ],
    )

    writer.writeheader()

    for p in projects:
        score = scores.get(p.id)

        writer.writerow(
            {
                "project_id": p.id,
                "project_name": p.name,
                "state": p.state,
                "district": p.district,
                "project_type": p.project_type,
                "land_area": p.land_area,
                "affected_families": p.affected_families,
                "acquisition_stage": p.acquisition_stage,
                "risk_score": score.score if score else None,
                "risk_level": (
                    score.risk_level
                    if score
                    else None
                ),
            }
        )

    return output.getvalue(), len(projects)