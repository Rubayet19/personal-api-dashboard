import uuid
import boto3
from datetime import datetime, timedelta
from moto import mock_aws
import os
from cryptography.fernet import Fernet
from typing import List, Dict, Any, Optional

# Initialize moto mock
dynamodb_mock = mock_aws()
dynamodb_mock.start()

# Create mock DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Create encryption key
# In a real app, this would be stored securely and not hardcoded
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY)

# In-memory request log storage
# Structure: { user_id: [{ timestamp, url, method, status_code, time_taken }] }
request_logs = {}

# Check if table exists and create if not
def ensure_tables_exist():
    existing_tables = list(dynamodb.tables.all())
    table_names = [table.name for table in existing_tables]
    
    if 'api_keys' not in table_names:
        dynamodb.create_table(
            TableName='api_keys',
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'user_id',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'user_id-index',
                    'KeySchema': [
                        {
                            'AttributeName': 'user_id',
                            'KeyType': 'HASH'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    },
                    'ProvisionedThroughput': {
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                }
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )

# Ensure tables are created
ensure_tables_exist()

# Get the API keys table
api_keys_table = dynamodb.Table('api_keys')

# Encrypt API key
def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key for storage"""
    encrypted_key = cipher_suite.encrypt(api_key.encode())
    return encrypted_key.decode()

# Decrypt API key
def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key for retrieval"""
    decrypted_key = cipher_suite.decrypt(encrypted_key.encode())
    return decrypted_key.decode()

# Create a new API key
def create_api_key(user_id: str, api_name: str, api_key: str):
    """Create a new API key in the mock DynamoDB"""
    key_id = str(uuid.uuid4())
    encrypted_key = encrypt_api_key(api_key)
    timestamp = datetime.now().isoformat()
    
    item = {
        'id': key_id,
        'user_id': user_id,
        'api_name': api_name,
        'encrypted_key': encrypted_key,
        'created_at': timestamp,
        'updated_at': timestamp
    }
    
    api_keys_table.put_item(Item=item)
    return key_id

# Get all API keys for a user
def get_user_api_keys(user_id: str):
    """Get all API keys for a specific user"""
    response = api_keys_table.query(
        IndexName='user_id-index',
        KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(user_id)
    )
    
    keys = []
    for item in response.get('Items', []):
        # Replace encrypted key with original
        item['api_key'] = decrypt_api_key(item['encrypted_key'])
        # Remove encrypted_key from response
        item.pop('encrypted_key', None)
        keys.append(item)
    
    return keys

# Get a specific API key by ID
def get_api_key(key_id: str):
    """Get a specific API key by ID"""
    response = api_keys_table.get_item(Key={'id': key_id})
    item = response.get('Item')
    
    if item:
        # Replace encrypted key with original
        item['api_key'] = decrypt_api_key(item['encrypted_key'])
        # Remove encrypted_key from response
        item.pop('encrypted_key', None)
        
    return item

# Update an API key
def update_api_key(key_id: str, api_name: str = None, api_key: str = None):
    """Update an API key in the mock DynamoDB"""
    update_expression = "SET updated_at = :updated_at"
    expression_values = {':updated_at': datetime.now().isoformat()}
    
    if api_name:
        update_expression += ", api_name = :api_name"
        expression_values[':api_name'] = api_name
    
    if api_key:
        update_expression += ", encrypted_key = :encrypted_key"
        expression_values[':encrypted_key'] = encrypt_api_key(api_key)
    
    response = api_keys_table.update_item(
        Key={'id': key_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values,
        ReturnValues='ALL_NEW'
    )
    
    updated_item = response.get('Attributes', {})
    
    # Replace encrypted key with original
    if 'encrypted_key' in updated_item:
        updated_item['api_key'] = decrypt_api_key(updated_item['encrypted_key'])
        # Remove encrypted_key from response
        updated_item.pop('encrypted_key', None)
    
    return updated_item

# Delete an API key
def delete_api_key(key_id: str):
    """Delete an API key from the mock DynamoDB"""
    api_keys_table.delete_item(Key={'id': key_id})
    return True

# Alias for get_api_key for backward compatibility
def get_api_key_by_id(key_id: str):
    """Alias for get_api_key function"""
    return get_api_key(key_id)

# Get API keys for a user (alias for get_user_api_keys)
def get_api_keys_for_user(user_id: str):
    """Get all API keys for a specific user"""
    return get_user_api_keys(user_id)

# Log API request
def log_request(user_id: str, url: str, method: str, status_code: int, time_taken: float):
    """Log an API request to the in-memory store"""
    if user_id not in request_logs:
        request_logs[user_id] = []
    
    request_logs[user_id].append({
        "timestamp": datetime.now().isoformat(),
        "url": str(url),
        "method": method,
        "status_code": status_code,
        "time_taken": time_taken
    })
    
    # Keep only last 1000 requests per user to avoid memory issues
    if len(request_logs[user_id]) > 1000:
        request_logs[user_id] = request_logs[user_id][-1000:]

# Get request logs for a user within a time period
def get_requests_log(user_id: str, days: int = 30) -> List[Dict[str, Any]]:
    """
    Get request logs for a user within the specified number of days
    
    Args:
        user_id: The user ID
        days: Number of days to look back (default: 30)
        
    Returns:
        List of request log entries
    """
    if user_id not in request_logs:
        return []
    
    cutoff_date = datetime.now() - timedelta(days=days)
    cutoff_str = cutoff_date.isoformat()
    
    # Filter logs by date
    filtered_logs = [
        log for log in request_logs[user_id] 
        if log["timestamp"] >= cutoff_str
    ]
    
    return filtered_logs 