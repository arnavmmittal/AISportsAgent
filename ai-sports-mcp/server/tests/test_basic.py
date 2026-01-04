"""
Basic tests for MCP Server
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest


def test_imports():
    """Test that core modules can be imported."""
    try:
        from app.core.logging import setup_logging
        from app.core.config import get_settings
        assert True
    except ImportError as e:
        pytest.fail(f"Failed to import core modules: {e}")


def test_environment_variables():
    """Test that required environment variables are defined (or have defaults)."""
    from app.core.config import get_settings

    settings = get_settings()

    # Should have default values or be defined
    assert settings is not None
    assert hasattr(settings, 'ENVIRONMENT')


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
    from app.core.config import get_settings

    settings = get_settings()

    # Verify settings object exists and has expected attributes
    assert settings is not None
    assert hasattr(settings, 'ENVIRONMENT')
    assert isinstance(settings.ENVIRONMENT, str)


def test_logging_setup():
    """Test that logging can be initialized."""
    from app.core.logging import setup_logging

    logger = setup_logging()

    # Verify logger was created
    assert logger is not None

    # Test logging doesn't crash
    logger.info("Test log message")
    logger.debug("Test debug message")

    assert True
