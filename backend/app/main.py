from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .routers import auth, api_keys, proxy

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Personal API Dashboard",
    description="A centralized web dashboard for managing and testing various APIs",
    version="1.0.0"
)

# Configure CORS - More permissive for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(api_keys.router)
app.include_router(proxy.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Personal API Dashboard"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 