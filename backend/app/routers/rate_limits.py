from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta

from ..schemas.rate_limit import RateLimit, RateLimitCreate, RateLimitUpdate
from ..utils.auth import get_current_user
from ..utils import redis_client

router = APIRouter(
    prefix="/api/rate-limits",
    tags=["rate-limits"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=List[RateLimit])
async def get_rate_limits(current_user: dict = Depends(get_current_user)):
    """
    Get all rate limits for the current user
    """
    user_id = current_user["sub"]
    
    # Get rate limits from Redis
    rate_limits = redis_client.get_all_rate_limits(user_id=user_id)
    
    # Create a dictionary to deduplicate by api_name (keeping the most recent)
    deduplicated = {}
    for rate_limit in rate_limits:
        api_name = rate_limit.api_name
        
        # Normalize API name to lowercase for comparison
        normalized_name = api_name.lower()
        
        # Only keep the entry if it's not already in our dict
        # or if it's newer than what we have
        if (normalized_name not in deduplicated or 
            rate_limit.last_updated > deduplicated[normalized_name].last_updated):
            deduplicated[normalized_name] = rate_limit
    
    # Convert to API schema
    return [
        RateLimit(
            api_name=rate_limit.api_name,
            limit=rate_limit.limit,
            remaining=rate_limit.remaining,
            reset_time=rate_limit.reset_time,
            last_updated=rate_limit.last_updated
        )
        for rate_limit in deduplicated.values()
    ]


@router.get("/{api_name}", response_model=RateLimit)
async def get_rate_limit(api_name: str, current_user: dict = Depends(get_current_user)):
    """
    Get rate limit information for a specific API
    """
    user_id = current_user["sub"]
    
    # Get rate limit from Redis
    rate_limit = redis_client.get_rate_limit(api_name=api_name, user_id=user_id)
    
    if not rate_limit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rate limit information for {api_name} not found"
        )
    
    # Convert to API schema
    return RateLimit(
        api_name=rate_limit.api_name,
        limit=rate_limit.limit,
        remaining=rate_limit.remaining,
        reset_time=rate_limit.reset_time,
        last_updated=rate_limit.last_updated
    )


@router.post("", response_model=RateLimit, status_code=status.HTTP_201_CREATED)
async def create_rate_limit(
    rate_limit: RateLimitCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create or update rate limit information for an API
    """
    user_id = current_user["sub"]
    
    # Default TTL is 1 hour if reset_time is not provided
    ttl = None
    if rate_limit.reset_time:
        # Calculate TTL from reset_time
        ttl = int((rate_limit.reset_time - datetime.now()).total_seconds())
        if ttl < 0:
            ttl = 3600  # Default to 1 hour if reset_time is in the past
    else:
        ttl = 3600  # Default to 1 hour
    
    # Store in Redis
    rate_limit_data = redis_client.store_rate_limit(
        api_name=rate_limit.api_name,
        limit=rate_limit.limit,
        remaining=rate_limit.remaining,
        reset_time=rate_limit.reset_time,
        user_id=user_id,
        ttl=ttl
    )
    
    # Return the created/updated rate limit
    return RateLimit(
        api_name=rate_limit_data.api_name,
        limit=rate_limit_data.limit,
        remaining=rate_limit_data.remaining,
        reset_time=rate_limit_data.reset_time,
        last_updated=rate_limit_data.last_updated
    )


@router.put("/{api_name}", response_model=RateLimit)
async def update_rate_limit(
    api_name: str,
    rate_limit_update: RateLimitUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update rate limit information for an API
    """
    user_id = current_user["sub"]
    
    # Get existing rate limit
    existing_rate_limit = redis_client.get_rate_limit(api_name=api_name, user_id=user_id)
    
    if not existing_rate_limit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rate limit information for {api_name} not found"
        )
    
    # Update fields
    limit = rate_limit_update.limit if rate_limit_update.limit is not None else existing_rate_limit.limit
    remaining = rate_limit_update.remaining if rate_limit_update.remaining is not None else existing_rate_limit.remaining
    reset_time = rate_limit_update.reset_time if rate_limit_update.reset_time is not None else existing_rate_limit.reset_time
    
    # Calculate TTL
    ttl = None
    if reset_time:
        ttl = int((reset_time - datetime.now()).total_seconds())
        if ttl < 0:
            ttl = 3600  # Default to 1 hour if reset_time is in the past
    
    # Store updated rate limit
    updated_rate_limit = redis_client.store_rate_limit(
        api_name=api_name,
        limit=limit,
        remaining=remaining,
        reset_time=reset_time,
        user_id=user_id,
        ttl=ttl
    )
    
    # Return updated rate limit
    return RateLimit(
        api_name=updated_rate_limit.api_name,
        limit=updated_rate_limit.limit,
        remaining=updated_rate_limit.remaining,
        reset_time=updated_rate_limit.reset_time,
        last_updated=updated_rate_limit.last_updated
    )


@router.delete("/{api_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rate_limit(api_name: str, current_user: dict = Depends(get_current_user)):
    """
    Delete rate limit information for an API
    """
    user_id = current_user["sub"]
    
    # Delete from Redis
    deleted = redis_client.delete_rate_limit(api_name=api_name, user_id=user_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rate limit information for {api_name} not found"
        )
    
    return None 