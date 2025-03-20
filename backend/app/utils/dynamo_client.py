import os
import boto3
from boto3.dynamodb.conditions import Key
from passlib.context import CryptContext
from typing import Dict, Optional
import uuid
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Setup password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# DynamoDB Configuration
TABLE_NAME = "api-dashboard"
USER_PREFIX = "USER#"
PROFILE_SUFFIX = "PROFILE"

# Check for test environment
IS_TESTING = os.getenv('TESTING', 'False').lower() == 'true'

# In-memory DB for testing
test_db = {}

# Initialize DynamoDB client
if not IS_TESTING:
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-2'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    # Get reference to the DynamoDB table
    table = dynamodb.Table(TABLE_NAME)

def hash_password(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def clear_test_db():
    """Clear the test database (for testing only)."""
    if IS_TESTING:
        test_db.clear()

async def create_user(email: str, password: str) -> Optional[Dict]:
    """
    Create a new user in DynamoDB
    
    Args:
        email: User's email address
        password: User's password
        
    Returns:
        User object or None if user already exists
    """
    # Check if user already exists
    user = get_user_by_email(email)
    if user:
        return None
    
    # Create new user
    hashed_password = hash_password(password)
    
    user_item = {
        'PK': f"{USER_PREFIX}{email}",
        'SK': PROFILE_SUFFIX,
        'email': email,
        'hashed_password': hashed_password,
        'GSI1PK': 'USERS',
        'GSI1SK': email
    }
    
    # Save user
    if IS_TESTING:
        # For testing, save to in-memory dict
        test_db[f"{USER_PREFIX}{email}"] = user_item
    else:
        # Save to DynamoDB
        table.put_item(Item=user_item)
    
    # Return user object (without password)
    return {
        'id': email,
        'email': email,
        'hashed_password': hashed_password  # Include for tests
    }

def get_user_by_email(email: str) -> Optional[Dict]:
    """
    Get a user from DynamoDB by email
    
    Args:
        email: User's email address
        
    Returns:
        User object or None if not found
    """
    if IS_TESTING:
        # For testing, get from in-memory dict
        return test_db.get(f"{USER_PREFIX}{email}")
    else:
        # Get from DynamoDB
        response = table.get_item(
            Key={
                'PK': f"{USER_PREFIX}{email}",
                'SK': PROFILE_SUFFIX
            }
        )
        
        user = response.get('Item')
        return user

def authenticate_user(email: str, password: str) -> Optional[Dict]:
    """
    Authenticate a user with email and password
    
    Args:
        email: User's email address
        password: User's password
        
    Returns:
        User object or None if authentication fails
    """
    user = get_user_by_email(email)
    
    if not user:
        return None
    
    if not verify_password(password, user['hashed_password']):
        return None
    
    # Return user without the hashed password
    return {
        'id': email,
        'email': email
    }

def get_all_users() -> list:
    """
    Get all users (for admin purposes)
    
    Returns:
        List of all users
    """
    if IS_TESTING:
        # For testing, get from in-memory dict
        users = []
        for key, item in test_db.items():
            if key.startswith(USER_PREFIX) and item['SK'] == PROFILE_SUFFIX:
                user_copy = item.copy()
                if 'hashed_password' in user_copy:
                    del user_copy['hashed_password']
                users.append(user_copy)
        return users
    else:
        # Get from DynamoDB
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression=Key('GSI1PK').eq('USERS')
        )
        
        users = []
        for item in response.get('Items', []):
            # Don't return hashed passwords
            if 'hashed_password' in item:
                del item['hashed_password']
            users.append(item)
        
        return users 