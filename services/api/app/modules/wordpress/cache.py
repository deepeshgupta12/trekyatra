from __future__ import annotations

import json

import redis

from app.core.config import settings

_WP_CACHE_DB = 2
_TTL_SECONDS = 300  # 5 minutes


def _client() -> redis.Redis:  # type: ignore[type-arg]
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        db=_WP_CACHE_DB,
        decode_responses=True,
        socket_connect_timeout=1,
    )


def cache_get(key: str) -> dict | list | None:
    try:
        raw = _client().get(key)
        return json.loads(raw) if raw else None  # type: ignore[arg-type]
    except Exception:
        return None


def cache_set(key: str, value: dict | list) -> None:
    try:
        _client().setex(key, _TTL_SECONDS, json.dumps(value))
    except Exception:
        pass


def cache_delete(key: str) -> None:
    try:
        _client().delete(key)
    except Exception:
        pass


def wp_post_key(slug: str) -> str:
    return f"wp:post:{slug}"


def wp_posts_key(post_type: str, page: int) -> str:
    return f"wp:posts:{post_type}:{page}"
