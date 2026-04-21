from fastapi import APIRouter, HTTPException, status

from app.modules.wordpress.client import WordPressClientError
from app.modules.wordpress.service import (
    get_wordpress_health,
    run_wordpress_connection_test,
)
from app.schemas.wordpress import (
    WordPressConnectionTestResponse,
    WordPressHealthResponse,
)

router = APIRouter(prefix="/wordpress", tags=["wordpress"])


@router.get("/health", response_model=WordPressHealthResponse)
def wordpress_health() -> WordPressHealthResponse:
    return get_wordpress_health()


@router.post(
    "/test-connection",
    response_model=WordPressConnectionTestResponse,
)
def wordpress_test_connection() -> WordPressConnectionTestResponse:
    try:
        return run_wordpress_connection_test()
    except WordPressClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc