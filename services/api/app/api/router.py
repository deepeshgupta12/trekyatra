from fastapi import APIRouter

from app.api.routes.admin import router as admin_router
from app.api.routes.auth import router as auth_router
from app.api.routes.content import router as content_router
from app.api.routes.health import router as health_router
from app.api.routes.wordpress import router as wordpress_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router)
api_router.include_router(wordpress_router)
api_router.include_router(content_router)
api_router.include_router(admin_router)