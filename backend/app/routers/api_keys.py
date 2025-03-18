from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..schemas.api_key import ApiKeyCreate, ApiKeyUpdate, ApiKey
from ..utils import mock_db
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
        
        # Create API key in mock DynamoDB
        key_id = mock_db.create_api_key(
            user_id=user_id,
            api_name=api_key.api_name,
            api_key=api_key.api_key
        )
        
        # Retrieve the created key to return
        created_key = mock_db.get_api_key(key_id)
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
        user_keys = mock_db.get_user_api_keys(user_id)
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
        key = mock_db.get_api_key(key_id)
        
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
        key = mock_db.get_api_key(key_id)
        
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
        updated_key = mock_db.update_api_key(
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
        key = mock_db.get_api_key(key_id)
        
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
        
        # Get API name before deletion
        api_name = key.get("api_name", "").lower()
        
        # Delete the key
        mock_db.delete_api_key(key_id)
        
        # Also delete associated rate limits if any
        try:
            from ..utils import redis_client
            if api_name:
                redis_client.delete_rate_limit(api_name=api_name, user_id=current_user["sub"])
                print(f"Deleted rate limit data for {api_name}")
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error deleting rate limit data: {e}")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete API key: {str(e)}"
        ) 