# Project Overview
You are building a Personal API Dashboard. It is a web app that allows users to monitor API usage, test API endpoints, track rate limits, and manage API keys in one centralized dashboard. Built with React, FastAPI, GraphQL, AWS (Lambda, API Gateway, DynamoDB, CloudWatch, Cognito), Supabase, and Redis, it provides a developer-friendly interface for handling multiple APIs efficiently.

Frontend (React + Vite + ShadCN)
Purpose: User interface for managing API requests, API key storage, and rate limit tracking.
Features:
API request builder (test GET, POST, PUT, DELETE).
Dashboard for tracking API usage.
Mock authentication (JWT) → Later switched to AWS Cognito.
ShadCN + Tailwind CSS for UI components.

Tech Stack:

Framework: React (Vite)
UI: ShadCN (Tailwind CSS + Radix UI)
GraphQL Client: Apollo Client
State Management: React Context API (Zustand if needed)

🔹 Backend (FastAPI + GraphQL)
Purpose: Serves as an API proxy, manages API keys, logs request usage, and tracks rate limits.
Framework: FastAPI (Python)
GraphQL Server: Strawberry GraphQL
Mock Database: Moto (for DynamoDB testing) → Later replaced after it starts wokring locally with AWS DynamoDB
Mock Authentication: JWT → Later replaced after it starts wokring locally  with AWS Cognito
Mock Caching: Local Redis → Later replaced after it starts wokring locally  with AWS ElastiCache
Mock Logging: Console/File → Later replaced after it starts wokring locally with AWS CloudWatch
Hosting: Local Uvicorn → Later replaced after it starts wokring locally to AWS Lambda + API Gateway

Frontend	React (Vite), ShadCN	@apollo/client graphql @shadcn/ui
Backend	FastAPI, GraphQL (Strawberry)	fastapi uvicorn strawberry-graphql boto3 redis
Database	Moto (mock DynamoDB)	moto boto3
Authentication	Mock JWT	pyjwt
Caching	Local Redis	redis
Monitoring	Local logging (console)	logging
Deployment	AWS Lambda + API Gateway	mangum


# Core Functionalities

✅ 1. API Key Management
Securely store API keys (encrypted in DynamoDB).
Add, remove, and update API keys.
✅ 2. API Request Builder & Testing
Test APIs using GET, POST, PUT, DELETE requests.
View formatted JSON responses.
✅ 3. API Rate Limit & Usage Tracking
Display API quota usage (e.g., GitHub API 4,500/5,000 requests left).
Fetch rate limits automatically.
✅ 4. User Authentication & Security
Login/signup via AWS Cognito (OAuth + JWT).
Encrypted API keys stored securely.
✅ 5. Performance Optimization
Cache API responses using Redis to avoid unnecessary requests.
Monitor API logs via AWS CloudWatch.


# Full Step-by-Step Implementation Plan (Frontend to Backend)

🔹 Phase 1: Frontend Setup (Static UI & Navigation)
1️⃣ Set up the project structure & all the dependencies packages etc.

Install React (Vite) + Tailwind + ShadCN.
Configure routing (react-router-dom).
Create a Navbar.tsx and Sidebar.tsx.
2️⃣ Build the Landing Page (Landing.tsx)

Simple welcome screen with login/signup buttons.
3️⃣ Build Dashboard Layout (Dashboard.tsx)

Design sidebar + API testing space.
Create placeholder sections for future features.
🔹 Phase 2: Authentication System (Mock JWT)
4️⃣ Implement Login & Signup Forms (Auth.tsx)

Create email/password input fields.
Store user session with local JWT authentication.
5️⃣ Implement Backend Authentication (jwt_auth.py)

Generate & validate JWT tokens (mock Cognito for now).
Restrict API access to logged-in users.
🔹 Phase 3: API Key Management (Mock DynamoDB)
6️⃣ Create API Key Management UI (ApiKeyManager.tsx)

UI for adding, deleting, and viewing API keys.
7️⃣ Implement API Key Storage (Mock DynamoDB - moto_mock.py)

Create a mock api_keys table.
Encrypt API keys before storing them.
Implement CRUD operations (Add, Remove, Update).
🔹 Phase 4: API Request Builder & Testing
8️⃣ Develop API Request Builder UI (ApiRequestForm.tsx)

Input field for API URL.
Dropdown for HTTP method selection.
Request body input field.
"Send Request" button.
9️⃣ Implement API Proxy (api_proxy.py)

FastAPI route that forwards requests to real APIs.
Return formatted JSON responses.
🔟 Display API Response (ApiResponse.tsx)

Format response JSON for better readability.
🔹 Phase 5: API Rate Limit & Usage Tracking
1️⃣1️⃣ Fetch API Rate Limit UI (RateLimit.tsx)

Display remaining API requests per service.
1️⃣2️⃣ Store Rate Limit Data (Mock Redis Locally - redis_cache.py)

Save rate limit data in local Redis.
Auto-refresh every X minutes.
🔹 Phase 6: Performance Optimization & Monitoring
1️⃣3️⃣ Cache API Responses (Mock Redis Locally - redis_cache.py)

Cache responses locally before making API calls.
1️⃣4️⃣ Implement Local Logging (logger.py)

Log API requests & responses to a local file.
Track API usage & errors.
🔹 Phase 7: Final Testing & AI Agent Confirmation
1️⃣5️⃣ AI Agent Confirms Full Functionality

AI runs tests on all features.
AI confirms: "All features are working correctly. You can now set up AWS. Prompts user to set up AWS services and test before implementing the next phase."

🔹 Phase 8: AWS Migration
1️⃣6️⃣ Replace Mock Components with AWS Services

Auth: Replace JWT with AWS Cognito.
Database: Replace Moto with AWS DynamoDB.
Caching: Replace local Redis with AWS ElastiCache.
Logging: Replace local logs with AWS CloudWatch.
1️⃣7️⃣ Deploy Backend to AWS Lambda

Use Mangum to make FastAPI serverless.
Configure AWS API Gateway.
1️⃣8️⃣ Deploy Frontend to AWS (S3 + CloudFront or Vercel)

Build & upload React app to AWS S3.
Set up CloudFront for global distribution.

# Current File Structure
personal-api-dashboard/
└── project.md
└── .cursorrules (or project rules)
└── memory.md
