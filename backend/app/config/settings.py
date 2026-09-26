from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# backend folder
BASE_DIR = Path(__file__).resolve().parents[2]

# persistent sqlite database
DEFAULT_DB = BASE_DIR / "land_acquisition.db"


class Settings(BaseSettings):
    app_name: str = "Land Acquisition Predictive System"
    environment: str = "development"

    # Persistent database
    database_url: str = f"sqlite:///{DEFAULT_DB.as_posix()}"

    # ML service
    ml_service_url: str = "http://127.0.0.1:8001"

    # Authentication
    secret_key: str = "landiq-super-secret-key-2026"
    access_token_expire_minutes: int = 60

    # Frontend
    cors_origins: str = (
        "http://127.0.0.1:5173,"
        "http://localhost:5173"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if len(value) < 16:
            raise ValueError(
                "SECRET_KEY must be at least 16 characters."
            )
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()