from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from ..schemas.auth import TokenData
from .dynamo_client import authenticate_user as db_authenticate_user

# Mock secret key - in a real application, store this in environment variables
# and use a more secure value
SECRET_KEY = "YOUR_SECRET_KEY_HERE"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme for token extraction from request
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Add a placeholder for Google token verification since we removed the button
def verify_google_token(token: str) -> dict:
    """Placeholder for Google token verification."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google authentication has been disabled"
    )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user from a JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(sub=email)
        
        # Return the token data as a dict with 'sub' field
        # This will be used as user_id in other parts of the app
        return {"sub": email}
    except JWTError:
        raise credentials_exception


async def create_new_user(email: str, password: str):
    """Create a new user in DynamoDB."""
    from .dynamo_client import create_user
    return await create_user(email, password)


def authenticate_user(email: str, password: str):
    """Authenticate a user with email and password."""
    return db_authenticate_user(email, password) 