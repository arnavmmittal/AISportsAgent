"""
Basic tests for MCP Server.

Tests core functionality without requiring database or external services.
Environment setup is handled by conftest.py.
"""

import pytest


def test_imports():
    """Test that core modules can be imported without errors."""
    from app.core.logging import setup_logging
    from app.core.config import settings

    assert setup_logging is not None
    assert settings is not None


def test_settings_loaded(test_settings):
    """Test that settings are loaded correctly from environment."""
    assert test_settings is not None
    assert hasattr(test_settings, 'ENVIRONMENT')
    assert test_settings.ENVIRONMENT is not None
    assert test_settings.DATABASE_URL.startswith('postgresql://')
    assert test_settings.OPENAI_API_KEY.startswith('sk-')


@pytest.mark.asyncio
async def test_basic_async():
    """Test async functionality works."""
    import asyncio

    async def dummy_async():
        await asyncio.sleep(0.01)
        return True

    result = await dummy_async()
    assert result is True


def test_configuration_has_required_fields(test_settings):
    """Test that configuration has all required fields."""
    assert hasattr(test_settings, 'ENVIRONMENT')
    assert hasattr(test_settings, 'DATABASE_URL')
    assert hasattr(test_settings, 'OPENAI_API_KEY')
    assert hasattr(test_settings, 'OPENAI_MODEL')
    assert hasattr(test_settings, 'LOG_LEVEL')
    assert hasattr(test_settings, 'LOG_FORMAT')


def test_logging_can_be_initialized():
    """Test that logging can be initialized without errors."""
    from app.core.logging import get_logger

    logger = get_logger("test")
    assert logger is not None

    # Test logging doesn't crash
    logger.info("Test log message from test suite")
    logger.debug("Test debug message")
