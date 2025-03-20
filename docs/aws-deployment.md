# AWS Deployment Guide

This guide provides step-by-step instructions for deploying the Personal API Dashboard to AWS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: AWS Resources Setup](#phase-1-aws-resources-setup)
3. [Phase 2: Backend Code Integration](#phase-2-backend-code-integration)
4. [Phase 3: Frontend Code Integration](#phase-3-frontend-code-integration)
5. [Phase 4: Packaging and Deployment](#phase-4-packaging-and-deployment)
6. [Phase 5: Final Configuration and Testing](#phase-5-final-configuration-and-testing)
7. [Resource Management](#resource-management)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- AWS account with appropriate permissions
- AWS CLI installed and configured
- GitHub account for code repository
- Node.js and npm for frontend development
- Python 3.10+ for backend development

## Phase 1: AWS Resources Setup

### 1.1 DynamoDB Table

```bash
# Create a single DynamoDB table for all data (authentication, API keys, and rate limits)
aws dynamodb create-table \
  --table-name api-dashboard \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
  --billing-mode PAY_PER_REQUEST

# Enable Time-To-Live for automatic cleanup of expired rate limits
aws dynamodb update-time-to-live \
  --table-name api-dashboard \
  --time-to-live-specification "Enabled=true,AttributeName=ttl"

echo "DynamoDB table 'api-dashboard' created with TTL enabled"
```

The DynamoDB table will be used for:
- User authentication data (maintaining our existing JWT system)
- API key storage (encrypted using Fernet)
- Rate limit tracking (with TTL for automatic expiration)

Data Access Patterns:
- Users: `PK = USER#{username}`, `SK = PROFILE`
- API Keys: `PK = USER#{username}`, `SK = APIKEY#{key_id}`
- Rate Limits: `PK = USER#{username}`, `SK = RATELIMIT#{api_name}`

### 1.2 S3 Bucket for Frontend

```bash
# Generate a unique bucket name using your account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="api-dashboard-frontend-$ACCOUNT_ID"

# Create S3 bucket
aws s3 mb s3://$BUCKET_NAME

# Configure for website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Create bucket policy for public read access
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

echo "S3 bucket created: $BUCKET_NAME"
echo "Website URL: http://$BUCKET_NAME.s3-website-$(aws configure get region).amazonaws.com"
```

> **Note**: If you encounter a "BlockPublicPolicy" error, you need to disable "Block Public Access" settings for the bucket in the AWS Console under Permissions.

### 1.3 Lambda IAM Role

```bash
# Create trust policy document
cat > lambda-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name api-dashboard-lambda-role \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name api-dashboard-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name api-dashboard-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Get the role ARN for later use
LAMBDA_ROLE_ARN=$(aws iam get-role --role-name api-dashboard-lambda-role --query 'Role.Arn' --output text)
echo "Lambda Role ARN: $LAMBDA_ROLE_ARN"
```

### 1.4 API Gateway

```bash
# Create HTTP API
API_ID=$(aws apigatewayv2 create-api \
  --name api-dashboard-api \
  --protocol-type HTTP \
  --query 'ApiId' \
  --output text)

echo "API Gateway ID: $API_ID"
echo "API Gateway Endpoint: https://$API_ID.execute-api.$(aws configure get region).amazonaws.com"
```

### 1.5 Save Configuration

```bash
# Set AWS region
AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
  AWS_REGION="us-east-2"  # Default region
fi

# Create a configuration file
mkdir -p ~/.api-dashboard
cat > ~/.api-dashboard/aws-config.env << EOF
# AWS Resource Configuration
DYNAMODB_TABLE=api-dashboard
S3_BUCKET=$BUCKET_NAME
LAMBDA_ROLE_ARN=$LAMBDA_ROLE_ARN
API_GATEWAY_ID=$API_ID
API_GATEWAY_URL=https://$API_ID.execute-api.$AWS_REGION.amazonaws.com
REGION=$AWS_REGION
S3_WEBSITE_URL=http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com
EOF

echo "Configuration saved to ~/.api-dashboard/aws-config.env"
cat ~/.api-dashboard/aws-config.env
```

## Phase 2: Backend Code Integration

### 2.1 Create Configuration Module

```bash
# Create a directory for AWS configuration
mkdir -p backend/app/config

# Create the Python configuration file
cat > backend/app/config/aws_config.py << EOF
"""AWS resource configuration for the API Dashboard."""

# AWS Resource Configuration
DYNAMODB_TABLE = "api-dashboard"
S3_BUCKET = "${BUCKET_NAME}"
LAMBDA_ROLE_ARN = "${LAMBDA_ROLE_ARN}"
API_GATEWAY_ID = "${API_ID}"
API_GATEWAY_URL = "https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com"
REGION = "${AWS_REGION}"
S3_WEBSITE_URL = "http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"
```

### 2.2 Update Requirements

```bash
# Add necessary AWS packages to requirements.txt
cat >> backend/requirements.txt << EOF

# AWS dependencies
boto3==1.34.0
mangum==0.17.0
EOF
```

### 2.3 Create AWS Utilities

```bash
# Create AWS utilities directory
mkdir -p backend/app/utils/aws

# Create DynamoDB utility
cat > backend/app/utils/aws/dynamodb.py << EOF
"""DynamoDB utilities for the API Dashboard."""
import boto3
from ..auth import get_current_user
from ...config.aws_config import DYNAMODB_TABLE, REGION
import time

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(DYNAMODB_TABLE)

# User Management Functions
def get_user(username):
    """Get user from DynamoDB."""
    try:
        response = table.get_item(
            Key={
                'PK': f'USER#{username}',
                'SK': 'PROFILE'
            }
        )
        return response.get('Item')
    except Exception as e:
        print(f"Error getting user: {e}")
        return None

def create_user(username, password_hash, email):
    """Create user in DynamoDB."""
    try:
        table.put_item(
            Item={
                'PK': f'USER#{username}',
                'SK': 'PROFILE',
                'username': username,
                'password': password_hash,
                'email': email,
                'created_at': int(time.time())
            }
        )
        return True
    except Exception as e:
        print(f"Error creating user: {e}")
        return False

# API Key Functions
def store_api_key(user_id, key_id, api_name, encrypted_key, description=None):
    """Store encrypted API key in DynamoDB."""
    try:
        item = {
            'PK': f'USER#{user_id}',
            'SK': f'APIKEY#{key_id}',
            'GSI1PK': f'APIKEYS',
            'GSI1SK': f'USER#{user_id}',
            'key_id': key_id,
            'api_name': api_name,
            'encrypted_key': encrypted_key,
            'created_at': int(time.time())
        }
        
        if description:
            item['description'] = description
            
        table.put_item(Item=item)
        return True
    except Exception as e:
        print(f"Error storing API key: {e}")
        return False

def get_api_keys(user_id):
    """Get all API keys for a user from DynamoDB."""
    try:
        response = table.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues={
                ':pk': f'USER#{user_id}',
                ':sk': 'APIKEY#'
            }
        )
        return response.get('Items', [])
    except Exception as e:
        print(f"Error getting API keys: {e}")
        return []

def get_api_key(user_id, key_id):
    """Get a specific API key from DynamoDB."""
    try:
        response = table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'APIKEY#{key_id}'
            }
        )
        return response.get('Item')
    except Exception as e:
        print(f"Error getting API key: {e}")
        return None

def update_api_key(user_id, key_id, api_name=None, encrypted_key=None, description=None):
    """Update API key in DynamoDB."""
    try:
        update_expression = "SET "
        expression_attribute_values = {}
        
        if api_name:
            update_expression += "api_name = :api_name, "
            expression_attribute_values[':api_name'] = api_name
            
        if encrypted_key:
            update_expression += "encrypted_key = :encrypted_key, "
            expression_attribute_values[':encrypted_key'] = encrypted_key
            
        if description:
            update_expression += "description = :description, "
            expression_attribute_values[':description'] = description
            
        update_expression += "updated_at = :updated_at"
        expression_attribute_values[':updated_at'] = int(time.time())
        
        table.update_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'APIKEY#{key_id}'
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )
        return True
    except Exception as e:
        print(f"Error updating API key: {e}")
        return False

def delete_api_key(user_id, key_id):
    """Delete API key from DynamoDB."""
    try:
        table.delete_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'APIKEY#{key_id}'
            }
        )
        return True
    except Exception as e:
        print(f"Error deleting API key: {e}")
        return False

# Rate Limit Functions
def update_rate_limit(user_id, api_name, limit, remaining, reset_at):
    """Store rate limit information in DynamoDB with TTL."""
    try:
        table.put_item(
            Item={
                'PK': f'USER#{user_id}',
                'SK': f'RATELIMIT#{api_name}',
                'limit': limit,
                'remaining': remaining,
                'reset_at': reset_at,
                'updated_at': int(time.time()),
                'ttl': reset_at  # DynamoDB TTL attribute for automatic cleanup
            }
        )
        return True
    except Exception as e:
        print(f"Error updating rate limit: {e}")
        return False

def get_rate_limit(user_id, api_name):
    """Get rate limit information from DynamoDB."""
    try:
        response = table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'RATELIMIT#{api_name}'
            }
        )
        return response.get('Item')
    except Exception as e:
        print(f"Error getting rate limit: {e}")
        return None

def get_all_rate_limits(user_id):
    """Get all rate limits for a user from DynamoDB."""
    try:
        response = table.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues={
                ':pk': f'USER#{user_id}',
                ':sk': 'RATELIMIT#'
            }
        )
        return response.get('Items', [])
    except Exception as e:
        print(f"Error getting rate limits: {e}")
        return []

def delete_rate_limit(user_id, api_name):
    """Delete rate limit information from DynamoDB."""
    try:
        table.delete_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'RATELIMIT#{api_name}'
            }
        )
        return True
    except Exception as e:
        print(f"Error deleting rate limit: {e}")
        return False
EOF
```

### 2.4 Create Lambda Handler

```bash
# Create Lambda handler file
cat > backend/app/lambda_handler.py << EOF
"""AWS Lambda handler for the API Dashboard."""
from mangum import Mangum
from .main import app

# Create handler for AWS Lambda
handler = Mangum(app)
EOF
```

## Phase 3: Frontend Code Integration

### 3.1 Update Environment Configuration

```bash
# Create development environment file
cat > frontend/.env.development << EOF
VITE_API_URL=http://localhost:8000
VITE_USE_AWS=false
EOF

# Create production environment file
cat > frontend/.env.production << EOF
VITE_API_URL=${API_GATEWAY_URL}
VITE_USE_AWS=false
EOF
```

### 3.2 Update API Endpoint Configuration

```bash
# Update the API configuration file if it exists
if [ -f frontend/src/lib/api.ts ]; then
  # Replace local API URL with environment variable
  sed -i 's|const API_URL = "http://localhost:8000"|const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"|g' frontend/src/lib/api.ts
fi
```

## Phase 4: Packaging and Deployment

### 4.1 Create Deployment Scripts

```bash
# Create scripts directory
mkdir -p scripts

# Create frontend deployment script
cat > scripts/deploy_frontend.sh << EOF
#!/bin/bash
set -e

# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://${BUCKET_NAME} --delete

echo "Frontend deployed to http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"
EOF

# Create backend packaging script
cat > scripts/package_backend.sh << EOF
#!/bin/bash
set -e

# Create package directory
mkdir -p package
cd backend

# Install dependencies to package directory
pip install -r requirements.txt -t ../package/

# Copy application code
cp -r app ../package/

# Create zip file
cd ../package
zip -r ../lambda_function.zip .

echo "Backend packaged as lambda_function.zip"
EOF

# Create Lambda deployment script
cat > scripts/deploy_backend.sh << EOF
#!/bin/bash
set -e

# Package backend if not already done
if [ ! -f lambda_function.zip ]; then
  ./scripts/package_backend.sh
fi

# Check if Lambda function exists
FUNCTION_EXISTS=$(aws lambda list-functions --query "Functions[?FunctionName=='api-dashboard'].FunctionName" --output text)

if [ -z "$FUNCTION_EXISTS" ]; then
  # Create Lambda function
  aws lambda create-function \
    --function-name api-dashboard \
    --runtime python3.10 \
    --role ${LAMBDA_ROLE_ARN} \
    --handler app.lambda_handler.handler \
    --zip-file fileb://lambda_function.zip \
    --timeout 30 \
    --memory-size 256 \
    --region ${AWS_REGION}
else
  # Update existing Lambda function
  aws lambda update-function-code \
    --function-name api-dashboard \
    --zip-file fileb://lambda_function.zip
fi

# Create API Gateway integration if not already exists
INTEGRATIONS=$(aws apigatewayv2 get-integrations --api-id ${API_ID} --query "Items[?IntegrationUri=='arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:function:api-dashboard'].IntegrationId" --output text)

if [ -z "$INTEGRATIONS" ]; then
  # Create new integration
  INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id ${API_ID} \
    --integration-type AWS_PROXY \
    --integration-uri arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:function:api-dashboard \
    --payload-format-version 2.0 \
    --integration-method POST \
    --query "IntegrationId" \
    --output text)
  
  # Create catch-all route
  aws apigatewayv2 create-route \
    --api-id ${API_ID} \
    --route-key 'ANY /{proxy+}' \
    --target "integrations/$INTEGRATION_ID"
else
  # Use existing integration
  INTEGRATION_ID=$INTEGRATIONS
fi

# Add Lambda permission for API Gateway if not already exists
STATEMENT_ID="apigateway-invoke"
PERMISSIONS=$(aws lambda get-policy --function-name api-dashboard --query "Policy" --output text 2>/dev/null || echo "")

if [[ "$PERMISSIONS" != *"$STATEMENT_ID"* ]]; then
  aws lambda add-permission \
    --function-name api-dashboard \
    --statement-id $STATEMENT_ID \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${AWS_REGION}:${ACCOUNT_ID}:${API_ID}/*"
fi

# Deploy API
aws apigatewayv2 create-deployment \
  --api-id ${API_ID} \
  --stage-name prod

echo "Backend deployed to https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com"
EOF

# Make scripts executable
chmod +x scripts/deploy_frontend.sh scripts/package_backend.sh scripts/deploy_backend.sh
```

## Phase 5: Final Configuration and Testing

### 5.1 Test the Deployment

After deploying both frontend and backend, navigate to your S3 website URL:

```
http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com
```

Test the following flows:
1. User sign-up and login
2. API key management (create, read, update, delete)
3. Making API requests through the proxy
4. Viewing dashboard statistics

### 5.2 Set Up CloudFront (Optional)

For HTTPS support and better global performance, set up CloudFront:

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name ${BUCKET_NAME}.s3.amazonaws.com \
  --default-root-object index.html \
  --error-responses Quantity=1,Items=[{ErrorCode=404,ResponsePagePath=/index.html,ResponseCode=200,ErrorCachingMinTTL=10}]
```

## Resource Management

### AWS Free Tier Usage

- **DynamoDB**: 25 GB storage, 25 WCUs/RCUs (free) 
- **S3**: 5 GB storage, 20,000 GET requests (free)
- **Lambda**: 1M requests, 400,000 GB-seconds (free)
- **API Gateway**: 1M requests per month (free)
- **IAM**: Always free

### Cleanup Resources

To avoid charges, you can delete resources when they're no longer needed:

```bash
# Delete Lambda function
aws lambda delete-function --function-name api-dashboard

# Delete API Gateway
aws apigatewayv2 delete-api --api-id ${API_ID}

# Delete S3 bucket (empty it first)
aws s3 rm s3://${BUCKET_NAME} --recursive
aws s3 rb s3://${BUCKET_NAME}

# Delete DynamoDB table
aws dynamodb delete-table --table-name api-dashboard

# Detach and delete IAM role policies
aws iam detach-role-policy \
  --role-name api-dashboard-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam detach-role-policy \
  --role-name api-dashboard-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam delete-role --role-name api-dashboard-lambda-role
```

## Troubleshooting

### Common Issues and Solutions

1. **CORS Issues**:
   - Problem: Frontend can't access API Gateway endpoints due to CORS
   - Solution: Add CORS configuration to API Gateway

2. **Authentication Errors**:
   - Problem: JWT authentication fails
   - Solution: Check token generation and validation logic, ensure DynamoDB integration is correct

3. **Lambda Errors**:
   - Problem: Lambda function fails to execute
   - Solution: Check logs in CloudWatch, ensure proper IAM permissions

4. **S3 Public Access Blocked**:
   - Problem: Can't make bucket public
   - Solution: Disable Block Public Access settings in S3 console 