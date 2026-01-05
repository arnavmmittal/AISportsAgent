"""
Application configuration management.
Handles environment variables and settings for the AI Sports MCP server.
"""

from enum import Enum
from pathlib import Path
from typing import Any, Optional, Union

from pydantic import field_validator, model_validator, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    """Application environment types."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class LogFormat(str, Enum):
    """Logging output formats."""
    JSON = "json"
    TEXT = "text"


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Configuration is organized into logical groups for better maintainability.
    All sensitive values should be overridden via environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # ============================================================================
    # Application Settings
    # ============================================================================
    APP_NAME: str = "AI Sports Psychology MCP Server"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: Environment = Environment.DEVELOPMENT

    # ============================================================================
    # Server Configuration
    # ============================================================================
    HOST: str = "0.0.0.0"
    PORT: int = Field(default=8000, ge=1, le=65535)
    RELOAD: bool = True

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT == Environment.PRODUCTION

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT == Environment.DEVELOPMENT

    # ============================================================================
    # Database Configuration
    # ============================================================================
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = Field(default=10, ge=1, le=100)
    DATABASE_MAX_OVERFLOW: int = Field(default=20, ge=0, le=100)
    DATABASE_ECHO: bool = False

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL format."""
        if not v:
            raise ValueError("DATABASE_URL is required")
        if not v.startswith(("postgresql://", "postgres://")):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string")
        return v

    # ============================================================================
    # OpenAI Configuration
    # ============================================================================
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    OPENAI_TEMPERATURE: float = Field(default=0.7, ge=0.0, le=2.0)
    OPENAI_MAX_TOKENS: int = Field(default=2000, ge=1, le=128000)
    OPENAI_TIMEOUT: int = Field(default=60, ge=1)

    @field_validator("OPENAI_API_KEY")
    @classmethod
    def validate_openai_key(cls, v: str) -> str:
        """Validate OpenAI API key format."""
        if not v:
            raise ValueError("OPENAI_API_KEY is required")
        if not v.startswith("sk-"):
            raise ValueError("OPENAI_API_KEY must start with 'sk-'")
        return v

    # ============================================================================
    # Voice Integration (Cartesia.ai + Whisper)
    # ============================================================================
    CARTESIA_API_KEY: Optional[str] = None  # Optional - falls back to OpenAI TTS
    CARTESIA_VOICE_ID: str = "voice-id-supportive"  # Default voice for athlete support
    WHISPER_MODEL: str = "whisper-1"  # OpenAI Whisper model for STT

    @field_validator("CARTESIA_API_KEY", mode="before")
    @classmethod
    def parse_cartesia_key(cls, v: Any) -> Optional[str]:
        """Parse Cartesia API key (optional)."""
        if v == "" or v is None:
            return None
        return v

    # ============================================================================
    # Vector Database (ChromaDB) Configuration
    # ============================================================================
    CHROMA_HOST: Optional[str] = None
    CHROMA_PORT: Optional[int] = Field(default=None, ge=1, le=65535)
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_data"
    CHROMA_COLLECTION_NAME: str = "sports_psychology_kb"

    @field_validator("CHROMA_HOST", "CHROMA_PORT", mode="before")
    @classmethod
    def parse_optional_fields(cls, v: Any) -> Optional[Any]:
        """Convert empty strings to None for optional fields."""
        if v == "" or v is None:
            return None
        return v

    @property
    def chroma_persist_path(self) -> Path:
        """Get ChromaDB persistence directory as Path object."""
        return Path(self.CHROMA_PERSIST_DIRECTORY)

    @property
    def is_chroma_remote(self) -> bool:
        """Check if ChromaDB is configured for remote access."""
        return self.CHROMA_HOST is not None and self.CHROMA_PORT is not None

    # ============================================================================
    # Security & Authentication
    # ============================================================================
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, ge=1)

    # NextAuth integration
    NEXTAUTH_SECRET: Optional[str] = None
    NEXTAUTH_URL: str = "http://localhost:3000"

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        """Ensure secrets are changed in production."""
        if self.is_production:
            if self.JWT_SECRET_KEY == "your-secret-key-change-in-production":
                raise ValueError("JWT_SECRET_KEY must be changed in production")
        return self

    # ============================================================================
    # Crisis Detection & Alerts
    # ============================================================================
    CRISIS_ALERT_EMAIL: Optional[str] = None
    CRISIS_ALERT_WEBHOOK: Optional[str] = None

    @field_validator("CRISIS_ALERT_EMAIL")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Validate email format if provided."""
        if v and "@" not in v:
            raise ValueError("Invalid email format for CRISIS_ALERT_EMAIL")
        return v

    # ============================================================================
    # Rate Limiting
    # ============================================================================
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = Field(default=60, ge=1)
    RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60, ge=1)

    # ============================================================================
    # CORS Configuration
    # ============================================================================
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS from comma-separated string to list."""
        if not self.CORS_ORIGINS:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # ============================================================================
    # Logging Configuration
    # ============================================================================
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: LogFormat = LogFormat.JSON

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return v_upper

    # ============================================================================
    # Knowledge Base Processing
    # ============================================================================
    KB_CHUNK_SIZE: int = Field(default=1000, ge=100, le=4000)
    KB_CHUNK_OVERLAP: int = Field(default=200, ge=0, le=1000)
    KB_MIN_CHUNK_SIZE: int = Field(default=100, ge=50)

    @model_validator(mode="after")
    def validate_chunk_sizes(self) -> "Settings":
        """Validate chunk size relationships."""
        if self.KB_CHUNK_OVERLAP >= self.KB_CHUNK_SIZE:
            raise ValueError("KB_CHUNK_OVERLAP must be less than KB_CHUNK_SIZE")
        if self.KB_MIN_CHUNK_SIZE > self.KB_CHUNK_SIZE:
            raise ValueError("KB_MIN_CHUNK_SIZE must be <= KB_CHUNK_SIZE")
        return self

    # ============================================================================
    # Agent Configuration
    # ============================================================================
    DISCOVERY_MIN_QUESTIONS: int = Field(default=5, ge=1, le=20)
    DISCOVERY_MAX_QUESTIONS: int = Field(default=10, ge=1, le=20)

    @model_validator(mode="after")
    def validate_discovery_questions(self) -> "Settings":
        """Validate discovery question bounds."""
        if self.DISCOVERY_MIN_QUESTIONS > self.DISCOVERY_MAX_QUESTIONS:
            raise ValueError(
                "DISCOVERY_MIN_QUESTIONS must be <= DISCOVERY_MAX_QUESTIONS"
            )
        return self


# ============================================================================
# Global Settings Instance
# ============================================================================
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """
    Get the global settings instance (singleton pattern).

    Returns:
        Settings: The application settings instance
    """
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


# Convenience alias for backward compatibility
settings = get_settings()
