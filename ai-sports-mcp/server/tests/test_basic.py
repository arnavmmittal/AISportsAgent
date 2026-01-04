"""
Basic tests for MCP Server
"""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment variables before importing anything
os.environ['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db'
os.environ['OPENAI_API_KEY'] = 'sk-test-key-for-ci-testing'
os.environ['ENVIRONMENT'] = 'test'
os.environ['DEBUG'] = 'true'

import pytest


def test_imports():
    """Test that core modules can be imported."""
    try:
        from app.core.logging import setup_logging
        assert True
    except ImportError as e:
        pytest.fail(f"Failed to import core modules: {e}")


def test_environment_variables():
    """Test that required environment variables are defined (or have defaults)."""
    # Import after env vars are set
    from app.core.config import Settings

    # Create settings with test values
    settings = Settings()

    # Should have default values or be defined
    assert settings is not None
    assert hasattr(settings, 'ENVIRONMENT')
    assert settings.ENVIRONMENT is not None


@pytest.mark.asyncio
async def test_basic_async():
    """Test async functionality works."""
    import asyncio

    async def dummy_async():
        await asyncio.sleep(0.01)
        return True

    result = await dummy_async()
    assert result is True


def test_configuration_loading():
    """Test that configuration can be loaded without errors."""
    from app.core.config import Settings

    settings = Settings()

    # Verify settings object exists and has expected attributes
    assert settings is not None
    assert hasattr(settings, 'ENVIRONMENT')
    # Just check it's not None, don't check type since it's an Enum
    assert settings.ENVIRONMENT is not None


def test_logging_setup():
    """Test that logging can be initialized."""
    from app.core.logging import setup_logging

    logger = setup_logging()

    # Verify logger was created
    assert logger is not None

    # Test logging doesn't crash (catch any exceptions)
    try:
        logger.info("Test log message")
        logger.debug("Test debug message")
        assert True
    except Exception as e:
        pytest.fail(f"Logging failed: {e}")
