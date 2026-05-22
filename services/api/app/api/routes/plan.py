from __future__ import annotations

import uuid

import redis as redis_lib
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, get_optional_user
from app.modules.auth.models import User
from app.modules.plan import service as plan_service
from app.schemas.plan import PlanEmailRequest, PlanGenerateRequest, PlanRecommendRequest, PlanRecommendResponse, TripPlanResponse

router = APIRouter(prefix="/plan", tags=["plan"])

_PLAN_RATE_LIMIT = 2       # max requests
_PLAN_RATE_WINDOW = 3600   # per 1 hour (seconds)
# IPs that bypass rate limiting (local dev, test runners)
_BYPASS_IPS = {"127.0.0.1", "::1", "localhost", "testclient"}


def _check_plan_rate_limit(ip: str) -> None:
    """Allow max 2 plan generations per IP per hour. Raises 429 if exceeded.
    Uses Redis incr/expire. Gracefully skips if Redis is unavailable.
    """
    if ip in _BYPASS_IPS:
        return  # Skip rate limiting for local dev and test environments
    try:
        r = redis_lib.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=0,
            username=settings.redis_username or None,
            password=settings.redis_password or None,
            ssl=settings.redis_port == 25061,
            ssl_cert_reqs="none",
            socket_connect_timeout=1,
        )
        key = f"rate:plan:{ip}"
        count = r.incr(key)
        if count == 1:
            r.expire(key, _PLAN_RATE_WINDOW)
        if count > _PLAN_RATE_LIMIT:
            remaining = r.ttl(key)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Rate limit: you can generate up to {_PLAN_RATE_LIMIT} plans per hour. "
                    f"Try again in {remaining // 60 + 1} minutes."
                ),
            )
    except HTTPException:
        raise
    except Exception:
        # If Redis is unavailable, allow the request rather than blocking all users
        pass


@router.post("/generate", response_model=TripPlanResponse, status_code=201)
def generate_plan(
    request: Request,
    payload: PlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> TripPlanResponse:
    # Rate limit: 2 plans per hour per IP (DDoS + API cost protection)
    ip = request.client.host if request.client else "unknown"
    _check_plan_rate_limit(ip)
    user_id = current_user.id if current_user else None
    plan = plan_service.generate_plan(db, payload, user_id=user_id)
    return TripPlanResponse.model_validate(plan)


@router.get("/{plan_id}", response_model=TripPlanResponse)
def get_plan(
    plan_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> TripPlanResponse:
    plan = plan_service.get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    return TripPlanResponse.model_validate(plan)


_RECOMMEND_LIMIT = 2        # max Plan My Trek uses per user per 24 hours
_RECOMMEND_WINDOW = 86400   # 24 hours in seconds


def _check_recommend_rate_limit(user_id: uuid.UUID) -> None:
    """Allow max 2 Plan My Trek recommendations per user per 24 hours.
    Uses Redis INCR/EXPIRE. Raises 429 with a helpful message if exceeded.
    Gracefully skips if Redis is unavailable.
    """
    key = f"rate:plan:recommend:{user_id}"
    try:
        r = redis_lib.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=0,
            decode_responses=True,
            **({} if not settings.redis_password else {
                "password": settings.redis_password,
                "username": getattr(settings, "redis_username", None) or "default",
                "ssl": getattr(settings, "redis_ssl", False),
            }),
        )
        current = r.incr(key)
        if current == 1:
            r.expire(key, _RECOMMEND_WINDOW)
        if current > _RECOMMEND_LIMIT:
            remaining_ttl = r.ttl(key)
            hours_left = max(1, remaining_ttl // 3600)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"You have used Plan My Trek {_RECOMMEND_LIMIT} times in the last 24 hours. "
                    f"Please try again in approximately {hours_left} hour(s). "
                    "This limit helps us keep recommendations fast and accurate for all users."
                ),
            )
    except HTTPException:
        raise
    except Exception:
        pass  # Redis unavailable — allow the request


@router.post("/recommend", response_model=PlanRecommendResponse, status_code=200)
def recommend_treks(
    payload: PlanRecommendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlanRecommendResponse:
    """Step 57 — Score all published trek_guide CMS pages against wizard inputs.
    Returns top 5 recommendations with match scores, explanations, and categories.
    Requires authentication. Limited to 2 uses per user per 24 hours."""
    _check_recommend_rate_limit(current_user.id)
    return plan_service.recommend_treks(db, payload)


@router.post("/{plan_id}/email", status_code=200)
def email_plan(
    plan_id: uuid.UUID,
    payload: PlanEmailRequest,
    db: Session = Depends(get_db),
) -> dict:
    ok = plan_service.email_plan(db, plan_id, payload.email)
    if not ok:
        raise HTTPException(status_code=404, detail="Plan not found or has no output.")
    return {"message": "Plan sent to your email (if SMTP is configured)."}
