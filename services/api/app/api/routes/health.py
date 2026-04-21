from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def api_health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.app_env,
        "version": "v1",
    }