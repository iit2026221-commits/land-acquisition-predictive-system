from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class ProjectAssignment(Base):
    __tablename__ = "project_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    domain: Mapped[str | None] = mapped_column(String(50), default=None)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AccessScope(Base):
    __tablename__ = "access_scopes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    scope_type: Mapped[str] = mapped_column(String(20))
    scope_value: Mapped[str] = mapped_column(String(255))
    domain: Mapped[str | None] = mapped_column(String(50), default=None)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    event: Mapped[str] = mapped_column(String(100), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    request_id: Mapped[str] = mapped_column(String(64), index=True)
    resource_type: Mapped[str | None] = mapped_column(String(50), default=None)
    resource_id: Mapped[str | None] = mapped_column(String(255), default=None)
    details: Mapped[str | None] = mapped_column(String(1000), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
