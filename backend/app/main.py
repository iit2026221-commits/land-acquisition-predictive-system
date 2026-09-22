from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import router as v1_router
from app.config.database import Base, engine
from app.config.settings import get_settings
from app import models  # noqa: F401
from app.seeders.auth_seed import seed_demo_users
from app.middleware.request_context import RequestContextMiddleware
from sqlalchemy import inspect, text
from app.services.ml_service import get_ml_status


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    if engine.url.get_backend_name() == "sqlite":
        existing = {column["name"] for column in inspect(engine).get_columns("projects")}
        for name, definition in {
            "state": "VARCHAR(100)", "state_id": "VARCHAR(100)", "district": "VARCHAR(100)",
            "district_id": "VARCHAR(100)", "project_type": "VARCHAR(100)", "land_area": "FLOAT",
            "affected_families": "INTEGER", "acquisition_stage": "VARCHAR(100)",
            "is_demo": "BOOLEAN NOT NULL DEFAULT 1",
        }.items():
            if name not in existing:
                with engine.begin() as connection:
                    connection.execute(text(f"ALTER TABLE projects ADD COLUMN {name} {definition}"))
        user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
        if "username" not in user_columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(100)"))
                connection.execute(text("UPDATE users SET username = substr(email, 1, instr(email, '@') - 1) WHERE username IS NULL"))
    from app.config.database import SessionLocal
    db = SessionLocal()
    try:
        if get_settings().environment == "development":
            seed_demo_users(db)
    finally:
        db.close()
    yield


app = FastAPI(title=get_settings().app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)
app.add_middleware(RequestContextMiddleware)
app.include_router(v1_router, prefix="/api/v1")


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, _: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected server error occurred.", "requestId": getattr(request.state, "request_id", None)}})


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", tags=["system"])
def readiness() -> dict[str, object]:
    database_ready = False
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database_ready = True
    except Exception:
        database_ready = False
    ml = get_ml_status()
    ready = database_ready and ml.get("status") == "ok"
    return {
        "status": "ready" if ready else "not_ready",
        "database": "ok" if database_ready else "unavailable",
        "ml_service": ml,
    }
