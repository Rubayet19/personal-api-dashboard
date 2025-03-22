# Personal API Dashboard

A centralized web dashboard for managing, monitoring, and testing various APIs. Built with React, FastAPI, and AWS services. The app can be accessed here: https://staging.d3n8vbdp15cm9d.amplifyapp.com

## Features

- API Key Management
- API Request Testing
- Rate Limit & Usage Tracking
- Authentication
- Logging & Monitoring

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router

### Backend
- FastAPI
- Redis (Caching)

### Deployment Options
- Local development environment
- AWS cloud deployment with:
  - Amazon Cognito (Authentication)
  - AWS Lambda (Serverless Backend)
  - Amazon API Gateway
  - Amazon DynamoDB (Database)
  - Amazon ElastiCache (Redis)
  - AWS Amplify (Frontend Hosting)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Redis (for local development)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

5. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

The backend will be available at `http://localhost:8000`


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Deployment

### Local Development
The application can be run entirely locally with mock services:

1. Start the backend:
   ```bash
   cd backend
   source venv/bin/activate
   export USE_AWS=false  # Explicitly use local mocks
   uvicorn app.main:app --reload
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
