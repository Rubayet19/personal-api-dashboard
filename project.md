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

## 5. Full Step-by-Step Implementation

The project is broken down into phases to ensure a smooth incremental build. Each phase lists what needs to be done and how the features integrate.

### Phase 1: Frontend Setup (Static UI & Navigation)

#### 1.1 Set Up Project Structure & Dependencies

**Frontend**
- Initialize a Vite + React project.
- Install Tailwind CSS and ShadCN UI or a similar library.
- Configure Tailwind in tailwind.css.
- Ensure you have react-router-dom for routing, @apollo/client and graphql (if you plan to start using GraphQL from the beginning).

**Backend**
- Create a minimal FastAPI application in main.py.
- Install dependencies (e.g., fastapi, uvicorn, strawberry-graphql, etc.).
- (Optional) Set up a test route (/ping returns "pong").

### 1.2 Build the Landing Page (LandingPage.tsx)

- A simple welcome or marketing-style page that includes:
  - Header with a title, short description.
  - Buttons linking to Login and Signup (or "Get Started").
  - Possibly a design from ShadCN or Tailwind for a clean look.
- No actual API integration yet—just static UI.

### 1.3 Build Dashboard Layout (DashboardPage.tsx)

- Create a Sidebar and Navbar for navigation.
- Add placeholders for future sections:
  - "API Keys"
  - "Rate Limit"
  - "API Request Builder"
- Keep it static for now. The goal is to have the overall layout ready.

**Acceptance Criteria for Phase 1:**
- The React app runs locally (npm run dev or yarn dev).
- You can navigate between Landing page and Dashboard page (using React Router).
- Tailwind + ShadCN is configured so that the UI has consistent styling.

## Phase 2: Authentication System (Mock JWT)

### 2.1 Implement Login & Signup Forms (AuthPage.tsx)

- Signup Form: Input fields for username, email, password.
- Login Form: Input fields for email, password.
- Store the user's JWT token in memory or in localStorage once retrieved (for mocking).
- Use React state or form libraries to handle inputs.
- Dont forget to do Integration tests whenever possible

### 2.2 Backend Authentication (main.py)

**Mock JWT Logic:**
- Create a POST endpoint: /auth/signup that takes email, password, etc. and returns a mock "User Created" response.
- Create a POST endpoint: /auth/login that verifies credentials (fake check) and returns a JWT token if valid.
- Use a library like pyjwt to generate tokens with a short expiration (for realism).
- Create a simple "User" model in memory or in a mock table to store user details.

**Restrict Access:**
- For any subsequent routes that require a logged-in user, parse and validate the JWT from headers or cookies.
- If invalid/expired, return 401.

**Acceptance Criteria for Phase 2:**
- Users can create an account (mock data).
- Users can log in with valid credentials, receiving a JWT token.
- The frontend stores the token and includes it in future requests to protected endpoints.
- Attempting to access a protected endpoint without a valid token returns 401.

## Phase 3: API Key Management (Mock DynamoDB)

### 3.1 Create API Key Management UI (ApiKeyManager.tsx)

- Add Key form: input fields for "API Name" and "API Key."
- Key List: Show stored keys with an "Edit" or "Remove" button.
- Ensure the user must be authenticated to view or manipulate keys.

### 3.2 Implement API Key Storage (Mock DynamoDB with Moto)

In main.py, set up a mock environment using Moto:
- Create a mock api_keys table with fields: id, user_id, api_name, encrypted_key.
- When a user adds a key, store it in the mock DB after encrypting or hashing (simple placeholder encryption is fine for now).
- Provide CRUD endpoints:
  - POST /keys to create a key.
  - GET /keys to list all keys for that user.
  - PUT /keys/{key_id} to update.
  - DELETE /keys/{key_id} to remove.

### 3.3 Encrypt API Keys

- Even though it's a mock environment, demonstrate how you might encrypt the key (e.g., a symmetrical encryption library or base64 placeholder).
- The main idea is to store keys in a way that isn't plain text.

