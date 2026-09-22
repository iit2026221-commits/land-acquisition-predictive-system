from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    app_name: str = "Land Acquisition Predictive System"
    environment: str = "development"
    database_url: str = "sqlite:///./land_acquisition.db"
    ml_service_url: str = "http://localhost:8001"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if len(value) < 16:
            raise ValueError("SECRET_KEY must be at least 16 characters.")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
