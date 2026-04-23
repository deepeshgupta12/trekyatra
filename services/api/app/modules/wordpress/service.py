from __future__ import annotations

from app.core.config import settings
from app.modules.wordpress.cache import (
    cache_delete,
    cache_get,
    cache_set,
    wp_post_key,
    wp_posts_key,
)
from app.modules.wordpress.client import WordPressClient, WordPressClientError
from app.schemas.wordpress import (
    WordPressCheckResult,
    WordPressConnectionTestResponse,
    WordPressHealthResponse,
)


def get_wordpress_health() -> WordPressHealthResponse:
    return WordPressHealthResponse(
        base_url=settings.wordpress_base_url.rstrip("/"),
        rest_api_base_url=settings.wordpress_rest_base_url,
        credentials_configured=settings.wordpress_credentials_configured,
        timeout_seconds=settings.wordpress_timeout_seconds,
        verify_ssl=settings.wordpress_verify_ssl,
    )


def _build_client() -> WordPressClient:
    return WordPressClient(
        base_url=settings.wordpress_base_url,
        username=settings.wordpress_username,
        app_password=settings.wordpress_app_password,
        timeout_seconds=settings.wordpress_timeout_seconds,
        verify_ssl=settings.wordpress_verify_ssl,
    )


def run_wordpress_connection_test() -> WordPressConnectionTestResponse:
    client = _build_client()

    public_result = client.fetch_site_index()

    authenticated_attempted = settings.wordpress_credentials_configured
    if authenticated_attempted:
        auth_result = client.fetch_current_user()
        authenticated_api = WordPressCheckResult(
            attempted=True,
            ok=auth_result.ok,
            endpoint=auth_result.endpoint,
            status_code=auth_result.status_code,
            message=auth_result.message,
            payload_preview=auth_result.payload,
        )
    else:
        authenticated_api = WordPressCheckResult(
            attempted=False,
            ok=False,
            endpoint=f"{settings.wordpress_base_url.rstrip('/')}/wp-json/wp/v2/users/me",
            status_code=None,
            message="Skipped because WordPress credentials are not configured.",
            payload_preview=None,
        )

    public_api = WordPressCheckResult(
        attempted=True,
        ok=public_result.ok,
        endpoint=public_result.endpoint,
        status_code=public_result.status_code,
        message=public_result.message,
        payload_preview=public_result.payload,
    )

    return WordPressConnectionTestResponse(
        base_url=settings.wordpress_base_url.rstrip("/"),
        public_api=public_api,
        authenticated_api=authenticated_api,
    )


# ---------------------------------------------------------------------------
# Step 16 — pull/sync helpers
# ---------------------------------------------------------------------------


def _normalize_wp_post(raw: dict) -> dict:
    def _rendered(field: object) -> str:
        if isinstance(field, dict):
            return field.get("rendered", "")
        return str(field) if field else ""

    return {
        "id": raw.get("id", 0),
        "slug": raw.get("slug", ""),
        "title": _rendered(raw.get("title")),
        "content": _rendered(raw.get("content")),
        "excerpt": _rendered(raw.get("excerpt")),
        "status": raw.get("status", ""),
        "post_type": raw.get("type", "post"),
        "link": raw.get("link", ""),
        "date": raw.get("date", ""),
        "meta": raw.get("meta") or {},
    }


def list_wp_posts(
    *,
    post_type: str = "post",
    status: str = "publish",
    per_page: int = 10,
    page: int = 1,
) -> dict:
    cache_key = wp_posts_key(post_type, page)
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    client = _build_client()
    result = client.list_posts(
        post_type=post_type, status=status, per_page=per_page, page=page
    )
    if not result.ok:
        raise WordPressClientError(
            f"Failed to list WP posts ({post_type}): {result.message}"
        )

    raw_posts = result.payload if isinstance(result.payload, list) else []
    posts = [_normalize_wp_post(p) for p in raw_posts if isinstance(p, dict)]
    response: dict = {
        "posts": posts,
        "total": result.total if result.total is not None else len(posts),
        "pages": result.total_pages if result.total_pages is not None else 1,
    }
    cache_set(cache_key, response)
    return response


def get_wp_post(*, slug: str) -> dict:
    cache_key = wp_post_key(slug)
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    client = _build_client()
    result = client.get_post(slug)
    if not result.ok:
        raise WordPressClientError(
            f"WP post '{slug}' not found: {result.message}"
        )

    payload = result.payload
    if isinstance(payload, list):
        if not payload:
            raise WordPressClientError(f"No WP post found with slug '{slug}'")
        payload = payload[0]

    if not isinstance(payload, dict):
        raise WordPressClientError(f"Unexpected WP response for slug '{slug}'")

    normalized = _normalize_wp_post(payload)
    cache_set(cache_key, normalized)
    return normalized


def ensure_wp_category(*, name: str) -> dict:
    client = _build_client()
    result = client.ensure_category(name)
    if not result.ok:
        raise WordPressClientError(
            f"Failed to ensure WP category '{name}': {result.message}"
        )
    if not isinstance(result.payload, dict):
        raise WordPressClientError(
            f"Unexpected response ensuring category '{name}'"
        )
    return result.payload


def ensure_wp_tag(*, name: str) -> dict:
    client = _build_client()
    result = client.ensure_tag(name)
    if not result.ok:
        raise WordPressClientError(
            f"Failed to ensure WP tag '{name}': {result.message}"
        )
    if not isinstance(result.payload, dict):
        raise WordPressClientError(
            f"Unexpected response ensuring tag '{name}'"
        )
    return result.payload


def invalidate_post_cache(slug: str) -> None:
    cache_delete(wp_post_key(slug))
