from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..schemas.api_key import ApiKeyCreate, ApiKeyUpdate, ApiKey
from ..utils import api_key_client, redis_client
from ..utils.auth import get_current_user

router = APIRouter(
    prefix="/api/keys",
    tags=["API Keys"],
    responses={
        404: {"description": "Not found"},
        401: {"description": "Unauthorized"},
    },
)

@router.post("/", response_model=ApiKey, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    api_key: ApiKeyCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Create a new API key for the current user"""
    try:
        # Get user ID from JWT token
        user_id = current_user["sub"]
        
        # Create API key in DynamoDB
        key_id = api_key_client.create_api_key(
            user_id=user_id,
            api_name=api_key.api_name,
            api_key=api_key.api_key
        )
        
        # Retrieve the created key to return
        created_key = api_key_client.get_api_key(key_id)
        return created_key
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create API key: {str(e)}"
        )

@router.get("/", response_model=List[ApiKey])
async def get_user_api_keys(current_user: dict = Depends(get_current_user)):
    """Get all API keys for the current user"""
    try:
        # Get user ID from JWT token
        user_id = current_user["sub"]
        
        # Get all API keys for the user
        user_keys = api_key_client.get_user_api_keys(user_id)
        return user_keys
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve API keys: {str(e)}"
        )

@router.get("/{key_id}", response_model=ApiKey)
async def get_api_key(
    key_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get a specific API key by ID"""
    try:
        # Get the API key
        key = api_key_client.get_api_key(key_id)
        
        # Check if key exists
        if not key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        # Check if key belongs to current user
        if key.get("user_id") != current_user["sub"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this API key"
            )
        
        return key
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve API key: {str(e)}"
        )

@router.put("/{key_id}", response_model=ApiKey)
async def update_api_key(
    key_id: str, 
    api_key_update: ApiKeyUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update an API key"""
    try:
        # First get the key to check ownership
        key = api_key_client.get_api_key(key_id)
        
        # Check if key exists
        if not key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        # Check if key belongs to current user
        if key.get("user_id") != current_user["sub"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this API key"
            )
        
        # Update the key
        updated_key = api_key_client.update_api_key(
            key_id=key_id,
            api_name=api_key_update.api_name,
            api_key=api_key_update.api_key
        )
        
        return updated_key
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update API key: {str(e)}"
        )

@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Delete an API key"""
    try:
        # First get the key to check ownership
        key = api_key_client.get_api_key(key_id)
        
        # Check if key exists
        if not key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        # Check if key belongs to current user
        if key.get("user_id") != current_user["sub"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this API key"
            )
        
        # Get the API name before deleting the key
        api_name = key.get("api_name")
        user_id = current_user["sub"]
        
        # Delete the key
        deleted = api_key_client.delete_api_key(key_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete API key"
            )
            
        # Now also delete the rate limit data associated with this API key
        if api_name:
            # Convert API name to lowercase for consistent case handling
            api_name_lower = api_name.lower()
            # Delete rate limit info from Redis
            redis_client.delete_rate_limit(api_name=api_name_lower, user_id=user_id)
            print(f"Deleted rate limit data for API: {api_name_lower} and user: {user_id}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete API key: {str(e)}"
        ) 