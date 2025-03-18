# Personal API Dashboard - Memory File

## Current State

The project is a web application for managing API keys and monitoring API usage across various services. It consists of a frontend built with React, Vite, TypeScript, and Tailwind CSS/Shadcn UI, and a backend using FastAPI and Python.

Phase 3.1-3.3 (API Key Management) has been implemented, including:
- Frontend UI for managing API keys (ApiKeyManager component)
- Backend endpoints for CRUD operations on API keys
- Mock DynamoDB storage for API keys
- Tests for the API key management functionality
- Special handling for large API keys with a detail view modal
- Copy-to-clipboard functionality for API keys

The application is now in a working state with the following fixed issues:
- Updated the moto import in mock_db.py to use mock_aws instead of mock_dynamodb
- Fixed the authentication implementation in auth.py
- Added the missing getToken function in api.ts
- Resolved CORS issues for development environment
- Fixed signup/login flow to handle the correct response formats

## Completed Tasks

### Project Structure
- Set up frontend with Vite, React, TypeScript, and Tailwind CSS
- Set up backend with FastAPI
- Created initial project directory structure

### Phase 1: Landing Page
- Created landing page with responsive design
- Implemented navigation bar with links
- Created Hero section with a "Get Started" button
- Added features section highlighting key functionality
- Added footer with open source information and GitHub link

### Phase 2: Dashboard & Authentication
- Created dashboard layout with sidebar navigation
- Implemented main dashboard view
- Created authentication system with JWT tokens
- Added protected routes for authenticated users
- Implemented user signup and login forms with validation
- Added in-memory user database for authentication

### Phase 3: API Key Management
- Created ApiKeyManager component for CRUD operations on API keys
- Created ApiKeysPage for dedicated API key management
- Implemented backend storage of API keys using mock DynamoDB
- Added encryption for API keys using Fernet
- Created API endpoints for managing API keys
- Connected frontend with backend for API key operations
- Added tests for API key endpoints
- Fixed bugs in moto implementation and authentication
- Enhanced UI with loading indicators, error handling, and confirmation dialogs
- Added special handling for large API keys with detail view modal
- Implemented copy-to-clipboard functionality for API keys

## Next Tasks

### Phase 4: API Rate Limit & Usage Tracking
- Create UI for displaying rate limit information
- Set up local Redis cache for storing rate limit data
- Create backend endpoints for tracking rate limits
- Implement middleware for rate limiting
- Add tests for rate limiting functionality

### Phase 5: API Testing Interface
- Create a UI for testing API endpoints
- Implement request builder and response viewer
- Add history of API requests
- Create backend proxy for forwarding API requests

## File Structure

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── ApiKeyManager.tsx
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── pages/
│   │   ├── ApiKeysPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── LandingPage.tsx
│   │   └── AuthPage.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

### Backend
```
backend/
├── app/
│   ├── main.py
│   ├── routers/
│   │   ├── auth.py
│   │   └── api_keys.py
│   ├── schemas/
│   │   ├── auth.py
│   │   └── api_key.py
│   └── utils/
│       ├── auth.py
│       └── mock_db.py
├── tests/
│   └── test_api_keys.py
└── requirements.txt
```

## Notes

- Frontend development server runs on port 5173
- Backend API runs on port 8000
- Using shadcn/ui for frontend components
- Using FastAPI with Strawberry GraphQL for backend
- Mock AWS services (Moto) and Redis for local development
- The landing page has been designed as a personal open-source project with:
  - Header with navigation
  - Hero section with a single "Get Started" button
  - Features section highlighting key functionality
  - Footer with open source license information and GitHub link
- Dashboard layout includes:
  - Sidebar with navigation links to different sections
  - Navbar with search, notifications, and user menu
  - Main content area with placeholder sections for API Keys, Rate Limits, and Request Builder
  - Responsive design that works on desktop and mobile
- React Router is set up for navigation between pages
- Project follows DRY, KISS, and YAGNI principles
- Applied modularization for maintainable components under 200 lines
- Authentication implemented with mock JWT using FastAPI
  - Backend uses in-memory database for users (email and password only, no username)
  - Frontend stores token in localStorage
  - Protected routes redirect to login if not authenticated
  - Registration and login forms with validation
  - Comprehensive test suite for authentication endpoints and utilities
- API Key Management is implemented with:
  - Frontend component for adding, viewing, editing, and deleting API keys
  - Backend storage using mock DynamoDB with Moto
  - Encryption of API keys using Fernet
  - Full CRUD operations with proper authentication
  - API client service for interacting with the backend
  - Form validation using Zod
  - Loading and error states for better user experience
  - Special handling for large API keys with detail view modal
  - Copy-to-clipboard functionality
- Test files are excluded from production builds:
  - Backend uses setup.py with find_packages(exclude=["tests", "tests.*"])
  - Frontend uses Vite config to exclude test files from build
  - Jest is configured for running frontend tests
  - Pytest with coverage reporting for backend tests
  - A production build script (build.sh) is available that excludes tests

To run the project:
1. Start the backend: `cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. Start the frontend: `cd frontend && npm run dev`
