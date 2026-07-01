import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

# Project root is one level above backend/
PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "AeroAssist AI"
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    database_url: str = f"sqlite:///{PROJECT_ROOT / 'aeroassist.db'}"

    gemini_api_key: str = ""
    openweather_api_key: str = ""
    aviationstack_api_key: str = ""

    embedding_model: str = "BAAI/bge-small-en-v1.5"
    chunk_size: int = 800
    chunk_overlap: int = 150
    rag_top_k: int = 3

    documents_dir: str = str(PROJECT_ROOT / "documents")
    faiss_dir: str = str(PROJECT_ROOT / "faiss")
    default_airline: str = "United"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def use_llm_agent(self) -> bool:
        return bool(self.gemini_api_key)

    class Config:
        env_file = str(PROJECT_ROOT / ".env")
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
