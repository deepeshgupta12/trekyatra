from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TrekYatra API"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    api_v1_prefix: str = "/api/v1"

    postgres_server: str = "localhost"
    postgres_port: int = 5433
    postgres_db: str = "trekyatra"
    postgres_user: str = "trekyatra"
    postgres_password: str = "trekyatra"

    redis_host: str = "localhost"
    redis_port: int = 6380
    redis_db: int = 0
    redis_username: str = "default"   # DO Valkey uses "default" as username
    redis_password: str | None = None  # Required for DO managed Valkey

    google_client_id: str | None = None
    google_client_secret: str | None = None
    anthropic_api_key: str | None = None
    sms_provider: str | None = None
    sms_api_key: str | None = None

    auth_jwt_secret: str = "trekyatra-dev-secret-key-at-least-32-bytes-long"
    auth_jwt_algorithm: str = "HS256"
    auth_access_token_expire_minutes: int = 1440  # 24 hours — user stays logged in for 1 day
    auth_cookie_name: str = "trekyatra_access_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"

    # CMS admin credentials — completely separate from public user auth
    admin_email: str = "explore@trekyatra.co.in"
    admin_password: str | None = None
    admin_cookie_name: str = "trekyatra_admin_token"
    admin_token_expire_hours: int = 24

    # Frontend base URL — used when building links in emails (e.g. verification URL)
    frontend_url: str = "https://trekyatra.co.in"

    # SMTP — used for lead notification, welcome, verification emails (gracefully disabled if unset)
    # GoDaddy SMTP: smtpout.secureserver.net, port 587 (STARTTLS)
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "explore@trekyatra.co.in"

    # Newsletter platform wiring (mailchimp | brevo); gracefully disabled if unset
    newsletter_platform: str | None = None
    newsletter_platform_api_key: str | None = None
    newsletter_list_id: str | None = None

    # Payment — Razorpay (India-first). Leave unset to run in test mode (skip real payment).
    razorpay_key_id: str | None = None
    razorpay_key_secret: str | None = None

    # Stripe — recurring subscription billing (Step 40)
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_premium_price_id_monthly: str | None = None
    stripe_premium_price_id_annual: str | None = None

    # IAP — Apple App Store + Google Play in-app purchases (M13)
    # Leave unset to run in test mode (subscription activated without real store verification).
    apple_iap_shared_secret: str | None = None
    google_play_service_account_json: str | None = None

    # Digital product file storage — local path, relative to services/api/
    product_files_dir: str = "data/products"
    product_download_base_url: str = "http://localhost:3000"

    # OpenAI — required for embedding generation (Step 35+). Leave unset to skip embeddings.
    openai_api_key: str | None = None

    # Step 44 — Search analytics (no API key required for basic search)
    # Step 45 — Image gathering agent (all optional; graceful skip if unset)
    unsplash_access_key: str | None = None    # unsplash.com/developers → Client-ID
    pixabay_api_key: str | None = None        # pixabay.com/api → free signup

    # DigitalOcean Spaces — object storage for media uploads (images, files)
    # Create a Space at cloud.digitalocean.com/spaces; generate API keys under API > Spaces Keys
    do_spaces_key: str | None = None
    do_spaces_secret: str | None = None
    do_spaces_bucket: str | None = None          # e.g. "trekyatra-media"
    do_spaces_endpoint: str | None = None        # e.g. "https://blr1.digitaloceanspaces.com"
    do_spaces_region: str = "blr1"
    do_spaces_cdn_endpoint: str | None = None    # e.g. "https://trekyatra-media.blr1.cdn.digitaloceanspaces.com"

    # Step 64 — CDP Analytics Layer
    # GA4 Measurement Protocol (server-side event forwarding — bypasses ad blockers)
    ga4_measurement_id: str | None = None        # e.g. "G-XXXXXXXXXX"
    ga4_api_secret: str | None = None            # GA4 Admin > Data Streams > Measurement Protocol API secrets
    # Google Search Console API (service account JSON, base64 or raw JSON string)
    gsc_service_account_json: str | None = None  # JSON string from GSC service account key file

    # Step M03 — Mobile token expiry
    mobile_token_expire_days: int = 30

    # Step 67 — CDP Phase 0: internal traffic separation
    # Comma-separated list of anonymous_ids belonging to developers/internal team.
    # Events from these IDs are marked is_internal=true and excluded from analytics by default.
    internal_anonymous_ids: list[str] = []

    # Step 72 — TrekSage MCP server: shared secret gating write/LLM-cost tools
    # (create_trek_plan_lead, translate_trek_content) when called via MCP.
    mcp_shared_secret: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlalchemy_database_uri(self) -> str:
        base = (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"
        )
        # DO managed Postgres uses port 25060 and requires SSL
        if self.postgres_port == 25060:
            base += "?sslmode=require"
        return base

    @computed_field  # type: ignore[prop-decorator]
    @property
    def _redis_scheme(self) -> str:
        # DO managed Redis/Valkey uses port 25061 and requires TLS (rediss://)
        return "rediss" if self.redis_port == 25061 else "redis"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def _redis_ssl_params(self) -> str:
        # Celery requires ssl_cert_reqs when using rediss://
        return "?ssl_cert_reqs=CERT_NONE" if self._redis_scheme == "rediss" else ""

    @computed_field  # type: ignore[prop-decorator]
    @property
    def _redis_auth(self) -> str:
        # Format: username:password@ (DO Valkey uses "default" username)
        if self.redis_password:
            return f"{self.redis_username}:{self.redis_password}@"
        return ""

    @computed_field  # type: ignore[prop-decorator]
    @property
    def redis_url(self) -> str:
        return (
            f"{self._redis_scheme}://{self._redis_auth}"
            f"{self.redis_host}:{self.redis_port}"
            f"/{self.redis_db}{self._redis_ssl_params}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def celery_broker_url(self) -> str:
        return (
            f"{self._redis_scheme}://{self._redis_auth}"
            f"{self.redis_host}:{self.redis_port}"
            f"/1{self._redis_ssl_params}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def celery_result_backend(self) -> str:
        return (
            f"{self._redis_scheme}://{self._redis_auth}"
            f"{self.redis_host}:{self.redis_port}"
            f"/1{self._redis_ssl_params}"
        )

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()