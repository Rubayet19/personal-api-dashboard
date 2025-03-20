import os
import uuid
import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime
from typing import List, Dict, Any, Optional
from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# DynamoDB Configuration
TABLE_NAME = "api-dashboard"
USER_PREFIX = "USER#"
APIKEY_PREFIX = "APIKEY#"

# Check for test environment
IS_TESTING = os.getenv('TESTING', 'False').lower() == 'true'

# Create encryption key for API keys
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY)

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

def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key for storage"""
    encrypted_key = cipher_suite.encrypt(api_key.encode())
    return encrypted_key.decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key for retrieval"""
    try:
        decrypted_key = cipher_suite.decrypt(encrypted_key.encode())
        return decrypted_key.decode()
    except Exception:
        # Return a placeholder if decryption fails
        return "DECRYPTION_ERROR"

def clear_test_db():
    """Clear the test database (for testing only)."""
    if IS_TESTING:
        keys_to_delete = []
        for key in test_db:
            if key.startswith(f"{USER_PREFIX}") and test_db[key]['SK'].startswith(APIKEY_PREFIX):
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del test_db[key]

def create_api_key(user_id: str, api_name: str, api_key: str) -> str:
    """
    Create a new API key in DynamoDB
    
    Args:
        user_id: User ID (email)
        api_name: Name of the API
        api_key: The API key to store
        
    Returns:
        The ID of the newly created API key
    """
    key_id = str(uuid.uuid4())
    encrypted_key = encrypt_api_key(api_key)
    timestamp = datetime.now().isoformat()
    
    item = {
        'PK': f"{USER_PREFIX}{user_id}",
        'SK': f"{APIKEY_PREFIX}{key_id}",
        'id': key_id,
        'user_id': user_id,
        'api_name': api_name,
        'encrypted_key': encrypted_key,
        'created_at': timestamp,
        'updated_at': timestamp,
        'GSI1PK': f"{USER_PREFIX}{user_id}",
        'GSI1SK': f"{APIKEY_PREFIX}{key_id}"
    }
    
    if IS_TESTING:
        # For testing, save to in-memory dict
        test_db[f"{USER_PREFIX}{user_id}_{APIKEY_PREFIX}{key_id}"] = item
    else:
        # Save to DynamoDB
        table.put_item(Item=item)
    
    return key_id

def get_user_api_keys(user_id: str) -> List[Dict[str, Any]]:
    """
    Get all API keys for a specific user
    
    Args:
        user_id: User ID (email)
        
    Returns:
        List of API keys
    """
    keys = []
    
    if IS_TESTING:
        # For testing, get from in-memory dict
        prefix = f"{USER_PREFIX}{user_id}_"
        for key, item in test_db.items():
            if key.startswith(prefix) and item['SK'].startswith(APIKEY_PREFIX):
                key_copy = item.copy()
                # Replace encrypted key with original
                key_copy['api_key'] = decrypt_api_key(key_copy['encrypted_key'])
                # Remove encrypted_key from response
                key_copy.pop('encrypted_key', None)
                # Remove DynamoDB-specific fields
                key_copy.pop('PK', None)
                key_copy.pop('SK', None)
                key_copy.pop('GSI1PK', None)
                key_copy.pop('GSI1SK', None)
                keys.append(key_copy)
    else:
        # Get from DynamoDB
        response = table.query(
            KeyConditionExpression=Key('PK').eq(f"{USER_PREFIX}{user_id}") & 
                                  Key('SK').begins_with(APIKEY_PREFIX)
        )
        
        for item in response.get('Items', []):
            key_copy = item.copy()
            # Replace encrypted key with original
            key_copy['api_key'] = decrypt_api_key(key_copy['encrypted_key'])
            # Remove encrypted_key from response
            key_copy.pop('encrypted_key', None)
            # Remove DynamoDB-specific fields
            key_copy.pop('PK', None)
            key_copy.pop('SK', None)
            key_copy.pop('GSI1PK', None)
            key_copy.pop('GSI1SK', None)
            keys.append(key_copy)
    
    return keys