**Acceptance Criteria for Phase 3:**
- Authenticated users can create, read, update, and delete their API keys.
- Keys are stored in mock DynamoDB (Moto).
- Keys are not stored in plain text (some form of encryption or obfuscation).

## Phase 4: API Request Builder & Testing

### 4.1 Develop API Request Builder UI (ApiRequestForm.tsx)

- Provide an input field for the API endpoint URL.
- Dropdown for HTTP method (GET, POST, PUT, DELETE).
- Optional headers + request body section.
- "Send Request" button.

### 4.2 Implement API Proxy (main.py)

Create a route (e.g., POST /proxy) that:
- Receives the requested URL, HTTP method, headers, and body from the frontend.
- Uses requests or httpx (in Python) to forward the request to the real API.
- Returns the raw response data (JSON or otherwise) back to the frontend.
- Optionally, automatically attach the user's stored API key from the DB if needed (for APIs that require a key in headers).

### 4.3 Display API Response (ApiResponse.tsx)

- Format the JSON response in a readable manner.
- Show status code, response headers (optional), and response body.

**Acceptance Criteria for Phase 4:**
- Users can build a request with URL, method, body, and send it via the backend proxy.
- The frontend displays the full response (status code + JSON data).
- Error or success messages appear if the request fails or succeeds.

## Phase 5: API Rate Limit & Usage Tracking

### 5.1 Fetch API Rate Limit UI (RateLimit.tsx)

- Build a component to show, for example, "GitHub API: 4,500 / 5,000 requests left."
- Expandable to multiple APIs (e.g., "Twitter API," "YouTube API," etc.).

### 5.2 Store Rate Limit Data (Mock Redis Locally)

In main.py, integrate Redis locally:
- On each API call (via the proxy), parse the response headers for rate limit info (if available).
- Store or update that info in a local Redis instance.
- When the user visits the Rate Limit Dashboard, query Redis for the latest data.
- Set up a small "auto-refresh" or "cron-like" mechanism if needed to update rate limit data every X minutes.

**Acceptance Criteria for Phase 5:**
- The user can see an accurate count of remaining requests for at least one API (e.g., GitHub).
- Rate limit data is cached in local Redis to avoid repeated calls.

## Phase 6: Performance Optimization & Monitoring

### 6.1 Cache API Responses (Mock Redis)

- Implement caching logic so that certain requests (e.g., GET requests to the same endpoint) return a cached response if within a short timeframe.
- This reduces the number of external API calls.
- Decide on a suitable TTL (Time to Live) for cached data.

### 6.2 Implement Local Logging (logger.py or within main.py)

- Log every API request (URL, method, user ID, timestamp) and response status code to console or a local file.
- Optionally store logs in a structured format (JSON lines) for easy searching.

**Acceptance Criteria for Phase 6:**
- Common GET requests are served from Redis if available.
- All requests and responses are logged locally, allowing devs to monitor usage and errors.

## Phase 7: Final Testing & "AI Agent" Confirmation

### 7.1 Run Unit & Integration Tests

Test coverage for:
- Authentication flows.
- DynamoDB (Moto) CRUD for API keys.
- Redis caching.
- API proxy request/response.

### 7.2 AI Agent (or QA Engineer) Confirmation

The system is tested end-to-end:
- Login → Add Key → Build Request → Check Response → View Rate Limits.
- Once confirmed stable, proceed with AWS migration.

**Acceptance Criteria for Phase 7:**
- All features function correctly in a local environment.
- Minimal bugs discovered in QA.
- The system is ready for AWS setup.

## Phase 8: AWS Migration. DO NOT MOVE TO THIS PHASE UNTIL USER APPROVES THE PREVIOUS PHASES. IF YOU DONT ASK USER YOU WILL FACE DIRE CONSEQUENCES.

### 8.1 Replace Mock Components with AWS Services


- Database: Remove Moto, use real AWS DynamoDB.



### 8.3 Deploy Frontend to AWS (S3 + CloudFront)

- Build React app (npm run build or yarn build).
- Upload static files to an S3 bucket.
- Configure CloudFront for global distribution (enable HTTPS, custom domain if desired).



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





