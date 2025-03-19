import pytest
from unittest import mock
import json
from datetime import datetime, timedelta
import sys
import os

# Add the parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.redis_client import (
    store_rate_limit, 
    get_rate_limit, 
    delete_rate_limit, 
    get_all_rate_limits,
)

# Test user ID
TEST_USER_ID = "test-user-id"

def test_store_and_get_rate_limit():
    """Test storing and retrieving a rate limit"""
    user_id = TEST_USER_ID
    api_name = "TestAPI"
    limit = 5000
    remaining = 4500
    reset_time = datetime.now() + timedelta(hours=1)
    
    # Store the rate limit
    store_rate_limit(
        api_name=api_name,
        limit=limit,
        remaining=remaining,
        reset_time=reset_time,
        user_id=user_id
    )
    
    # Retrieve the rate limit
    rate_limit = get_rate_limit(api_name, user_id)
    
    assert rate_limit is not None
    assert rate_limit.api_name == api_name
    assert rate_limit.limit == limit
    assert rate_limit.remaining == remaining

def test_get_nonexistent_rate_limit():
    """Test getting a non-existent rate limit"""
    rate_limit = get_rate_limit("NonExistentAPI", TEST_USER_ID)
    assert rate_limit is None

def test_delete_rate_limit():
    """Test deleting a rate limit"""
    user_id = TEST_USER_ID
    api_name = "DeleteAPI"
    
    # First store a rate limit
    store_rate_limit(
        api_name=api_name,
        limit=1000,
        remaining=900,
        reset_time=datetime.now() + timedelta(hours=1),
        user_id=user_id
    )
    
    # Verify it exists
    assert get_rate_limit(api_name, user_id) is not None
    
    # Delete it
    result = delete_rate_limit(api_name, user_id)
    assert result is True
    
    # Verify it's gone
    assert get_rate_limit(api_name, user_id) is None

def test_get_all_rate_limits():
    """Test getting all rate limits for a user"""
    user_id = TEST_USER_ID
    
    # Store multiple rate limits
    apis = ["API1", "API2", "API3"]
    for i, api_name in enumerate(apis):
        store_rate_limit(
            api_name=api_name,
            limit=1000 * (i + 1),
            remaining=900 * (i + 1),
            reset_time=datetime.now() + timedelta(hours=1),
            user_id=user_id
        )
    
    # Get all rate limits
    rate_limits = get_all_rate_limits(user_id)
    
    # Verify we got all of them
    assert len(rate_limits) >= len(apis)
    
    # Check that our test APIs are in the results
    api_names = [rl.api_name for rl in rate_limits]
    for api in apis:
        assert api in api_names 