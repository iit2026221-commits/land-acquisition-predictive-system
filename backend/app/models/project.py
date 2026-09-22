from datetime import datetime

from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    latitude: Mapped[float | None] = mapped_column(Float, default=None)
    longitude: Mapped[float | None] = mapped_column(Float, default=None)
    state: Mapped[str | None] = mapped_column(String(100), default=None)
    state_id: Mapped[str | None] = mapped_column(String(100), default=None)
    district: Mapped[str | None] = mapped_column(String(100), default=None)
    district_id: Mapped[str | None] = mapped_column(String(100), default=None)
    project_type: Mapped[str | None] = mapped_column(String(100), default=None)
    land_area: Mapped[float | None] = mapped_column(Float, default=None)
    affected_families: Mapped[int | None] = mapped_column(default=None)
    acquisition_stage: Mapped[str | None] = mapped_column(String(100), default=None)
    is_demo: Mapped[bool] = mapped_column(default=True)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
