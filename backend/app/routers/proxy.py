import time
import httpx
from fastapi import APIRouter, Depends, HTTPException
from typing import Any, Dict, Union
import json

from ..schemas.proxy import ProxyRequest, ProxyResponse
from ..utils.auth import get_current_user
from ..utils.mock_db import get_api_key

router = APIRouter(
    prefix="/api/proxy",
    tags=["proxy"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=ProxyResponse)
async def proxy_request(request: ProxyRequest):
    """
    Proxy an API request to an external API
    """
    # If an API key ID is provided, fetch it from the database
    headers = dict(request.headers)
    
    if request.api_key_id:
        api_key = get_api_key(request.api_key_id)
        if not api_key:
            raise HTTPException(status_code=404, detail="API key not found")
        
        # Check if there's a header name specified for this API key
        header_name = api_key.get("header_name", "Authorization")
        headers[header_name] = api_key.get("api_key", "")

    # Create a httpx client
    async with httpx.AsyncClient(timeout=30.0) as client:
        start_time = time.time()
        
        try:
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
            
            # Extract rate limit headers if available
            rate_limit_headers = _extract_rate_limit_headers(response_headers)
            
            # Return the response
            return ProxyResponse(
                status_code=response.status_code,
                headers=response_headers,
                body=response_body,
                time_taken=time_taken,
            )
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
        except Exception as e:
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
    
    for key, value in headers.items():
        key_lower = key.lower()
        if any(limit_key in key_lower for limit_key in rate_limit_keys):
            rate_limit_headers[key] = value
    
    return rate_limit_headers 