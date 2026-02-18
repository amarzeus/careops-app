from fastapi import APIRouter

from app.api.endpoints.health import router as health_router
from app.api.endpoints.protected import router as protected_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(protected_router, tags=["auth"])
