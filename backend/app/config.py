from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Reads settings from backend/.env (or real environment variables, which win)."""

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / '.env', extra='ignore')

    database_url: str


settings = Settings()
