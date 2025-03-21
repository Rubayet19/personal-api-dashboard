import redis
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Redis connection settings from environment variables or defaults
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_PREFIX = "rate_limit:"

# Initialize Redis client
try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        decode_responses=True  # Automatically decode responses to strings
    )
    redis_client.ping()  # Test connection
    print(f"Successfully connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
except redis.ConnectionError as e:
    print(f"Warning: Could not connect to Redis: {e}")
    # Fallback to a mock in-memory implementation for development
    from collections import defaultdict
    print("Using in-memory mock for Redis")
    
    class MockRedis:
        def __init__(self):
            self.data = defaultdict(dict)
            self.expires = {}
        
        def set(self, key: str, value: str, ex: Optional[int] = None):
            self.data[key] = value
            if ex:
                self.expires[key] = datetime.now() + timedelta(seconds=ex)
            return True
        
        def get(self, key: str) -> Optional[str]:
            if key in self.expires and datetime.now() > self.expires[key]:
                del self.data[key]
                del self.expires[key]
                return None
            return self.data.get(key)
        
        def delete(self, key: str) -> int:
            if key in self.data:
                del self.data[key]
                if key in self.expires:
                    del self.expires[key]
                return 1
            return 0
        
        def scan_iter(self, match: str) -> List[str]:
            import fnmatch
            pattern = match.replace('*', '.*')
            return [k for k in self.data.keys() if fnmatch.fnmatch(k, pattern)]
        
        def ttl(self, key: str) -> int:
            if key not in self.expires:
                return -1
            remaining = (self.expires[key] - datetime.now()).total_seconds()
            return int(remaining) if remaining > 0 else -2
    
    redis_client = MockRedis()

# Rate limit data structure
class RateLimitData:
    def __init__(
        self,
        api_name: str,
        limit: int,
        remaining: int,
        reset_time: Optional[datetime] = None,
        user_id: Optional[str] = None
    ):
        self.api_name = api_name
        self.limit = limit
        self.remaining = remaining
        self.reset_time = reset_time
        self.user_id = user_id
        self.last_updated = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "api_name": self.api_name,
            "limit": self.limit,
            "remaining": self.remaining,
            "reset_time": self.reset_time.isoformat() if self.reset_time else None,
            "user_id": self.user_id,
            "last_updated": self.last_updated.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RateLimitData':
        # Convert ISO format strings back to datetime objects
        reset_time = None
        if data.get("reset_time"):
            try:
                reset_time = datetime.fromisoformat(data["reset_time"])
            except ValueError:
                pass
        
        last_updated = None
        if data.get("last_updated"):
            try:
                last_updated = datetime.fromisoformat(data["last_updated"])
            except ValueError:
                pass
        
        instance = cls(
            api_name=data["api_name"],
            limit=data["limit"],
            remaining=data["remaining"],
            reset_time=reset_time,
            user_id=data.get("user_id")
        )
        
        if last_updated:
            instance.last_updated = last_updated
        
        return instance

def store_rate_limit(
    api_name: str,
    limit: int,
    remaining: int,
    reset_time: Optional[datetime] = None,
    user_id: Optional[str] = None,
    ttl: Optional[int] = None
):
    """
    Store rate limit information in Redis
    
    Args:
        api_name: Name of the API (e.g., "github", "twitter")
        limit: Total request limit
        remaining: Remaining requests
        reset_time: When the rate limit resets
        user_id: User ID if storing per-user rate limits
        ttl: Time to live in seconds for this cache entry
    """
    # Normalize API name to lowercase for consistent storage
    api_name = api_name.lower()
    
    # Create the rate limit data
    rate_limit = RateLimitData(
        api_name=api_name,
        limit=limit,
        remaining=remaining,
        reset_time=reset_time,
        user_id=user_id
    )
    
    # Generate Redis key
    key = f"{REDIS_PREFIX}{api_name}"
    if user_id:
        key = f"{key}:{user_id}"
    
    # Store in Redis
    redis_client.set(key, json.dumps(rate_limit.to_dict()), ex=ttl)
    
    return rate_limit

def get_rate_limit(api_name: str, user_id: Optional[str] = None) -> Optional[RateLimitData]:
    """
    Get rate limit information from Redis
    
    Args:
        api_name: Name of the API (e.g., "github", "twitter")
        user_id: User ID if retrieving per-user rate limits
    
    Returns:
        RateLimitData object or None if not found
    """
    # Normalize API name to lowercase for consistent retrieval
    api_name = api_name.lower()
    
    # Generate Redis key
    key = f"{REDIS_PREFIX}{api_name}"
    if user_id:
        key = f"{key}:{user_id}"
    
    # Get from Redis
    data = redis_client.get(key)
    if not data:
        return None
    
    try:
        # Parse the JSON data
        rate_limit_dict = json.loads(data)
        return RateLimitData.from_dict(rate_limit_dict)
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Error decoding rate limit data: {e}")
        return None

def get_all_rate_limits(user_id: Optional[str] = None) -> List[RateLimitData]:
    """
    Get all rate limits for a user or globally
    
    Args:
        user_id: Optional user ID to filter by
    
    Returns:
        List of RateLimitData objects
    """
    pattern = f"{REDIS_PREFIX}*"
    if user_id:
        pattern = f"{REDIS_PREFIX}*:{user_id}"
    
    rate_limits = []
    for key in redis_client.scan_iter(match=pattern):
        data = redis_client.get(key)
        if data:
            try:
                rate_limit_dict = json.loads(data)
                rate_limits.append(RateLimitData.from_dict(rate_limit_dict))
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Error decoding rate limit data for key {key}: {e}")
    
    return rate_limits

def delete_rate_limit(api_name: str, user_id: Optional[str] = None) -> bool:
    """
    Delete rate limit information from Redis
    
    Args:
        api_name: Name of the API (e.g., "github", "twitter")
        user_id: User ID if deleting per-user rate limits
    
    Returns:
        True if deleted, False if not found
    """
    # Normalize API name to lowercase for consistent deletion
    api_name = api_name.lower()
    
    # Generate Redis key
    key = f"{REDIS_PREFIX}{api_name}"
    if user_id:
        key = f"{key}:{user_id}"
    
    # Delete from Redis
    return bool(redis_client.delete(key)) 