from fastapi import APIRouter

from app.core.database import check_database_connection
from app.core.redis import check_redis_connection

router = APIRouter(prefix="/health")


@router.get("", summary="Backend health check")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "component": "api"}


@router.get("/db", summary="Database connectivity health check")
async def health_check_db() -> dict[str, object]:
    db_status = await check_database_connection()
    return {
        "status": "ok" if db_status["status"] == "ok" else "degraded",
        "component": "database",
        "database": db_status,
    }


@router.get("/redis", summary="Redis connectivity health check")
async def health_check_redis() -> dict[str, object]:
    redis_status = await check_redis_connection()
    return {
        "status": "ok" if redis_status["status"] == "ok" else "degraded",
        "component": "redis",
        "redis": redis_status,
    }
