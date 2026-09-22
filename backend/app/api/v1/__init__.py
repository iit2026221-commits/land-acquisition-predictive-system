from fastapi import APIRouter

from app.api.v1 import admin, analytics, auth, dashboard, ml, predictions, projects

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(projects.router, prefix="/projects", tags=["projects"])
router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
router.include_router(ml.router, prefix="/ml", tags=["ml"])
router.include_router(admin.router, prefix="/admin", tags=["admin"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
