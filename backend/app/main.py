from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.v1 import router as api_router
from app.config.database import Base, engine, SessionLocal
from app.config.settings import get_settings
from app.seeders.auth_seed import seed_bootstrap_admin

# Import models so SQLAlchemy registers them
from app.models.project import Project
from app.models.user import User
from app.models.authorization import ProjectAssignment, AccessScope
from app.models.risk_score import RiskScore
from app.models.prediction_run import PredictionRun


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables if they do not exist
    Base.metadata.create_all(bind=engine)
    # Keep existing local SQLite installations compatible with the complete
    # registration record without requiring a manual migration command.
    if "details" not in {column["name"] for column in inspect(engine).get_columns("projects")}:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE projects ADD COLUMN details JSON"))
    if settings.bootstrap_admin_password:
        db = SessionLocal()
        try:
            seed_bootstrap_admin(db, settings.bootstrap_admin_password)
        finally:
            db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "LANDIQ Backend",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "database": "connected",
    }
