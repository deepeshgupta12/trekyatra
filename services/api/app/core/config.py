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
    redis_port: int = 6379
    redis_db: int = 0

    wordpress_base_url: str = "http://localhost:8080"
    wordpress_username: str = "admin"
    wordpress_app_password: str = "replace_me"

    google_client_id: str | None = None
    google_client_secret: str | None = None
    sms_provider: str | None = None
    sms_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()