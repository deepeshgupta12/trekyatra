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