from fastapi import APIRouter, HTTPException, Query, status

from app.modules.wordpress.client import WordPressClientError
from app.modules.wordpress.service import (
    ensure_wp_category,
    ensure_wp_tag,
    get_wp_post,
    get_wordpress_health,
    list_wp_posts,
    run_wordpress_connection_test,
)
from app.schemas.wordpress import (
    WPCategoryRequest,
    WPCategoryResponse,
    WPPostResponse,
    WPPostsListResponse,
    WPTagRequest,
    WPTagResponse,
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


# ---------------------------------------------------------------------------
# Step 16 — new endpoints
# ---------------------------------------------------------------------------


@router.get("/posts", response_model=WPPostsListResponse)
def list_wordpress_posts(
    post_type: str = Query(default="post"),
    wp_status: str = Query(default="publish", alias="status"),
    per_page: int = Query(default=10, ge=1, le=100),
    page: int = Query(default=1, ge=1),
) -> WPPostsListResponse:
    try:
        data = list_wp_posts(
            post_type=post_type, status=wp_status, per_page=per_page, page=page
        )
        return WPPostsListResponse(**data)
    except WordPressClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.get("/posts/{slug}", response_model=WPPostResponse)
def get_wordpress_post(
    slug: str,
    post_type: str = Query(default="post"),
) -> WPPostResponse:
    try:
        data = get_wp_post(slug=slug, post_type=post_type)
        return WPPostResponse(**data)
    except WordPressClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post("/categories", response_model=WPCategoryResponse)
def create_wordpress_category(body: WPCategoryRequest) -> WPCategoryResponse:
    try:
        data = ensure_wp_category(name=body.name)
        return WPCategoryResponse(**data)
    except WordPressClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post("/tags", response_model=WPTagResponse)
def create_wordpress_tag(body: WPTagRequest) -> WPTagResponse:
    try:
        data = ensure_wp_tag(name=body.name)
        return WPTagResponse(**data)
    except WordPressClientError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
