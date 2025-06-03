from datetime import timedelta
import os
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from dotenv import load_dotenv

from ..schemas.auth import Token, UserCreate, UserResponse, ForgotPasswordRequest, ResetPasswordRequest
from ..utils.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    create_new_user,
    get_current_user,
)
from ..utils.dynamo_client import (
    get_user_by_email,
    set_password_reset_token,
    update_user_password,
    clear_password_reset_token,
    hash_password
)
from ..utils.token_utils import (
    generate_password_reset_token,
    verify_password_reset_token,
    get_password_reset_token_expiry,
    is_token_expired
)
from ..utils.email_client import send_password_reset_email, send_password_change_notification

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:5173')

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    """Create a new user account."""
    user = await create_new_user(
        email=user_data.email,
        password=user_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    return {
        "id": user["id"],
        "email": user["email"]
    }


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate and get a JWT token."""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token", response_model=Token)
async def get_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Get a JWT token (alias for login)."""
    return await login(form_data)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information."""
    # Use the email from token as both id and email since we don't have
    # a separate id in the token payload
    email = current_user["sub"]
    return {
        "id": email,  # Use email as ID for simplicity
        "email": email
    }


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request a password reset email."""
    try:
        # Check if user exists
        user = get_user_by_email(request.email)
        
        if user:
            # Generate password reset token
            plaintext_token, hashed_token = generate_password_reset_token()
            expiry_timestamp = get_password_reset_token_expiry()
            
            # Store the hashed token in the database
            success = set_password_reset_token(request.email, hashed_token, expiry_timestamp)
            
            if success:
                # Construct reset link
                reset_link = f"{FRONTEND_BASE_URL}/reset-password?email={request.email}&token={plaintext_token}"
                
                # Send password reset email
                email_sent = send_password_reset_email(
                    recipient_email=request.email,
                    user_name=request.email,  # Use email as name since we don't store names
                    reset_link=reset_link
                )
                
                if email_sent:
                    logger.info(f"Password reset email sent successfully to {request.email}")
                else:
                    logger.error(f"Failed to send password reset email to {request.email}")
            else:
                logger.error(f"Failed to store password reset token for {request.email}")
        
        # Always return the same generic message to prevent email enumeration
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }
        
    except Exception as e:
        logger.error(f"Error in forgot_password endpoint: {e}")
        # Still return generic message even on error
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset user password using a valid token."""
    try:
        # Get user by email
        user = get_user_by_email(request.email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request or token not initiated."
            )
        
        # Check if reset token exists
        if 'reset_token_hash' not in user or 'reset_token_expiry' not in user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request or token not initiated."
            )
        
        # Verify the token
        if not verify_password_reset_token(request.token, user['reset_token_hash']):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token."
            )
        
        # Check if token has expired
        if is_token_expired(user['reset_token_expiry']):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token expired."
            )
        
        # All checks passed - update the password
        new_hashed_password = hash_password(request.new_password)
        password_updated = update_user_password(request.email, new_hashed_password)
        
        if not password_updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password. Please try again."
            )
        
        # Clear the reset token (one-time use)
        clear_password_reset_token(request.email)
        
        # Send password change notification
        send_password_change_notification(
            recipient_email=request.email,
            user_name=request.email
        )
        
        logger.info(f"Password reset successfully for {request.email}")
        
        return {
            "message": "Password reset successfully."
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error in reset_password endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting the password. Please try again."
        ) 