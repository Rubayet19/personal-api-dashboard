import pytest
from fastapi.testclient import TestClient

def test_signup(client):
    """Test user signup endpoint."""
    # Test valid signup
    response = client.post(
        "/auth/signup",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["email"] == "test@example.com"
    
    # Test duplicate email signup
    response = client.post(
        "/auth/signup",
        json={"email": "test@example.com", "password": "password456"}
    )
    assert response.status_code == 400
    assert "User with this email already exists" in response.json()["detail"]
    
    # Test invalid email
    response = client.post(
        "/auth/signup",
        json={"email": "invalid-email", "password": "password123"}
    )
    assert response.status_code == 422
    
    # Test short password
    response = client.post(
        "/auth/signup",
        json={"email": "another@example.com", "password": "pass"}
    )
    assert response.status_code == 422

def test_login(client):
    """Test user login endpoint."""
    # Create test user first
    client.post(
        "/auth/signup",
        json={"email": "login_test@example.com", "password": "password123"}
    )
    
    # Test valid login
    response = client.post(
        "/auth/token",
        data={"username": "login_test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    # Test invalid password
    response = client.post(
        "/auth/token",
        data={"username": "login_test@example.com", "password": "wrong_password"}
    )
    assert response.status_code == 401
    
    # Test non-existent user
    response = client.post(
        "/auth/token",
        data={"username": "doesnotexist@example.com", "password": "password123"}
    )
    assert response.status_code == 401

def test_me_endpoint(client):
    """Test the /me endpoint that requires authentication."""
    # Create test user first
    client.post(
        "/auth/signup",
        json={"email": "me_test@example.com", "password": "password123"}
    )
    
    # Login to get token
    login_response = client.post(
        "/auth/token",
        data={"username": "me_test@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Test authenticated access to /me
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me_test@example.com"
    
    # Test unauthenticated access
    response = client.get("/auth/me")
    assert response.status_code == 401
    
    # Test with invalid token
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401 