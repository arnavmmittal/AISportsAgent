"""
Database connection and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)

# Create SQLAlchemy engine with enhanced connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=getattr(settings, 'DATABASE_POOL_SIZE', 5),
    max_overflow=getattr(settings, 'DATABASE_MAX_OVERFLOW', 10),
    pool_pre_ping=True,  # Verify connections before use (prevents stale connections)
    pool_recycle=3600,   # Recycle connections every hour (prevents timeout)
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    connect_args={
        "connect_timeout": 10,  # 10 second connection timeout
        "options": "-c timezone=utc"  # Set timezone to UTC
    }
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.

    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database (create tables if they don't exist)."""
    logger.info("Initializing database...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")


def close_db() -> None:
    """Close database connections."""
    logger.info("Closing database connections...")
    engine.dispose()
    logger.info("Database connections closed")