def get_api_key(key_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific API key by ID
    
    Args:
        key_id: API key ID
        
    Returns:
        API key data or None if not found
    """
    if IS_TESTING:
        # For testing, search in in-memory dict
        for item in test_db.values():
            if item.get('id') == key_id:
                key_copy = item.copy()
                # Replace encrypted key with original
                key_copy['api_key'] = decrypt_api_key(key_copy['encrypted_key'])
                # Remove encrypted_key from response
                key_copy.pop('encrypted_key', None)
                # Remove DynamoDB-specific fields
                key_copy.pop('PK', None)
                key_copy.pop('SK', None)
                key_copy.pop('GSI1PK', None)
                key_copy.pop('GSI1SK', None)
                return key_copy
        return None
    else:
        # First we need to find the user ID for this key since we need both PK and SK
        # Use scan operation to find the API key by ID
        try:
            # Scan to find the item with matching id
            response = table.scan(
                FilterExpression="id = :keyid",
                ExpressionAttributeValues={':keyid': key_id}
            )
            
            items = response.get('Items', [])
            if not items:
                return None
            
            # Just use the first matching item
            item = items[0]
            key_copy = item.copy()
            
            # Replace encrypted key with original
            key_copy['api_key'] = decrypt_api_key(key_copy['encrypted_key'])
            # Remove encrypted_key from response
            key_copy.pop('encrypted_key', None)
            # Remove DynamoDB-specific fields
            key_copy.pop('PK', None)
            key_copy.pop('SK', None)
            key_copy.pop('GSI1PK', None)
            key_copy.pop('GSI1SK', None)
            
            return key_copy
        except Exception as e:
            print(f"Error retrieving API key: {e}")
            return None

def update_api_key(key_id: str, api_name: str = None, api_key: str = None) -> Optional[Dict[str, Any]]:
    """
    Update an API key
    
    Args:
        key_id: API key ID
        api_name: New API name (optional)
        api_key: New API key (optional)
        
    Returns:
        Updated API key data or None if not found
    """
    # First get the existing key
    existing_key = get_api_key(key_id)
    if not existing_key:
        return None
    
    user_id = existing_key['user_id']
    timestamp = datetime.now().isoformat()
    
    # Build update expression
    if IS_TESTING:
        # For testing, update in-memory dict
        key = f"{USER_PREFIX}{user_id}_{APIKEY_PREFIX}{key_id}"
        if key in test_db:
            test_db[key]['updated_at'] = timestamp
            
            if api_name:
                test_db[key]['api_name'] = api_name
            
            if api_key:
                test_db[key]['encrypted_key'] = encrypt_api_key(api_key)
            
            # Get updated item
            return get_api_key(key_id)
        return None
    else:
        # Update in DynamoDB
        update_expression = "SET updated_at = :updated_at"
        expression_values = {':updated_at': timestamp}
        
        if api_name:
            update_expression += ", api_name = :api_name"
            expression_values[':api_name'] = api_name
        
        if api_key:
            update_expression += ", encrypted_key = :encrypted_key"
            expression_values[':encrypted_key'] = encrypt_api_key(api_key)
        
        response = table.update_item(
            Key={
                'PK': f"{USER_PREFIX}{user_id}",
                'SK': f"{APIKEY_PREFIX}{key_id}"
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )
        
        if 'Attributes' not in response:
            return None
        
        updated_item = response['Attributes']
        key_copy = updated_item.copy()
        
        # Replace encrypted key with original
        key_copy['api_key'] = decrypt_api_key(key_copy['encrypted_key'])
        # Remove encrypted_key from response
        key_copy.pop('encrypted_key', None)
        # Remove DynamoDB-specific fields
        key_copy.pop('PK', None)
        key_copy.pop('SK', None)
        key_copy.pop('GSI1PK', None)
        key_copy.pop('GSI1SK', None)
        
        return key_copy

def delete_api_key(key_id: str) -> bool:
    """
    Delete an API key
    
    Args:
        key_id: API key ID
        
    Returns:
        True if successfully deleted, False otherwise
    """
    # First get the existing key to get the user_id
    existing_key = get_api_key(key_id)
    if not existing_key:
        return False
    
    user_id = existing_key['user_id']
    
    if IS_TESTING:
        # For testing, delete from in-memory dict
        key = f"{USER_PREFIX}{user_id}_{APIKEY_PREFIX}{key_id}"
        if key in test_db:
            del test_db[key]
            return True
        return False
    else:
        # Delete from DynamoDB
        try:
            table.delete_item(
                Key={
                    'PK': f"{USER_PREFIX}{user_id}",
                    'SK': f"{APIKEY_PREFIX}{key_id}"
                }
            )
            return True
        except Exception:
            return False

# Aliases for backward compatibility
get_api_key_by_id = get_api_key
get_api_keys_for_user = get_user_api_keys 