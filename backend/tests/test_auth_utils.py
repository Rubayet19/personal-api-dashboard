import pytest
from datetime import timedelta
from jose import jwt

from app.utils.auth import (
    get_password_hash,
    verify_password,
    authenticate_user,
    create_access_token,
    create_new_user,
    get_user,
    SECRET_KEY,
    ALGORITHM
)

@pytest.mark.asyncio
async def test_password_hashing():
    """Test password hashing and verification functions."""
    password = "testpassword123"
    hashed = get_password_hash(password)
    
    # Ensure hashed password is not equal to original
    assert hashed != password
    
    # Verify that the original password matches the hash
    assert verify_password(password, hashed)
    
    # Verify that incorrect password doesn't match
    assert not verify_password("wrongpassword", hashed)

@pytest.mark.asyncio
async def test_create_new_user():
    """Test user creation function."""
    test_email = "test_create@example.com"
    test_password = "password123"
    
    # Create a new user
    user = await create_new_user(test_email, test_password)
    
    # Assert user was created correctly
    assert user is not None
    assert user["email"] == test_email
    assert "hashed_password" in user
    assert verify_password(test_password, user["hashed_password"])
    
    # Try to create the same user again should return False
    duplicate_user = await create_new_user(test_email, "another_password")
    assert duplicate_user is False
    
    # Verify user can be fetched
    fetched_user = get_user(test_email)
    assert fetched_user is not None
    assert fetched_user["email"] == test_email

@pytest.mark.asyncio
async def test_authenticate_user():
    """Test user authentication function."""
    test_email = "test_auth@example.com"
    test_password = "auth_password"
    
    # Create a test user
    await create_new_user(test_email, test_password)
    
    # Test successful authentication
    user = authenticate_user(test_email, test_password)
    assert user is not False
    assert user["email"] == test_email
    
    # Test authentication with wrong password
    user = authenticate_user(test_email, "wrong_password")
    assert user is False
    
    # Test authentication with non-existent user
    user = authenticate_user("nonexistent@example.com", test_password)
    assert user is False

def test_create_access_token():
    """Test JWT token creation."""
    email = "token_test@example.com"
    
    # Create token with default expiry
    token = create_access_token(data={"sub": email})
    assert token is not None
    
    # Decode and verify token
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == email
    assert "exp" in payload
    
    # Create token with custom expiry
    custom_delta = timedelta(minutes=5)
    token = create_access_token(data={"sub": email}, expires_delta=custom_delta)
    assert token is not None 