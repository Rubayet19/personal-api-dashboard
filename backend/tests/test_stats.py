import pytest
import json
from fastapi.testclient import TestClient
import sys
import os

# Add the parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.utils.auth import create_access_token

# Test client
client = TestClient(app)

# Sample user data
TEST_USER = {"sub": "test-user", "email": "test@example.com"}

# Create a test JWT token
def get_test_token():
    return create_access_token(TEST_USER)

# Test fixture for authenticated client
@pytest.fixture
def auth_client():
    token = get_test_token()
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client

def test_get_dashboard_stats(auth_client):
    """Test getting dashboard statistics"""
    response = auth_client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    
    # Check for expected fields in the response
    assert "total_api_keys" in data
    assert "api_calls" in data
    assert "success_rate" in data
    assert "average_latency" in data
    
    # Verify data types
    assert isinstance(data["total_api_keys"], int)
    assert isinstance(data["api_calls"], int)
    assert isinstance(data["success_rate"], (int, float)) or data["success_rate"] is None
    assert isinstance(data["average_latency"], (int, float)) or data["average_latency"] is None

def test_get_request_logs(auth_client):
    """Test getting request logs"""
    response = auth_client.get("/api/stats/request-logs")
    assert response.status_code == 200
    data = response.json()
    
    # Verify it's a list
    assert isinstance(data, list)
    
    # If there are logs, check their structure
    if data:
        sample_log = data[0]
        assert "url" in sample_log
        assert "method" in sample_log
        assert "status_code" in sample_log
        assert "timestamp" in sample_log
        assert "time_taken" in sample_log

def test_unauthorized_stats_access():
    """Test that unauthenticated users cannot access stats"""
    # Create a new client without auth headers
    unauth_client = TestClient(app)
    
    response = unauth_client.get("/api/stats")
    assert response.status_code == 401
    
    response = unauth_client.get("/api/stats/request-logs")
    assert response.status_code == 401 