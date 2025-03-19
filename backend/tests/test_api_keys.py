import pytest
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

# Test getting all API keys (empty list initially)
def test_get_api_keys_empty(auth_client):
    response = auth_client.get("/api/keys")
    assert response.status_code == 200
    assert response.json() == []

# Test creating an API key
def test_create_api_key(auth_client):
    api_key_data = {
        "api_name": "GitHub",
        "api_key": "ghp_testkey123456789"
    }
    response = auth_client.post("/api/keys", json=api_key_data)
    assert response.status_code == 201
    
    result = response.json()
    assert result["api_name"] == api_key_data["api_name"]
    assert result["api_key"] == api_key_data["api_key"]
    assert "id" in result
    assert "created_at" in result
    assert "updated_at" in result
    
    # Save the created key ID for later tests
    return result["id"]

# Test getting all API keys (should now have one)
def test_get_api_keys_with_item(auth_client):
    # First create a key
    key_id = test_create_api_key(auth_client)
    
    # Now get all keys
    response = auth_client.get("/api/keys")
    assert response.status_code == 200
    
    results = response.json()
    assert isinstance(results, list)
    assert len(results) >= 1
    
    # Instead verify the key we just created is in the list
    found = False
    for key in results:
        if key['id'] == key_id:
            found = True
            break
    assert found, f"Created key with ID {key_id} not found in results"

# Test getting a specific API key
def test_get_single_api_key(auth_client):
    # First create a key
    key_id = test_create_api_key(auth_client)
    
    # Now get the specific key
    response = auth_client.get(f"/api/keys/{key_id}")
    assert response.status_code == 200
    
    result = response.json()
    assert result["id"] == key_id
    assert result["api_name"] == "GitHub"
    assert result["api_key"] == "ghp_testkey123456789"

# Test updating an API key
def test_update_api_key(auth_client):
    # First create a key
    key_id = test_create_api_key(auth_client)
    
    # Update the key
    update_data = {
        "api_name": "GitHub Updated",
        "api_key": "ghp_updated987654321"
    }
    response = auth_client.put(f"/api/keys/{key_id}", json=update_data)
    assert response.status_code == 200
    
    result = response.json()
    assert result["id"] == key_id
    assert result["api_name"] == update_data["api_name"]
    assert result["api_key"] == update_data["api_key"]
    
    # Verify the update by getting the key
    response = auth_client.get(f"/api/keys/{key_id}")
    assert response.status_code == 200
    result = response.json()
    assert result["api_name"] == update_data["api_name"]

# Test partial update (only name)
def test_partial_update_api_key(auth_client):
    # First create a key
    key_id = test_create_api_key(auth_client)
    
    # Get the original key to compare
    original = auth_client.get(f"/api/keys/{key_id}").json()
    
    # Update only the name
    update_data = {
        "api_name": "GitHub Partial Update"
    }
    response = auth_client.put(f"/api/keys/{key_id}", json=update_data)
    assert response.status_code == 200
    
    result = response.json()
    assert result["id"] == key_id
    assert result["api_name"] == update_data["api_name"]
    assert result["api_key"] == original["api_key"]  # Key should remain unchanged

# Test deleting an API key
def test_delete_api_key(auth_client):
    # First create a key
    key_id = test_create_api_key(auth_client)
    
    # Delete the key
    response = auth_client.delete(f"/api/keys/{key_id}")
    assert response.status_code == 204
    
    # Verify the key is deleted
    response = auth_client.get(f"/api/keys/{key_id}")
    assert response.status_code == 404

# Test accessing non-existent API key
def test_get_nonexistent_api_key(auth_client):
    response = auth_client.get("/api/keys/non-existent-id")
    assert response.status_code == 404

# Test unauthorized access (no token)
def test_unauthorized_access():
    # Create a new client without auth headers to ensure it's unauthenticated
    unauth_client = TestClient(app)
    
    response = unauth_client.get("/api/keys")
    assert response.status_code == 401 