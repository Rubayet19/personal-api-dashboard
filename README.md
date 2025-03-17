# Personal API Dashboard

A centralized web dashboard for managing, monitoring, and testing various APIs. Built with React, FastAPI, and AWS services.

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
- Apollo Client (GraphQL)
- React Router
- Zustand (State Management)

### Backend
- FastAPI
- Strawberry GraphQL
- Redis (Caching)
- Moto (Mock AWS Services)
- Python-Jose (JWT)

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

## Development

- Frontend development server: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- GraphQL Playground: `http://localhost:8000/graphql`

## Project Structure

```
personal-api-dashboard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── graphql/
│   │   ├── hooks/
│   │   └── utils/
│   └── ...
└── backend/
    ├── app/
    │   ├── main.py
    │   └── ...
    └── tests/
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 