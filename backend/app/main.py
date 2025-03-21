from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .routers import auth, api_keys, proxy, rate_limits, stats

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Personal API Dashboard",
    description="A centralized web dashboard for managing and testing various APIs",
    version="1.0.0"
)

# Define explicit allowed origins instead of wildcard
# This is necessary when allow_credentials is True
allowed_origins = [
    # Local development origins
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Production origins
    "https://personal-api-dashboard-production.up.railway.app",
    "http://api-dashboard-frontend-166868085052.s3-website.us-east-2.amazonaws.com",
    "https://api-dashboard-frontend-166868085052.s3-website.us-east-2.amazonaws.com",
    # Additional production origins
    "https://staging.d3n8vbdp15cm9d.amplifyapp.com"
]

# Configure CORS with explicit origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Explicit origins instead of wildcard
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(api_keys.router)
app.include_router(proxy.router)
app.include_router(rate_limits.router)
app.include_router(stats.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Personal API Dashboard"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 