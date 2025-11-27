"""
Application configuration management.
Handles environment variables and settings for the AI Sports MCP server.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, Union
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "AI Sports Psychology MCP Server"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development, staging, production

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True

    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    OPENAI_TEMPERATURE: float = 0.7
    OPENAI_MAX_TOKENS: int = 2000

    # Vector Database (ChromaDB)
    CHROMA_HOST: Optional[str] = None  # If None, use local
    CHROMA_PORT: Optional[int] = None
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_data"
    CHROMA_COLLECTION_NAME: str = "sports_psychology_kb"

    @field_validator("CHROMA_HOST", "CHROMA_PORT", mode="before")
    @classmethod
    def parse_optional_fields(cls, v):
        """Convert empty strings to None for optional fields."""
        if v == "" or v is None:
            return None
        return v

    # Authentication / Security
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # NextAuth (for JWT verification from Next.js)
    NEXTAUTH_SECRET: Optional[str] = None
    NEXTAUTH_URL: str = "http://localhost:3000"

    # Crisis Detection
    CRISIS_ALERT_EMAIL: Optional[str] = None
    CRISIS_ALERT_WEBHOOK: Optional[str] = None

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 60
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # CORS
    CORS_ORIGINS: Union[list, str] = "http://localhost:3000,http://127.0.0.1:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text

    # Knowledge Base Processing
    KB_CHUNK_SIZE: int = 1000
    KB_CHUNK_OVERLAP: int = 200
    KB_MIN_CHUNK_SIZE: int = 100

    # Agent Settings
    DISCOVERY_MIN_QUESTIONS: int = 5
    DISCOVERY_MAX_QUESTIONS: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings
