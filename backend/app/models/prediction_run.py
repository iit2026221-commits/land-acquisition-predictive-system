from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class PredictionRun(Base):
    __tablename__ = "prediction_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), index=True, default=None)
    project_ref: Mapped[str] = mapped_column(String(255), index=True)
    requested_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    request_id: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(30), index=True)
    model_version: Mapped[str | None] = mapped_column(String(100), default=None)
    response_json: Mapped[str | None] = mapped_column(Text, default=None)
    error_code: Mapped[str | None] = mapped_column(String(100), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
