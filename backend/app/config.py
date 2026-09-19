import re
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    llm_api: str = "responses"  # responses | chat
    model_fast: str = "gpt-5.6-luna"
    model_strong: str = "gpt-5.6-terra"
    embedding_model: str = "text-embedding-3-small"
    embedding_dim: int = 1536

    # Default matches docker-compose.dev.yml, which uses passwordless trust auth
    database_url: str = "postgresql+asyncpg://mentor@localhost:5432/mentor"
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db: str = "mentor"

    exa_api_key: str = ""

    clickup_token: str = ""
    clickup_enabled: bool = False
    sarvam_api_key: str = ""

    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    auth_secret: str = "change-me"
    repos_dir: str = "./data/repos"

    @field_validator("database_url")
    @classmethod
    def _asyncpg_url(cls, url: str) -> str:
        """Accept the connection strings Supabase gives out and make them asyncpg URLs."""
        scheme, sep, rest = url.partition("://")
        if not sep:
            return url
        if scheme.split("+")[0] in ("postgres", "postgresql"):
            scheme = "postgresql+asyncpg"
        # asyncpg does not understand libpq's sslmode; "ssl" is its equivalent
        rest = re.sub(r"([?&])sslmode=", r"\1ssl=", rest)
        return f"{scheme}://{rest}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
