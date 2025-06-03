import secrets
import os
from datetime import datetime, timedelta
from typing import Tuple
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup password context for hashing (same as in dynamo_client.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv('PASSWORD_RESET_TOKEN_EXPIRE_MINUTES', '60'))

def generate_password_reset_token() -> Tuple[str, str]:
    """
    Generate a cryptographically secure password reset token.
    
    Returns:
        Tuple[str, str]: (plaintext_token, hashed_token)
            - plaintext_token: The token to be sent in the email
            - hashed_token: The hashed version to be stored in the database
    """
    # Generate a cryptographically secure random string
    # Using 32 bytes = 256 bits of entropy, URL-safe base64 encoded
    plaintext_token = secrets.token_urlsafe(32)
    
    # Hash the token for storage in the database
    hashed_token = pwd_context.hash(plaintext_token)
    
    return plaintext_token, hashed_token

def verify_password_reset_token(plaintext_token: str, hashed_token_from_db: str) -> bool:
    """
    Verify a password reset token against its stored hash.
    
    Args:
        plaintext_token: The token received from the user
        hashed_token_from_db: The hashed token stored in the database
        
    Returns:
        bool: True if the token is valid, False otherwise
    """
    try:
        return pwd_context.verify(plaintext_token, hashed_token_from_db)
    except Exception:
        # If verification fails for any reason, return False
        return False

def get_password_reset_token_expiry() -> int:
    """
    Get the expiry timestamp for a password reset token.
    
    Returns:
        int: Unix timestamp when the token should expire
    """
    expiry_time = datetime.utcnow() + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    return int(expiry_time.timestamp())

def is_token_expired(expiry_timestamp: int) -> bool:
    """
    Check if a password reset token has expired.
    
    Args:
        expiry_timestamp: Unix timestamp when the token expires
        
    Returns:
        bool: True if the token has expired, False otherwise
    """
    current_timestamp = int(datetime.utcnow().timestamp())
    return current_timestamp > expiry_timestamp 