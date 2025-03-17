# Personal API Dashboard

## 1. Project Overview

**Name:** Personal API Dashboard  
**Description:** A centralized web dashboard allowing users to manage, monitor, and test various APIs. Users can store their API keys, keep track of rate limits, view usage logs, and quickly build/test requests (GET, POST, PUT, DELETE). Ultimately, this application will integrate with AWS to handle authentication (Cognito), storage (DynamoDB), caching (ElastiCache), and logging (CloudWatch).

**Primary Use Cases:**
1. **API Key Management:** Users can safely store, update, and delete API keys.
2. **API Request Testing:** Users can quickly build and send requests, see formatted responses, and track usage.
3. **Rate Limit & Usage Tracking:** Display remaining quota for each API and track usage.
4. **Authentication:** Secure sign-up and login system (initially mock JWT, later replaced by AWS Cognito).
5. **Logging & Monitoring:** Log requests in real-time (initially local logs, then AWS CloudWatch).

## 2. Goals & Objectives

1. **Centralized API Management**
    * Provide a single interface for managing multiple API connections.
    * Enable quick storage/retrieval of API keys with optional encryption.
2. **Efficient API Testing**
    * Give developers a request builder to test endpoints rapidly.
    * Display JSON responses in a clean, human-readable format.
3. **Streamlined Dev Experience**
    * Use React + Tailwind for a modern, performant UI.
    * Use FastAPI + Strawberry GraphQL for flexible, pythonic backend development.
4. **Scalable Infrastructure**
    * Start with local mocks (Moto for DynamoDB, local Redis, local JWT).
    * Migrate seamlessly to AWS services (Lambda, API Gateway, DynamoDB, ElastiCache, Cognito, CloudWatch).

## 3. Key Functional Requirements

### 3.1 Authentication
* Phase 1: Mock JWT-based login and signup for local development.
* Phase 2: Replace mock JWT with AWS Cognito.
* Sign-Up: Collect username, email, password.
* Login: Validate user credentials, retrieve JWT/Cognito tokens, store token in client (localStorage or cookies).

### 3.2 API Key Management
* Add Key: User can add a new API key (stored encrypted in DynamoDB or mock DB).
* Remove Key: Delete from storage.
* Update Key: Edit existing keys.
* View Keys: List of user's stored API keys.

### 3.3 API Request Builder
* Select Endpoint: Input URL or select from saved endpoints.
* Choose HTTP Method: GET, POST, PUT, DELETE.
* Headers & Body: Optionally specify request headers and body (JSON or form-data).
* Send Request: Dispatch call through a backend proxy endpoint.
* View Response: Formatted JSON (and status code, headers).

### 3.4 Rate Limit & Usage Tracking
* Rate Limit Dashboard: Show how many requests remain for each integrated API (e.g., GitHub API 4,500/5,000).
* Auto-Refresh: The system queries rate limit data periodically.
* Local Caching (Phase 1): Store rate limit stats in local Redis.
* AWS ElastiCache (Phase 2): Migrate to AWS for production usage.

### 3.5 Logging & Monitoring
* Local Logging (Phase 1): Writes requests/responses to console or file.
* AWS CloudWatch (Phase 2): Migrate logs to CloudWatch with structured log messages.

