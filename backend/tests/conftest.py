import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add the parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.utils.auth import fake_users_db

@pytest.fixture(autouse=True)
def clear_fake_db():
    """Clear the fake database before each test."""
    fake_users_db.clear()
    yield

@pytest.fixture
def client():
    """Create a test client for FastAPI endpoints."""
    return TestClient(app) 