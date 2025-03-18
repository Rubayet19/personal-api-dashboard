from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from ..schemas.auth import TokenData

# Mock secret key - in a real application, store this in environment variables
# and use a more secure value
SECRET_KEY = "YOUR_SECRET_KEY_HERE"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Setup password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction from request
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# In-memory user database for demonstration
fake_users_db = {}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)


def get_user(email: str):
    """Get a user from the database by email."""
    if email in fake_users_db:
        return fake_users_db[email]
    return None


def authenticate_user(email: str, password: str):
    """Authenticate a user with email and password."""
    user = get_user(email)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user


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
    """Create a new user in the mock database."""
    if email in fake_users_db:
        return False
    
    hashed_password = get_password_hash(password)
    user_id = f"user_{len(fake_users_db) + 1}"
    
    fake_users_db[email] = {
        "id": user_id,
        "email": email,
        "hashed_password": hashed_password
    }
    
    return fake_users_db[email] 