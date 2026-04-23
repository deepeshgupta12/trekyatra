from pydantic import BaseModel


class WordPressHealthResponse(BaseModel):
    base_url: str
    rest_api_base_url: str
    credentials_configured: bool
    timeout_seconds: float
    verify_ssl: bool


class WordPressCheckResult(BaseModel):
    attempted: bool
    ok: bool
    endpoint: str
    status_code: int | None
    message: str
    payload_preview: dict | list | str | None = None


class WordPressConnectionTestResponse(BaseModel):
    base_url: str
    public_api: WordPressCheckResult
    authenticated_api: WordPressCheckResult


# ---------------------------------------------------------------------------
# Step 16 — full WP content schemas
# ---------------------------------------------------------------------------


class WPPostResponse(BaseModel):
    id: int
    slug: str
    title: str
    content: str
    excerpt: str
    status: str
    post_type: str
    link: str
    date: str
    meta: dict = {}


class WPPostsListResponse(BaseModel):
    posts: list[WPPostResponse]
    total: int
    pages: int


class WPCategoryRequest(BaseModel):
    name: str


class WPCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str


class WPTagRequest(BaseModel):
    name: str


class WPTagResponse(BaseModel):
    id: int
    name: str
    slug: str
