from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    state: str | None = None
    state_id: str | None = None
    district: str | None = None
    district_id: str | None = None
    project_type: str | None = None
    land_area: float | None = Field(default=None, ge=0)
    affected_families: int | None = Field(default=None, ge=0)
    acquisition_stage: str | None = None
    is_demo: bool = True


class ProjectResponse(ProjectCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
