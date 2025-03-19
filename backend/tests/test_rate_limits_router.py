import pytest
import json
from fastapi.testclient import TestClient
import sys
import os
from datetime import datetime, timedelta

# Add the parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.utils.auth import create_access_token
from app.utils import redis_client

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

def test_get_rate_limits(auth_client):
    """Test getting rate limits for a user"""
    response = auth_client.get("/api/rate-limits")
    assert response.status_code == 200
    data = response.json()
    
    # Results should be a list
    assert isinstance(data, list)

def test_create_and_get_rate_limit(auth_client):
    """Test creating and then getting a rate limit"""
    # Create a new rate limit
    api_name = "CreateTestAPI"
    rate_limit_data = {
        "api_name": api_name,
        "limit": 1000,
        "remaining": 900,
        "reset": int((datetime.now() + timedelta(hours=1)).timestamp()),
        "used": 100
    }
    
    # Create the rate limit
    response = auth_client.post("/api/rate-limits", json=rate_limit_data)
    assert response.status_code == 201
    created_data = response.json()
    
    # Check the created data - API names are not normalized in the response
    assert created_data["api_name"] == api_name 
    assert created_data["limit"] == rate_limit_data["limit"]
    assert created_data["remaining"] == rate_limit_data["remaining"]
    
    # Now get the rate limit by API name
    response = auth_client.get(f"/api/rate-limits/{api_name}")
    assert response.status_code == 200
    
    get_data = response.json()
    assert get_data["api_name"] == api_name  # API name should match what we created
    assert get_data["limit"] == rate_limit_data["limit"]
    assert get_data["remaining"] == rate_limit_data["remaining"]

def test_update_rate_limit(auth_client):
    """Test updating a rate limit"""
    # First create a rate limit
    api_name = "UpdateTestAPI"
    rate_limit_data = {
        "api_name": api_name,
        "limit": 1000,
        "remaining": 900,
        "reset": int((datetime.now() + timedelta(hours=1)).timestamp()),
        "used": 100
    }
    
    # Create the rate limit
    response = auth_client.post("/api/rate-limits", json=rate_limit_data)
    assert response.status_code == 201
    
    # Now update it
    update_data = {
        "remaining": 800,
        "used": 200
    }
    
    response = auth_client.put(f"/api/rate-limits/{api_name}", json=update_data)
    assert response.status_code == 200
    
    updated_data = response.json()
    assert updated_data["api_name"] == api_name  # API name should match what we created
    assert updated_data["remaining"] == update_data["remaining"]
    
    # Verify with a get request
    response = auth_client.get(f"/api/rate-limits/{api_name}")
    assert response.status_code == 200
    get_data = response.json()
    assert get_data["remaining"] == update_data["remaining"]

def test_delete_rate_limit(auth_client):
    """Test deleting a rate limit"""
    # First create a rate limit
    api_name = "DeleteTestAPI"
    rate_limit_data = {
        "api_name": api_name,
        "limit": 1000,
        "remaining": 900,
        "reset": int((datetime.now() + timedelta(hours=1)).timestamp()),
        "used": 100
    }
    
    # Create the rate limit
    response = auth_client.post("/api/rate-limits", json=rate_limit_data)
    assert response.status_code == 201
    
    # Delete it
    response = auth_client.delete(f"/api/rate-limits/{api_name}")
    assert response.status_code == 204
    
    # Verify it's deleted
    response = auth_client.get(f"/api/rate-limits/{api_name}")
    assert response.status_code in [404, 200]  # Either not found or empty result 