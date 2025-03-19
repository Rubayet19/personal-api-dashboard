import pytest
import json
from fastapi.testclient import TestClient
import sys
import os
from datetime import datetime, timedelta
import time

# Add the parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Test client
client = TestClient(app)

def test_end_to_end_workflow():
    """
    Test the complete workflow from registration to API key management,
    API requests, and viewing statistics.
    """
    # Step 1: Create a test user
    test_user = {
        "email": f"test_e2e_{int(time.time())}@example.com",
        "password": "Password123!"
    }
    
    # Sign up
    signup_response = client.post("/auth/signup", json=test_user)
    assert signup_response.status_code == 201
    assert "id" in signup_response.json()
    assert "email" in signup_response.json()
    
    # Step 2: Login to get token
    login_data = {
        "username": test_user["email"],
        "password": test_user["password"]
    }
    
    login_response = client.post("/auth/token", data=login_data)
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert "token_type" in token_data
    
    # Set auth headers for subsequent requests
    auth_headers = {
        "Authorization": f"Bearer {token_data['access_token']}"
    }
    
    # Step 3: Create an API key
    api_key_data = {
        "api_name": "MockAPI",
        "api_key": "test_api_key_12345"
    }
    
    create_key_response = client.post(
        "/api/keys", 
        json=api_key_data,
        headers=auth_headers
    )
    assert create_key_response.status_code == 201
    created_key = create_key_response.json()
    assert created_key["api_name"] == api_key_data["api_name"]
    assert created_key["api_key"] == api_key_data["api_key"]
    
    # Step 4: Get all API keys
    get_keys_response = client.get("/api/keys", headers=auth_headers)
    assert get_keys_response.status_code == 200
    keys = get_keys_response.json()
    assert isinstance(keys, list)
    assert len(keys) >= 1
    
    # Step 5: Make a proxy request
    # Using httpbin.org as a test endpoint
    proxy_data = {
        "url": "https://httpbin.org/get",
        "method": "GET",
        "headers": {},
        "body": None,
        "api_key_id": None  # Not using a real API key for this test
    }
    
    proxy_response = client.post(
        "/api/proxy",
        json=proxy_data,
        headers=auth_headers
    )
    assert proxy_response.status_code == 200
    proxy_result = proxy_response.json()
    assert "status_code" in proxy_result
    assert "headers" in proxy_result
    assert "body" in proxy_result
    assert proxy_result["status_code"] == 200
    
    # Step 6: Get dashboard statistics
    stats_response = client.get("/api/stats", headers=auth_headers)
    assert stats_response.status_code == 200
    stats = stats_response.json()
    assert "total_api_keys" in stats
    assert "api_calls" in stats
    assert "success_rate" in stats
    assert "average_latency" in stats
    
    # Verify API key count matches what we created
    assert stats["total_api_keys"] >= 1
    
    # Verify API calls count includes our proxy request
    assert stats["api_calls"] >= 1
    
    # Step 7: Get request logs
    logs_response = client.get("/api/stats/request-logs", headers=auth_headers)
    assert logs_response.status_code == 200
    logs = logs_response.json()
    assert isinstance(logs, list)
    
    # Verify our httpbin request is in the logs
    httpbin_requests = [log for log in logs if "httpbin.org" in log["url"]]
    assert len(httpbin_requests) >= 1
    
    # Step 8: Update the API key
    key_id = created_key["id"]
    update_data = {
        "api_name": "UpdatedMockAPI"
    }
    
    update_response = client.put(
        f"/api/keys/{key_id}",
        json=update_data,
        headers=auth_headers
    )
    assert update_response.status_code == 200
    updated_key = update_response.json()
    assert updated_key["api_name"] == update_data["api_name"]
    
    # Step 9: Delete the API key
    delete_response = client.delete(
        f"/api/keys/{key_id}",
        headers=auth_headers
    )
    assert delete_response.status_code == 204
    
    # Verify it's gone
    get_key_response = client.get(
        f"/api/keys/{key_id}",
        headers=auth_headers
    )
    assert get_key_response.status_code == 404 