from fastapi import APIRouter

import redis as redis_lib

from app.core.config import settings

router = APIRouter(prefix="/worker", tags=["worker"])


@router.get("/health")
def worker_health() -> dict:
    try:
        r = redis_lib.from_url(settings.celery_broker_url, socket_connect_timeout=2)
        r.ping()
        broker_status = "ok"
    except Exception:
        broker_status = "error"

    return {
        "status": "ok" if broker_status == "ok" else "degraded",
        "broker": broker_status,
        "broker_url": settings.celery_broker_url,
    }
