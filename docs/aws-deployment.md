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

### 1.1 Cognito User Pool

```bash
# Create User Pool
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name ApiDashboard \
  --email-configuration EmailSendingAccount=COGNITO_DEFAULT \
  --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false}}' \
  --auto-verified-attributes email \
  --query 'UserPool.Id' \
  --output text)

echo "User Pool ID: $USER_POOL_ID"

# Create App Client
aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name ApiDashboardClient \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_ADMIN_USER_PASSWORD_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH

# Get the App Client ID
APP_CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id $USER_POOL_ID --query "UserPoolClients[0].ClientId" --output text)
echo "App Client ID: $APP_CLIENT_ID"
```

### 1.2 DynamoDB Table

```bash
# Create a single DynamoDB table for all data
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

echo "DynamoDB table 'api-dashboard' created"
```

### 1.3 S3 Bucket for Frontend

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

### 1.4 Lambda IAM Role

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

aws iam attach-role-policy \
  --role-name api-dashboard-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonCognitoReadOnly

# Get the role ARN for later use
LAMBDA_ROLE_ARN=$(aws iam get-role --role-name api-dashboard-lambda-role --query 'Role.Arn' --output text)
echo "Lambda Role ARN: $LAMBDA_ROLE_ARN"
```

### 1.5 API Gateway

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

### 1.6 Save Configuration

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
USER_POOL_ID=$USER_POOL_ID
APP_CLIENT_ID=$APP_CLIENT_ID
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
USER_POOL_ID = "${USER_POOL_ID}"
APP_CLIENT_ID = "${APP_CLIENT_ID}"
DYNAMODB_TABLE = "api-dashboard"
S3_BUCKET = "${BUCKET_NAME}"
LAMBDA_ROLE_ARN = "${LAMBDA_ROLE_ARN}"
API_GATEWAY_ID = "${API_ID}"
API_GATEWAY_URL = "https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com"
REGION = "${AWS_REGION}"
S3_WEBSITE_URL = "http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"

# Flag to determine if we should use AWS services or local mock services
USE_AWS = True
EOF
```

### 2.2 Update Requirements

```bash
# Add necessary AWS packages to requirements.txt
cat >> backend/requirements.txt << EOF

# AWS dependencies
boto3==1.34.0
mangum==0.17.0
pycognito==2023.2.0
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

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(DYNAMODB_TABLE)

# Implementation functions will be added in Phase 2.4
EOF

# Create Cognito utility
cat > backend/app/utils/aws/cognito.py << EOF
"""Cognito utilities for the API Dashboard."""
import boto3
from pycognito import Cognito
from ...config.aws_config import USER_POOL_ID, APP_CLIENT_ID, REGION

cognito_idp = boto3.client('cognito-idp', region_name=REGION)

# Implementation functions will be added in Phase 2.4
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

### 3.1 Install AWS Amplify

```bash
# Navigate to frontend directory
cd frontend

# Install AWS Amplify
npm install aws-amplify
```

### 3.2 Create Environment Files

```bash
# Create development environment file
cat > frontend/.env.development << EOF
VITE_API_URL=http://localhost:8000
VITE_USE_AWS=false
EOF

# Create production environment file
cat > frontend/.env.production << EOF
VITE_API_URL=${API_GATEWAY_URL}
VITE_USER_POOL_ID=${USER_POOL_ID}
VITE_APP_CLIENT_ID=${APP_CLIENT_ID}
VITE_AWS_REGION=${AWS_REGION}
VITE_USE_AWS=true
EOF
```

### 3.3 Create AWS Configuration

```bash
# Create AWS configuration file
mkdir -p frontend/src/lib/aws
cat > frontend/src/lib/aws/config.ts << EOF
// AWS Configuration
export const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION,
  userPoolId: import.meta.env.VITE_USER_POOL_ID,
  userPoolWebClientId: import.meta.env.VITE_APP_CLIENT_ID,
  authenticationFlowType: 'USER_PASSWORD_AUTH',
};
EOF

# Create Cognito Authentication Service
cat > frontend/src/lib/aws/auth-service.ts << EOF
// AWS Cognito Authentication Service
import { Auth } from 'aws-amplify';
import { awsConfig } from './config';

// Initialize Amplify
Auth.configure(awsConfig);

export const AuthService = {
  // Implementation functions will be added in Phase 3.4
};
EOF
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

# Create API Gateway integration
aws apigatewayv2 create-integration \
  --api-id ${API_ID} \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:function:api-dashboard \
  --payload-format-version 2.0 \
  --integration-method POST

# Create catch-all route
INTEGRATION_ID=\$(aws apigatewayv2 get-integrations --api-id ${API_ID} --query "Items[0].IntegrationId" --output text)
aws apigatewayv2 create-route \
  --api-id ${API_ID} \
  --route-key 'ANY /{proxy+}' \
  --target "integrations/\$INTEGRATION_ID"

# Add Lambda permission for API Gateway
aws lambda add-permission \
  --function-name api-dashboard \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${AWS_REGION}:${ACCOUNT_ID}:${API_ID}/*"

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

- **Cognito**: 50,000 MAUs per month (free)
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

# Delete Cognito User Pool
aws cognito-idp delete-user-pool --user-pool-id ${USER_POOL_ID}

# Detach and delete IAM role policies
aws iam detach-role-policy \
  --role-name api-dashboard-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam detach-role-policy \
  --role-name api-dashboard-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam detach-role-policy \
  --role-name api-dashboard-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonCognitoReadOnly

aws iam delete-role --role-name api-dashboard-lambda-role
```

## Troubleshooting

### Common Issues and Solutions

1. **CORS Issues**:
   - Problem: Frontend can't access API Gateway endpoints due to CORS
   - Solution: Add CORS configuration to API Gateway

2. **Authentication Errors**:
   - Problem: Cognito authentication fails
   - Solution: Check auth flows, token expiration, and Cognito setup

3. **Lambda Errors**:
   - Problem: Lambda function fails to execute
   - Solution: Check logs in CloudWatch, ensure proper IAM permissions

4. **S3 Public Access Blocked**:
   - Problem: Can't make bucket public
   - Solution: Disable Block Public Access settings in S3 console 