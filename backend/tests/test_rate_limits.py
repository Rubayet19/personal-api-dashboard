import pytest
from unittest import mock
from datetime import datetime, timedelta
import json

from app.routers.proxy import _extract_rate_limit_headers, _store_rate_limit_info
from app.utils.redis_client import store_rate_limit

@pytest.fixture
def mock_redis_client():
    """Setup a mock for the Redis client"""
    with mock.patch("app.routers.proxy.redis_client") as mock_client:
        yield mock_client


def test_extract_rate_limit_headers_github():
    """Test extracting GitHub-specific rate limit headers"""
    # Setup test headers
    headers = {
        "content-type": "application/json",
        "X-RateLimit-Limit": "5000",
        "X-RateLimit-Remaining": "4950",
        "X-RateLimit-Reset": "1625097053",
        "X-RateLimit-Used": "50",
        "X-RateLimit-Resource": "core",
        "X-GitHub-Request-Id": "1234:5678"
    }
    
    # Extract headers
    rate_limit_headers = _extract_rate_limit_headers(headers)
    
    # Verify only rate limit headers were extracted
    assert len(rate_limit_headers) == 5
    assert "X-RateLimit-Limit" in rate_limit_headers
    assert "X-RateLimit-Remaining" in rate_limit_headers
    assert "X-RateLimit-Reset" in rate_limit_headers
    assert "X-RateLimit-Used" in rate_limit_headers
    assert "X-RateLimit-Resource" in rate_limit_headers
    assert "X-GitHub-Request-Id" not in rate_limit_headers
    assert "content-type" not in rate_limit_headers
    
    # Verify values were preserved
    assert rate_limit_headers["X-RateLimit-Limit"] == "5000"
    assert rate_limit_headers["X-RateLimit-Remaining"] == "4950"
    assert rate_limit_headers["X-RateLimit-Reset"] == "1625097053"


def test_extract_rate_limit_headers_generic():
    """Test extracting generic rate limit headers"""
    # Setup test headers
    headers = {
        "content-type": "application/json",
        "x-ratelimit-limit": "1000",
        "x-ratelimit-remaining": "980",
        "x-ratelimit-reset": "1625097060",
        "server": "nginx"
    }
    
    # Extract headers
    rate_limit_headers = _extract_rate_limit_headers(headers)
    
    # Verify only rate limit headers were extracted
    assert len(rate_limit_headers) == 3
    assert "x-ratelimit-limit" in rate_limit_headers
    assert "x-ratelimit-remaining" in rate_limit_headers
    assert "x-ratelimit-reset" in rate_limit_headers
    assert "server" not in rate_limit_headers
    assert "content-type" not in rate_limit_headers
    
    # Verify values were preserved
    assert rate_limit_headers["x-ratelimit-limit"] == "1000"
    assert rate_limit_headers["x-ratelimit-remaining"] == "980"
    assert rate_limit_headers["x-ratelimit-reset"] == "1625097060"


def test_extract_rate_limit_headers_twitter():
    """Test extracting Twitter-style rate limit headers"""
    # Setup test headers
    headers = {
        "content-type": "application/json",
        "x-rate-limit-limit": "300",
        "x-rate-limit-remaining": "299",
        "x-rate-limit-reset": "1625097120",
        "x-response-time": "12ms"
    }
    
    # Extract headers
    rate_limit_headers = _extract_rate_limit_headers(headers)
    
    # Verify only rate limit headers were extracted
    assert len(rate_limit_headers) == 3
    assert "x-rate-limit-limit" in rate_limit_headers
    assert "x-rate-limit-remaining" in rate_limit_headers
    assert "x-rate-limit-reset" in rate_limit_headers
    assert "x-response-time" not in rate_limit_headers
    
    # Verify values were preserved
    assert rate_limit_headers["x-rate-limit-limit"] == "300"
    assert rate_limit_headers["x-rate-limit-remaining"] == "299"
    assert rate_limit_headers["x-rate-limit-reset"] == "1625097120"


def test_store_rate_limit_info_github(mock_redis_client):
    """Test storing GitHub rate limit information"""
    # Setup test headers
    headers = {
        "X-RateLimit-Limit": "5000",
        "X-RateLimit-Remaining": "4950",
        "X-RateLimit-Reset": str(int((datetime.now() + timedelta(hours=1)).timestamp()))
    }
    
    # Store rate limit info
    result = _store_rate_limit_info(
        rate_limit_headers=headers,
        api_name="GitHub",
        user_id="test-user"
    )
    
    # Verify result
    assert result is not None
    assert result["api_name"] == "github"  # Lowercase normalized
    assert result["limit"] == 5000
    assert result["remaining"] == 4950
    assert "reset_time" in result
    assert "ttl" in result
    
    # Verify Redis call
    mock_redis_client.store_rate_limit.assert_called_once()
    call_args = mock_redis_client.store_rate_limit.call_args[1]
    assert call_args["api_name"] == "github"
    assert call_args["limit"] == 5000
    assert call_args["remaining"] == 4950
    assert call_args["user_id"] == "test-user"
    assert call_args["ttl"] > 0


def test_store_rate_limit_info_generic(mock_redis_client):
    """Test storing generic rate limit information"""
    # Setup test headers
    headers = {
        "x-ratelimit-limit": "1000",
        "x-ratelimit-remaining": "980",
        "x-ratelimit-reset": str(int((datetime.now() + timedelta(hours=1)).timestamp()))
    }
    
    # Store rate limit info
    result = _store_rate_limit_info(
        rate_limit_headers=headers,
        api_name="API Service",
        user_id="test-user"
    )
    
    # Verify result
    assert result is not None
    assert result["api_name"] == "api service"  # Lowercase normalized
    assert result["limit"] == 1000
    assert result["remaining"] == 980
    assert "reset_time" in result
    assert "ttl" in result
    
    # Verify Redis call
    mock_redis_client.store_rate_limit.assert_called_once()
    call_args = mock_redis_client.store_rate_limit.call_args[1]
    assert call_args["api_name"] == "api service"
    assert call_args["limit"] == 1000
    assert call_args["remaining"] == 980
    assert call_args["user_id"] == "test-user"
    assert 3590 <= call_args["ttl"] <= 3600


def test_store_rate_limit_info_missing_reset(mock_redis_client):
    """Test storing rate limit info with missing reset time"""
    # Setup test headers with no reset time
    headers = {
        "x-ratelimit-limit": "1000",
        "x-ratelimit-remaining": "980"
    }
    
    # Store rate limit info
    result = _store_rate_limit_info(
        rate_limit_headers=headers,
        api_name="API Service",
        user_id="test-user"
    )
    
    # Verify result
    assert result is not None
    assert result["api_name"] == "api service"
    assert result["limit"] == 1000
    assert result["remaining"] == 980
    assert result["reset_time"] is not None  # Should have a default value
    assert 3590 <= result["ttl"] <= 3600  # Default 1 hour with small margin of error
    
    # Verify Redis call
    mock_redis_client.store_rate_limit.assert_called_once()
    call_args = mock_redis_client.store_rate_limit.call_args[1]
    assert 3590 <= call_args["ttl"] <= 3600 