### 3.6 GraphQL Integration
* Provide GraphQL endpoints (via Strawberry GraphQL) for certain data queries (optional or complementary to REST).
* The front end can use Apollo Client to query and mutate data (e.g., fetching the user's stored API keys).

## 4. Technical Architecture

### 4.1 Frontend (React + Vite + ShadCN)
* UI Library: ShadCN + TailwindCSS + Radix UI.
* Routing: React Router for multi-page setup (Landing, Auth, Dashboard).
* State Management: React Context API or Zustand if needed.
* GraphQL Client: Apollo Client (or whichever the team prefers).

### 4.2 Backend (FastAPI + Strawberry GraphQL)
* FastAPI for REST endpoints and request proxying.
* Strawberry for GraphQL schema/resolvers.
* Database:
    * Phase 1: Moto (Mock DynamoDB) for local dev.
    * Phase 2: AWS DynamoDB.
* Caching:
    * Phase 1: Local Redis.
    * Phase 2: AWS ElastiCache (Redis).
* Authentication:
    * Phase 1: Mock JWT.
    * Phase 2: AWS Cognito.
* Deployment:
    * Phase 1: Local dev with Uvicorn.
    * Phase 2: AWS Lambda + API Gateway (using Mangum).

## 5. Implementation Phases

1. **Phase 1: Basic Local Version**
    * Frontend UI with Landing, Dashboard, Auth forms.
    * Mock JWT for authentication.
    * Moto for DynamoDB (store encrypted API keys).
    * Local Redis for caching rate limits.
    * Local file/console logging.
    * Test coverage for all major flows.
2. **Phase 2: AWS Integration** (Don't move to this step until user approves. Only after phase 1 works you will move to phase 2)
    * Replace local JWT with AWS Cognito.
    * Replace Moto with real DynamoDB.
    * Replace local Redis with ElastiCache.
    * Replace local logs with CloudWatch.
    * Deploy backend via AWS Lambda + API Gateway.
    * Deploy frontend via AWS S3 + CloudFront (or Vercel).

## 6. Use Cases & User Stories

1. **User Authentication**
    * "As a user, I can create an account so that I can securely log in to my dashboard."
    * "As a user, I want to log in using my email and password so that I can access my saved API keys."
2. **API Key Storage**
    * "As a user, I want to add my GitHub and Twitter API keys so that I can quickly make requests from the dashboard."
3. **API Request Testing**
    * "As a user, I want to build and send custom REST requests so that I can test endpoints from within the dashboard."
4. **Rate Limit Tracking**
    * "As a user, I want to see how many requests I have remaining for each API so I can avoid hitting rate limits."
5. **Monitoring**
    * "As an admin/dev, I want logs of all requests/responses so that I can troubleshoot errors and usage."

## 7. Proposed File Structure

Below is a minimal file structure that keeps things organized while reducing the total number of files. Developers can add or split files if the project grows.

```
personal-api-dashboard/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx      // Landing/home screen
│   │   │   ├── DashboardPage.tsx    // Main dashboard UI
│   │   │   └── AuthPage.tsx         // Login/Signup
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ApiKeyManager.tsx
│   │   │   ├── ApiRequestForm.tsx
│   │   │   ├── ApiResponse.tsx
│   │   │   └── RateLimit.tsx
│   │   └── tailwind.css             // Tailwind + ShadCN styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── main.py                      // FastAPI + Strawberry + routes + mock logic
│   └── requirements.txt
│
├── .gitignore
└── README.md
├── .cursorrules
└── memory.md
├── project.md

```

### Notes on the File Structure

* **frontend/**
    * **src/**: Core React source code.
    * **pages/**: Page-level components (Landing, Dashboard, Auth).
    * **components/**: UI building blocks and specialized components (e.g., request builder, rate limit display).
    * **tailwind.css**: Central style entry for Tailwind + ShadCN.
* **backend/**
    * **main.py**:
        * FastAPI application instance.
        * Strawberry GraphQL schema/resolvers.
        * Mock JWT logic and user login routes.
        * Mock DynamoDB setup with Moto.
        * Redis caching logic.
        * Logging.
        * To keep it minimal, these can be grouped with clear comment headings.
    * **requirements.txt**: Python dependencies (fastapi, uvicorn, strawberry-graphql, pyjwt, boto3, redis, etc.).
* **.gitignore**: Exclude node_modules, Python __pycache__, environment files, etc.
* **README.md**:
    * Setup instructions (local dev, environment config).
    * Explanation of future AWS integration steps.

## 8. Acceptance Criteria

1. **Core Functionality**
    * Users can sign up and log in using mock JWTs.
    * Users can add, update, and delete API keys stored in the mock database.
    * Users can build and send REST requests to external APIs.
    * The system displays JSON responses in a readable format.
    * Logs record each request and response.
2. **Rate Limit Tracking**
    * Dashboard accurately shows user's remaining requests (for at least one external API).
    * Data is cached in local Redis.
3. **GraphQL Endpoint**
    * Available at a path like /graphql, serving Strawberry schema.
    * Can fetch or mutate data (e.g., user info, API key info).
4. **Deployment**
    * Phase 1: Runs locally via vite dev for frontend and uvicorn main:app --reload for backend.
    * Phase 2: Hosted on AWS (Lambda + API Gateway for backend, S3 + CloudFront for frontend).

## 9. Risks & Considerations

1. **Security of API Keys**
    * Even though it's a personal dashboard, encryption and secure storage are critical.
2. **Rate Limits**
    * Some APIs (like GitHub) have fairly generous limits, while others do not. Implement robust error handling and caching.
3. **AWS Costs**
    * Certain AWS services can incur costs. Carefully monitor usage in non-production environments.
4. **Scalability**
    * For large volumes of data, DynamoDB, ElastiCache, and CloudWatch metrics will be essential.
    * The architecture is designed to scale if the user base grows.
5. **User Experience**
    * Keep the UI minimal but intuitive. Provide immediate feedback for request results or error states.

## Current File Structure
personal-api-dashboard/
└── project.md
└── .cursorrules (or project rules)
└── memory.md
