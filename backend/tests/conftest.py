import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add the parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set testing environment variable
os.environ['TESTING'] = 'True'

from app.main import app
from app.utils.dynamo_client import clear_test_db

@pytest.fixture(autouse=True)
def clear_test_database():
    """Clear the test database before each test."""
    clear_test_db()
    yield

@pytest.fixture
def client():
    """Create a test client for FastAPI endpoints."""
    return TestClient(app) 