"""
Pytest configuration and fixtures for MCP Server tests.

This file runs before any tests and sets up the testing environment.
"""

import os
import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment variables BEFORE any app imports
# This is critical because app/core/config.py creates settings on import
os.environ.setdefault('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/test_db')
os.environ.setdefault('OPENAI_API_KEY', 'sk-test-key-for-ci-testing')
os.environ.setdefault('ENVIRONMENT', 'development')  # Use development to avoid production validation
os.environ.setdefault('DEBUG', 'true')
os.environ.setdefault('LOG_LEVEL', 'DEBUG')
os.environ.setdefault('LOG_FORMAT', 'text')

# Optional environment variables
os.environ.setdefault('REDIS_URL', 'redis://localhost:6379')
os.environ.setdefault('JWT_SECRET_KEY', 'test-jwt-secret-key-32-characters-long')
os.environ.setdefault('NEXTAUTH_SECRET', 'test-nextauth-secret')
os.environ.setdefault('NEXTAUTH_URL', 'http://localhost:3000')

# Pytest configuration
import pytest


@pytest.fixture(scope="session")
def test_settings():
    """
    Provide test settings for the entire test session.
    """
    from app.core.config import Settings
    return Settings()


@pytest.fixture(scope="function")
def mock_db():
    """
    Mock database session for tests that don't need real DB.
    """
    from unittest.mock import MagicMock
    return MagicMock()


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """
    Auto-use fixture that sets up test environment.
    Runs once at the start of the test session.
    """
    print("\n" + "="*60)
    print("Setting up test environment...")
    print(f"DATABASE_URL: {os.environ['DATABASE_URL']}")
    print(f"ENVIRONMENT: {os.environ['ENVIRONMENT']}")
    print(f"DEBUG: {os.environ['DEBUG']}")
    print("="*60 + "\n")

    yield

    print("\n" + "="*60)
    print("Tearing down test environment...")
    print("="*60 + "\n")
