from fastapi import APIRouter

router = APIRouter(prefix="/health")


@router.get("", summary="Backend health check")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "component": "api"}
