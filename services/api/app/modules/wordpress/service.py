from __future__ import annotations

from app.core.config import settings
from app.modules.wordpress.client import WordPressClient
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