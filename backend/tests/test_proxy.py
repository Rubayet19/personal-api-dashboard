import pytest
from fastapi.testclient import TestClient
from unittest import mock
import json

from app.main import app
from app.utils.auth import create_access_token

client = TestClient(app)


def get_auth_token():
    """Helper function to create a valid auth token for testing"""
    access_token = create_access_token(
        data={"sub": "test@example.com"}
    )
    return access_token


@mock.patch("httpx.AsyncClient.request")
def test_proxy_request_get_success(mock_request):
    """Test that a GET request is successfully proxied"""
    # Setup mock response
    mock_response = mock.MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"content-type": "application/json"}
    mock_response.json.return_value = {"data": "mocked response"}
    mock_response.text = json.dumps({"data": "mocked response"})
    mock_request.return_value = mock_response

    # Get auth token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Define test request
    request_data = {
        "url": "https://example.com/api",
        "method": "GET",
        "headers": {"Accept": "application/json"}
    }

    # Make request
    response = client.post("/api/proxy", json=request_data, headers=headers)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["status_code"] == 200
    assert data["body"]["data"] == "mocked response"
    assert "time_taken" in data


@mock.patch("httpx.AsyncClient.request")
def test_proxy_request_post_success(mock_request):
    """Test that a POST request with body is successfully proxied"""
    # Setup mock response
    mock_response = mock.MagicMock()
    mock_response.status_code = 201
    mock_response.headers = {"content-type": "application/json"}
    mock_response.json.return_value = {"id": 123, "status": "created"}
    mock_response.text = json.dumps({"id": 123, "status": "created"})
    mock_request.return_value = mock_response

    # Get auth token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Define test request
    request_data = {
        "url": "https://example.com/api/resource",
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": {"name": "Test Resource", "value": 42}
    }

    # Make request
    response = client.post("/api/proxy", json=request_data, headers=headers)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["status_code"] == 201
    assert data["body"]["id"] == 123
    assert data["body"]["status"] == "created"


@mock.patch("httpx.AsyncClient.request")
def test_proxy_request_with_api_key(mock_request, monkeypatch):
    """Test using a stored API key in the proxy request"""
    # Setup mock response
    mock_response = mock.MagicMock()
    mock_response.status_code = 200
    mock_response.headers = {"content-type": "application/json"}
    mock_response.json.return_value = {"data": "success with api key"}
    mock_response.text = json.dumps({"data": "success with api key"})
    mock_request.return_value = mock_response

    # Mock the get_api_key function
    def mock_get_api_key(key_id):
        if key_id == "test-key-id":
            return {
                "id": "test-key-id",
                "user_id": "test-user",
                "api_name": "Test API",
                "api_key": "test-api-key-value",
                "header_name": "X-API-Key"
            }
        return None

    monkeypatch.setattr("app.routers.proxy.get_api_key", mock_get_api_key)

    # Get auth token
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Define test request with API key ID
    request_data = {
        "url": "https://api.example.com/protected",
        "method": "GET",
        "api_key_id": "test-key-id"
    }

    # Make request
    response = client.post("/api/proxy", json=request_data, headers=headers)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["status_code"] == 200
    assert data["body"]["data"] == "success with api key"

    # Verify the API key was included in the request headers
    called_args = mock_request.call_args[1]
    assert "X-API-Key" in called_args["headers"]
    assert called_args["headers"]["X-API-Key"] == "test-api-key-value"


def test_proxy_request_unauthorized():
    """Test that proxy endpoint requires authentication"""
    request_data = {
        "url": "https://example.com/api",
        "method": "GET"
    }
    
    # Request without token should fail
    response = client.post("/api/proxy", json=request_data)
    assert response.status_code == 401 