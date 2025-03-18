import time
import httpx
from fastapi import APIRouter, Depends, HTTPException
from typing import Any, Dict, Union, Optional
import json
from datetime import datetime, timedelta

from ..schemas.proxy import ProxyRequest, ProxyResponse
from ..utils.auth import get_current_user
from ..utils.mock_db import get_api_key
from ..utils import redis_client

router = APIRouter(
    prefix="/api/proxy",
    tags=["proxy"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=ProxyResponse)
async def proxy_request(request: ProxyRequest, current_user: dict = Depends(get_current_user)):
    """
    Proxy an API request to an external API
    """
    # Get user ID from token
    user_id = current_user["sub"]
    
    # If an API key ID is provided, fetch it from the database
    headers = dict(request.headers)
    api_name = None
    
    if request.api_key_id:
        api_key = get_api_key(request.api_key_id)
        if not api_key:
            raise HTTPException(status_code=404, detail="API key not found")
        
        # Check if there's a header name specified for this API key
        header_name = api_key.get("header_name", "Authorization")
        headers[header_name] = api_key.get("api_key", "")
        
        # Get API name for rate limit tracking
        api_name = api_key.get("api_name")
        print(f"Using API key for: {api_name}")

    # If no API name from API key, try to determine from URL
    if not api_name:
        # Extract API name from URL if possible
        try:
            from urllib.parse import urlparse
            domain = urlparse(str(request.url)).netloc
            api_name = domain.split('.')[-2]  # e.g., api.github.com -> github
            print(f"Extracted API name from URL: {api_name}")
        except Exception as e:
            print(f"Error extracting API name from URL: {e}")
            api_name = "unknown"

    # Create a httpx client
    async with httpx.AsyncClient(timeout=30.0) as client:
        start_time = time.time()
        
        try:
            print(f"Making {request.method} request to {request.url}")
            # Make the request to the external API
            response = await client.request(
                method=request.method,
                url=str(request.url),
                headers=headers,
                content=_prepare_request_body(request.body, request.method),
            )
            
            # Calculate time taken
            time_taken = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Get response body
            response_body = _parse_response_body(response)
            
            # Convert headers to dict
            response_headers = dict(response.headers)
            
            # Print all headers for debugging
            print(f"Response headers: {json.dumps(dict(response.headers))}")
            
            # Extract rate limit headers if available
            rate_limit_headers = _extract_rate_limit_headers(response_headers)
            print(f"Extracted rate limit headers: {rate_limit_headers}")
            
            # Store rate limit information in Redis if headers are available
            if rate_limit_headers:
                rate_limit_info = _store_rate_limit_info(rate_limit_headers, api_name, user_id)
                print(f"Stored rate limit info: {rate_limit_info}")
            else:
                print(f"No rate limit headers found for {api_name}")
            
            # Return the response
            return ProxyResponse(
                status_code=response.status_code,
                headers=response_headers,
                body=response_body,
                time_taken=time_taken,
            )
            
        except httpx.RequestError as e:
            print(f"Request error: {e}")
            raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
        except Exception as e:
            print(f"Unexpected error: {e}")
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


def _prepare_request_body(body: Union[Dict[str, Any], str, None], method: str) -> Union[str, bytes, None]:
    """Prepare the request body based on the method and content"""
    if method in ["GET", "HEAD"] or body is None:
        return None
        
    if isinstance(body, dict):
        return json.dumps(body)
    
    return body


def _parse_response_body(response: httpx.Response) -> Any:
    """Parse the response body based on content type"""
    content_type = response.headers.get("content-type", "")
    
    if "application/json" in content_type:
        try:
            return response.json()
        except json.JSONDecodeError:
            return response.text
    
    return response.text


def _extract_rate_limit_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """Extract rate limit related headers from the response"""
    rate_limit_headers = {}
    
    # Common rate limit header patterns
    rate_limit_keys = [
        "x-rate-limit", "x-ratelimit", "ratelimit", 
        "x-rate-limit-limit", "x-rate-limit-remaining", "x-rate-limit-reset",
        "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"
    ]
    
    # GitHub-specific headers (case-sensitive)
    github_headers = [
        "X-RateLimit-Limit", 
        "X-RateLimit-Remaining", 
        "X-RateLimit-Reset", 
        "X-RateLimit-Used",
        "X-RateLimit-Resource"
    ]
    
    for key, value in headers.items():
        # Check for exact GitHub headers (case-sensitive)
        if key in github_headers:
            rate_limit_headers[key] = value
            continue
            
        # Check for other common patterns (case-insensitive)
        key_lower = key.lower()
        if any(limit_key in key_lower for limit_key in rate_limit_keys):
            rate_limit_headers[key] = value
    
    return rate_limit_headers


def _store_rate_limit_info(rate_limit_headers: Dict[str, str], api_name: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Parse rate limit headers and store them in Redis
    
    Different APIs use different header formats:
    - GitHub: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
    - Twitter: x-rate-limit-limit, x-rate-limit-remaining, x-rate-limit-reset
    """
    try:
        # Initialize with default values
        limit = None
        remaining = None
        reset_time = None
        
        # Normalize API name to avoid multiple entries for the same API
        # For example "github", "Github", "github-public" should all be stored as "github"
        normalized_api_name = api_name.lower()
        if "github" in normalized_api_name:
            normalized_api_name = "github"
        elif "twitter" in normalized_api_name:
            normalized_api_name = "twitter"
        elif "openai" in normalized_api_name:
            normalized_api_name = "openai"
            
        print(f"Using normalized API name: {normalized_api_name} (was {api_name})")
        
        # Check for GitHub format first (case-sensitive)
        if "X-RateLimit-Limit" in rate_limit_headers and "X-RateLimit-Remaining" in rate_limit_headers:
            print("Found GitHub format rate limit headers")
            try:
                limit = int(rate_limit_headers["X-RateLimit-Limit"])
                remaining = int(rate_limit_headers["X-RateLimit-Remaining"])
                
                if "X-RateLimit-Reset" in rate_limit_headers:
                    reset_timestamp = int(rate_limit_headers["X-RateLimit-Reset"])
                    reset_time = datetime.fromtimestamp(reset_timestamp)
            except (ValueError, TypeError) as e:
                print(f"Error parsing GitHub rate limit headers: {e}")
        
        # If GitHub format not found, try generic formats
        if limit is None or remaining is None:
            # Lowercase all keys for easier matching
            normalized_headers = {k.lower(): v for k, v in rate_limit_headers.items()}
            print(f"Normalized headers: {normalized_headers}")
            
            # Try to find limit
            for key in ["x-ratelimit-limit", "x-rate-limit-limit", "ratelimit-limit"]:
                if key in normalized_headers:
                    try:
                        limit = int(normalized_headers[key])
                        print(f"Found limit: {limit} from header {key}")
                        break
                    except (ValueError, TypeError) as e:
                        print(f"Error parsing limit from {key}: {e}")
            
            # Try to find remaining
            for key in ["x-ratelimit-remaining", "x-rate-limit-remaining", "ratelimit-remaining"]:
                if key in normalized_headers:
                    try:
                        remaining = int(normalized_headers[key])
                        print(f"Found remaining: {remaining} from header {key}")
                        break
                    except (ValueError, TypeError) as e:
                        print(f"Error parsing remaining from {key}: {e}")
            
            # Try to find reset time
            for key in ["x-ratelimit-reset", "x-rate-limit-reset", "ratelimit-reset"]:
                if key in normalized_headers:
                    try:
                        # Sometimes reset is in Unix timestamp format
                        reset_timestamp = int(normalized_headers[key])
                        reset_time = datetime.fromtimestamp(reset_timestamp)
                        print(f"Found reset time: {reset_time} from header {key}")
                        break
                    except (ValueError, TypeError) as e:
                        print(f"Error parsing reset time from {key}: {e}")
        
        # If we couldn't find reset time but found other rate limit info,
        # default to 1 hour from now
        if limit is not None and remaining is not None and reset_time is None:
            reset_time = datetime.now() + timedelta(hours=1)
            print(f"No reset time found, defaulting to 1 hour from now: {reset_time}")
        
        # Only store if we have at least limit and remaining
        if limit is not None and remaining is not None:
            # Calculate TTL from reset_time or default to 1 hour
            ttl = None
            if reset_time:
                ttl = int((reset_time - datetime.now()).total_seconds())
                if ttl < 0:
                    ttl = 3600  # Default to 1 hour if reset_time is in the past
            else:
                ttl = 3600  # Default to 1 hour
            
            # Store in Redis using the normalized API name
            print(f"Storing rate limit for {normalized_api_name} (user {user_id}): limit={limit}, remaining={remaining}, reset={reset_time}, ttl={ttl}")
            rate_limit = redis_client.store_rate_limit(
                api_name=normalized_api_name,
                limit=limit,
                remaining=remaining,
                reset_time=reset_time,
                user_id=user_id,
                ttl=ttl
            )
            
            return {
                "api_name": normalized_api_name,
                "limit": limit,
                "remaining": remaining,
                "reset_time": reset_time.isoformat() if reset_time else None,
                "ttl": ttl
            }
    except Exception as e:
        # Log error but don't fail the request
        print(f"Error storing rate limit info: {e}")
    
    return None 